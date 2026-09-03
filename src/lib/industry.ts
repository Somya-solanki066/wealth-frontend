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
