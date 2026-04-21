// Shared types used across frontend and backend

export interface TalentProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  phone?: string;
  skills: Skill[];
  languages?: Language[];
  experience: WorkExperience[];
  education: Education[];
  certifications?: Certification[];
  projects: TalentProject[];
  availability: Availability;
  socialLinks?: SocialLinks;

  // Compatibility fields used by the current app and AI pipeline
  fullName?: string;
  summary?: string;
  yearsOfExperience?: number;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  availableFrom?: string;
  expectedSalary?: SalaryRange;
  preferredWorkType?: "remote" | "hybrid" | "onsite";
}

export interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience?: number;
  yearsUsed?: number;
}

export interface Language {
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native" | "Professional";
}

export interface WorkExperience {
  company: string;
  role: string;
  title?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  technologies?: string[];
  skills?: string[];
  achievements?: string[];
  isCurrent?: boolean;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  field?: string;
  startYear?: number;
  endYear?: number;
  graduationYear?: number;
  gpa?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate?: string;
  year?: number;
}

export interface TalentProject {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface Availability {
  status: "Available" | "Open to Opportunities" | "Not Available";
  type: "Full-time" | "Part-time" | "Contract";
  startDate?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
  [key: string]: string | undefined;
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface Job {
  _id?: string;
  title: string;
  department?: string;
  location?: string;
  workType: "remote" | "hybrid" | "onsite";
  description: string;
  responsibilities: string[];
  requirements: Requirements;
  niceToHave?: string[];
  salaryRange?: SalaryRange;
  createdAt?: string;
  updatedAt?: string;
  status: "draft" | "active" | "closed";
}

export interface Requirements {
  yearsOfExperience: number;
  requiredSkills: string[];
  preferredSkills?: string[];
  educationLevel?: "high_school" | "bachelor" | "master" | "phd";
  educationField?: string;
}

export interface Applicant {
  _id?: string;
  jobId: string;
  source: "davinci_platform" | "external_upload" | "resume_upload";
  profile?: TalentProfile;   // Davinci structured profile
  rawResumeText?: string;     // Parsed from PDF / link
  resumeUrl?: string;
  formAnswers?: Record<string, string>; // Application form Q&A responses
  createdAt?: string;
}

export interface ScreeningResult {
  _id?: string;
  jobId: string;
  triggeredAt: string;
  shortlistSize: 10 | 20;
  shortlist: RankedCandidate[];
  biasAudit: BiasAuditReport;
  status: "pending" | "completed" | "failed";
  errorMessage?: string;
  progress?: { total: number; completed: number };
  analysisStats?: { total: number; scored: number; insufficientDocs: number };
}

export type HireVerdict = "strong_yes" | "yes" | "maybe" | "no";

export interface RankedCandidate {
  rank: number;
  applicantId: string;
  candidateName: string;
  overallScore: number; // 0–100
  confidence?: number; // 0–100 confidence in the AI assessment
  hireVerdict?: HireVerdict;
  scoreBreakdown: ScoreBreakdown;
  matchedRequirements?: string[];
  missingRequirements?: string[];
  impactEvidence?: string[];
  riskSignals?: string[];
  interviewFocus?: string[];
  strengths: string[];
  gaps: string[];
  recommendation: string;
  documentStatus: "sufficient" | "partial" | "insufficient";
  documentNotes?: string;
  interviewQuestions?: InterviewQuestion[];
  recruiterFeedback?: "accepted" | "rejected" | null;
}

export interface ScoreBreakdown {
  skillsMatch: number;      // 0–100
  experienceRelevance: number;
  educationFit: number;
  overallRelevance: number;
}

export interface BiasAuditReport {
  riskLevel: "low" | "medium" | "high";
  flags: BiasFlag[];
  overallAssessment: string;
}

export interface BiasFlag {
  type: "institution_concentration" | "company_type" | "language_bias" | "experience_gap" | "other";
  description: string;
  affectedCandidates?: number[];  // ranks
  severity: "info" | "warning" | "critical";
}

export interface InterviewQuestion {
  question: string;
  rationale: string;       // why this question for this candidate
  area: "technical" | "behavioral" | "gap_probe" | "cultural_fit";
}

export interface RecruiterFeedback {
  screeningId: string;
  applicantId: string;
  feedback: "accepted" | "rejected";
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
