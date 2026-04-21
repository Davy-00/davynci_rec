import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { ScreeningResultModel } from "../models/ScreeningResult";
import { ApplicantModel } from "../models/Applicant";
import { JobModel } from "../models/Job";
import { runScreening, buildShortlist } from "../services/gemini";
import { runBiasAudit } from "../services/biasGuard";
import { generateInterviewQuestionsForAll } from "../services/interviewGen";

const router = Router();
// 3 screening triggers per 10 seconds (prevents accidental double-clicks)
const aiLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  message: { success: false, error: "Too many requests. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/screening/trigger
router.post("/trigger", aiLimiter, async (req: Request, res: Response) => {
  const { jobId, shortlistSize = 10 } = req.body as {
    jobId: string;
    shortlistSize?: 10 | 20;
  };

  if (!jobId) return res.status(400).json({ success: false, error: "jobId required" });

  const [job, rawApplicants] = await Promise.all([
    JobModel.findOne({ _id: jobId, userId: req.userId }).lean(),
    ApplicantModel.find({ jobId }).lean(),
  ]);

  // Deduplicate applicants by profile name (or email), keeping the latest
  // Flag duplicates so Bias Guard can report them
  const seenMap = new Map<string, typeof rawApplicants[0]>();
  const duplicateNames: string[] = [];
  for (const a of rawApplicants) {
    const profile = (a as any).profile || {};
    const name = (profile.fullName || profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || '').toLowerCase();
    const email = (profile.email || (a as any).email || '').toLowerCase();
    const key = email || name || String(a._id);
    const existing = seenMap.get(key);
    if (existing) {
      duplicateNames.push(profile.fullName || profile.name || name || 'Unknown');
    }
    if (!existing || (a as any).createdAt > (existing as any).createdAt) {
      seenMap.set(key, a);
    }
  }
  const applicants = Array.from(seenMap.values());
  if (duplicateNames.length > 0) {
    console.log(`[Screening] Duplicate applicants detected: ${duplicateNames.join(', ')}`);
  }

  if (!job) return res.status(404).json({ success: false, error: "Job not found" });
  if (applicants.length === 0)
    return res.status(400).json({ success: false, error: "No applicants found for this job" });

  // ── Always re-analyze all candidates fresh (no stale cache) ──
  // Previous caching caused stale scores when candidates updated their profiles
  const cachedScores = new Map<string, import("../services/gemini").IndividualAnalysis>();

  console.log(
    `[Screening] ${applicants.length} unique applicants — all will be analyzed fresh.`
  );

  // Create a pending result record
  const screeningDoc = await ScreeningResultModel.create({
    userId: req.userId,
    jobId,
    shortlistSize,
    status: "pending",
    shortlist: [],
    progress: { total: applicants.length, completed: 0 },
    candidateProgress: [],
    biasAudit: { riskLevel: "low", flags: [], overallAssessment: "" },
  });

  // Run async so UI can poll for status
  (async () => {
    try {
      // Step 1: Analyze each candidate (cached ones skip Gemini)
      const { candidates, analysisStats } = await runScreening(
        job as Record<string, unknown>,
        applicants as Record<string, unknown>[],
        shortlistSize as 10 | 20,
        async (completed, total, candidateDetails) => {
          if (candidateDetails) {
            console.log(`[Progress Update] ${candidateDetails.candidateName}: ${candidateDetails.status}`, candidateDetails.overallScore || '-');
            
            // Use updateOne with $push to add the candidate progress
            await ScreeningResultModel.collection.updateOne(
              { _id: screeningDoc._id },
              { 
                $push: { candidateProgress: candidateDetails } as any,
                $set: { 
                  "progress.completed": completed,
                  "progress.total": total,
                }
              }
            );
          } else {
            // Just update counts
            await ScreeningResultModel.findByIdAndUpdate(screeningDoc._id, {
              "progress.completed": completed,
              "progress.total": total,
            });
          }
        },
        cachedScores
      );

      // Step 2: Build ranked shortlist from individual scores
      const shortlist = buildShortlist(candidates, shortlistSize as 10 | 20);

      // Step 3: ONE batched Gemini call for all interview questions (vs N calls)
      const withQuestions = await generateInterviewQuestionsForAll(
        job as Record<string, unknown>,
        shortlist,
        applicants as Record<string, unknown>[]
      );

      // Step 4: Run bias audit (1 Gemini call)
      const biasAudit = await runBiasAudit(
        job as Record<string, unknown>,
        withQuestions,
        applicants as Record<string, unknown>[]
      );

      // Inject duplicate applicant flag if detected
      if (duplicateNames.length > 0) {
        const uniqueDupes = [...new Set(duplicateNames)];
        biasAudit.flags.unshift({
          type: "other",
          description: `Duplicate application${uniqueDupes.length > 1 ? "s" : ""} detected: ${uniqueDupes.join(", ")}. These candidates applied more than once — only their most recent application was analyzed. Please verify their identity and intent.`,
          severity: "warning",
        });
        if (biasAudit.riskLevel === "low") {
          biasAudit.riskLevel = "medium";
        }
      }

      await ScreeningResultModel.findByIdAndUpdate(screeningDoc._id, {
        shortlist: withQuestions,
        biasAudit,
        analysisStats,
        status: "completed",
        "progress.completed": applicants.length,
        "progress.total": applicants.length,
      });
    } catch (err) {
      console.error("Screening pipeline failed:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      await ScreeningResultModel.findByIdAndUpdate(screeningDoc._id, {
        status: "failed",
        errorMessage,
      });
    }
  })();

  res.status(202).json({
    success: true,
    data: {
      screeningId: screeningDoc._id,
      status: "pending",
      totalCandidates: applicants.length,
      duplicatesRemoved: duplicateNames.length,
    },
    message: `Screening started for ${applicants.length} candidate${applicants.length !== 1 ? 's' : ''}${duplicateNames.length ? ` (${duplicateNames.length} duplicate${duplicateNames.length > 1 ? 's' : ''} removed)` : ''}. Poll /api/screening/:id for results.`,
  });
});

// GET /api/screening/job/:jobId — get all screenings for a job
// NOTE: must be registered BEFORE /:id so Express doesn't match "job" as an id
router.get("/job/:jobId", async (req: Request, res: Response) => {
  const results = await ScreeningResultModel.find({ jobId: req.params.jobId, userId: req.userId })
    .sort({ triggeredAt: -1 })
    .lean();
  res.json({ success: true, data: results });
});

// GET /api/screening/:id — poll for results
router.get("/:id", async (req: Request, res: Response) => {
  const result = await ScreeningResultModel.findOne({ _id: req.params.id, userId: req.userId }).lean();
  if (!result) return res.status(404).json({ success: false, error: "Screening not found" });
  res.json({ success: true, data: result });
});

export default router;
