"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Mail, Loader2, Key, ArrowLeft, BookOpen } from "lucide-react";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send reset link. Please check the email address.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-4 py-12">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[20%] h-96 w-96 rounded-full bg-[var(--gd)]/5 blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] h-96 w-96 rounded-full bg-[var(--gm)]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 bg-[#0f0f0f] border border-[#242424] p-8 rounded-2xl shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 group mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--bg1)] to-[var(--bg2)] border border-[var(--gm)] rounded-xl flex items-center justify-center text-lg text-[var(--gd)]">
              <BookOpen className="h-5 w-5 text-[var(--gd)]" />
            </div>
            <span className="font-serif font-black text-xl text-[var(--gd)] tracking-wide">
              Ink2Wealth
            </span>
          </Link>
          <h2 className="text-2xl font-serif font-bold text-white tracking-tight">
            Reset Password
          </h2>
          <p className="mt-1 text-xs text-[#909090]">
            Enter your email to receive a password reset link
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs leading-relaxed">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-xs leading-relaxed">
            Password reset link sent successfully! Check your inbox for further instructions.
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-[#909090] mb-1.5">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Mail className="h-4.5 w-4.5" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-[#161616] border border-[#242424] rounded-lg text-[#F0EBE0] placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-[var(--gd)]/10 focus:border-[var(--gm)] transition-all duration-200 text-xs"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 text-xs font-bold rounded-lg text-zinc-950 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 focus:outline-none disabled:opacity-50 transition-all duration-200"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#909090] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
