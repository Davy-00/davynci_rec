import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import type { InterviewQuestion, RankedCandidate } from "@davinci/shared";
import { resolveGeminiModel } from "./geminiModel";

const generationConfig: GenerationConfig = {
  temperature: 0.4,
  topP: 0.9,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  thinkingConfig: { thinkingBudget: 0 },
} as GenerationConfig & { thinkingConfig?: { thinkingBudget: number } };

function getFastModel() {
  return resolveGeminiModel(
    process.env.GEMINI_FAST_MODEL || process.env.GEMINI_REASONING_MODEL,
    "gemini-2.5-flash"
  );
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

function buildFallbackInterviewQuestions(
  job: Record<string, unknown>,
  candidate: RankedCandidate
): InterviewQuestion[] {
  const focusAreas = candidate.interviewFocus ?? [];
  const matched = candidate.matchedRequirements ?? [];
  const gaps = candidate.gaps ?? [];
  const missing = candidate.missingRequirements ?? [];
  const firstStrength = matched[0] || "the strongest technical area on your resume";
  const secondStrength = matched[1] || "your most relevant shipped project";
  const mainGap = missing[0] || gaps[0] || "the least proven requirement for this role";
  const focus = focusAreas[0] || "your direct ownership on recent work";

  return [
    {
      question: `Walk me through a project where you used ${firstStrength}. What was your direct contribution, and what tradeoffs did you make?`,
      rationale: "Validates whether the strongest claimed match reflects hands-on depth.",
      area: "technical",
    },
    {
      question: `Which production decisions best show your strength in ${secondStrength}, and how would you improve them if you rebuilt that work today?`,
      rationale: "Tests real-world judgment instead of surface-level keyword matching.",
      area: "technical",
    },
    {
      question: `We found less direct evidence around ${mainGap}. How have you closed similar gaps before, and what would your first 30 days look like if this became a core part of the role?`,
      rationale: "Probes the candidate's biggest risk area and learning plan.",
      area: "gap_probe",
    },
    {
      question: `Tell me about a time you had to defend ${focus.toLowerCase()} under delivery pressure. How did you align stakeholders and still ship?`,
      rationale: "Checks ownership, communication, and execution under pressure.",
      area: "behavioral",
    },
  ];
}

/**
 * DIFFERENTIATOR #2 — INTERVIEW QUESTION GENERATOR (BATCHED)
 *
 * Generates tailored questions for ALL shortlisted candidates in ONE Gemini call
 * instead of N separate calls — saving precious free-tier RPD quota.
 */
export async function generateInterviewQuestionsForAll(
  job: Record<string, unknown>,
  shortlist: RankedCandidate[],
  allApplicants: Record<string, unknown>[]
): Promise<RankedCandidate[]> {
  // Skip candidates without documents
  const eligible = shortlist.filter((c) => c.documentStatus !== "insufficient");
  if (eligible.length === 0) return shortlist;

  try {
    const model = getGenAI().getGenerativeModel({ model: getFastModel(), generationConfig });

    const candidateSummaries = eligible.map((candidate) => {
      const applicant = allApplicants.find((a) => String(a._id) === candidate.applicantId);
      const profileText = applicant?.rawResumeText
        ? (applicant.rawResumeText as string).slice(0, 600)
        : JSON.stringify(applicant?.profile || {}).slice(0, 600);

      return `{
  "applicantId": "${candidate.applicantId}",
  "name": "${candidate.candidateName}",
  "score": ${candidate.overallScore},
  "strengths": ${JSON.stringify(candidate.strengths)},
  "gaps": ${JSON.stringify(candidate.gaps)},
  "profile_snippet": ${JSON.stringify(profileText)}
}`;
    }).join(",\n");

    const prompt = `You are a senior technical recruiter preparing interviews for shortlisted candidates.

ROLE: ${job.title}
Required skills: ${JSON.stringify((job.requirements as Record<string, unknown>)?.requiredSkills)}

For EACH candidate below, generate exactly 4 targeted interview questions:
- 2 technical questions probing their stated strengths
- 1 question that tactfully explores their main gap
- 1 behavioral/situational question relevant to the role

Candidates:
[${candidateSummaries}]

Return ONLY valid JSON — an object keyed by applicantId:
{
  "<applicantId>": [
    { "question": "...", "rationale": "...", "area": "technical" | "behavioral" | "gap_probe" | "cultural_fit" }
  ]
}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsed: Record<string, InterviewQuestion[]> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return shortlist.map((candidate) => ({
      ...candidate,
      interviewQuestions: parsed[candidate.applicantId] ?? [],
    }));
  } catch (err) {
    console.error("[InterviewGen] Batch generation failed:", err instanceof Error ? err.message : err);
    return shortlist.map((candidate) => ({
      ...candidate,
      interviewQuestions:
        candidate.documentStatus === "insufficient"
          ? []
          : buildFallbackInterviewQuestions(job, candidate),
    }));
  }
}

// Keep single-candidate variant for backwards compatibility
export async function generateInterviewQuestions(
  job: Record<string, unknown>,
  candidate: RankedCandidate,
  allApplicants: Record<string, unknown>[]
): Promise<RankedCandidate> {
  const results = await generateInterviewQuestionsForAll(job, [candidate], allApplicants);
  return results[0];
}
