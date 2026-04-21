import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import type { HireVerdict, RankedCandidate, ScoreBreakdown, TalentProfile } from "@davinci/shared";
import { resolveGeminiModel } from "./geminiModel";

function getReasoningModel() {
  return resolveGeminiModel(process.env.GEMINI_REASONING_MODEL, "gemini-2.0-flash");
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
  const requiredSkills = expandRequirementTerms((req?.requiredSkills as string[]) || []);
  const preferredSkills = expandRequirementTerms((req?.preferredSkills as string[]) || []);
  return `JOB TITLE: ${job.title}
DESCRIPTION: ${(job.description as string)?.slice(0, 600)}
REQUIRED SKILLS: ${requiredSkills.join(", ")}
PREFERRED SKILLS: ${preferredSkills.join(", ") || "None specified"}
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
  }

  if (applicant.profile) {
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

interface CandidateSignals {
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedPreferredSkills: string[];
  estimatedYearsOfExperience: number;
  roleCount: number;
  projectCount: number;
  certificationCount: number;
  impactSignalCount: number;
  leadershipSignalCount: number;
  deliverySignalCount: number;
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function expandRequirementTerms(values: string[]): string[] {
  return uniqueNonEmpty(
    values.flatMap((value) =>
      String(value || "")
        .split(/,|\/|\band\b/gi)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function includesEvidence(rawText: string, normalizedText: string, term: string): boolean {
  const rawTerm = term.toLowerCase().trim();
  if (!rawTerm) return false;
  if (rawText.includes(rawTerm)) return true;

  const normalizedTerm = normalizeForMatch(rawTerm);
  return normalizedTerm.length > 1 && normalizedText.includes(normalizedTerm);
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function countRegexHits(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function parseLooseDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function estimateExperienceYears(profile: Partial<TalentProfile>): number {
  const explicitYears = Number(profile.yearsOfExperience) || 0;
  const skillYears = Array.isArray(profile.skills)
    ? profile.skills.reduce((highest, skill) => {
        const years = Number(skill.yearsOfExperience ?? skill.yearsUsed) || 0;
        return Math.max(highest, years);
      }, 0)
    : 0;

  let timelineYears = 0;
  if (Array.isArray(profile.experience) && profile.experience.length > 0) {
    const starts = profile.experience
      .map((item) => parseLooseDate(item.startDate))
      .filter((date): date is Date => Boolean(date));
    const ends = profile.experience
      .map((item) => parseLooseDate(item.endDate) ?? (item.isCurrent ? new Date() : null))
      .filter((date): date is Date => Boolean(date));

    if (starts.length > 0 && ends.length > 0) {
      const earliestStart = Math.min(...starts.map((date) => date.getTime()));
      const latestEnd = Math.max(...ends.map((date) => date.getTime()));
      const diffYears = (latestEnd - earliestStart) / (1000 * 60 * 60 * 24 * 365.25);
      timelineYears = Math.max(diffYears, 0);
    }
  }

  return Math.round(Math.max(explicitYears, skillYears, timelineYears) * 10) / 10;
}

function extractStructuredTerms(profile: Partial<TalentProfile>): string[] {
  const terms: string[] = [];

  if (Array.isArray(profile.skills)) {
    terms.push(...profile.skills.map((skill) => skill.name || ""));
  }

  if (Array.isArray(profile.experience)) {
    for (const item of profile.experience) {
      terms.push(item.role || "", item.title || "", item.company || "");
      if (Array.isArray(item.technologies)) terms.push(...item.technologies);
      if (Array.isArray(item.skills)) terms.push(...item.skills);
      if (Array.isArray(item.achievements)) terms.push(...item.achievements);
    }
  }

  if (Array.isArray(profile.projects)) {
    for (const item of profile.projects) {
      terms.push(item.name || "", item.role || "", item.description || "");
      if (Array.isArray(item.technologies)) terms.push(...item.technologies);
    }
  }

  if (Array.isArray(profile.certifications)) {
    terms.push(...profile.certifications.map((item) => item.name || ""));
  }

  if (Array.isArray(profile.education)) {
    for (const item of profile.education) {
      terms.push(item.degree || "", item.fieldOfStudy || item.field || "", item.institution || "");
    }
  }

  return uniqueNonEmpty(terms);
}

function buildCandidateSignals(
  job: Record<string, unknown>,
  applicant: Record<string, unknown>,
  profileText: string
): CandidateSignals {
  const requirements = ((job.requirements || {}) as Record<string, unknown>) || {};
  const requiredSkills = Array.isArray(requirements.requiredSkills)
    ? expandRequirementTerms(requirements.requiredSkills.map((skill) => String(skill)))
    : [];
  const preferredSkills = Array.isArray(requirements.preferredSkills)
    ? expandRequirementTerms(requirements.preferredSkills.map((skill) => String(skill)))
    : [];
  const profile = ((applicant.profile || {}) as Partial<TalentProfile>) || {};
  const structuredTerms = extractStructuredTerms(profile);
  const combinedText = `${profileText}\n${structuredTerms.join("\n")}`;
  const rawText = combinedText.toLowerCase();
  const normalizedText = normalizeForMatch(combinedText);

  const matchedRequiredSkills = requiredSkills.filter((skill) =>
    includesEvidence(rawText, normalizedText, skill)
  );
  const missingRequiredSkills = requiredSkills.filter(
    (skill) => !matchedRequiredSkills.includes(skill)
  );
  const matchedPreferredSkills = preferredSkills.filter((skill) =>
    includesEvidence(rawText, normalizedText, skill)
  );

  const quantifiedImpactCount = countRegexHits(
    rawText,
    /\b\d+(?:\.\d+)?%|\$\d[\d,]*|\b\d+\+|\b\d+x\b/gi
  );
  const impactKeywordCount = [
    "increased",
    "reduced",
    "improved",
    "grew",
    "saved",
    "scaled",
    "optimized",
    "automated",
    "accelerated",
    "boosted",
  ].filter((keyword) => includesEvidence(rawText, normalizedText, keyword)).length;
  const leadershipSignalCount = [
    "led",
    "managed",
    "mentored",
    "owned",
    "drove",
    "coordinated",
    "architected",
    "supervised",
  ].filter((keyword) => includesEvidence(rawText, normalizedText, keyword)).length;
  const deliverySignalCount = [
    "built",
    "launched",
    "shipped",
    "deployed",
    "implemented",
    "delivered",
    "released",
    "designed",
  ].filter((keyword) => includesEvidence(rawText, normalizedText, keyword)).length;

  return {
    matchedRequiredSkills,
    missingRequiredSkills,
    matchedPreferredSkills,
    estimatedYearsOfExperience: estimateExperienceYears(profile),
    roleCount: Array.isArray(profile.experience) ? profile.experience.length : 0,
    projectCount: Array.isArray(profile.projects) ? profile.projects.length : 0,
    certificationCount: Array.isArray(profile.certifications) ? profile.certifications.length : 0,
    impactSignalCount: quantifiedImpactCount + impactKeywordCount,
    leadershipSignalCount,
    deliverySignalCount,
  };
}

function formatCandidateSignals(signals: CandidateSignals): string {
  const totalRequired = signals.matchedRequiredSkills.length + signals.missingRequiredSkills.length;

  return [
    `Required skill coverage: ${signals.matchedRequiredSkills.length}/${totalRequired || 0}`,
    `Matched required skills: ${signals.matchedRequiredSkills.join(", ") || "None detected directly"}`,
    `Missing required skills: ${signals.missingRequiredSkills.join(", ") || "None obvious"}`,
    `Matched preferred skills: ${signals.matchedPreferredSkills.join(", ") || "None detected directly"}`,
    `Estimated years of experience: ${signals.estimatedYearsOfExperience || 0}`,
    `Profile depth: ${signals.roleCount} roles, ${signals.projectCount} projects, ${signals.certificationCount} certifications`,
    `Impact signals found: ${signals.impactSignalCount}`,
    `Leadership signals found: ${signals.leadershipSignalCount}`,
    `Delivery signals found: ${signals.deliverySignalCount}`,
  ].join("\n");
}

function clampScore(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];

  return uniqueNonEmpty(
    value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, maxItems)
  );
}

function normalizeScoreBreakdown(value: unknown): ScoreBreakdown {
  const breakdown = (value || {}) as Record<string, unknown>;
  return {
    skillsMatch: clampScore(breakdown.skillsMatch),
    experienceRelevance: clampScore(breakdown.experienceRelevance),
    educationFit: clampScore(breakdown.educationFit),
    overallRelevance: clampScore(breakdown.overallRelevance),
  };
}

function normalizeVerdict(value: unknown, overallScore: number): HireVerdict {
  const normalized = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  if (normalized === "strong_yes" || normalized === "yes" || normalized === "maybe" || normalized === "no") {
    return normalized;
  }

  if (overallScore >= 85) return "strong_yes";
  if (overallScore >= 70) return "yes";
  if (overallScore >= 55) return "maybe";
  return "no";
}

function defaultConfidence(documentStatus: "sufficient" | "partial" | "insufficient"): number {
  if (documentStatus === "sufficient") return 78;
  if (documentStatus === "partial") return 52;
  return 0;
}

function normalizeEducationLevel(level: unknown): number {
  const normalized = String(level || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (!normalized) return 0;
  if (normalized.includes("phd") || normalized.includes("doctor")) return 4;
  if (normalized.includes("master") || normalized === "msc" || normalized === "ma") return 3;
  if (
    normalized.includes("bachelor") ||
    normalized === "bs" ||
    normalized === "ba" ||
    normalized === "bsc"
  ) {
    return 2;
  }
  if (normalized.includes("highschool") || normalized.includes("secondary")) return 1;
  return 1;
}

function getEducationSignals(
  profile: Partial<TalentProfile>,
  requiredField: string | undefined
): { highestLevel: number; hasEducation: boolean; fieldMatch: boolean } {
  const education = Array.isArray(profile.education) ? profile.education : [];
  const highestLevel = education.reduce((best, item) => {
    return Math.max(best, normalizeEducationLevel(item.degree));
  }, 0);
  const normalizedRequiredField = normalizeForMatch(requiredField || "");
  const fieldMatch = normalizedRequiredField
    ? education.some((item) => {
        const candidateField = normalizeForMatch(item.fieldOfStudy || item.field || "");
        if (!candidateField) return false;
        return (
          candidateField.includes(normalizedRequiredField) ||
          normalizedRequiredField.includes(candidateField)
        );
      })
    : education.length > 0;

  return {
    highestLevel,
    hasEducation: education.length > 0,
    fieldMatch,
  };
}

function extractEvidenceSnippets(
  text: string,
  matcher: (segment: string) => boolean,
  limit: number
): string[] {
  const segments = text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length >= 18);

  return uniqueNonEmpty(
    segments
      .filter(matcher)
      .map((segment) => (segment.length > 160 ? `${segment.slice(0, 157)}...` : segment))
      .slice(0, limit)
  );
}

function summarizeAiFailure(error: Error | null): string {
  const message = error?.message.toLowerCase() || "";
  if (message.includes("429") || message.includes("too many requests") || message.includes("quota")) {
    return "Live AI quota is currently exhausted";
  }
  if (message.includes("404") || message.includes("not found")) {
    return "Configured AI model is currently unavailable";
  }
  if (message.includes("api key") || message.includes("permission") || message.includes("unauthorized")) {
    return "AI credentials are not available for this run";
  }
  return "Live AI scoring is temporarily unavailable";
}

function extractStructuredImpactEvidence(profile: Partial<TalentProfile>): string[] {
  const actionPattern = /\b(increased|reduced|improved|grew|scaled|optimized|launched|shipped|built|delivered|led|implemented|managed|designed|architected|mentored|owned)\b/i;
  const evidence: string[] = [];

  for (const item of profile.experience || []) {
    if (item.description && actionPattern.test(item.description)) {
      evidence.push(item.description);
    }
    for (const achievement of item.achievements || []) {
      if (actionPattern.test(achievement) || /\d|%/.test(achievement)) {
        evidence.push(achievement);
      }
    }
  }

  for (const item of profile.projects || []) {
    if (item.description && actionPattern.test(item.description)) {
      evidence.push(item.description);
    }
  }

  return uniqueNonEmpty(
    evidence.map((item) => (item.length > 160 ? `${item.slice(0, 157)}...` : item))
  ).slice(0, 4);
}

function shouldFastFallback(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("quota") ||
    message.includes("404") ||
    message.includes("not found") ||
    message.includes("api key") ||
    message.includes("permission") ||
    message.includes("unauthorized")
  );
}

function buildHeuristicAnalysis(
  job: Record<string, unknown>,
  applicantId: string,
  candidateName: string,
  profile: Partial<TalentProfile>,
  docCheck: DocumentCheck,
  candidateSignals: CandidateSignals,
  profileText: string,
  failure: Error | null
): IndividualAnalysis {
  const requirements = ((job.requirements || {}) as Record<string, unknown>) || {};
  const requiredSkills = Array.isArray(requirements.requiredSkills)
    ? expandRequirementTerms(requirements.requiredSkills.map((skill) => String(skill)))
    : [];
  const preferredSkills = Array.isArray(requirements.preferredSkills)
    ? expandRequirementTerms(requirements.preferredSkills.map((skill) => String(skill)))
    : [];
  const requiredYears = Math.max(Number(requirements.yearsOfExperience) || 0, 0);
  const requiredEducationLevel = normalizeEducationLevel(requirements.educationLevel);
  const requiredEducationField = String(requirements.educationField || "").trim();
  const educationSignals = getEducationSignals(profile, requiredEducationField);
  const partialPenalty = docCheck.status === "partial" ? 10 : 0;
  const requiredCoverage = requiredSkills.length
    ? candidateSignals.matchedRequiredSkills.length / requiredSkills.length
    : candidateSignals.matchedPreferredSkills.length > 0
    ? 0.75
    : 0.55;
  const preferredCoverage = preferredSkills.length
    ? candidateSignals.matchedPreferredSkills.length / preferredSkills.length
    : 0;
  const yearsRatio = requiredYears > 0
    ? Math.min(candidateSignals.estimatedYearsOfExperience / requiredYears, 1.25)
    : Math.min(candidateSignals.estimatedYearsOfExperience / 3 || 0, 1.1);

  const skillsMatch = clampScore(
    38 +
      requiredCoverage * 42 +
      preferredCoverage * 10 +
      Math.min(candidateSignals.deliverySignalCount, 4) * 2 +
      Math.min(candidateSignals.estimatedYearsOfExperience, 8) * 1.5 -
      partialPenalty
  );
  const experienceRelevance = clampScore(
    30 +
      yearsRatio * 38 +
      Math.min(candidateSignals.roleCount, 4) * 4 +
      Math.min(candidateSignals.projectCount, 4) * 3 +
      Math.min(candidateSignals.impactSignalCount, 4) * 3 +
      Math.min(candidateSignals.leadershipSignalCount, 3) * 2 -
      partialPenalty
  );

  let educationFit = educationSignals.hasEducation ? 52 : 30;
  if (requiredEducationLevel > 0) {
    if (educationSignals.highestLevel >= requiredEducationLevel) {
      educationFit += 22;
    } else if (educationSignals.highestLevel === requiredEducationLevel - 1) {
      educationFit += 12;
    }
  } else if (educationSignals.hasEducation) {
    educationFit += 14;
  }
  if (educationSignals.fieldMatch) {
    educationFit += 18;
  } else if (!requiredEducationField && educationSignals.hasEducation) {
    educationFit += 8;
  }
  if (!educationSignals.hasEducation && candidateSignals.estimatedYearsOfExperience >= Math.max(requiredYears, 2)) {
    educationFit += 12;
  }
  educationFit = clampScore(educationFit - Math.floor(partialPenalty / 2));

  const hasHeadline = Boolean(profile.headline);
  const hasSummary = Boolean(profile.bio || profile.summary);
  const hasLinks = Boolean(profile.githubUrl || profile.linkedinUrl || profile.portfolioUrl || profile.socialLinks);
  const overallRelevance = clampScore(
    42 +
      (hasHeadline ? 8 : 0) +
      (hasSummary ? 8 : 0) +
      (hasLinks ? 4 : 0) +
      Math.min(candidateSignals.deliverySignalCount, 4) * 4 +
      Math.min(candidateSignals.impactSignalCount, 4) * 3 +
      Math.round(requiredCoverage * 16) -
      partialPenalty
  );

  const overallScore = clampScore(
    Math.round(
      skillsMatch * 0.4 +
        experienceRelevance * 0.3 +
        educationFit * 0.15 +
        overallRelevance * 0.15
    )
  );

  const matchedRequirements = uniqueNonEmpty([
    ...candidateSignals.matchedRequiredSkills,
    ...candidateSignals.matchedPreferredSkills,
  ]).slice(0, 8);
  const missingRequirements = candidateSignals.missingRequiredSkills.slice(0, 8);
  const impactEvidence = extractStructuredImpactEvidence(profile);
  if (impactEvidence.length === 0) {
    const textEvidence = extractEvidenceSnippets(
      profileText,
      (segment) => {
        const lowered = segment.toLowerCase();
        if (/\b(kigali|rwanda|street| st\b|road|avenue|district)\b/.test(lowered)) {
          return false;
        }
        return /\b(increased|reduced|improved|grew|scaled|optimized|launched|shipped|led|built|delivered|implemented|managed|designed)\b/i.test(segment);
      },
      4
    );
    impactEvidence.push(...textEvidence);
  }
  if (impactEvidence.length === 0) {
    if (candidateSignals.projectCount > 0) {
      impactEvidence.push(`Profile shows ${candidateSignals.projectCount} project(s) that can be reviewed in interview.`);
    }
    if (candidateSignals.roleCount > 0) {
      impactEvidence.push(`Work history spans ${candidateSignals.roleCount} role(s) with approximately ${candidateSignals.estimatedYearsOfExperience || 0} years of experience.`);
    }
  }

  const strengths = uniqueNonEmpty([
    matchedRequirements.length > 0
      ? `Matches ${candidateSignals.matchedRequiredSkills.length}/${requiredSkills.length || candidateSignals.matchedRequiredSkills.length} required skills${matchedRequirements.length ? ` including ${matchedRequirements.slice(0, 3).join(", ")}` : ""}.`
      : "",
    candidateSignals.estimatedYearsOfExperience > 0
      ? `Shows about ${candidateSignals.estimatedYearsOfExperience} years of experience across ${candidateSignals.roleCount || 1} relevant role(s).`
      : "",
    impactEvidence[0] || "",
    candidateSignals.leadershipSignalCount > 0
      ? `Leadership and ownership signals appear in prior work history.`
      : "",
  ]).slice(0, 4);

  const failureSummary = summarizeAiFailure(failure);
  const gaps = uniqueNonEmpty([
    missingRequirements.length > 0
      ? `Missing explicit evidence for ${missingRequirements.slice(0, 3).join(", ")}.`
      : "",
    requiredYears > 0 && candidateSignals.estimatedYearsOfExperience < requiredYears
      ? `Experience appears below the requested ${requiredYears} year benchmark.`
      : "",
    docCheck.status === "partial" ? docCheck.notes : "",
    impactEvidence.length === 0
      ? `Few quantified outcomes were detected, so impact should be validated manually.`
      : "",
  ]).slice(0, 4);

  const interviewFocus = uniqueNonEmpty([
    ...missingRequirements.slice(0, 2).map((skill) => `Validate hands-on depth in ${skill}.`),
    impactEvidence.length > 0
      ? `Ask the candidate to break down the measurable outcome they are most responsible for.`
      : `Probe for a concrete example of shipped work and direct ownership.`,
    candidateSignals.leadershipSignalCount > 0
      ? `Clarify whether prior leadership signals reflect true ownership or team participation.`
      : `Test how quickly the candidate can ramp into the role's most important stack areas.`,
  ]).slice(0, 4);

  const confidence = clampScore(
    (docCheck.status === "sufficient" ? 56 : 42) +
      Math.min(matchedRequirements.length, 5) * 4 +
      Math.min(candidateSignals.roleCount, 4) * 2 +
      Math.min(candidateSignals.projectCount, 4) * 2 +
      (educationSignals.hasEducation ? 4 : 0) -
      Math.min(missingRequirements.length, 4) * 3
  );
  const hireVerdict = normalizeVerdict(undefined, overallScore);
  const recommendation = [
    `Heuristic screening suggests a ${hireVerdict.replace("_", " ")} based on ${candidateSignals.matchedRequiredSkills.length}/${requiredSkills.length || 0} required skills matched and an estimated ${candidateSignals.estimatedYearsOfExperience || 0} years of experience.`,
    missingRequirements.length > 0
      ? `Main follow-up areas are ${missingRequirements.slice(0, 2).join(" and ")}.`
      : `The strongest next step is to validate ownership depth and delivery impact in interview.`,
    `${failureSummary}, so this result was generated using deterministic fallback scoring instead of a live model call.`,
  ].join(" ");

  return {
    applicantId,
    candidateName,
    documentStatus: docCheck.status,
    documentNotes: `${docCheck.notes} Deterministic fallback scoring was used for this run.`,
    overallScore,
    confidence,
    hireVerdict,
    scoreBreakdown: {
      skillsMatch,
      experienceRelevance,
      educationFit,
      overallRelevance,
    },
    matchedRequirements,
    missingRequirements,
    impactEvidence: impactEvidence.slice(0, 4),
    riskSignals: uniqueNonEmpty([
      `${failureSummary}; recruiter should treat this as a heuristic result.`,
      ...gaps,
    ]).slice(0, 5),
    interviewFocus,
    strengths,
    gaps,
    recommendation,
  };
}

// ─── Individual Analysis Types ────────────────────────────────────────────────

export interface IndividualAnalysis {
  applicantId: string;
  candidateName: string;
  documentStatus: "sufficient" | "partial" | "insufficient";
  documentNotes: string;
  overallScore: number;
  confidence: number;
  hireVerdict: HireVerdict;
  scoreBreakdown: ScoreBreakdown;
  matchedRequirements: string[];
  missingRequirements: string[];
  impactEvidence: string[];
  riskSignals: string[];
  interviewFocus: string[];
  strengths: string[];
  gaps: string[];
  recommendation: string;
}

// ─── Analyze a Single Candidate ──────────────────────────────────────────────

async function analyzeOneCandidate(
  job: Record<string, unknown>,
  applicant: Record<string, unknown>
): Promise<IndividualAnalysis> {
  const profile = (applicant.profile || {}) as Partial<TalentProfile>;
  const legacyName = String((applicant.profile as Record<string, unknown> | undefined)?.name || "");
  const candidateName =
    (profile.fullName as string) ||
    `${(profile.firstName as string) || ""} ${(profile.lastName as string) || ""}`.trim() ||
    legacyName ||
    "Unknown Applicant";
  const applicantId = String(applicant._id || "");
  const requiredSkills = Array.isArray((job.requirements as Record<string, unknown>)?.requiredSkills)
    ? ((job.requirements as Record<string, unknown>).requiredSkills as string[])
    : [];

  // Fast path: no documents
  const docCheck = checkDocuments(applicant);
  if (docCheck.status === "insufficient") {
    return {
      applicantId,
      candidateName,
      documentStatus: "insufficient",
      documentNotes: docCheck.notes,
      overallScore: 0,
      confidence: 0,
      hireVerdict: "no",
      scoreBreakdown: {
        skillsMatch: 0,
        experienceRelevance: 0,
        educationFit: 0,
        overallRelevance: 0,
      },
      matchedRequirements: [],
      missingRequirements: requiredSkills,
      impactEvidence: [],
      riskSignals: [docCheck.notes],
      interviewFocus: [
        "Request a resume or structured profile before any interview decision is made.",
      ],
      strengths: [],
      gaps: [
        "No documents submitted. Cannot evaluate this applicant without a resume, profile, or form answers.",
      ],
      recommendation:
        "Cannot evaluate — no documents submitted. Contact applicant to request materials.",
    };
  }

  const profileText = buildCandidateProfileText(applicant);
  const candidateSignals = buildCandidateSignals(job, applicant, profileText);
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

=== PRECOMPUTED SCREENING SIGNALS ===
These signals were extracted from the resume/profile to help you inspect the candidate more deeply.
Treat them as hints, not ground truth, and verify them against the actual candidate data above.
${formatCandidateSignals(candidateSignals)}

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

=== ADVANCED DECISION BRIEF ===
- confidence: 0–100 confidence in your assessment based on evidence completeness and specificity
- hireVerdict: one of "strong_yes", "yes", "maybe", "no"
- matchedRequirements: required or preferred skills/needs that are DIRECTLY supported by evidence
- missingRequirements: key required skills or proof points you could not verify in the candidate data
- impactEvidence: 2–4 bullets about measurable outcomes, shipped work, leadership, or ownership
- riskSignals: 2–4 bullets about ambiguity, shallow evidence, role mismatch, or execution risk
- interviewFocus: 2–4 bullets describing what the recruiter/interviewer should probe next
- strengths and gaps should remain concise and evidence-based; do not duplicate the exact same bullets everywhere

=== OUTPUT FORMAT (valid JSON only, no markdown) ===
{
  "candidateName": "their name",
  "overallScore": 82,
  "confidence": 86,
  "hireVerdict": "yes",
  "scoreBreakdown": {
    "skillsMatch": 85,
    "experienceRelevance": 80,
    "educationFit": 78,
    "overallRelevance": 82
  },
  "matchedRequirements": [
    "React + Next.js evidenced in 3 recent roles and 2 shipped projects",
    "TypeScript used across production frontend work"
  ],
  "missingRequirements": [
    "No direct Redis or caching experience found"
  ],
  "impactEvidence": [
    "Improved conversion by 18% on a production dashboard",
    "Led delivery of a customer-facing app used by 12k+ users"
  ],
  "riskSignals": [
    "Backend depth is less proven than frontend depth",
    "No direct evidence of scaling distributed systems"
  ],
  "interviewFocus": [
    "Probe architecture decisions in the most complex shipped Next.js product",
    "Validate ownership depth versus execution within a larger team"
  ],
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

      const overallScore = clampScore(parsed.overallScore);
      const strengths = normalizeStringList(parsed.strengths, 5);
      const gaps = normalizeStringList(parsed.gaps, 5);
      const matchedRequirements = normalizeStringList(parsed.matchedRequirements, 8);
      const missingRequirements = normalizeStringList(parsed.missingRequirements, 8);
      const impactEvidence = normalizeStringList(parsed.impactEvidence, 5);
      const riskSignals = normalizeStringList(parsed.riskSignals, 5);
      const interviewFocus = normalizeStringList(parsed.interviewFocus, 5);

      return {
        applicantId,
        candidateName: (parsed.candidateName as string) || candidateName,
        documentStatus: docCheck.status,
        documentNotes: docCheck.notes,
        overallScore,
        confidence: clampScore(parsed.confidence) || defaultConfidence(docCheck.status),
        hireVerdict: normalizeVerdict(parsed.hireVerdict, overallScore),
        scoreBreakdown: normalizeScoreBreakdown(parsed.scoreBreakdown),
        matchedRequirements:
          matchedRequirements.length > 0
            ? matchedRequirements
            : candidateSignals.matchedRequiredSkills.slice(0, 8),
        missingRequirements:
          missingRequirements.length > 0
            ? missingRequirements
            : candidateSignals.missingRequiredSkills.slice(0, 8),
        impactEvidence,
        riskSignals: riskSignals.length > 0 ? riskSignals : gaps.slice(0, 4),
        interviewFocus:
          interviewFocus.length > 0
            ? interviewFocus
            : candidateSignals.missingRequiredSkills
                .slice(0, 3)
                .map((skill) => `Validate depth in ${skill}.`),
        strengths,
        gaps,
        recommendation: (parsed.recommendation as string) || "",
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const is429 = lastError.message.includes('429') || lastError.message.includes('Too Many Requests');
      console.error(
        `[Gemini] Attempt ${attempt + 1} failed for applicant ${applicantId}:`,
        lastError.message.slice(0, 200)
      );
      if (shouldFastFallback(lastError)) {
        console.log(`[Gemini] Using deterministic fallback for applicant ${applicantId}.`);
        break;
      }
      if (attempt < 4) {
        const delay = is429 ? 15000 * (attempt + 1) : 3000 * (attempt + 1);
        console.log(`[Gemini] Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      }
    }
  }

  return buildHeuristicAnalysis(
    job,
    applicantId,
    candidateName,
    profile,
    docCheck,
    candidateSignals,
    profileText,
    lastError
  );
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
    .sort(
      (a, b) =>
        b.overallScore - a.overallScore ||
        b.confidence - a.confidence ||
        b.matchedRequirements.length - a.matchedRequirements.length ||
        b.impactEvidence.length - a.impactEvidence.length
    )
    .slice(0, shortlistSize)
    .map((a, idx) => ({
      rank: idx + 1,
      applicantId: a.applicantId,
      candidateName: a.candidateName,
      overallScore: a.overallScore,
      confidence: a.confidence,
      hireVerdict: a.hireVerdict,
      scoreBreakdown: a.scoreBreakdown,
      matchedRequirements: a.matchedRequirements,
      missingRequirements: a.missingRequirements,
      impactEvidence: a.impactEvidence,
      riskSignals: a.riskSignals,
      interviewFocus: a.interviewFocus,
      strengths: a.strengths,
      gaps: a.gaps,
      recommendation: a.recommendation,
      documentStatus: a.documentStatus,
      documentNotes: a.documentNotes,
      interviewQuestions: [],
      recruiterFeedback: null,
    }));
}
