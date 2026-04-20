"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { BriefcaseIcon, MapPinIcon, ClockIcon, ArrowRightIcon, SearchIcon } from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  workType: "remote" | "hybrid" | "onsite";
  description: string;
  requirements: {
    yearsOfExperience: number;
    requiredSkills: string[];
    preferredSkills?: string[];
  };
  createdAt: string;
}

const WORK_BADGE: Record<string, string> = {
  remote: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
  hybrid: "text-amber-400 bg-amber-400/8 border-amber-400/20",
  onsite: "text-sky-400 bg-sky-400/8 border-sky-400/20",
};

export default function PortalPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/jobs/active`)
      .then((r) => setJobs(r.data.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department?.toLowerCase().includes(search.toLowerCase()) ||
      j.location?.toLowerCase().includes(search.toLowerCase()) ||
      j.requirements.requiredSkills.some((s) =>
        s.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="fade-rise mb-10">
        <p className="text-[10px] tracking-[0.3em] text-cyan-400/70 uppercase font-semibold mb-3">
          Open Positions
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-2">
          Find Your Next Role
        </h1>
        <p className="text-slate-500 text-sm">
          Browse open positions and apply directly. No account required — just submit your profile and we'll notify you about next steps.
        </p>
      </div>

      {/* Search */}
      <div className="fade-rise mb-8">
        <div className="flex items-center gap-3 bg-[#0d0d1a] border border-white/[0.07] rounded-2xl px-4 py-3">
          <SearchIcon className="w-4 h-4 text-slate-600 shrink-0" />
          <input
            type="text"
            placeholder="Search by title, skill, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] text-slate-600 hover:text-slate-400 font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-[#0d0d1a] border border-white/[0.04] rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <BriefcaseIcon className="w-5 h-5 text-slate-700" />
          </div>
          <p className="text-sm font-semibold text-slate-400">
            {search ? "No matching positions" : "No open positions right now"}
          </p>
          <p className="text-xs text-slate-600 mt-1.5">
            {search ? "Try a different keyword." : "Check back soon — new roles are posted regularly."}
          </p>
        </div>
      ) : (
        <div className="fade-rise space-y-3">
          {filtered.map((job) => (
            <Link
              key={job._id}
              href={`/portal/jobs/${job._id}`}
              className="group flex flex-col gap-3 bg-[#0d0d1a] border border-white/[0.06] hover:border-cyan-400/20 rounded-2xl p-5 transition-all hover:bg-[#0d1520]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-slate-100 group-hover:text-white transition-colors leading-tight">
                    {job.title}
                  </p>
                  {job.department && (
                    <p className="text-xs text-slate-600 mt-0.5">{job.department}</p>
                  )}
                </div>
                <span
                  className={clsx(
                    "shrink-0 text-[9px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest capitalize",
                    WORK_BADGE[job.workType]
                  )}
                >
                  {job.workType}
                </span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {job.description}
              </p>

              <div className="flex items-center gap-4 text-[10px] text-slate-600">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" />
                    {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {job.requirements.yearsOfExperience}+ yrs exp
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5">
                {job.requirements.requiredSkills.slice(0, 5).map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] text-slate-500 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {job.requirements.requiredSkills.length > 5 && (
                  <span className="text-[10px] text-slate-700 px-2 py-0.5">
                    +{job.requirements.requiredSkills.length - 5} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end">
                <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold group-hover:gap-2.5 transition-all">
                  View & apply <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
