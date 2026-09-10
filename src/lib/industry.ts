export const CALL_TYPES = [
  { value: "script_submission", label: "Script Submission" },
  { value: "short_film", label: "Short Film" },
  { value: "competition", label: "Competition" },
  { value: "commission", label: "Commission" },
  { value: "collaboration", label: "Collaboration" },
] as const;

export const LOCATION_TYPES = [
  { value: "remote", label: "Remote" },
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const INDUSTRY_GENRE_FILTERS = [
  "All genres",
  "Drama",
  "Thriller",
  "Comedy",
  "Romance",
  "Action",
  "Horror",
] as const;

export type OpenCall = {
  id: string;
  posterId: string;
  posterName: string;
  title: string;
  organization: string;
  callType: string;
  genre: string;
  targetMarket: string;
  description: string;
  requirements: string;
  deadline: string | null;
  prize: string;
  fee: string;
  budget?: string;
  location?: string;
  locationType: string;
  status: string;
  rejectReason?: string | null;
  pitchCount: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type IndustryPitch = {
  id: string;
  callId: string;
  callTitle: string;
  callType: string;
  applicantId: string;
  applicantName: string;
  applicantEmail?: string | null;
  pitchMessage: string;
  portfolioUrl: string;
  sampleUrl: string;
  experience: string;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export function callTypeLabel(value: string) {
  return CALL_TYPES.find((c) => c.value === value)?.label || value;
}

export function pitchStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    reviewed: "Reviewed",
    shortlisted: "Shortlisted",
    accepted: "Accepted",
    rejected: "Rejected",
  };
  return map[status] || status;
}

export function callStatusLabel(status: string) {
  const map: Record<string, string> = {
    draft: "Draft",
    pending_review: "Pending Review",
    active: "Active",
    rejected: "Rejected",
    closed: "Closed",
  };
  return map[status] || status;
}

export function formatPostedAt(iso?: string | null) {
  if (!iso) return "Posted recently";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Posted recently";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Posted just now";
  if (mins < 60) return `Posted ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    const d = new Date(t);
    const hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ampm = hh >= 12 ? "pm" : "am";
    const h12 = hh % 12 || 12;
    if (hours <= 12) return `Posted ${h12}:${mm}${ampm}`;
    return `Posted ${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days}d ago`;
  return `Posted ${new Date(t).toLocaleDateString()}`;
}

export function openCallMetaLine(call: OpenCall) {
  const parts = [
    call.organization,
    call.location ||
      (call.locationType === "remote"
        ? "Remote"
        : call.locationType === "hybrid"
          ? "Hybrid"
          : call.locationType === "onsite"
            ? "On-site"
            : ""),
    call.budget || call.prize
      ? `Budget: ${call.budget || call.prize}`
      : "",
  ].filter(Boolean);
  return parts.join(" · ");
}
