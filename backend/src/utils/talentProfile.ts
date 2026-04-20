import type {
  Availability,
  Certification,
  Education,
  Language,
  Skill,
  SocialLinks,
  TalentProfile,
  TalentProject,
  WorkExperience,
} from "@davinci/shared";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
const LANGUAGE_PROFICIENCIES = ["Basic", "Conversational", "Fluent", "Native"] as const;
const AVAILABILITY_STATUSES = ["Available", "Open to Opportunities", "Not Available"] as const;
const AVAILABILITY_TYPES = ["Full-time", "Part-time", "Contract"] as const;

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cleanEmail(value: unknown): string | undefined {
  const email = cleanString(value)?.toLowerCase();
  if (!email) return undefined;
  return /^\S+@\S+\.\S+$/.test(email) ? email : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function safeJsonParse<T>(value: unknown): T | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function splitCsv(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickAllowedValue<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return allowed.find((item) => item.toLowerCase() === normalized) ?? fallback;
}

function splitFullName(fullName?: string): { firstName?: string; lastName?: string } {
  const clean = cleanString(fullName);
  if (!clean) return {};
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0], lastName: "Applicant" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeSkills(payload: Record<string, unknown>): Skill[] {
  const parsed = safeJsonParse<Array<Record<string, unknown> | string>>(payload.skillsJson) ?? [];
  const fromJson = parsed
    .map((entry) => {
      if (typeof entry === "string") {
        return { name: entry, level: "Intermediate", yearsOfExperience: undefined } satisfies Skill;
      }

      const name = cleanString(entry.name);
      if (!name) return null;

      return {
        name,
        level: pickAllowedValue(cleanString(entry.level), SKILL_LEVELS, "Intermediate"),
        yearsOfExperience: toNumber(entry.yearsOfExperience ?? entry.yearsUsed),
        yearsUsed: toNumber(entry.yearsUsed ?? entry.yearsOfExperience),
      } satisfies Skill;
    })
    .filter(Boolean) as Skill[];

  if (fromJson.length) return fromJson;

  const fallbackYears = toNumber(payload.yearsOfExperience);
  return splitCsv(payload.skills).map((name) => ({
    name,
    level: "Intermediate",
    yearsOfExperience: fallbackYears,
    yearsUsed: fallbackYears,
  }));
}

function normalizeLanguages(payload: Record<string, unknown>): Language[] {
  const parsed = safeJsonParse<Array<Record<string, unknown> | string>>(payload.languagesJson) ?? [];
  return parsed
    .map((entry) => {
      if (typeof entry === "string") {
        return { name: entry, proficiency: "Conversational" } satisfies Language;
      }

      const name = cleanString(entry.name);
      if (!name) return null;
      return {
        name,
        proficiency: pickAllowedValue(cleanString(entry.proficiency), LANGUAGE_PROFICIENCIES, "Conversational"),
      } satisfies Language;
    })
    .filter(Boolean) as Language[];
}

function normalizeExperience(payload: Record<string, unknown>): WorkExperience[] {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(payload.experienceJson) ?? [];
  return parsed
    .map((entry) => {
      const company = cleanString(entry.company);
      const role = cleanString(entry.role ?? entry.title);
      const startDate = cleanString(entry.startDate ?? entry["Start Date"]);
      if (!company || !role || !startDate) return null;

      const endDate = cleanString(entry.endDate ?? entry["End Date"]);
      const isCurrent = Boolean(entry.isCurrent ?? entry["Is Current"] ?? (endDate === "Present"));
      const technologies = Array.isArray(entry.technologies)
        ? entry.technologies.map((item) => cleanString(item)).filter(Boolean) as string[]
        : splitCsv(entry.technologies);

      return {
        company,
        role,
        title: role,
        startDate,
        endDate: isCurrent ? "Present" : endDate,
        description: cleanString(entry.description),
        technologies,
        skills: technologies,
        isCurrent,
      } satisfies WorkExperience;
    })
    .filter(Boolean) as WorkExperience[];
}

function normalizeEducation(payload: Record<string, unknown>): Education[] {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(payload.educationJson) ?? [];
  return parsed
    .map((entry) => {
      const institution = cleanString(entry.institution);
      const degree = cleanString(entry.degree);
      const fieldOfStudy = cleanString(entry.fieldOfStudy ?? entry.field ?? entry["Field of Study"]);
      if (!institution || !degree || !fieldOfStudy) return null;

      return {
        institution,
        degree,
        fieldOfStudy,
        field: fieldOfStudy,
        startYear: toNumber(entry.startYear ?? entry["Start Year"]),
        endYear: toNumber(entry.endYear ?? entry.graduationYear ?? entry["End Year"]),
        graduationYear: toNumber(entry.graduationYear ?? entry.endYear ?? entry["End Year"]),
      } satisfies Education;
    })
    .filter(Boolean) as Education[];
}

function normalizeCertifications(payload: Record<string, unknown>): Certification[] {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(payload.certificationsJson) ?? [];
  return parsed
    .map((entry) => {
      const name = cleanString(entry.name);
      const issuer = cleanString(entry.issuer);
      if (!name || !issuer) return null;

      const issueDate = cleanString(entry.issueDate ?? entry["Issue Date"]);
      return {
        name,
        issuer,
        issueDate,
        year: issueDate ? Number(issueDate.slice(0, 4)) : undefined,
      } satisfies Certification;
    })
    .filter(Boolean) as Certification[];
}

function normalizeProjects(payload: Record<string, unknown>): TalentProject[] {
  const parsed = safeJsonParse<Array<Record<string, unknown>>>(payload.projectsJson) ?? [];
  return parsed
    .map((entry) => {
      const name = cleanString(entry.name);
      const description = cleanString(entry.description);
      const role = cleanString(entry.role);
      if (!name || !description || !role) return null;

      const technologies = Array.isArray(entry.technologies)
        ? entry.technologies.map((item) => cleanString(item)).filter(Boolean) as string[]
        : splitCsv(entry.technologies);

      return {
        name,
        description,
        technologies,
        role,
        link: cleanString(entry.link),
        startDate: cleanString(entry.startDate ?? entry["Start Date"]),
        endDate: cleanString(entry.endDate ?? entry["End Date"]),
      } satisfies TalentProject;
    })
    .filter(Boolean) as TalentProject[];
}

function normalizeAvailability(payload: Record<string, unknown>): Availability | undefined {
  const parsed = safeJsonParse<Record<string, unknown>>(payload.availabilityJson) ?? {};
  const status = pickAllowedValue(
    cleanString(parsed.status ?? payload.availabilityStatus),
    AVAILABILITY_STATUSES,
    "Open to Opportunities"
  );
  const type = pickAllowedValue(cleanString(parsed.type ?? payload.availabilityType), AVAILABILITY_TYPES, "Full-time");
  const startDate = cleanString(parsed.startDate ?? payload.availabilityStartDate ?? payload.availableFrom);

  return { status, type, startDate };
}

function normalizeSocialLinks(payload: Record<string, unknown>): SocialLinks | undefined {
  const parsed = safeJsonParse<Record<string, unknown>>(payload.socialLinksJson) ?? {};
  const socialLinks = {
    linkedin: cleanString(parsed.linkedin ?? payload.linkedin ?? payload.linkedinUrl),
    github: cleanString(parsed.github ?? payload.github ?? payload.githubUrl),
    portfolio: cleanString(parsed.portfolio ?? payload.portfolio ?? payload.portfolioUrl),
  } satisfies SocialLinks;

  if (!socialLinks.linkedin && !socialLinks.github && !socialLinks.portfolio) return undefined;
  return socialLinks;
}

function calculateYearsOfExperience(experience: WorkExperience[], skills: Skill[]): number | undefined {
  const fromSkills = skills
    .map((skill) => skill.yearsOfExperience ?? skill.yearsUsed)
    .filter((years): years is number => typeof years === "number" && Number.isFinite(years));

  const fromExperience = experience
    .map((item) => {
      const start = cleanString(item.startDate);
      const end = cleanString(item.endDate);
      if (!start) return undefined;

      const [startYear, startMonth = "01"] = start.split("-");
      const startDate = new Date(Number(startYear), Number(startMonth) - 1, 1);
      const endDate = end && end !== "Present"
        ? new Date(Number(end.split("-")[0]), Number((end.split("-")[1] || "01")) - 1, 1)
        : new Date();

      const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
      return diffMonths > 0 ? Number((diffMonths / 12).toFixed(1)) : undefined;
    })
    .filter((years): years is number => typeof years === "number" && Number.isFinite(years));

  const combined = [...fromSkills, ...fromExperience];
  if (!combined.length) return undefined;
  return Math.max(...combined);
}

export function normalizeTalentProfileInput(payload: Record<string, unknown>): {
  profile: TalentProfile;
  errors: string[];
} {
  const nameParts = splitFullName(cleanString(payload.fullName));

  const firstName = cleanString(payload.firstName) ?? nameParts.firstName ?? "";
  const lastName = cleanString(payload.lastName) ?? nameParts.lastName ?? "";
  const email = cleanEmail(payload.email) ?? "";
  const headline = cleanString(payload.headline) ?? "";
  const bio = cleanString(payload.bio ?? payload.summary);
  const location = cleanString(payload.location) ?? "";
  const phone = cleanString(payload.phone);

  const skills = normalizeSkills(payload);
  const languages = normalizeLanguages(payload);
  const experience = normalizeExperience(payload);
  const education = normalizeEducation(payload);
  const certifications = normalizeCertifications(payload);
  const projects = normalizeProjects(payload);
  const availability = normalizeAvailability(payload);
  const socialLinks = normalizeSocialLinks(payload);
  const yearsOfExperience = calculateYearsOfExperience(experience, skills) ?? toNumber(payload.yearsOfExperience);

  const errors: string[] = [];
  if (!firstName) errors.push("First Name is required.");
  if (!lastName) errors.push("Last Name is required.");
  if (!email) errors.push("A valid Email is required.");
  if (!headline) errors.push("Headline is required.");
  if (!location) errors.push("Location is required.");
  if (skills.length === 0) errors.push("At least one skill is required.");
  if (experience.length === 0) errors.push("At least one work experience entry is required.");
  if (education.length === 0) errors.push("At least one education entry is required.");
  if (projects.length === 0) errors.push("At least one project entry is required.");
  if (!availability?.status || !availability.type) errors.push("Availability status and type are required.");

  const profile: TalentProfile = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim(),
    email,
    phone,
    headline,
    bio,
    summary: bio,
    location,
    yearsOfExperience,
    skills,
    languages: languages.length ? languages : undefined,
    experience,
    education,
    certifications: certifications.length ? certifications : undefined,
    projects,
    availability: availability ?? { status: "Open to Opportunities", type: "Full-time" },
    socialLinks,
    portfolioUrl: socialLinks?.portfolio,
    githubUrl: socialLinks?.github,
    linkedinUrl: socialLinks?.linkedin,
    availableFrom: availability?.startDate,
    preferredWorkType:
      cleanString(payload.preferredWorkType) === "remote" ||
      cleanString(payload.preferredWorkType) === "hybrid" ||
      cleanString(payload.preferredWorkType) === "onsite"
        ? (cleanString(payload.preferredWorkType) as "remote" | "hybrid" | "onsite")
        : undefined,
  };

  return { profile, errors };
}
