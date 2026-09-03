"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { OpenCallCard } from "@/components/wealth/OpenCallCard";
import WealthIndustryNav from "@/components/wealth/WealthIndustryNav";
import type { OpenCall } from "@/lib/industry";
import { CALL_TYPES, LOCATION_TYPES } from "@/lib/industry";

export default function IndustryFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [callType, setCallType] = useState("");
  const [locationType, setLocationType] = useState("");
  const [calls, setCalls] = useState<OpenCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/industry")}`);
    }
  }, [authLoading, user, router]);

  const load = useCallback(async (overrides?: {
    search?: string;
    callType?: string;
    locationType?: string;
  }) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const s = overrides?.search ?? search;
      const ct = overrides?.callType ?? callType;
      const lt = overrides?.locationType ?? locationType;
      if (s.trim()) params.set("search", s.trim());
      if (ct) params.set("callType", ct);
      if (lt) params.set("locationType", lt);
      const res = await api.get(`/wealth/industry?${params.toString()}`);
      setCalls(res.data.calls || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load open calls.");
    } finally {
      setLoading(false);
    }
  }, [search, callType, locationType]);

  useEffect(() => {
    if (!user) return;
    load();
    // initial load only when user becomes available
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
        <div className="mx-auto max-w-[1200px]">
          <WealthIndustryNav active="browse" />
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gd)]">
                Industry Connect
              </p>
              <h1 className="font-serif text-3xl font-black text-white mt-1">Open Calls</h1>
              <p className="text-xs text-[#909090] mt-1">
                Directors and producers seeking scripts, stories, and collaborations.
              </p>
            </div>
            <Link
              href="/wealth/industry/post"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] px-4 py-2.5 text-xs font-bold text-[#080808]"
            >
              Post a Listing
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="rounded-xl border border-[#242424] bg-[#161616] px-3 py-2.5 text-xs text-[#F0EBE0] outline-none focus:border-[var(--gm)]"
            />
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="rounded-xl border border-[#242424] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#F0EBE0] outline-none"
            >
              <option value="">All types</option>
              {CALL_TYPES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="rounded-xl border border-[#242424] bg-[#1c1c1c] px-3 py-2.5 text-xs text-[#F0EBE0] outline-none"
            >
              <option value="">Any location</option>
              {LOCATION_TYPES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              className="rounded-xl border border-[var(--gm)] bg-[var(--gf)] px-3 py-2.5 text-xs font-bold text-[var(--gd)]"
            >
              Apply Filters
            </button>
          </div>

          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}

          {loading ? (
            <p className="text-xs text-[#909090]">Loading open calls…</p>
          ) : calls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242424] p-10 text-center">
              <p className="text-xs text-[#606060]">No active open calls yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {calls.map((call) => (
                <OpenCallCard key={call.id} call={call} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
