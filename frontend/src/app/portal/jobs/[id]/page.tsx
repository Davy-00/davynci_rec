"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  CheckIcon,
  StarIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "lucide-react";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Job {
  _id: string;
  title: string;
  department?: string;
  location?: string;
  workType: "remote" | "hybrid" | "onsite";
  description: string;
  responsibilities: string[];
  requirements: {
    yearsOfExperience: number;
    requiredSkills: string[];
    preferredSkills?: string[];
    educationLevel?: string;
  };
  formQuestions?: { id: string; question: string }[];
}

const WORK_BADGE: Record<string, string> = {
  remote: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
  hybrid: "text-amber-400 bg-amber-400/8 border-amber-400/20",
  onsite: "text-sky-400 bg-sky-400/8 border-sky-400/20",
};

export default function PortalJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios
      .get(`${API}/jobs/${id}`)
      .then((r) => setJob(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-5 h-5 border-2 border-white/[0.06] border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !job) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-slate-400 text-sm font-semibold">Position not found</p>
        <Link
          href="/portal"
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Back */}
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-400 font-semibold uppercase tracking-widest mb-8 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" /> All positions
      </Link>

      <div className="fade-rise">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.3em] text-cyan-400/70 uppercase font-semibold mb-2">
              {job.department || "Open Role"}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {job.title}
            </h1>
          </div>
          <span
            className={clsx(
              "shrink-0 mt-1 text-[9px] font-bold px-3 py-1.5 rounded-full border uppercase tracking-widest capitalize",
              WORK_BADGE[job.workType]
            )}
          >
            {job.workType}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-8 pb-8 border-b border-white/[0.05]">
          {job.location && (
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="w-3.5 h-3.5 text-slate-600" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5 text-slate-600" />
            {job.requirements.yearsOfExperience}+ years of experience
          </span>
          {job.requirements.educationLevel && (
            <span className="flex items-center gap-1.5">
              <BriefcaseIcon className="w-3.5 h-3.5 text-slate-600" />
              {job.requirements.educationLevel}
            </span>
          )}
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            About this role
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </section>

        {/* Responsibilities */}
        {job.responsibilities?.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Responsibilities
            </h2>
            <ul className="space-y-2.5">
              {job.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <CheckIcon className="w-3.5 h-3.5 text-cyan-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Required skills */}
        {job.requirements.requiredSkills?.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Required skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.requirements.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] text-cyan-300/80 bg-cyan-400/[0.06] border border-cyan-400/12 px-3 py-1 rounded-full font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Preferred skills */}
        {job.requirements.preferredSkills && job.requirements.preferredSkills.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Nice to have
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.requirements.preferredSkills.map((skill) => (
                <span
                  key={skill}
                  className="text-[11px] text-amber-300/70 bg-amber-400/[0.05] border border-amber-400/10 px-3 py-1 rounded-full font-medium"
                >
                  <StarIcon className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="pt-6 border-t border-white/[0.06]">
          <p className="text-xs text-slate-600 mb-4">
            Apply in minutes — no account required.
          </p>
          <button
            onClick={() => router.push(`/portal/apply/${job._id}`)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-cyan-500/20"
          >
            Apply for this position
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
