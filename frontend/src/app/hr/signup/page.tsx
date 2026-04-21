"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ZapIcon, EyeIcon, EyeOffIcon, AlertCircleIcon } from "lucide-react";
import { setToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "https://davinci-backend-production.up.railway.app/api";

export default function HRSignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/auth/signup`, { username, password });
      setToken(res.data.token);
      router.replace("/hr");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen dot-bg flex flex-col items-center justify-center px-6">
      {/* Brand */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center">
          <ZapIcon className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="leading-none">
          <p className="text-base font-bold text-white tracking-tight">Davinci</p>
          <p className="text-[9px] text-slate-600 font-medium tracking-[0.2em] uppercase">HR Portal</p>
        </div>
      </div>

      <div className="w-full max-w-sm bg-[#0d0d1a] border border-white/[0.07] rounded-2xl p-8">
        <h1 className="text-xl font-black text-white tracking-tight mb-1">Create account</h1>
        <p className="text-xs text-slate-600 mb-7">HR & recruiter access only.</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/8 border border-red-400/20 rounded-xl px-3.5 py-3 mb-5 text-sm text-red-400">
            <AlertCircleIcon className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
              placeholder="yourname"
              className="bg-[#080810] border border-white/[0.07] focus:border-cyan-400/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-700 focus:outline-none transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Password</span>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min 8 characters"
                className="w-full bg-[#080810] border border-white/[0.07] focus:border-cyan-400/40 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-100 placeholder-slate-700 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Confirm password</span>
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              placeholder="••••••••"
              className="bg-[#080810] border border-white/[0.07] focus:border-cyan-400/40 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-700 focus:outline-none transition-colors"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !username || !password || !confirm}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl transition-all mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Already have an account?{" "}
          <Link href="/hr/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
