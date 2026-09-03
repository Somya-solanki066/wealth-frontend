"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import WealthJobsNav from "@/components/wealth/WealthJobsNav";
import { StatusBadge } from "@/components/wealth/JobCard";
import { categoryLabel, formatDeadline, type WealthApplication } from "@/lib/wealthJobs";

export default function MyApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<WealthApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/applications")}`);
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/wealth/applications/mine");
        setApplications(res.data.applications || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load applications.");
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
          <WealthJobsNav active="applications" />
          <h1 className="font-serif text-3xl font-black text-white mb-2">My Applications</h1>
          <p className="text-xs text-[#909090] mb-6">Track the status of jobs you applied to.</p>

          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}

          {loading ? (
            <p className="text-xs text-[#909090]">Loading…</p>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242424] p-10 text-center space-y-3">
              <p className="text-xs text-[#606060]">You haven&apos;t applied to any jobs yet.</p>
              <Link href="/wealth/jobs" className="text-xs font-bold text-[var(--gd)]">
                Browse Jobs →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Link
                  key={app.id}
                  href={`/wealth/jobs/${app.jobId}`}
                  className="block rounded-2xl border border-[#242424] bg-[#161616] p-5 hover:border-[var(--gm)] transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-base font-bold text-white">{app.jobTitle}</h3>
                      <p className="text-[11px] text-[#909090] mt-1">
                        {categoryLabel(app.jobCategory)} · Applied{" "}
                        {formatDeadline(app.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
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
