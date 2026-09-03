"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import WealthJobsNav from "@/components/wealth/WealthJobsNav";
import { StatusBadge } from "@/components/wealth/JobCard";
import {
  categoryLabel,
  formatDeadline,
  type WealthJob,
} from "@/lib/wealthJobs";

export default function MyJobsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<WealthJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent("/wealth/jobs/mine")}`);
    }
  }, [authLoading, user, router]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/wealth/jobs/mine");
      setJobs(res.data.jobs || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load your jobs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const closeJob = async (id: string) => {
    if (!confirm("Close this job? It will no longer accept applications.")) return;
    try {
      await api.post(`/wealth/jobs/${id}/close`);
      setToast("Job closed.");
      window.setTimeout(() => setToast(""), 2000);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to close job.");
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
      {toast ? (
        <div className="fixed bottom-8 left-1/2 z-[999] -translate-x-1/2 rounded-[14px] border border-[var(--gm)] bg-[#1a1200] px-6 py-3 text-[13px] font-semibold text-[var(--gd)]">
          {toast}
        </div>
      ) : null}
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[1000px]">
          <WealthJobsNav active="mine" />
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="font-serif text-3xl font-black text-white">My Job Listings</h1>
              <p className="text-xs text-[#909090] mt-1">Manage your posts and applicants.</p>
            </div>
            <Link href="/wealth/jobs/post">
              <Button type="button" size="sm">
                Post a Job
              </Button>
            </Link>
          </div>

          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}

          {loading ? (
            <p className="text-xs text-[#909090]">Loading…</p>
          ) : jobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242424] p-10 text-center text-xs text-[#606060]">
              You haven&apos;t posted any jobs yet.
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-[#242424] bg-[#161616] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-serif text-base font-bold text-white">{job.title}</h3>
                      <StatusBadge status={job.status} />
                      {job.urgent ? (
                        <span className="text-[9px] font-bold uppercase text-red-400">Urgent</span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#909090]">
                      {categoryLabel(job.category)} · Deadline {formatDeadline(job.deadline)} ·{" "}
                      Applications: {job.applicationCount}
                    </p>
                    {job.status === "rejected" && job.rejectReason ? (
                      <p className="text-[11px] text-red-400 mt-1">Rejected: {job.rejectReason}</p>
                    ) : null}
                    {job.status === "pending_review" ? (
                      <p className="text-[11px] text-[#E2C06A] mt-1">Waiting for admin approval.</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Link href={`/wealth/jobs/${job.id}`}>
                      <Button type="button" variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    {(job.status === "active" || job.status === "closed") && (
                      <Link href={`/wealth/jobs/${job.id}/applicants`}>
                        <Button type="button" size="sm">
                          View Applicants
                        </Button>
                      </Link>
                    )}
                    {job.status === "active" ? (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => closeJob(job.id)}
                      >
                        Close
                      </Button>
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
