import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import type { BiasAuditReport, RankedCandidate } from "@davinci/shared";

const generationConfig: GenerationConfig = {
  temperature: 0.1,
  topP: 0.9,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
};

function getReasoningModel() {
  return process.env.GEMINI_REASONING_MODEL || "gemini-1.5-flash";
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * DIFFERENTIATOR #1 — BIAS GUARD
 *
 * After the primary ranking is done, a second independent Gemini call
 * audits the shortlist for potential bias signals. This is unique in the
 * hackathon field and directly addresses "AI clarity and responsibility".
 *
 * The audit checks for:
 * - Institution concentration (did we over-index on graduates from one school?)
 * - Company-type bias (all Big Tech, ignoring strong startup candidates?)
 * - Experience-gap bias (penalizing career breaks unfairly?)
 * - Language/phrasing bias in the AI's own reasoning
 * - Demographic signal risk from names/locations
 */
export async function runBiasAudit(
  job: Record<string, unknown>,
  shortlist: RankedCandidate[],
  allApplicants: Record<string, unknown>[]
): Promise<BiasAuditReport> {
  const model = getGenAI().getGenerativeModel({
    model: getReasoningModel(),
    generationConfig,
  });

  const shortlistSummary = shortlist
    .map(
      (c) =>
        `Rank ${c.rank}: ${c.candidateName} | Score: ${c.overallScore} | ` +
        `Strengths: ${c.strengths.join("; ")} | Gaps: ${c.gaps.join("; ")}`
    )
    .join("\n");

  // Extract institution and company info for pattern analysis
  const profileData = allApplicants.slice(0, 50).map((a, i) => {
    const p = (a.profile || a) as Record<string, unknown>;
    const edu = (p.education as Array<{ institution?: string }>) || [];
    const exp = (p.experience as Array<{ company?: string }>) || [];
    return {
      index: i,
      institutions: edu.map((e) => e.institution || "").filter(Boolean),
      companies: exp.map((e) => e.company || "").filter(Boolean),
      name: p.fullName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || "",
    };
  });

  const prompt = `
You are an AI Ethics Auditor reviewing an AI-generated candidate shortlist for hiring bias.
Your role is to protect the recruiter and the company from unintentional discrimination
while ensuring fair opportunity for all qualified candidates.

=== JOB ===
Title: ${job.title}
Required Skills: ${JSON.stringify((job.requirements as Record<string, unknown>)?.requiredSkills)}

=== SHORTLISTED CANDIDATES (${shortlist.length}) ===
${shortlistSummary}

=== FULL APPLICANT POOL CONTEXT ===
Total applicants: ${allApplicants.length}
Sample profile data: ${JSON.stringify(profileData.slice(0, 20))}

=== BIAS AUDIT INSTRUCTIONS ===
Analyze the shortlist for these potential bias patterns:
1. INSTITUTION CONCENTRATION: Are shortlisted candidates clustered from the same universities/bootcamps?
2. COMPANY TYPE BIAS: Are only candidates from certain company types (e.g., FAANG, startups) favored?
3. EXPERIENCE GAP BIAS: Are candidates with career breaks penalized unfairly?
4. LANGUAGE BIAS: Does the AI's reasoning use language that could signal gender/ethnic bias?
5. GEOGRAPHIC BIAS: Is diversity of location reflected reasonably?
6. RECENCY BIAS: Are candidates over-weighted purely for recent company prestige?

Return ONLY a valid JSON object with this exact structure:
{
  "riskLevel": "low" | "medium" | "high",
  "flags": [
    {
      "type": "institution_concentration" | "company_type" | "language_bias" | "experience_gap" | "other",
      "description": "Clear description of the potential bias detected",
      "affectedCandidates": [1, 3],
      "severity": "info" | "warning" | "critical"
    }
  ],
  "overallAssessment": "2-3 sentence summary of the fairness of this shortlist and any recommended recruiter actions."
}

If no bias is detected, return an empty flags array with riskLevel "low".
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text) as BiasAuditReport;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      // Fail safe — return a neutral audit rather than crashing the screening
      return {
        riskLevel: "low",
        flags: [],
        overallAssessment:
          "Bias audit could not be fully completed. Manual review recommended.",
      };
    }
    return JSON.parse(match[0]) as BiasAuditReport;
  }
}
