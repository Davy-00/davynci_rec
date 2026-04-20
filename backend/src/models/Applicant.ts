import mongoose, { Schema, Document } from "mongoose";
import type { TalentProfile } from "@davinci/shared";

export interface ApplicantDoc extends Document {
  jobId: mongoose.Types.ObjectId;
  source: "davinci_platform" | "external_upload" | "resume_upload";
  profile?: TalentProfile;
  rawResumeText?: string;
  resumeUrl?: string;
  formAnswers?: Record<string, string>;
  createdAt: Date;
}

const ApplicantSchema = new Schema<ApplicantDoc>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    source: {
      type: String,
      enum: ["davinci_platform", "external_upload", "resume_upload"],
      required: true,
    },
    profile: { type: Schema.Types.Mixed },
    rawResumeText: String,
    resumeUrl: String,
    formAnswers: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ApplicantModel = mongoose.model<ApplicantDoc>("Applicant", ApplicantSchema);
