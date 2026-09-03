"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import WealthIndustryNav from "@/components/wealth/WealthIndustryNav";
import type { OpenCall } from "@/lib/industry";
import { callTypeLabel } from "@/lib/industry";

export default function OpenCallDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [call, setCall] = useState<OpenCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPitch, setShowPitch] = useState(false);
  const [pitchMessage, setPitchMessage] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");
  const [experience, setExperience] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/wealth/industry/${id}`)}`);
    }
  }, [authLoading, user, router, id]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/wealth/industry/${id}`);
        setCall(res.data.call);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load open call.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, id]);

  const submitPitch = async () => {
    if (pitchMessage.trim().length < 20) {
      setError("Pitch message must be at least 20 characters.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post(`/wealth/industry/${id}/pitches`, {
        pitchMessage: pitchMessage.trim(),
        portfolioUrl: portfolioUrl.trim(),
        sampleUrl: sampleUrl.trim(),
        experience: experience.trim(),
      });
      setToast("Pitch submitted.");
      setShowPitch(false);
      window.setTimeout(() => setToast(""), 2200);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit pitch.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#909090] text-xs">
        Loading…
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
        <Navbar />
        <main className="flex-grow px-[5%] pt-6">
          <p className="text-xs text-red-400">{error || "Not found."}</p>
          <Link href="/wealth/industry" className="text-xs text-[var(--gd)] mt-4 inline-block">
            ← Back to Open Calls
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = call.posterId === user.uid;
  const field =
    "mb-3 w-full rounded-xl border border-[#242424] bg-[#161616] px-3.5 py-3 text-[13px] text-[#F0EBE0] outline-none focus:border-[var(--gm)]";

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      {toast ? (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-[999] -translate-x-1/2 rounded-[14px] border border-[var(--gm)] bg-[#1a1200] px-6 py-3 text-[13px] font-semibold text-[var(--gd)]">
          {toast}
        </div>
      ) : null}
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[800px]">
          <WealthIndustryNav active="browse" />
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="rounded-md border border-[var(--gm)] bg-[var(--gf)] px-2 py-0.5 text-[9px] font-bold uppercase text-[var(--gd)]">
              {callTypeLabel(call.callType)}
            </span>
            <span className="rounded-md border border-[#242424] px-2 py-0.5 text-[9px] font-bold uppercase text-[#909090]">
              {call.locationType}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-black text-white mb-1">{call.title}</h1>
          <p className="text-sm text-[var(--gd)] mb-4">{call.organization}</p>
          <div className="flex flex-wrap gap-4 text-[11px] text-[#909090] mb-6">
            {call.deadline ? <span>Deadline: {call.deadline}</span> : null}
            {call.genre ? <span>Genre: {call.genre}</span> : null}
            {call.prize ? <span>Prize: {call.prize}</span> : null}
            {call.fee ? <span>Fee: {call.fee}</span> : null}
          </div>
          <section className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gm)] mb-2">Description</h2>
            <p className="text-sm leading-relaxed text-[#F0EBE0] whitespace-pre-wrap">{call.description}</p>
          </section>
          {call.requirements ? (
            <section className="mb-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--gm)] mb-2">Requirements</h2>
              <p className="text-sm leading-relaxed text-[#909090] whitespace-pre-wrap">{call.requirements}</p>
            </section>
          ) : null}

          {error ? <p className="text-xs text-red-400 mb-3">{error}</p> : null}

          {isOwner ? (
            <Link
              href={`/wealth/industry/${call.id}/pitches`}
              className="inline-flex rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] px-5 py-3 text-xs font-bold text-[#080808]"
            >
              View Pitches ({call.pitchCount || 0})
            </Link>
          ) : showPitch ? (
            <div className="rounded-2xl border border-[#242424] bg-[#141414] p-5">
              <h3 className="font-serif text-xl font-bold text-white mb-3">Submit Your Pitch</h3>
              <textarea
                className={`${field} min-h-[100px]`}
                value={pitchMessage}
                onChange={(e) => setPitchMessage(e.target.value)}
                placeholder="Cover pitch / why you're a fit *"
              />
              <input className={field} value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="Portfolio URL (optional)" />
              <input className={field} value={sampleUrl} onChange={(e) => setSampleUrl(e.target.value)} placeholder="Script / sample URL (optional)" />
              <input className={field} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Relevant experience (optional)" />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submitPitch}
                  className="flex-1 rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] py-3 text-xs font-bold text-[#080808] disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Pitch"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPitch(false)}
                  className="rounded-xl border border-[#242424] px-4 py-3 text-xs font-bold text-[#909090]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPitch(true)}
              className="rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] px-5 py-3 text-xs font-bold text-[#080808]"
            >
              Pitch / Apply
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
