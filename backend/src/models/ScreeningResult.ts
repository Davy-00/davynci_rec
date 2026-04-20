import mongoose, { Schema, Document } from "mongoose";

export interface ScreeningResultDoc extends Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  triggeredAt: Date;
  shortlistSize: 10 | 20;
  shortlist: RankedCandidateDoc[];
  biasAudit: BiasAuditDoc;
  status: "pending" | "completed" | "failed";
  errorMessage?: string;
  progress?: { total: number; completed: number };
  candidateProgress?: Array<{
    candidateName: string;
    status: "analyzing" | "completed";
    overallScore?: number;
    recommendation?: string;
  }>;
  analysisStats?: { total: number; scored: number; insufficientDocs: number };
}

interface ScoreBreakdownDoc {
  skillsMatch: number;
  experienceRelevance: number;
  educationFit: number;
  overallRelevance: number;
}

interface InterviewQuestionDoc {
  question: string;
  rationale: string;
  area: "technical" | "behavioral" | "gap_probe" | "cultural_fit";
}

interface RankedCandidateDoc {
  rank: number;
  applicantId: mongoose.Types.ObjectId;
  candidateName: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdownDoc;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  documentStatus: "sufficient" | "partial" | "insufficient";
  documentNotes?: string;
  interviewQuestions: InterviewQuestionDoc[];
  recruiterFeedback?: "accepted" | "rejected" | null;
}

interface BiasFlagDoc {
  type: string;
  description: string;
  affectedCandidates?: number[];
  severity: "info" | "warning" | "critical";
}

interface BiasAuditDoc {
  riskLevel: "low" | "medium" | "high";
  flags: BiasFlagDoc[];
  overallAssessment: string;
}

const ScreeningResultSchema = new Schema<ScreeningResultDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    triggeredAt: { type: Date, default: Date.now },
    shortlistSize: { type: Number, enum: [10, 20], default: 10 },
    shortlist: [
      {
        rank: Number,
        applicantId: { type: Schema.Types.ObjectId, ref: "Applicant" },
        candidateName: String,
        overallScore: Number,
        scoreBreakdown: {
          skillsMatch: Number,
          experienceRelevance: Number,
          educationFit: Number,
          overallRelevance: Number,
        },
        strengths: [String],
        gaps: [String],
        recommendation: String,
        documentStatus: {
          type: String,
          enum: ["sufficient", "partial", "insufficient"],
          default: "sufficient",
        },
        documentNotes: String,
        interviewQuestions: [
          {
            question: String,
            rationale: String,
            area: String,
          },
        ],
        recruiterFeedback: {
          type: String,
          enum: ["accepted", "rejected", null],
          default: null,
        },
      },
    ],
    biasAudit: {
      riskLevel: { type: String, enum: ["low", "medium", "high"] },
      flags: [
        {
          type: { type: String },
          description: String,
          affectedCandidates: [Number],
          severity: { type: String, enum: ["info", "warning", "critical"] },
        },
      ],
      overallAssessment: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    candidateProgress: [
      {
        candidateName: String,
        status: { type: String, enum: ["analyzing", "completed"] },
        overallScore: Number,
        recommendation: String,
      },
    ],
    errorMessage: String,
    progress: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
    },
    analysisStats: {
      total: Number,
      scored: Number,
      insufficientDocs: Number,
    },
  },
  { timestamps: true }
);

export const ScreeningResultModel = mongoose.model<ScreeningResultDoc>(
  "ScreeningResult",
  ScreeningResultSchema
);
