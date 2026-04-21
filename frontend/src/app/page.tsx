"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ZapIcon,
  BadgeCheckIcon,
  ScanSearchIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const VALUE_PILLS = [
  { icon: SparklesIcon, label: "Clear scoring breakdown" },
  { icon: ShieldCheckIcon, label: "Bias audit included" },
  { icon: ScanSearchIcon, label: "Structured profiles" },
];

const FEATURE_CARDS = [
  {
    title: "How it works",
    body: "1. Post your job opening  2. Candidates apply with their profiles  3. Click 'Run AI Screening'  4. Get your top 10 with reasons why they qualified.",
  },
  {
    title: "Intelligent ranking",
    body: "AI analyzes skills, experience, education, and projects. Each candidate gets a score breakdown showing exactly what they excel at and where they have gaps.",
  },
  {
    title: "Interview ready",
    body: "Your shortlist includes 5 custom interview questions per candidate. Questions target their specific strengths and weaknesses — ready to use immediately.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen dot-bg flex flex-col">
      <header className="h-14 flex items-center justify-between px-6 md:px-12 border-b border-slate-200 dark:border-white/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
            <ZapIcon className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Davinci</p>
            <p className="text-[9px] text-slate-600 font-medium tracking-[0.2em] uppercase">AI Screener</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1.5 font-semibold">
            <BadgeCheckIcon className="w-3.5 h-3.5" /> Demo-ready build
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <section className="text-center lg:text-left">
            <p className="text-[10px] tracking-[0.3em] text-cyan-400/70 uppercase font-semibold mb-5 fade-rise">
              Talent Screening Platform
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-5 fade-rise">
              AI Hiring Assistant
              <span className="block text-cyan-400">for Smart Recruiters</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed mb-8 fade-rise">
              Post jobs, receive applications, and let AI rank your top 10 candidates with detailed reasoning. 
              See exactly why each person made the shortlist — skills match, experience depth, and cultural fit.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-8 fade-rise">
              {VALUE_PILLS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-white/[0.05] rounded-full px-3 py-1.5 bg-slate-100 dark:bg-white/[0.02]"
                >
                  <Icon className="w-3 h-3 text-cyan-400" />
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl fade-rise">
              <Link
                href="/portal"
                className="group relative flex flex-col items-start gap-4 bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.07] hover:border-cyan-400/30 rounded-2xl p-6 text-left transition-all hover:bg-slate-50 dark:hover:bg-[#0d1520]"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/15 flex items-center justify-center">
                  <BriefcaseIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold text-base mb-1">For Job Seekers</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Submit your profile with skills, projects, and experience. Get evaluated fairly.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mt-auto group-hover:gap-2.5 transition-all">
                  Browse jobs <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </Link>

              <Link
                href="/hr"
                className="group relative flex flex-col items-start gap-4 bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.07] hover:border-slate-400/20 rounded-2xl p-6 text-left transition-all hover:bg-slate-50 dark:hover:bg-[#100d1a]"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-400/10 border border-slate-400/10 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-bold text-base mb-1">For Recruiters</p>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Run screening, review ranked candidates with score breakdowns, and get interview questions ready.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-semibold mt-auto group-hover:gap-2.5 transition-all">
                  Open dashboard <ArrowRightIcon className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </section>

          <aside className="fade-rise bg-white dark:bg-[#0d0d1a] border border-slate-200 dark:border-white/[0.06] rounded-3xl p-5 md:p-6">
            <p className="text-[10px] tracking-[0.28em] text-cyan-400/70 uppercase font-semibold mb-4">
              How it works
            </p>
            <div className="space-y-3">
              {FEATURE_CARDS.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 dark:border-white/[0.05] bg-slate-100 dark:bg-white/[0.02] p-4">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{card.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                ["40%", "skills"],
                ["30%", "experience"],
                ["30%", "fit + education"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] p-3 text-center">
                  <p className="text-lg font-black text-cyan-400 leading-none">{value}</p>
                  <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

