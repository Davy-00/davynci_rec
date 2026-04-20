import { Router, Request, Response } from "express";
import { z } from "zod";
import { JobModel } from "../models/Job";
import { requireAuth } from "../middleware/auth";

const router = Router();

const JobSchema = z.object({
  title: z.string().min(2),
  department: z.string().optional(),
  location: z.string().optional(),
  workType: z.enum(["remote", "hybrid", "onsite"]),
  description: z.string().min(10),
  responsibilities: z.array(z.string()),
  requirements: z.object({
    yearsOfExperience: z.number().min(0),
    requiredSkills: z.array(z.string()),
    preferredSkills: z.array(z.string()).optional(),
    educationLevel: z.string().optional(),
    educationField: z.string().optional(),
  }),
  niceToHave: z.array(z.string()).optional(),
  salaryRange: z
    .object({ min: z.number(), max: z.number(), currency: z.string() })
    .optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
});

// GET /api/jobs — requires auth, returns only user's jobs
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const jobs = await JobModel.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: jobs });
});

// GET /api/jobs/active — public endpoint for applicant portal (active only)
router.get("/active", async (_req: Request, res: Response) => {
  const jobs = await JobModel.find({ status: "active" }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: jobs });
});

// GET /api/jobs/:id
router.get("/:id", async (req: Request, res: Response) => {
  const job = await JobModel.findById(req.params.id).lean();
  if (!job) return res.status(404).json({ success: false, error: "Job not found" });
  res.json({ success: true, data: job });
});

// POST /api/jobs
router.post("/", requireAuth, async (req: Request, res: Response) => {
  const parsed = JobSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }
  const job = await JobModel.create({ ...parsed.data, userId: req.userId });
  res.status(201).json({ success: true, data: job });
});

// PATCH /api/jobs/:id
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  const job = await JobModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true, runValidators: true }
  ).lean();
  if (!job) return res.status(404).json({ success: false, error: "Job not found" });
  res.json({ success: true, data: job });
});

// DELETE /api/jobs/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const result = await JobModel.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!result) return res.status(404).json({ success: false, error: "Job not found" });
  res.json({ success: true, message: "Job deleted" });
});

export default router;
