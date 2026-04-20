import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { JobModel } from "../models/Job";
import { ApplicantModel } from "../models/Applicant";
import { ScreeningResultModel } from "../models/ScreeningResult";

const router = Router();

/**
 * DELETE /api/admin/reset
 * Wipes all jobs, applicants, and screening results.
 * Requires a confirmation token so it can't be hit by accident.
 */
router.delete("/reset", async (req: Request, res: Response) => {
  const { confirm } = req.body as { confirm?: string };
  if (confirm !== "RESET_ALL") {
    return res.status(400).json({
      success: false,
      error: 'Send { "confirm": "RESET_ALL" } in the request body to confirm.',
    });
  }

  const [jobs, applicants, screenings] = await Promise.all([
    JobModel.deleteMany({ userId: req.userId }),
    ApplicantModel.deleteMany({}),  // no userId on applicants - they belong to jobs
    ScreeningResultModel.deleteMany({ userId: req.userId }),
  ]);

  res.json({
    success: true,
    message: "All data cleared.",
    deleted: {
      jobs: jobs.deletedCount,
      applicants: applicants.deletedCount,
      screenings: screenings.deletedCount,
    },
  });
});

/**
 * GET /api/admin/stats
 * Quick count of everything in the DB for current user.
 */
router.get("/stats", async (req: Request, res: Response) => {
  const [jobs, screenings] = await Promise.all([
    JobModel.countDocuments({ userId: req.userId }),
    ScreeningResultModel.countDocuments({ userId: req.userId }),
  ]);
  // Count applicants for user's jobs
  const userJobs = await JobModel.find({ userId: req.userId }).select("_id").lean();
  const jobIds = userJobs.map(j => j._id);
  const applicants = await ApplicantModel.countDocuments({ jobId: { $in: jobIds } });
  
  res.json({ success: true, data: { jobs, applicants, screenings } });
});

export default router;
