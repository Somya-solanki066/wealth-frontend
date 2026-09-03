"use client";

import Link from "next/link";
import {
  categoryLabel,
  formatDeadline,
  locationLabel,
  statusColor,
  type WealthJob,
} from "@/lib/wealthJobs";

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColor(status)}`}
    >
      {label}
    </span>
  );
}

export function JobCard({
  job,
  href,
  showStatus,
}: {
  job: WealthJob;
  href?: string;
  showStatus?: boolean;
}) {
  const to = href || `/wealth/jobs/${job.id}`;
  return (
    <Link
      href={to}
      className="block rounded-2xl border border-[#242424] bg-[#1c1c1c] p-5 transition-all hover:border-[var(--gm)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 className="font-serif text-base font-bold text-white leading-snug">{job.title}</h3>
        <div className="flex flex-wrap gap-1.5">
          {job.urgent ? (
            <span className="rounded-md border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
              🔴 Urgent
            </span>
          ) : null}
          {showStatus ? <StatusBadge status={job.status} /> : null}
        </div>
      </div>
      <p className="text-[11px] text-[#909090] mb-3 line-clamp-2">{job.description}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#606060]">
        <span className="text-[var(--gd)] font-semibold">
          {job.budgetDisplay || (job.budget != null ? `$${job.budget}` : "Budget TBA")}
        </span>
        <span>Deadline: {formatDeadline(job.deadline)}</span>
        <span>{locationLabel(job.locationType)}</span>
        <span>{categoryLabel(job.category)}</span>
      </div>
      <span className="inline-block mt-4 text-xs font-bold text-[var(--gd)]">View Job →</span>
    </Link>
  );
}
