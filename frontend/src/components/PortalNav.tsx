"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseIcon, HomeIcon, ZapIcon } from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/portal", label: "Browse Jobs", icon: BriefcaseIcon, exact: true },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <header className="h-14 shrink-0 flex items-center gap-6 px-6 border-b border-white/[0.05] bg-[#080810]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Logo */}
      <Link href="/portal" className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <ZapIcon className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="leading-none">
          <p className="text-sm font-bold text-white tracking-tight">Davinci</p>
          <p className="text-[9px] text-slate-600 font-medium tracking-[0.2em] uppercase">Jobs Portal</p>
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

      {/* Back to landing */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 font-medium tracking-wide transition-colors"
      >
        <HomeIcon className="w-3 h-3" />
        Home
      </Link>
    </header>
  );
}
