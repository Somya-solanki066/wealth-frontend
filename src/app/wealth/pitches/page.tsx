"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import WealthIndustryNav from "@/components/wealth/WealthIndustryNav";
import type { IndustryPitch } from "@/lib/industry";
import { pitchStatusLabel } from "@/lib/industry";

export default function MyPitchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pitches, setPitches] = useState<IndustryPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/pitches")}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/wealth/pitches/mine");
        setPitches(res.data.pitches || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load pitches.");
      } finally {
        setLoading(false);
      }
    })();
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
        <div className="mx-auto max-w-[900px]">
          <WealthIndustryNav active="pitches" />
          <h1 className="font-serif text-3xl font-black text-white mb-6">My Pitches</h1>
          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}
          {loading ? (
            <p className="text-xs text-[#909090]">Loading…</p>
          ) : pitches.length === 0 ? (
            <p className="text-xs text-[#606060]">
              No pitches yet.{" "}
              <Link href="/wealth/industry" className="text-[var(--gd)] underline">
                Browse open calls
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {pitches.map((p) => (
                <Link
                  key={p.id}
                  href={`/wealth/industry/${p.callId}`}
                  className="block rounded-2xl border border-[#242424] bg-[#1c1c1c] p-4 hover:border-[var(--gm)]"
                >
                  <div className="flex justify-between gap-2 mb-1">
                    <h3 className="font-bold text-white">{p.callTitle}</h3>
                    <span className="text-[10px] font-bold uppercase text-[var(--gd)] shrink-0">
                      {pitchStatusLabel(p.status)}
                    </span>
                  </div>
                  <p className="text-xs text-[#606060] line-clamp-2">{p.pitchMessage}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
