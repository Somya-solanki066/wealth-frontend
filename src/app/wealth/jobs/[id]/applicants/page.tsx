"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import WealthJobsNav from "@/components/wealth/WealthJobsNav";
import { StatusBadge } from "@/components/wealth/JobCard";
import type { WealthApplication, WealthJob } from "@/lib/wealthJobs";

const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Reviewed", value: "reviewed" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

export default function JobApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [job, setJob] = useState<WealthJob | null>(null);
  const [applications, setApplications] = useState<WealthApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirectTo=${encodeURIComponent(`/wealth/jobs/${id}/applicants`)}`);
    }
  }, [authLoading, user, router, id]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/wealth/jobs/${id}/applications`);
      setJob(res.data.job);
      setApplications(res.data.applications || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const updateStatus = async (appId: string, status: string) => {
    try {
      await api.patch(`/wealth/applications/${appId}`, { status });
      setToast(`Marked as ${status}.`);
      window.setTimeout(() => setToast(""), 1800);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update status.");
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
        <div className="mx-auto max-w-[900px]">
          <WealthJobsNav active="mine" />
          <div className="mb-6">
            <Link href="/wealth/jobs/mine" className="text-[11px] text-[var(--gd)] font-bold">
              ← My Jobs
            </Link>
            <h1 className="font-serif text-3xl font-black text-white mt-2">
              Applications{job ? ` — ${applications.length}` : ""}
            </h1>
            {job ? (
              <p className="text-xs text-[#909090] mt-1">{job.title}</p>
            ) : null}
          </div>

          {error ? <p className="text-xs text-red-400 mb-4">{error}</p> : null}

          {loading ? (
            <p className="text-xs text-[#909090]">Loading applicants…</p>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#242424] p-10 text-center text-xs text-[#606060]">
              No applications yet.
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-base font-bold text-white">
                        {app.applicantName}
                      </h3>
                      {app.applicantEmail ? (
                        <p className="text-[11px] text-[#606060]">{app.applicantEmail}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-[#F0EBE0] leading-relaxed whitespace-pre-wrap">
                    {app.coverMessage}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#909090]">
                    <p>
                      <span className="text-[#606060]">Portfolio:</span>{" "}
                      {app.portfolioUrl ? (
                        <a
                          href={app.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--gd)] hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p>
                      <span className="text-[#606060]">Experience:</span> {app.experience || "—"}
                    </p>
                    <p>
                      <span className="text-[#606060]">Expected rate:</span>{" "}
                      {app.expectedRate || "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-end gap-2 pt-1">
                    <div className="w-44">
                      <Select
                        label="Update status"
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        options={STATUS_OPTIONS}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updateStatus(app.id, "shortlisted")}
                    >
                      Shortlist
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => updateStatus(app.id, "rejected")}
                    >
                      Reject
                    </Button>
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
