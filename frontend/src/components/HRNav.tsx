"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BriefcaseIcon, PlusIcon, ZapIcon, Trash2Icon, LogOutIcon } from "lucide-react";
import clsx from "clsx";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { clearToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL;

const nav = [
  { href: "/hr", label: "Dashboard", icon: BriefcaseIcon, exact: true },
  { href: "/hr/jobs/new", label: "New Job", icon: PlusIcon, exact: false },
];

export function HRNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  function handleLogout() {
    clearToken();
    router.push("/hr/login");
  }

  async function handleReset() {
    if (!confirm("Delete ALL jobs, applicants, and screening data? This cannot be undone.")) return;
    setResetting(true);
    try {
      await axios.delete(`${API}/admin/reset`, { data: { confirm: "RESET_ALL" } });
      toast.success("All data cleared. Starting fresh.");
      window.location.href = "/hr";
    } catch {
      toast.error("Reset failed.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <header className="h-14 shrink-0 flex items-center gap-6 px-6 border-b border-white/[0.05] bg-[#080810]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Logo */}
      <Link href="/hr" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <ZapIcon className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-white tracking-tight">Davinci</p>
          <p className="text-[9px] text-slate-600 font-medium tracking-[0.2em] uppercase">HR Dashboard</p>
        </div>
      </Link>

      {/* Divider */}
      <div className="h-5 w-px bg-white/[0.07]" />

      {/* Nav */}
      <nav className="flex items-center gap-0.5">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/15"
                  : "text-slate-500 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
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

      {/* Portal link */}
      <Link
        href="/portal"
        className="text-[10px] text-slate-600 hover:text-slate-400 font-medium tracking-wide transition-colors"
      >
        ← Applicant Portal
      </Link>

      {/* Reset button */}
      <button
        onClick={handleReset}
        disabled={resetting}
        title="Clear all demo data"
        className="p-1.5 rounded-lg text-slate-700 hover:text-rose-400 hover:bg-rose-400/10 transition-colors disabled:opacity-40"
      >
        <Trash2Icon className="w-3.5 h-3.5" />
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Sign out"
        className="p-1.5 rounded-lg text-slate-700 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
      >
        <LogOutIcon className="w-3.5 h-3.5" />
      </button>

      {/* Gemini status */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-40" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
        </span>
        <span className="text-[10px] text-slate-600 font-medium tracking-wide hidden sm:block">Gemini live</span>
      </div>
    </header>
  );
}
