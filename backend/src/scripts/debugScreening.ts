import fs from "node:fs/promises";
import path from "node:path";

import dotenv from "dotenv";
import mongoose from "mongoose";

import { ApplicantModel } from "../models/Applicant";
import { JobModel } from "../models/Job";
import { runBiasAudit } from "../services/biasGuard";
import { runScreening, buildShortlist } from "../services/gemini";
import { generateInterviewQuestions } from "../services/interviewGen";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const outputPath = path.join(process.cwd(), "screening-debug.json");

async function main() {
  const mongoUri = process.env.MONGO_URI || "";

  if (!mongoUri) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  try {
    const job = await JobModel.findOne({ status: "active" }).sort({ createdAt: -1 }).lean();

    if (!job) {
      throw new Error("No active job found");
    }

    const applicants = await ApplicantModel.find({ jobId: job._id }).lean();

    if (applicants.length === 0) {
      throw new Error(`No applicants found for job ${job._id}`);
    }

    const { candidates, analysisStats } = await runScreening(job as Record<string, unknown>, applicants as Record<string, unknown>[], 10);
    const shortlist = buildShortlist(candidates, 10);
    const withQuestions = [];
    for (const candidate of shortlist) {
      if (candidate.documentStatus === "insufficient") { withQuestions.push(candidate); continue; }
      const withQ = await generateInterviewQuestions(job as Record<string, unknown>, candidate, applicants as Record<string, unknown>[]);
      withQuestions.push(withQ);
    }
    const biasAudit = await runBiasAudit(job, withQuestions, applicants);

    await fs.writeFile(
      outputPath,
      JSON.stringify(
        {
          success: true,
          jobId: String(job._id),
          applicants: applicants.length,
          analysisStats,
          shortlist: withQuestions,
          biasAudit,
        },
        null,
        2
      )
    );
  } catch (error) {
    const normalized =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : { message: String(error) };

    await fs.writeFile(
      outputPath,
      JSON.stringify(
        {
          success: false,
          error: normalized,
        },
        null,
        2
      )
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void main();