"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Calendar, Copy, ExternalLink, GraduationCap } from "lucide-react";
import api from "@/services/api";
import Badge from "@/components/ui/Badge";
import { getCourseCatalogEntry } from "@/lib/courseCatalog";
import { formatTransactionDate, transactionDetailPath } from "@/lib/transactionUtils";

type Enrollment = {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseName: string;
  status: string;
  accessType: "lifetime" | "limited";
  validFrom: string | null;
  validUntil: string | null;
  amountPaid: number;
  currency: string;
  createdAt: string | null;
};

function isEnrollmentActive(enrollment: Enrollment) {
  if (enrollment.status !== "paid") return false;
  if (enrollment.accessType === "lifetime" || !enrollment.validUntil) return true;
  const expiry = new Date(enrollment.validUntil);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() > Date.now();
}

export default function CoursesWorkspace() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/courses/my-enrollments");
        const rows: Enrollment[] = (res.data.enrollments || [])
          .filter((e: Enrollment) => e.status === "paid")
          .map((e: Enrollment) => ({
            id: e.id,
            enrollmentId: e.enrollmentId,
            courseId: e.courseId,
            courseName: e.courseName,
            status: e.status,
            accessType: e.accessType || (e.validUntil ? "limited" : "lifetime"),
            validFrom: e.validFrom || e.createdAt || null,
            validUntil: e.validUntil || null,
            amountPaid: e.amountPaid || 0,
            currency: (e.currency || "ngn").toUpperCase(),
            createdAt: e.createdAt || null,
          }));
        setEnrollments(rows);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to load your courses.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyEnrollmentId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-[var(--gd)]" />
            My Courses
          </h2>
          <p className="text-xs text-[#909090] mt-1">
            Courses you have enrolled in — your unique enrollment IDs and access details.
          </p>
        </div>
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 text-zinc-950 font-bold rounded-xl text-xs transition-all"
        >
          <BookOpen className="h-4 w-4" />
          Ink2Wealth Academy
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {loading ? (
        <p className="text-xs text-[#909090]">Loading your courses…</p>
      ) : enrollments.length === 0 ? (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-8 text-center space-y-4">
          <div className="text-4xl">📚</div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">No courses enrolled yet</p>
            <p className="text-xs text-[#909090] max-w-md mx-auto">
              Explore flagship courses by Coach Victor Daniels and enroll to get your unique enrollment ID.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 font-bold rounded-xl text-xs transition-all"
          >
            Browse Ink2Wealth Academy
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {enrollments.map((enrollment) => {
            const catalog = getCourseCatalogEntry(enrollment.courseId);
            const active = isEnrollmentActive(enrollment);

            return (
              <div
                key={enrollment.id}
                className="rounded-2xl border border-[#242424] bg-[#161616] overflow-hidden flex flex-col"
              >
                <div
                  className="h-24 flex items-center justify-center text-4xl border-b border-[#242424]"
                  style={{ background: catalog?.bannerGradient || "#1a1200" }}
                >
                  {catalog?.emoji || "📖"}
                </div>

                <div className="p-5 flex flex-col flex-grow space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-base font-bold text-white">
                        {catalog?.shortName || enrollment.courseName}
                      </h3>
                      <Badge variant={active ? "green" : "gray"}>
                        {active ? "Active" : "Expired"}
                      </Badge>
                    </div>
                    {catalog?.subtitle ? (
                      <p className="text-xs text-[var(--gd)] font-semibold">{catalog.subtitle}</p>
                    ) : null}
                    <p className="text-xs text-[#909090] leading-relaxed">
                      {catalog?.description || enrollment.courseName}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#5298E0]/30 bg-[#5298E0]/5 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5298E0]">
                      Your Enrollment ID
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className="font-mono text-sm font-bold text-white break-all">
                        {enrollment.enrollmentId}
                      </p>
                      <button
                        type="button"
                        onClick={() => copyEnrollmentId(enrollment.enrollmentId)}
                        className="shrink-0 p-1.5 rounded-lg border border-[#242424] hover:border-[#5298E0]/40 text-[#909090] hover:text-white transition-colors"
                        title="Copy enrollment ID"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {copiedId === enrollment.enrollmentId ? (
                      <p className="text-[10px] text-[#52C07A] mt-1">Copied!</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(catalog?.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold px-2 py-1 rounded bg-[#0f0f0f] border border-[#242424] text-[#909090]"
                      >
                        {tag}
                      </span>
                    ))}
                    {catalog?.modulesLabel ? (
                      <span className="text-[9px] font-bold px-2 py-1 rounded bg-[var(--gd)]/10 border border-[var(--gm)]/20 text-[var(--gd)]">
                        {catalog.modulesLabel}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#242424] pt-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#606060] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#606060]">
                          Enrolled on
                        </p>
                        <p className="text-[#F0EBE0] mt-0.5">
                          {formatTransactionDate(enrollment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#606060]">
                        Valid until
                      </p>
                      <p className="text-[#F0EBE0] mt-0.5">
                        {enrollment.accessType === "lifetime"
                          ? "Lifetime"
                          : formatTransactionDate(enrollment.validUntil)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {catalog?.landingPath ? (
                      <Link
                        href={catalog.landingPath}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--gm)]/40 hover:bg-[var(--gd)]/5 text-[var(--gd)] font-bold rounded-xl text-xs transition-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Course
                      </Link>
                    ) : null}
                    <Link
                      href={transactionDetailPath("course", enrollment.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#242424] hover:border-[#242424]/80 text-[#909090] hover:text-white font-bold rounded-xl text-xs transition-all"
                    >
                      Payment Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
