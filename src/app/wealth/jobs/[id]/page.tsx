"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import ApplyForm from "@/components/wealth/ApplyForm";
import WealthJobsNav from "@/components/wealth/WealthJobsNav";
import { StatusBadge } from "@/components/wealth/JobCard";
import {
  categoryLabel,
  formatDeadline,
  locationLabel,
  type WealthApplication,
  type WealthJob,
} from "@/lib/wealthJobs";

export default function WealthJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<WealthJob | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [myApplication, setMyApplication] = useState<WealthApplication | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/wealth/jobs/${id}`)}`);
    }
  }, [authLoading, user, router, id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/wealth/jobs/${id}`);
      setJob(res.data.job);
      setIsOwner(Boolean(res.data.isOwner));
      setMyApplication(res.data.myApplication || null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load job.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

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
        <div className="mx-auto max-w-[800px]">
          <WealthJobsNav active="browse" />
          {loading ? (
            <p className="text-xs text-[#909090]">Loading job…</p>
          ) : error || !job ? (
            <p className="text-xs text-red-400">{error || "Job not found."}</p>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {job.urgent ? (
                    <span className="rounded-md border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[9px] font-bold uppercase text-red-400">
                      🔴 Urgent
                    </span>
                  ) : null}
                  <StatusBadge status={job.status} />
                </div>
                <h1 className="font-serif text-3xl font-black text-white">{job.title}</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#909090]">
                  <p>
                    <span className="text-[#606060]">Category:</span> {categoryLabel(job.category)}
                  </p>
                  <p>
                    <span className="text-[#606060]">Budget:</span>{" "}
                    <span className="text-[var(--gd)] font-semibold">
                      {job.budgetDisplay || "—"} ({job.budgetType})
                    </span>
                  </p>
                  <p>
                    <span className="text-[#606060]">Deadline:</span> {formatDeadline(job.deadline)}
                  </p>
                  <p>
                    <span className="text-[#606060]">Job Type:</span> {job.jobType}
                  </p>
                  <p>
                    <span className="text-[#606060]">Location:</span> {locationLabel(job.locationType)}
                  </p>
                  <p>
                    <span className="text-[#606060]">Posted by:</span> {job.posterName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gd)] mb-2">
                    Description
                  </p>
                  <p className="text-sm text-[#F0EBE0] leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>

                {isOwner ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href={`/wealth/jobs/${job.id}/applicants`}>
                      <Button type="button" size="sm">
                        View Applicants ({job.applicationCount})
                      </Button>
                    </Link>
                    <Link href="/wealth/jobs/mine">
                      <Button type="button" variant="outline" size="sm">
                        My Jobs
                      </Button>
                    </Link>
                  </div>
                ) : myApplication ? (
                  <div className="rounded-xl border border-[#242424] bg-[#080808] p-4 space-y-2">
                    <p className="text-xs text-[#F0EBE0]">You already applied.</p>
                    <StatusBadge status={myApplication.status} />
                    <Link
                      href="/wealth/applications"
                      className="block text-xs font-bold text-[var(--gd)]"
                    >
                      View My Applications →
                    </Link>
                  </div>
                ) : job.status === "active" ? (
                  showApply ? (
                    <div className="rounded-xl border border-[#242424] bg-[#080808] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gd)] mb-3">
                        Apply for this job
                      </p>
                      <ApplyForm
                        jobId={job.id}
                        onCancel={() => setShowApply(false)}
                        onSuccess={() => {
                          setShowApply(false);
                          setToast("Application submitted successfully.");
                          window.setTimeout(() => setToast(""), 2200);
                          load();
                        }}
                      />
                    </div>
                  ) : (
                    <Button type="button" onClick={() => setShowApply(true)}>
                      Apply for this Job
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
