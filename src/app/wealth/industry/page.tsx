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
import { INDUSTRY_GENRE_FILTERS } from "@/lib/industry";

export default function IndustryFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [genre, setGenre] = useState("All genres");
  const [calls, setCalls] = useState<OpenCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/industry")}`);
    }
  }, [authLoading, user, router]);

  const load = useCallback(async (selectedGenre = genre) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedGenre && selectedGenre !== "All genres") {
        params.set("genre", selectedGenre);
      }
      const res = await api.get(`/wealth/industry?${params.toString()}`);
      let list: OpenCall[] = res.data.calls || [];
      if (list.length === 0 && selectedGenre === "All genres") {
        const seed = await api.post("/wealth/industry/seed-demo");
        list = seed.data?.calls || [];
      }
      setCalls(list);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load open calls.");
    } finally {
      setLoading(false);
    }
  }, [genre]);

  useEffect(() => {
    if (!user) return;
    void load(genre);
  }, [user, genre]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <div className="mx-auto max-w-[720px]">
          <WealthIndustryNav active="browse" />
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gd)]">
                Industry Hub
              </p>
              <h1 className="font-serif text-3xl font-black text-white mt-1">
                Industry Hub & Open Calls
              </h1>
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

          <div className="rounded-2xl border border-[#242424] bg-[#1c1c1c] p-3 mb-6">
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_GENRE_FILTERS.map((g) => {
                const active = genre === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                      active
                        ? "bg-[var(--gd)] text-[#080808]"
                        : "bg-[#161616] text-[#a0a0a0] hover:text-[#f0ebe0]"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}

          {loading ? (
            <p className="text-xs text-[#909090]">Loading open calls…</p>
          ) : calls.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242424] p-10 text-center">
              <p className="text-xs text-[#606060]">No active open calls yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-4">
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
