import { Router, Request, Response } from "express";
import { ScreeningResultModel } from "../models/ScreeningResult";

const router = Router();

// POST /api/feedback — recruiter accepts or rejects a shortlisted candidate
// THE DIFFERENTIATOR #3: Recruiter Feedback Loop
router.post("/", async (req: Request, res: Response) => {
  const { screeningId, rank, feedback, notes } = req.body as {
    screeningId: string;
    rank: number;
    feedback: "accepted" | "rejected";
    notes?: string;
  };

  if (!screeningId || !rank || !feedback) {
    return res.status(400).json({ success: false, error: "screeningId, rank, and feedback required" });
  }

  const result = await ScreeningResultModel.findOne({ _id: screeningId, userId: req.userId });
  if (!result) return res.status(404).json({ success: false, error: "Screening not found" });

  const candidate = result.shortlist.find((c) => c.rank === rank);
  if (!candidate) return res.status(404).json({ success: false, error: "Candidate not found in shortlist" });

  candidate.recruiterFeedback = feedback;
  await result.save();

  res.json({
    success: true,
    message: `Candidate #${rank} marked as ${feedback}. Feedback stored for future ranking calibration.`,
  });
});

// GET /api/feedback/insights/:jobId — aggregated feedback to surface recruiter preferences
router.get("/insights/:jobId", async (req: Request, res: Response) => {
  const results = await ScreeningResultModel.find({
    jobId: req.params.jobId,
    userId: req.userId,
    status: "completed",
  }).lean();

  const accepted: string[] = [];
  const rejected: string[] = [];

  for (const r of results) {
    for (const c of r.shortlist) {
      if (c.recruiterFeedback === "accepted") accepted.push(c.candidateName);
      if (c.recruiterFeedback === "rejected") rejected.push(c.candidateName);
    }
  }

  res.json({
    success: true,
    data: {
      totalScreenings: results.length,
      accepted: accepted.length,
      rejected: rejected.length,
      acceptanceRate:
        accepted.length + rejected.length > 0
          ? Math.round((accepted.length / (accepted.length + rejected.length)) * 100)
          : null,
      note: "These insights feed forward to calibrate the AI ranking weights for your future screenings.",
    },
  });
});

export default router;
