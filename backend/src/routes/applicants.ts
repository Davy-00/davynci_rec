import { Router, Request, Response } from "express";
import multer from "multer";
import xlsx from "xlsx";
import pdfParse from "pdf-parse";
import { ApplicantModel } from "../models/Applicant";
import { JobModel } from "../models/Job";
import { requireAuth } from "../middleware/auth";
import { normalizeTalentProfileInput } from "../utils/talentProfile";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/applicants?jobId=xxx
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const { jobId } = req.query;
  if (!jobId) return res.status(400).json({ success: false, error: "jobId required" });
  const applicants = await ApplicantModel.find({ jobId }).lean();
  res.json({ success: true, data: applicants });
});

// GET /api/applicants/job/:jobId/count — get count of applicants for a job
router.get("/job/:jobId/count", requireAuth, async (req: Request, res: Response) => {
  const count = await ApplicantModel.countDocuments({ jobId: req.params.jobId });
  res.json({ success: true, count });
});

// POST /api/applicants/davinci — bulk structured profiles from Davinci platform
router.post("/davinci", requireAuth, async (req: Request, res: Response) => {
  const { jobId, profiles } = req.body as {
    jobId: string;
    profiles: Array<Record<string, unknown> & { formAnswers?: Record<string, string> }>;
  };
  if (!jobId || !Array.isArray(profiles)) {
    return res.status(400).json({ success: false, error: "jobId and profiles[] required" });
  }
  const job = await JobModel.findById(jobId);
  if (!job) return res.status(404).json({ success: false, error: "Job not found" });

  const prepared = profiles.map((p, index) => {
    const { formAnswers, ...rawProfile } = p;
    const { profile, errors } = normalizeTalentProfileInput(rawProfile);

    return {
      index,
      errors,
      doc: {
        jobId,
        source: "davinci_platform" as const,
        profile,
        ...(formAnswers ? { formAnswers } : {}),
      },
    };
  });

  const invalidProfiles = prepared.filter((entry) => entry.errors.length > 0);
  if (invalidProfiles.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Some profiles do not match the Talent Profile Schema.",
      details: invalidProfiles.map((entry) => ({
        index: entry.index,
        errors: entry.errors,
      })),
    });
  }

  const inserted = await ApplicantModel.insertMany(prepared.map((entry) => entry.doc));
  res.status(201).json({ success: true, data: inserted, count: inserted.length });
});

// POST /api/applicants/spreadsheet — CSV or Excel upload
router.post(
  "/spreadsheet",
  requireAuth,
  upload.single("file"),
  async (req: Request, res: Response) => {
    const { jobId } = req.body;
    if (!jobId || !req.file) {
      return res.status(400).json({ success: false, error: "jobId and file required" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const docs = rows.map((row) => ({
      jobId,
      source: "external_upload" as const,
      profile: row,
    }));
    const inserted = await ApplicantModel.insertMany(docs);
    res.status(201).json({ success: true, data: inserted, count: inserted.length });
  }
);

// POST /api/applicants/resume — single PDF resume upload
router.post(
  "/resume",
  requireAuth,
  upload.single("resume"),
  async (req: Request, res: Response) => {
    const { jobId } = req.body;
    if (!jobId || !req.file) {
      return res.status(400).json({ success: false, error: "jobId and resume file required" });
    }

    const parsed = await pdfParse(req.file.buffer);
    const applicant = await ApplicantModel.create({
      jobId,
      source: "resume_upload",
      rawResumeText: parsed.text.slice(0, 8000), // cap to avoid token overflow
    });

    res.status(201).json({ success: true, data: applicant });
  }
);

// DELETE /api/applicants/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  await ApplicantModel.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Applicant removed" });
});

/**
 * POST /api/applicants/apply
 * Applicant self-submission: name, contact info, resume PDF, and form answers.
 * This is the endpoint called from the public applicant portal.
 */
router.post(
  "/apply",
  upload.single("resume"),
  async (req: Request, res: Response) => {
    const payload = req.body as Record<string, string>;
    const { jobId, formAnswersJson } = payload;

    if (!jobId) {
      return res.status(400).json({ success: false, error: "jobId is required" });
    }

    const job = await JobModel.findById(jobId);
    if (!job) return res.status(404).json({ success: false, error: "Job not found" });

    const { profile, errors } = normalizeTalentProfileInput(payload);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(" "),
        details: errors,
      });
    }

    // Parse form answers if provided
    let formAnswers: Record<string, string> | undefined;
    if (formAnswersJson) {
      try {
        formAnswers = JSON.parse(formAnswersJson);
      } catch {
        // ignore malformed answers
      }
    }

    // Parse resume if uploaded
    let rawResumeText: string | undefined;
    if (req.file) {
      const parsed = await pdfParse(req.file.buffer);
      rawResumeText = parsed.text.slice(0, 8000);
    }

    const applicant = await ApplicantModel.create({
      jobId,
      source: "external_upload",
      profile,
      rawResumeText,
      formAnswers,
    });

    res.status(201).json({ success: true, data: { _id: applicant._id } });
  }
);

export default router;
