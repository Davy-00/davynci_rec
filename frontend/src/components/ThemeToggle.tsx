"use client";

import { SunIcon, MoonIcon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 hover:bg-cyan-500/10 dark:hover:bg-cyan-400/10 transition-colors"
    >
      {theme === "dark" ? (
        <SunIcon className="w-3.5 h-3.5" />
      ) : (
        <MoonIcon className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
