import mongoose, { Schema, Document } from "mongoose";

export interface JobDoc extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  department?: string;
  location?: string;
  workType: "remote" | "hybrid" | "onsite";
  description: string;
  responsibilities: string[];
  requirements: {
    yearsOfExperience: number;
    requiredSkills: string[];
    preferredSkills?: string[];
    educationLevel?: string;
    educationField?: string;
  };
  niceToHave?: string[];
  salaryRange?: { min: number; max: number; currency: string };
  formQuestions?: { id: string; question: string }[];
  status: "draft" | "active" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<JobDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    department: String,
    location: String,
    workType: { type: String, enum: ["remote", "hybrid", "onsite"], required: true },
    description: { type: String, required: true },
    responsibilities: [String],
    requirements: {
      yearsOfExperience: { type: Number, required: true },
      requiredSkills: [String],
      preferredSkills: [String],
      educationLevel: String,
      educationField: String,
    },
    niceToHave: [String],
    salaryRange: { min: Number, max: Number, currency: String },
    formQuestions: [{ id: String, question: String }],
    status: { type: String, enum: ["draft", "active", "closed"], default: "draft" },
  },
  { timestamps: true }
);

export const JobModel = mongoose.model<JobDoc>("Job", JobSchema);
