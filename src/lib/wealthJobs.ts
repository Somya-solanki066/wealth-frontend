export const JOB_CATEGORIES = [
  { value: "novel", label: "Novel Writing", icon: "📖" },
  { value: "screenwriting", label: "Screenwriting", icon: "🎬" },
  { value: "ghostwriting", label: "Ghostwriting", icon: "👻" },
  { value: "editing", label: "Editing", icon: "✍️" },
] as const;

export const JOB_TYPES = [
  { value: "freelance", label: "Freelance" },
  { value: "contract", label: "Contract" },
  { value: "part-time", label: "Part-time" },
  { value: "full-time", label: "Full-time" },
  { value: "one-time", label: "One-time project" },
] as const;

export const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const BUDGET_TYPES = [
  { value: "fixed", label: "Fixed" },
  { value: "hourly", label: "Hourly" },
  { value: "negotiable", label: "Negotiable" },
] as const;

export type WealthJob = {
  id: string;
  posterId: string;
  posterName: string;
  title: string;
  category: string;
  description: string;
  budget: number | null;
  budgetDisplay: string;
  budgetType: string;
  deadline: string | null;
  jobType: string;
  locationType: string;
  urgent: boolean;
  status: string;
  rejectReason?: string | null;
  applicationCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type WealthApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCategory: string;
  applicantId: string;
  applicantName: string;
  applicantEmail?: string | null;
  coverMessage: string;
  portfolioUrl?: string;
  experience?: string;
  expectedRate?: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function categoryLabel(value: string) {
  return JOB_CATEGORIES.find((c) => c.value === value)?.label || value;
}

export function locationLabel(value: string) {
  if (value === "remote") return "🌐 Remote";
  if (value === "onsite") return "📍 On-site";
  if (value === "hybrid") return "🔀 Hybrid";
  return value;
}

export function formatDeadline(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function statusColor(status: string) {
  switch (status) {
    case "active":
    case "accepted":
    case "shortlisted":
      return "text-[#52C07A] border-[#52C07A]/30 bg-[#52C07A]/10";
    case "pending":
    case "pending_review":
    case "reviewed":
      return "text-[#E2C06A] border-[#E2C06A]/30 bg-[#E2C06A]/10";
    case "rejected":
    case "closed":
      return "text-[#E05252] border-[#E05252]/30 bg-[#E05252]/10";
    default:
      return "text-[#909090] border-[#242424] bg-[#161616]";
  }
}
