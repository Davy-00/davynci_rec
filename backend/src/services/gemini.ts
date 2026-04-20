import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import type { RankedCandidate, ScoreBreakdown } from "@davinci/shared";

function getReasoningModel() {
  return process.env.GEMINI_REASONING_MODEL || "gemini-1.5-flash";
}

// Conservative delay between sequential candidate calls to respect RPM limits
const INTER_CALL_DELAY_MS = 1000;

// Per-candidate config: deterministic scoring, full JSON output
const singleCandidateConfig: GenerationConfig = {
  temperature: 0.2,
  topP: 0.95,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: getReasoningModel(),
    generationConfig: singleCandidateConfig,
  });
}

function buildJobSummary(job: Record<string, unknown>): string {
  const req = job.requirements as Record<string, unknown>;
  return `JOB TITLE: ${job.title}
DESCRIPTION: ${(job.description as string)?.slice(0, 600)}
REQUIRED SKILLS: ${(req?.requiredSkills as string[])?.join(", ")}
PREFERRED SKILLS: ${(req?.preferredSkills as string[])?.join(", ") || "None specified"}
EXPERIENCE REQUIRED: ${req?.yearsOfExperience} years
EDUCATION: ${req?.educationLevel || "Not specified"} in ${req?.educationField || "any field"}
RESPONSIBILITIES: ${(job.responsibilities as string[])?.slice(0, 5).join("; ")}
NICE TO HAVE: ${(job.niceToHave as string[])?.join(", ") || "None"}`.trim();
}

// ─── Document Completeness Check ─────────────────────────────────────────────

interface DocumentCheck {
  status: "sufficient" | "partial" | "insufficient";
  notes: string;
}

function checkDocuments(applicant: Record<string, unknown>): DocumentCheck {
  const hasResume =
    typeof applicant.rawResumeText === "string" &&
    applicant.rawResumeText.trim().length > 100;

  const profile = (applicant.profile || {}) as Record<string, unknown>;
  const hasProfileName =
    !!(profile.fullName || profile.name || `${profile.firstName || ""} ${profile.lastName || ""}`.trim());
  const hasProfile =
    hasProfileName &&
    (!!(profile.skills as unknown[])?.length ||
      !!(profile.experience as unknown[])?.length ||
      !!(profile.projects as unknown[])?.length ||
      !!(profile.education as unknown[])?.length ||
      !!(profile.yearsOfExperience));

  const hasFormAnswers =
    !!applicant.formAnswers &&
    Object.keys(applicant.formAnswers as object).length > 0;

  if (hasResume || hasProfile) {
    return {
      status: "sufficient",
      notes: "Resume or structured profile provided.",
    };
  }

  if (hasFormAnswers) {
    return {
      status: "partial",
      notes:
        "Only application form answers provided — no resume or structured profile found. Analysis based on form responses only; manual document review recommended.",
    };
  }

  return {
    status: "insufficient",
    notes:
      "No resume, profile, or form answers found. This applicant cannot be evaluated — please request their documents.",
  };
}

// ─── Build Candidate Profile Text ────────────────────────────────────────────

function buildCandidateProfileText(applicant: Record<string, unknown>): string {
  const parts: string[] = [];

  if (applicant.rawResumeText) {
    parts.push(`RESUME:\n${(applicant.rawResumeText as string).slice(0, 6000)}`);
  } else if (applicant.profile) {
    const p = applicant.profile as Record<string, unknown>;
    const derivedName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
    if (p.fullName || p.name || derivedName) parts.push(`NAME: ${p.fullName || p.name || derivedName}`);
    if (p.location) parts.push(`LOCATION: ${p.location}`);
    if (p.yearsOfExperience) parts.push(`TOTAL EXPERIENCE: ${p.yearsOfExperience} years`);
    if (p.headline) parts.push(`HEADLINE: ${p.headline}`);
    if (p.bio || p.summary) parts.push(`BIO: ${p.bio || p.summary}`);
    if ((p.skills as unknown[])?.length)
      parts.push(`SKILLS: ${JSON.stringify(p.skills).slice(0, 1200)}`);
    if ((p.languages as unknown[])?.length)
      parts.push(`LANGUAGES: ${JSON.stringify(p.languages).slice(0, 500)}`);
    if ((p.experience as unknown[])?.length)
      parts.push(`WORK HISTORY: ${JSON.stringify(p.experience).slice(0, 1800)}`);
    if ((p.education as unknown[])?.length)
      parts.push(`EDUCATION: ${JSON.stringify(p.education).slice(0, 800)}`);
    if ((p.certifications as unknown[])?.length)
      parts.push(`CERTIFICATIONS: ${JSON.stringify(p.certifications).slice(0, 600)}`);
    if ((p.projects as unknown[])?.length)
      parts.push(`PROJECTS: ${JSON.stringify(p.projects).slice(0, 1200)}`);
    if (p.availability)
      parts.push(`AVAILABILITY: ${JSON.stringify(p.availability).slice(0, 300)}`);
    if (p.socialLinks)
      parts.push(`SOCIAL LINKS: ${JSON.stringify(p.socialLinks).slice(0, 400)}`);
    if (p.portfolioUrl) parts.push(`PORTFOLIO: ${p.portfolioUrl}`);
    if (p.githubUrl) parts.push(`GITHUB: ${p.githubUrl}`);
    if (p.linkedinUrl) parts.push(`LINKEDIN: ${p.linkedinUrl}`);
  }

  if (applicant.formAnswers) {
    const answers = applicant.formAnswers as Record<string, string>;
    const answersText = Object.entries(answers)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join("\n\n");
    if (answersText.trim()) parts.push(`APPLICATION FORM ANSWERS:\n${answersText}`);
  }

  return parts.join("\n\n");
}

// ─── Individual Analysis Types ────────────────────────────────────────────────

export interface IndividualAnalysis {
  applicantId: string;
  candidateName: string;
  documentStatus: "sufficient" | "partial" | "insufficient";
  documentNotes: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

// ─── Analyze a Single Candidate ──────────────────────────────────────────────

async function analyzeOneCandidate(
  job: Record<string, unknown>,
  applicant: Record<string, unknown>
): Promise<IndividualAnalysis> {
  const profile = (applicant.profile || {}) as Record<string, unknown>;
  const candidateName =
    (profile.fullName as string) ||
    `${(profile.firstName as string) || ""} ${(profile.lastName as string) || ""}`.trim() ||
    (profile.name as string) ||
    "Unknown Applicant";
  const applicantId = String(applicant._id || "");

  // Fast path: no documents
  const docCheck = checkDocuments(applicant);
  if (docCheck.status === "insufficient") {
    return {
      applicantId,
      candidateName,
      documentStatus: "insufficient",
      documentNotes: docCheck.notes,
      overallScore: 0,
      scoreBreakdown: {
        skillsMatch: 0,
        experienceRelevance: 0,
        educationFit: 0,
        overallRelevance: 0,
      },
      strengths: [],
      gaps: [
        "No documents submitted. Cannot evaluate this applicant without a resume, profile, or form answers.",
      ],
      recommendation:
        "Cannot evaluate — no documents submitted. Contact applicant to request materials.",
    };
  }

  const profileText = buildCandidateProfileText(applicant);
  const partialWarning =
    docCheck.status === "partial"
      ? "\nIMPORTANT: This applicant only provided form answers — no resume or profile. Evaluate based on answers only and note this limitation clearly."
      : "";

  const prompt = `You are an expert AI recruiter for Davinci, analyzing tech talent in Africa.
Your mission: Provide DEEPLY INTELLIGENT evaluation with SPECIFIC EVIDENCE-BASED reasoning.

CRITICAL SCORING PRINCIPLES:
- Each score MUST be justified with CONCRETE examples from the candidate's actual profile data.
- Do NOT give similar scores to candidates with vastly different experience levels.
- A candidate with 7 years of React/Next.js experience MUST score significantly higher on skillsMatch than one with 1 year.
- A candidate with 5 relevant projects MUST score higher on experienceRelevance than one with 0.
- Be STRICT: If a required skill is missing from the candidate's profile, that's a real gap — don't inflate the score.
- Be GENEROUS only where evidence directly supports it — actual named technologies, years, projects, achievements.
- NEVER hallucinate skills or experience the candidate didn't mention.

ANTI-BIAS RULES (critical):
- Do NOT factor name, gender, ethnicity, nationality, or age
- Do NOT favor prestigious schools — only field relevance and education level matter
- Do NOT penalize career gaps unless skills clearly regressed
- Do NOT favor traditional paths over self-taught/bootcamp backgrounds if skills are strong
- DO prioritize demonstrated work quality and real project outcomes
- DO value strong communication in application answers as evidence of professionalism
- DO recognize transferable skills (e.g., strong CS fundamentals can bridge specific tech gaps quickly)
${partialWarning}

=== JOB REQUIREMENTS ===
${buildJobSummary(job)}

=== CANDIDATE PROFILE ===
${profileText}

=== STRICT SCORING FRAMEWORK ===
Each dimension scored 0–100. You MUST cite specific evidence for your scores.
IMPORTANT: Score ONLY based on what the candidate has actually provided. Missing info = lower score.

skillsMatch (40% weight — most critical):
  95-100: Masters ALL required + most preferred skills. Evidence: X years with Y tech, built Z projects
  85-94: Strong in all required skills with proof. Minor preferred skill gaps but fast learner signals
  70-84: Meets core required skills, some gaps in preferred. Evidence shows capability to learn
  55-69: Meets majority of required skills but missing 1-2 critical ones. Adjacent experience exists
  40-54: Meets some required skills, several gaps. Related skills suggest trainable
  0-39: Missing most required skills with no compensating adjacent expertise

experienceRelevance (30% weight):
  95-100: Deep relevant experience (5+ years in exact domain) + quantified achievements ("increased X by 40%")
  85-94: Strong relevant experience (3-5 years) with clear impact stories
  70-84: Solid relevant experience (2-3 years) or strong adjacent domain experience
  55-69: Some relevant experience (1-2 years) or strong junior work in related areas
  40-54: Limited relevant experience but transferable skills from other domains
  0-39: Little to no professional experience aligned to this role

educationFit (15% weight):
  95-100: Perfect match — required degree in exact field from accredited institution
  85-94: Closely related field (e.g., CS for Software Eng) at required level
  70-84: Related field OR one level below required but compensated by strong experience
  55-69: Adjacent field (e.g., Math for CS role) or meets level but different field
  40-54: Different field + below required level, weak compensation
  0-39: No relevant education and no compensating factors

overallRelevance (15% weight — communication, culture fit, motivation):
  95-100: Exceptional communication skills evident. Clear passion for role. Strong self-awareness
  85-94: Excellent communication. Specific motivations tied to role/company. Professional polish
  70-84: Good communication. Relevant motivations. Shows understanding of role expectations
  55-69: Adequate communication. Generic motivations but professional tone
  40-54: Weak communication or unclear fit signals. Minimal effort shown
  0-39: Very poor communication or completely irrelevant application

FINAL overallScore formula:
  round(skillsMatch*0.4 + experienceRelevance*0.3 + educationFit*0.15 + overallRelevance*0.15)

=== OUTPUT FORMAT (valid JSON only, no markdown) ===
{
  "candidateName": "their name",
  "overallScore": 82,
  "scoreBreakdown": {
    "skillsMatch": 85,
    "experienceRelevance": 80,
    "educationFit": 78,
    "overallRelevance": 82
  },
  "strengths": [
    "Specific strength 1 with evidence (e.g., '6 years React experience with 3 production apps deployed')",
    "Specific strength 2 citing concrete work (e.g., 'Led team of 4 engineers at ScaleHR, shipped dashboard in 6 months')",
    "Specific strength 3 tied to job need (e.g., 'Next.js + TypeScript stack matches our requirements exactly')"
  ],
  "gaps": [
    "Specific, honest gap (e.g., 'No Redux Toolkit experience — has used Context API instead')",
    "Constructive gap with context (e.g., 'Only 1 year Node.js vs 3 years required, but strong JS fundamentals suggest quick ramp')"
  ],
  "recommendation": "Clear, actionable recommendation in 2-3 sentences. Explain WHY this score makes sense given evidence, and suggest next step. Example: 'Strong technical match for senior frontend role with deep React/Next.js background and proven team leadership. Slight gap in Redux Toolkit but shows fast learning ability with similar state management tools. Recommend technical screen focused on component architecture and state patterns.'"
}`;

  // Retry up to 5 times with exponential back-off (429s need longer waits)
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Unparseable JSON from Gemini");
        parsed = JSON.parse(match[0]);
      }

      return {
        applicantId,
        candidateName: (parsed.candidateName as string) || candidateName,
        documentStatus: docCheck.status,
        documentNotes: docCheck.notes,
        overallScore: Number(parsed.overallScore) || 0,
        scoreBreakdown: parsed.scoreBreakdown as ScoreBreakdown,
        strengths: (parsed.strengths as string[]) || [],
        gaps: (parsed.gaps as string[]) || [],
        recommendation: (parsed.recommendation as string) || "",
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const is429 = lastError.message.includes('429') || lastError.message.includes('Too Many Requests');
      console.error(
        `[Gemini] Attempt ${attempt + 1} failed for applicant ${applicantId}:`,
        lastError.message.slice(0, 200)
      );
      if (attempt < 4) {
        const delay = is429 ? 15000 * (attempt + 1) : 3000 * (attempt + 1);
        console.log(`[Gemini] Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — return a safe placeholder instead of crashing
  return {
    applicantId,
    candidateName,
    documentStatus: docCheck.status,
    documentNotes: `AI analysis failed after 5 attempts: ${lastError?.message || "Unknown error"}`,    
    overallScore: 0,
    scoreBreakdown: {
      skillsMatch: 0,
      experienceRelevance: 0,
      educationFit: 0,
      overallRelevance: 0,
    },
    strengths: [],
    gaps: [`AI analysis unavailable: ${lastError?.message || "Unknown error"}. Manual review required.`],
    recommendation: "Analysis unavailable due to AI error. Manual review required.",
  };
}

// ─── Primary Screening Entry Point ───────────────────────────────────────────

/**
 * Analyzes each applicant INDIVIDUALLY against the job (no batching).
 * This eliminates token overflow failures and gives per-candidate retry logic.
 * Progress is reported via onProgress callback so the route can persist it to DB.
 */
export async function runScreening(
  job: Record<string, unknown>,
  applicants: Record<string, unknown>[],
  shortlistSize: 10 | 20,
  onProgress?: (completed: number, total: number, candidateDetails?: {
    candidateName: string;
    status: "analyzing" | "completed";
    overallScore?: number;
    recommendation?: string;
  }) => Promise<void>,
  cachedScores?: Map<string, IndividualAnalysis>
): Promise<{ candidates: IndividualAnalysis[]; analysisStats: { total: number; scored: number; insufficientDocs: number; fromCache: number } }> {
  const results: IndividualAnalysis[] = [];
  let callsThisRun = 0;

  for (let i = 0; i < applicants.length; i++) {
    const applicantId = String(applicants[i]._id || "");
    const candidateName = String(applicants[i].name || "Unknown");

    // ── Cache hit: reuse prior analysis, no API call ──
    const cached = cachedScores?.get(applicantId);
    if (cached) {
      console.log(`[Screening] Cache hit for applicant ${i + 1}/${applicants.length} — skipping Gemini call.`);
      results.push(cached);
      if (onProgress) {
        await onProgress(i + 1, applicants.length, {
          candidateName,
          status: "completed",
          overallScore: cached.overallScore,
          recommendation: cached.recommendation,
        });
      }
      continue;
    }

    // Notify frontend that we're analyzing this candidate
    if (onProgress) {
      await onProgress(i, applicants.length, {
        candidateName,
        status: "analyzing",
      });
    }

    // ── Rate-limit: enforce 500ms gap if we already made a call this run ──
    if (callsThisRun > 0) await sleep(INTER_CALL_DELAY_MS);

    console.log(`[Screening] Analyzing applicant ${i + 1}/${applicants.length} (API call #${callsThisRun + 1})...`);
    const analysis = await analyzeOneCandidate(job, applicants[i]);
    results.push(analysis);
    callsThisRun++;

    // Notify frontend that analysis is complete
    if (onProgress) {
      await onProgress(i + 1, applicants.length, {
        candidateName,
        status: "completed",
        overallScore: analysis.overallScore,
        recommendation: analysis.recommendation,
      });
    }
  }

  const insufficientDocs = results.filter((r) => r.documentStatus === "insufficient").length;
  const scored = results.filter((r) => r.overallScore > 0).length;
  const fromCache = results.length - callsThisRun;

  return {
    candidates: results,
    analysisStats: { total: results.length, scored, insufficientDocs, fromCache },
  };
}

/**
 * Converts raw IndividualAnalyses into a ranked RankedCandidate shortlist.
 * Insufficient-doc candidates score 0 and naturally fall below real candidates.
 */
export function buildShortlist(
  analyses: IndividualAnalysis[],
  shortlistSize: 10 | 20
): RankedCandidate[] {
  // Deduplicate by applicantId — keep the highest-scoring entry per candidate
  const bestByApplicant = new Map<string, IndividualAnalysis>();
  for (const a of analyses) {
    const existing = bestByApplicant.get(a.applicantId);
    if (!existing || a.overallScore > existing.overallScore) {
      bestByApplicant.set(a.applicantId, a);
    }
  }

  return Array.from(bestByApplicant.values())
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, shortlistSize)
    .map((a, idx) => ({
      rank: idx + 1,
      applicantId: a.applicantId,
      candidateName: a.candidateName,
      overallScore: a.overallScore,
      scoreBreakdown: a.scoreBreakdown,
      strengths: a.strengths,
      gaps: a.gaps,
      recommendation: a.recommendation,
      documentStatus: a.documentStatus,
      documentNotes: a.documentNotes,
      interviewQuestions: [],
      recruiterFeedback: null,
    }));
}
