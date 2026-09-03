"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import WealthIndustryNav from "@/components/wealth/WealthIndustryNav";
import type { IndustryPitch } from "@/lib/industry";
import { pitchStatusLabel } from "@/lib/industry";

const ACTIONS = ["reviewed", "shortlisted", "accepted", "rejected"] as const;

export default function CallPitchesPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pitches, setPitches] = useState<IndustryPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/wealth/industry/${id}/pitches`)}`);
    }
  }, [authLoading, user, router, id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/wealth/industry/${id}/pitches`);
      setPitches(res.data.pitches || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load pitches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) load();
  }, [user, id]);

  const updateStatus = async (pitchId: string, status: string) => {
    setBusyId(pitchId);
    try {
      await api.patch(`/wealth/pitches/${pitchId}`, { status });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Update failed.");
    } finally {
      setBusyId("");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#909090] text-xs">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[900px]">
          <WealthIndustryNav active="mine" />
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-serif text-3xl font-black text-white">Pitches</h1>
            <Link href={`/wealth/industry/${id}`} className="text-xs text-[var(--gd)]">
              ← Listing
            </Link>
          </div>
          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}
          {loading ? (
            <p className="text-xs text-[#909090]">Loading…</p>
          ) : pitches.length === 0 ? (
            <p className="text-xs text-[#606060]">No pitches yet.</p>
          ) : (
            <div className="space-y-4">
              {pitches.map((p) => (
                <div key={p.id} className="rounded-2xl border border-[#242424] bg-[#1c1c1c] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white">{p.applicantName}</h3>
                    <span className="text-[10px] font-bold uppercase text-[var(--gd)]">
                      {pitchStatusLabel(p.status)}
                    </span>
                  </div>
                  <p className="text-sm text-[#F0EBE0] whitespace-pre-wrap mb-3">{p.pitchMessage}</p>
                  {p.experience ? (
                    <p className="text-xs text-[#909090] mb-1">Experience: {p.experience}</p>
                  ) : null}
                  {p.portfolioUrl ? (
                    <a href={p.portfolioUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--gd)] underline block mb-1">
                      Portfolio
                    </a>
                  ) : null}
                  {p.sampleUrl ? (
                    <a href={p.sampleUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--gd)] underline block mb-3">
                      Sample
                    </a>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busyId === p.id || p.status === status}
                        onClick={() => updateStatus(p.id, status)}
                        className="rounded-lg border border-[#242424] px-2.5 py-1 text-[10px] font-bold uppercase text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)] disabled:opacity-40"
                      >
                        {pitchStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
