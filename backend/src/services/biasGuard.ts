import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import type { BiasAuditReport, RankedCandidate } from "@davinci/shared";
import { resolveGeminiModel } from "./geminiModel";

const generationConfig: GenerationConfig = {
  temperature: 0.1,
  topP: 0.9,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
};

function getReasoningModel() {
  return resolveGeminiModel(process.env.GEMINI_REASONING_MODEL, "gemini-2.0-flash");
}

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  return new GoogleGenerativeAI(apiKey);
}

function summarizeAuditFailure(error?: Error): string {
  const message = error?.message.toLowerCase() || "";
  if (message.includes("429") || message.includes("too many requests") || message.includes("quota")) {
    return "live Gemini quota is currently exhausted";
  }
  if (message.includes("404") || message.includes("not found")) {
    return "the configured Gemini model is unavailable";
  }
  if (message.includes("api key") || message.includes("permission") || message.includes("unauthorized")) {
    return "AI audit credentials are unavailable";
  }
  return "the live Gemini audit is unavailable";
}

function buildFallbackBiasAudit(
  shortlist: RankedCandidate[],
  allApplicants: Record<string, unknown>[],
  error?: Error
): BiasAuditReport {
  const flags: BiasAuditReport["flags"] = [];
  const shortlistApplicants = shortlist
    .map((candidate) =>
      allApplicants.find((applicant) => String((applicant as Record<string, unknown>)._id || "") === candidate.applicantId)
    )
    .filter((applicant): applicant is Record<string, unknown> => Boolean(applicant));

  const institutionCounts = new Map<string, number>();
  for (const applicant of shortlistApplicants) {
    const profile = ((applicant.profile || applicant) as Record<string, unknown>) || {};
    const education = Array.isArray(profile.education) ? profile.education : [];
    const institution = String((education[0] as Record<string, unknown> | undefined)?.institution || "").trim();
    if (institution) {
      institutionCounts.set(institution, (institutionCounts.get(institution) || 0) + 1);
    }
  }

  for (const [institution, count] of institutionCounts) {
    if (shortlist.length >= 3 && count >= Math.ceil(shortlist.length * 0.6)) {
      flags.push({
        type: "institution_concentration",
        description: `${count} of ${shortlist.length} shortlisted candidates share ${institution} as a recent education signal. Review whether this reflects skill concentration or unintended school bias.`,
        severity: "warning",
      });
      break;
    }
  }

  const lowConfidenceCount = shortlist.filter((candidate) => (candidate.confidence || 0) < 60).length;
  if (lowConfidenceCount >= Math.ceil(Math.max(shortlist.length, 1) / 2)) {
    flags.push({
      type: "other",
      description: `${lowConfidenceCount} shortlisted candidates were scored in degraded mode with lower confidence. Recruiters should manually review evidence before final decisions.`,
      severity: "info",
    });
  }

  const message = summarizeAuditFailure(error);
  return {
    riskLevel: flags.some((flag) => flag.severity === "warning" || flag.severity === "critical") ? "medium" : "low",
    flags,
    overallAssessment: `Bias Guard used deterministic fallback because ${message}. No automatic re-ranking was performed; manual fairness review is still recommended.`,
  };
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
  try {
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
        return buildFallbackBiasAudit(shortlist, allApplicants);
      }
      return JSON.parse(match[0]) as BiasAuditReport;
    }
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    console.error("[BiasGuard] Falling back to heuristic bias audit:", normalized.message);
    return buildFallbackBiasAudit(shortlist, allApplicants, normalized);
  }
}
