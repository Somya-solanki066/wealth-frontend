"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { JobCard } from "@/components/wealth/JobCard";
import JobFilters, { emptyFilters, type JobFilterState } from "@/components/wealth/JobFilters";
import WealthJobsNav from "@/components/wealth/WealthJobsNav";
import type { WealthJob } from "@/lib/wealthJobs";
import { categoryLabel } from "@/lib/wealthJobs";

function WealthJobsFeedInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [filters, setFilters] = useState<JobFilterState>(() => ({
    ...emptyFilters(),
    category: initialCategory,
  }));
  const [jobs, setJobs] = useState<WealthJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/jobs")}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setFilters((prev) => ({ ...prev, category: cat }));
  }, [searchParams]);

  const loadJobs = useCallback(async (f: JobFilterState) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.category) params.set("category", f.category);
      if (f.jobType) params.set("jobType", f.jobType);
      if (f.locationType) params.set("locationType", f.locationType);
      if (f.budgetMin) params.set("budgetMin", f.budgetMin);
      if (f.budgetMax) params.set("budgetMax", f.budgetMax);
      if (f.urgent) params.set("urgent", "true");
      const res = await api.get(`/wealth/jobs?${params.toString()}`);
      setJobs(res.data.jobs || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadJobs(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters.category]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex items-center justify-center">
        <p className="text-xs text-[#909090]">Loading…</p>
      </div>
    );
  }

  const heading = filters.category
    ? `${categoryLabel(filters.category)} Jobs`
    : "Writing Jobs";

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[1200px]">
          <WealthJobsNav active="browse" />
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gd)]">
                WEALTH Engine
              </p>
              <h1 className="font-serif text-3xl font-black text-white mt-1">{heading}</h1>
              <p className="text-xs text-[#909090] mt-1">
                Browse writing gigs from publishers and clients worldwide.
              </p>
            </div>
            <Link
              href="/wealth/jobs/post"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] px-4 py-2.5 text-xs font-bold text-[#080808]"
            >
              Post a Job
            </Link>
          </div>

          <JobFilters
            value={filters}
            onChange={setFilters}
            onApply={() => {
              const params = new URLSearchParams();
              if (filters.category) params.set("category", filters.category);
              router.replace(`/wealth/jobs${params.toString() ? `?${params}` : ""}`);
              loadJobs(filters);
            }}
          />

          {error ? <p className="text-xs text-red-400 mt-4">{error}</p> : null}

          <div className="mt-6">
            {loading ? (
              <p className="text-xs text-[#909090]">Loading jobs…</p>
            ) : jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#242424] p-10 text-center">
                <p className="text-xs text-[#606060]">
                  No active jobs match your filters. Check back soon or post a job.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function WealthJobsFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#909090] text-xs">
          Loading…
        </div>
      }
    >
      <WealthJobsFeedInner />
    </Suspense>
  );
}
