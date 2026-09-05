export type TransactionFeature = { name: string; included: boolean };

export type TransactionDetail = {
  id: string;
  type: "course" | "subscription";
  title: string;
  description: string | null;
  enrollmentId: string | null;
  courseId: string | null;
  planId: string | null;
  planName: string | null;
  amountPaid: number;
  amountPaidKobo: number | null;
  currency: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  accessType: "lifetime" | "limited";
  createdAt: string | null;
  confirmedAt: string | null;
  paymentProvider: string;
  stripeSessionId: string | null;
  source: string | null;
  userEmail: string | null;
  subscriptionWorld?: string | null;
  currentSubscriptionExpiry?: string | null;
  isActive: boolean;
  daysRemaining: number | null;
  features: TransactionFeature[];
};

export function formatTransactionDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTransactionDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTransactionMoney(amount: number, currency: string) {
  const sym = currency === "NGN" ? "₦" : "";
  return `${sym}${Number(amount || 0).toLocaleString()}`;
}

export function transactionDetailPath(type: string, id: string) {
  const params = new URLSearchParams({
    tab: "transactions",
    txType: type,
    txId: id,
  });
  return `/dashboard?${params.toString()}`;
}

export function transactionsListPath() {
  return "/dashboard?tab=transactions";
}
