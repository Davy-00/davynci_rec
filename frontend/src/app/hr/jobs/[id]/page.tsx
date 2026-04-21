"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJob } from "@/store/jobsSlice";
import {
  triggerScreening,
  pollScreening,
  fetchScreeningHistory,
  submitFeedback,
  RankedCandidate,
} from "@/store/screeningSlice";
import { authHeader } from "@/lib/auth";
import toast from "react-hot-toast";
import clsx from "clsx";
import axios from "axios";
import {
  SparklesIcon,
  ShieldCheckIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  UploadIcon,
  ArrowLeftIcon,
  MessageSquareIcon,
  FileWarningIcon,
  UsersIcon,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://davinci-backend-production.up.railway.app/api";
const POLL_INTERVAL = 1500;

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const fill = mounted ? (score / 100) * circ : 0;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#f43f5e";
  const textColor =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#27272a"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <span
        className={clsx(
          "absolute inset-0 flex items-center justify-center text-[11px] font-extrabold",
          textColor
        )}
      >
        {score}
      </span>
    </div>
  );
}

export default function JobScreeningPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const job = useAppSelector((s) => s.jobs.selected);
  const { current: screening, polling, loading, pendingScreeningId } = useAppSelector((s) => s.screening);
  const [shortlistSize, setShortlistSize] = useState<10 | 20>(10);
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [applicantCount, setApplicantCount] = useState<number | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Debug: Log when screening updates
  useEffect(() => {
    if (screening?.candidateProgress) {
      console.log(`[Component] Screening updated - ${screening.candidateProgress.length} candidates in progress array`);
    }
  }, [screening?.candidateProgress]);

  useEffect(() => {
    dispatch(fetchJob(id));
    dispatch(fetchScreeningHistory(id));
    // Fetch applicant count
    axios.get(`${API}/applicants/job/${id}/count`, {
      headers: { Authorization: authHeader() },
    })
      .then(r => setApplicantCount(r.data.count))
      .catch(() => setApplicantCount(0));
  }, [id, dispatch]);

  useEffect(() => {
    if (polling && pendingScreeningId) {
      console.log(`[Polling Setup] Starting interval for screening ${pendingScreeningId}`);
      
      // Poll immediately, then set up interval
      const pollOnce = async () => {
        const result = await dispatch(pollScreening(pendingScreeningId)).unwrap();
        
        // Debug logging
        if (result.candidateProgress && result.candidateProgress.length > 0) {
          console.log(`[Polling] Received ${result.candidateProgress.length} candidate updates`);
        }
        
        if (result.status === "completed") {
          toast.success("Screening complete! Shortlist is ready.");
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (result.status === "failed") {
          toast.error("Screening failed. Please retry.");
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      };
      
      // Initial poll
      pollOnce();
      
      // Then set up interval for subsequent polls
      pollingRef.current = setInterval(pollOnce, POLL_INTERVAL);
    }

    return () => {
      if (pollingRef.current) {
        console.log('[Polling Cleanup] Clearing interval');
        clearInterval(pollingRef.current);
      }
    };
  }, [polling, pendingScreeningId, dispatch]);

  async function handleTrigger() {
    try {
      const res = await dispatch(triggerScreening({ jobId: id, shortlistSize })).unwrap();
      console.log(`[Screening] Started with ID: ${res.screeningId}, polling will begin`);
      toast("Screening started - AI is analyzing all applicants...");
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const message = err?.message || err?.response?.data?.error || err?.data?.error;
      
      if (status === 429) {
        toast.error("Please wait a few seconds before starting another screening.", { duration: 5000 });
      } else if (status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (status === 400) {
        toast.error(message || "No applicants found for this job.");
      } else {
        toast.error(message || "Failed to start screening. Please try again.");
      }
      console.error("Screening trigger error:", err);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    formData.append("jobId", id);

    try {
      const res = await axios.post(`${API}/applicants/spreadsheet`, formData, {
        headers: { Authorization: authHeader() },
      });
      toast.success(`${res.data.count} applicants uploaded!`);
    } catch {
      toast.error("Upload failed. Check CSV/Excel format.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFeedback(rank: number, feedback: "accepted" | "rejected") {
    if (!screening) return;
    await dispatch(submitFeedback({ screeningId: screening._id, rank, feedback }));
    toast.success(feedback === "accepted" ? "Candidate accepted" : "Candidate rejected");
  }

  const biasConfig = {
    low: {
      wrap: "border-emerald-500/20 bg-emerald-500/5",
      badge: "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20",
      icon: "text-emerald-400",
    },
    medium: {
      wrap: "border-amber-500/20 bg-amber-500/5",
      badge: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
      icon: "text-amber-400",
    },
    high: {
      wrap: "border-rose-500/20 bg-rose-500/5",
      badge: "bg-rose-400/10 text-rose-400 border border-rose-400/20",
      icon: "text-rose-400",
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link
          href="/hr"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-300 text-xs font-medium transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-3 h-3" />
          Dashboard
        </Link>
        <h1 className="text-3xl font-black text-white tracking-tight">{job?.title}</h1>
        <p className="text-slate-600 text-xs mt-1.5 font-medium tracking-widest uppercase">
          AI Screening · Bias Guard · Interview Questions
        </p>
      </div>

      {/* Applicant count card */}
      {applicantCount !== null && (
        <div className="bg-[#0d0d1a] border border-white/[0.07] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest mb-0.5">
                Applications Received
              </p>
              <p className="text-2xl font-black text-white tabular-nums">
                {applicantCount}
                <span className="text-xs text-slate-600 font-medium ml-2">
                  {applicantCount === 1 ? 'candidate' : 'candidates'}
                </span>
              </p>
            </div>
            {applicantCount > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-full font-semibold">
                Ready to screen
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-[#0d0d1a] border border-white/[0.06] rounded-2xl px-4 py-3.5 md:px-5 mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
            Shortlist
          </span>
          {([10, 20] as const).map((n) => (
            <button
              key={n}
              onClick={() => setShortlistSize(n)}
              className={clsx(
                "px-3 py-1 rounded-lg text-xs font-semibold border transition-all",
                shortlistSize === n
                  ? "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
                  : "text-slate-600 border-transparent hover:text-slate-300 hover:border-white/[0.06]"
              )}
            >
              Top {n}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/[0.06] rounded-xl text-xs text-slate-500 cursor-pointer hover:bg-white/[0.04] hover:text-slate-300 transition-all",
              uploading && "opacity-40 pointer-events-none"
            )}
          >
            <UploadIcon className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Upload CSV / XLSX"}
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
          </label>

          <button
            onClick={handleTrigger}
            disabled={loading || polling || !applicantCount || applicantCount === 0}
            className="inline-flex items-center gap-1.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 text-xs font-bold px-4 py-1.5 rounded-xl transition-colors"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            {polling ? "Screening..." : loading ? "Starting..." : "Run AI Screening"}
          </button>
        </div>
      </div>

      {polling && (
        <div className="bg-[#0d0d1a] border border-cyan-400/15 rounded-2xl p-6 md:p-7 mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.18em] text-slate-500 uppercase font-semibold">
              Processing
            </span>
            {screening?.progress && (
              <span className="ml-auto text-xs text-slate-500 tabular-nums">
                {screening.progress.completed}/{screening.progress.total} analyzed
                {screening?.candidateProgress && screening.candidateProgress.length > 0 && (
                  <span className="ml-2 text-cyan-400">
                    • {screening.candidateProgress.length} updates
                  </span>
                )}
              </span>
            )}
          </div>

          {screening?.progress && screening.progress.total > 0 && (
            <div className="mb-5">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((screening.progress.completed / screening.progress.total) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Real-time candidate progress */}
          {screening?.candidateProgress && screening.candidateProgress.length > 0 && (
            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
              {(() => {
                // Deduplicate by candidateName and show latest status
                const candidateMap = new Map();
                screening.candidateProgress.forEach((candidate: any) => {
                  candidateMap.set(candidate.candidateName, candidate);
                });
                return Array.from(candidateMap.values()).map((candidate: any, idx: number) => (
                  <div
                    key={candidate.candidateName}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all",
                      candidate.status === "analyzing"
                        ? "border-cyan-400/20 bg-cyan-400/5"
                        : candidate.overallScore && candidate.overallScore >= 70
                        ? "border-emerald-400/20 bg-emerald-400/5"
                        : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    {candidate.status === "analyzing" ? (
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                    ) : candidate.overallScore && candidate.overallScore >= 70 ? (
                      <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {candidate.candidateName}
                      </p>
                      {candidate.status === "completed" && candidate.recommendation && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {candidate.recommendation.slice(0, 100)}
                          {candidate.recommendation.length > 100 && "..."}
                        </p>
                      )}
                    </div>
                    
                    {candidate.status === "completed" && candidate.overallScore !== undefined && (
                      <div className="shrink-0">
                        <ScoreRing score={candidate.overallScore} size={36} />
                      </div>
                    )}
                    
                    {candidate.status === "analyzing" && (
                      <span className="text-[9px] text-cyan-400 font-semibold uppercase tracking-wider shrink-0">
                        Analyzing...
                      </span>
                    )}
                  </div>
                ));
              })()}
            </div>
          )}

          <div className="space-y-2 font-mono">
            <p className="text-sm text-slate-300">
              {screening?.progress && screening.progress.completed > 0
                ? `Analyzed ${screening.progress.completed} of ${screening.progress.total} applicants...`
                : "Analyzing applicants one by one..."}
            </p>
            <p className="text-sm text-slate-500">Running bias detection pipeline...</p>
            <p className="text-sm text-slate-700">
              Generating tailored interview questions
              <span className="blink text-cyan-400">_</span>
            </p>
          </div>
        </div>
      )}

      {screening?.status === "failed" && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 mb-8">
          <p className="font-bold text-rose-400 text-sm">Screening failed</p>
          <p className="text-xs text-rose-400/60 mt-1 leading-relaxed">
            {screening.errorMessage ||
              "The AI pipeline encountered an error. Check configuration and retry."}
          </p>
        </div>
      )}

      {screening?.status === "completed" && (
        <>
          <div
            className={clsx(
              "border rounded-2xl p-5 mb-8",
              biasConfig[screening.biasAudit.riskLevel].wrap
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon
                  className={clsx("w-4 h-4", biasConfig[screening.biasAudit.riskLevel].icon)}
                />
                <span className="text-sm font-bold text-slate-200">Bias Guard Audit</span>
              </div>
              <span
                className={clsx(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest",
                  biasConfig[screening.biasAudit.riskLevel].badge
                )}
              >
                {screening.biasAudit.riskLevel} risk
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">
              {screening.biasAudit.overallAssessment}
            </p>
            {screening.biasAudit.flags.length > 0 && (
              <div className="space-y-2">
                {screening.biasAudit.flags.map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 text-xs bg-black/20 rounded-xl px-3 py-2.5"
                  >
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-300 capitalize">
                        {flag.type.replace(/_/g, " ")}: 
                      </span>
                      <span className="text-slate-500">{flag.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />
            <p className="text-[10px] tracking-widest text-slate-600 uppercase font-semibold">
              Top {screening.shortlist.length} Candidates
            </p>
            {screening.analysisStats && (
              <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-600">
                <span className="flex items-center gap-1">
                  <UsersIcon className="w-3 h-3" />
                  {screening.analysisStats.total} analyzed
                </span>
                {screening.analysisStats.insufficientDocs > 0 && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <FileWarningIcon className="w-3 h-3" />
                    {screening.analysisStats.insufficientDocs} missing docs
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {screening.shortlist.map((candidate) => (
              <CandidateCard
                key={candidate.rank}
                candidate={candidate}
                expanded={expandedCandidate === candidate.rank}
                onToggle={() =>
                  setExpandedCandidate((p) => (p === candidate.rank ? null : candidate.rank))
                }
                onFeedback={handleFeedback}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  expanded,
  onToggle,
  onFeedback,
}: {
  candidate: RankedCandidate;
  expanded: boolean;
  onToggle: () => void;
  onFeedback: (rank: number, f: "accepted" | "rejected") => void;
}) {
  const radarData = [
    { subject: "Skills", value: candidate.scoreBreakdown.skillsMatch },
    { subject: "Exp", value: candidate.scoreBreakdown.experienceRelevance },
    { subject: "Edu", value: candidate.scoreBreakdown.educationFit },
    { subject: "Relevance", value: candidate.scoreBreakdown.overallRelevance },
  ];

  const areaConfig: Record<string, string> = {
    technical: "text-sky-400 bg-sky-400/10",
    behavioral: "text-purple-400 bg-purple-400/10",
    gap_probe: "text-orange-400 bg-orange-400/10",
    cultural_fit: "text-teal-400 bg-teal-400/10",
  };

  return (
    <div
      className={clsx(
        "bg-[#0d0d1a] border rounded-2xl overflow-hidden transition-all",
        expanded ? "border-cyan-400/20" : "border-white/[0.06] hover:border-white/[0.1]"
      )}
    >
      <div role="button" tabIndex={0} onClick={onToggle} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }} className="w-full flex items-center gap-4 px-5 py-4 text-left">

        <span className="text-base font-black text-slate-700 w-6 text-center tabular-nums shrink-0">
          {candidate.rank}
        </span>

        <ScoreRing score={candidate.overallScore} />

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-100 text-sm leading-none">{candidate.candidateName}</p>
          <p className="text-xs text-slate-600 truncate mt-1">{candidate.recommendation}</p>
          {candidate.documentStatus !== "sufficient" && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 mt-1.5 text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide",
                candidate.documentStatus === "insufficient"
                  ? "bg-rose-400/10 text-rose-400"
                  : "bg-amber-400/10 text-amber-400"
              )}
            >
              <FileWarningIcon className="w-2.5 h-2.5" />
              {candidate.documentStatus === "insufficient" ? "No documents" : "Partial docs"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {candidate.recruiterFeedback ? (
            <span
              className={clsx(
                "text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide",
                candidate.recruiterFeedback === "accepted"
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  : "bg-rose-400/10 text-rose-400 border-rose-400/20"
              )}
            >
              {candidate.recruiterFeedback}
            </span>
          ) : (
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onFeedback(candidate.rank, "accepted")}
                className="p-1.5 rounded-lg text-slate-700 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                title="Accept"
              >
                <ThumbsUpIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onFeedback(candidate.rank, "rejected")}
                className="p-1.5 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                title="Reject"
              >
                <ThumbsDownIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {expanded ? (
            <ChevronUpIcon className="w-4 h-4 text-slate-700" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-slate-700" />
          )}
      </div>

      </div>


      {expanded && (
        <div className="border-t border-white/[0.06] px-5 py-6">
          {candidate.documentStatus !== "sufficient" && candidate.documentNotes && (
            <div
              className={clsx(
                "flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5 text-xs",
                candidate.documentStatus === "insufficient"
                  ? "bg-rose-500/5 border border-rose-500/15 text-rose-400"
                  : "bg-amber-500/5 border border-amber-500/15 text-amber-400"
              )}
            >
              <FileWarningIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{candidate.documentNotes}</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-[9px] tracking-[0.18em] text-slate-600 uppercase font-semibold">
                  Score Breakdown
                </p>
                {[
                  { label: "Skills Match", value: candidate.scoreBreakdown.skillsMatch },
                  { label: "Experience", value: candidate.scoreBreakdown.experienceRelevance },
                  { label: "Education", value: candidate.scoreBreakdown.educationFit },
                  { label: "Relevance", value: candidate.scoreBreakdown.overallRelevance },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="text-slate-300 font-bold tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{
                          width: `${item.value}%`,
                          transition: "width 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {candidate.strengths.length > 0 && (
                <div>
                  <p className="text-[9px] tracking-[0.18em] text-slate-600 uppercase font-semibold mb-2">
                    Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {candidate.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {candidate.gaps.length > 0 && (
                <div>
                  <p className="text-[9px] tracking-[0.18em] text-slate-600 uppercase font-semibold mb-2">
                    Gaps / Risks
                  </p>
                  <ul className="space-y-1.5">
                    {candidate.gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#0d0d1a",
                      border: "1px solid rgba(34,211,238,0.12)",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "#f0f9ff",
                    }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#22d3ee"
                    fill="#22d3ee"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {candidate.interviewQuestions && candidate.interviewQuestions.length > 0 && (
            <div className="border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquareIcon className="w-3.5 h-3.5 text-cyan-400" />
                <p className="text-[9px] tracking-[0.18em] text-slate-600 uppercase font-semibold">
                  Tailored Interview Questions
                </p>
              </div>
              <ol className="space-y-4">
                {candidate.interviewQuestions.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-xs font-black text-slate-700 w-5 shrink-0 mt-0.5 tabular-nums text-right">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 leading-relaxed">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={clsx(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                            areaConfig[q.area] ?? "text-slate-500 bg-slate-800/60"
                          )}
                        >
                          {q.area.replace(/_/g, " ")}
                        </span>
                        {q.rationale && <span className="text-[10px] text-slate-700">{q.rationale}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
