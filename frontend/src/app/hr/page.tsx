"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchJobs } from "@/store/jobsSlice";
import { BriefcaseIcon, PlusIcon, ArrowRightIcon } from "lucide-react";
import clsx from "clsx";

const STATUS: Record<string, { label: string; dot: string; cls: string }> = {
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    cls: "text-emerald-400 bg-emerald-400/8 border border-emerald-400/20",
  },
  draft: {
    label: "Draft",
    dot: "bg-amber-400",
    cls: "text-amber-400 bg-amber-400/8 border border-amber-400/20",
  },
  closed: {
    label: "Closed",
    dot: "bg-slate-600",
    cls: "text-slate-500 bg-slate-500/8 border border-slate-500/20",
  },
};

export default function HRDashboard() {
  const dispatch = useAppDispatch();
  const { list: jobs, loading } = useAppSelector((s) => s.jobs);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const draftJobs = jobs.filter((j) => j.status === "draft").length;
  const activePercent = jobs.length === 0 ? 0 : Math.round((activeJobs / jobs.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="fade-rise mb-10">
        <p className="text-[10px] tracking-[0.3em] text-slate-600 uppercase font-semibold mb-3">
          Recruiter Dashboard
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
              Signal Pipeline
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-xl">
              Post jobs, run AI screening, and review ranked candidates with score breakdowns.
            </p>
          </div>
          <Link
            href="/hr/jobs/new"
            className="inline-flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Job
          </Link>
        </div>
      </div>

      {/* Stat strip */}
      <div className="fade-rise grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Total", value: jobs.length, cls: "text-white" },
          { label: "Active", value: activeJobs, cls: "text-emerald-400" },
          { label: "Draft", value: draftJobs, cls: "text-amber-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-[9px] tracking-[0.24em] text-slate-600 uppercase font-semibold mb-3">
              {stat.label}
            </p>
            <p className={clsx("text-3xl font-black tabular-nums leading-none", stat.cls)}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pipeline health bar */}
      {jobs.length > 0 && (
        <div className="fade-rise bg-[#0d0d1a] border border-white/[0.06] rounded-2xl px-5 py-4 mb-8 flex items-center gap-4">
          <p className="text-[9px] tracking-[0.24em] text-slate-600 uppercase font-semibold shrink-0">
            Pipeline Health
          </p>
          <div className="flex-1 h-0.5 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-[width] duration-700"
              style={{ width: `${activePercent}%` }}
            />
          </div>
          <p className="text-sm font-black tabular-nums text-cyan-400 shrink-0">
            {activePercent}%
          </p>
        </div>
      )}

      {/* Jobs list */}
      <div className="fade-rise">
        <p className="text-[9px] tracking-[0.24em] text-slate-600 uppercase font-semibold mb-4">
          All Positions
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-5 h-5 border-2 border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center bg-[#0d0d1a] border border-white/[0.04] rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <BriefcaseIcon className="w-5 h-5 text-slate-700" />
            </div>
            <p className="text-sm font-semibold text-slate-400">No positions yet</p>
            <p className="text-xs text-slate-600 mt-1.5 mb-5">
              Create your first job to activate the screening pipeline.
            </p>
            <Link
              href="/hr/jobs/new"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Create a job
            </Link>
          </div>
        ) : (
          <div className="bg-[#0d0d1a] border border-white/[0.06] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
            {jobs.map((job) => {
              const s = STATUS[job.status] ?? STATUS.draft;
              return (
                <Link
                  key={job._id}
                  href={`/hr/jobs/${job._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <BriefcaseIcon className="w-3.5 h-3.5 text-slate-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {[job.department, job.location, job.workType].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  {job.requirements?.requiredSkills?.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="hidden md:inline text-[10px] text-slate-600 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md font-medium"
                    >
                      {skill}
                    </span>
                  ))}

                  <span
                    className={clsx(
                      "text-[9px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-widest",
                      s.cls
                    )}
                  >
                    {s.label}
                  </span>

                  <ArrowRightIcon className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
