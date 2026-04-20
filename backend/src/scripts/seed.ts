import path from "node:path";

import dotenv from "dotenv";
import mongoose from "mongoose";

import { ApplicantModel } from "../models/Applicant";
import { JobModel } from "../models/Job";
import { ScreeningResultModel } from "../models/ScreeningResult";
import { UserModel } from "../models/User";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "";

async function main() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log("🧹 Clearing all demo data...");

  // Clear all data
  await Promise.all([
    JobModel.deleteMany({}),
    ApplicantModel.deleteMany({}),
    ScreeningResultModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);

  console.log("✅ Database cleared. Starting fresh for production.");
  console.log("👤 Create your own account at /hr/signup to get started.");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed script error:", err);
  process.exit(1);
});