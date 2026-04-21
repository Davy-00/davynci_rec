"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseIcon, PlusIcon, ZapIcon } from "lucide-react";
import clsx from "clsx";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/", label: "Dashboard", icon: BriefcaseIcon },
  { href: "/jobs/new", label: "New Job", icon: PlusIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <header className="h-14 shrink-0 flex items-center gap-6 px-6 border-b border-slate-200 dark:border-white/[0.05] bg-white/95 dark:bg-[#080810]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <ZapIcon className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Davinci</p>
          <p className="text-[9px] text-slate-600 font-medium tracking-[0.2em] uppercase">AI Screener</p>
        </div>
      </Link>

      {/* Divider */}
      <div className="h-5 w-px bg-slate-200 dark:bg-white/[0.07]" />

      {/* Nav */}
      <nav className="flex items-center gap-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/15"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-transparent"
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      <ThemeToggle />

      {/* Status */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-600 font-mono tracking-tight">gemini-2.5-flash</span>
      </div>
    </header>
  );
}
