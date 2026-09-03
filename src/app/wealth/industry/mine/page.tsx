"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import WealthIndustryNav from "@/components/wealth/WealthIndustryNav";
import type { OpenCall } from "@/lib/industry";
import { callStatusLabel, callTypeLabel } from "@/lib/industry";

export default function MyOpenCallsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [calls, setCalls] = useState<OpenCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/industry/mine")}`);
    }
  }, [authLoading, user, router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/wealth/industry/mine");
      setCalls(res.data.calls || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const closeCall = async (id: string) => {
    try {
      await api.post(`/wealth/industry/${id}/close`);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to close listing.");
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
          <h1 className="font-serif text-3xl font-black text-white mb-6">My Listings</h1>
          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}
          {loading ? (
            <p className="text-xs text-[#909090]">Loading…</p>
          ) : calls.length === 0 ? (
            <p className="text-xs text-[#606060]">
              No listings yet.{" "}
              <Link href="/wealth/industry/post" className="text-[var(--gd)] underline">
                Post one
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="rounded-2xl border border-[#242424] bg-[#1c1c1c] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[10px] text-[var(--gd)] mb-1">
                      {callTypeLabel(call.callType)} · {callStatusLabel(call.status)}
                    </p>
                    <h3 className="font-bold text-white">{call.title}</h3>
                    <p className="text-xs text-[#606060] mt-1">
                      {call.pitchCount || 0} pitches
                      {call.rejectReason ? ` · Rejected: ${call.rejectReason}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/wealth/industry/${call.id}`}
                      className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090]"
                    >
                      View
                    </Link>
                    {call.status === "active" || call.status === "pending_review" ? (
                      <Link
                        href={`/wealth/industry/${call.id}/pitches`}
                        className="rounded-xl border border-[var(--gm)] bg-[var(--gf)] px-3 py-1.5 text-[11px] font-bold text-[var(--gd)]"
                      >
                        Pitches
                      </Link>
                    ) : null}
                    {call.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => closeCall(call.id)}
                        className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090]"
                      >
                        Close
                      </button>
                    ) : null}
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
