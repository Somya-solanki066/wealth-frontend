"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import api from "@/services/api";
import {
  formatTransactionDate,
  formatTransactionDateTime,
  formatTransactionMoney,
  type TransactionDetail,
} from "@/lib/transactionUtils";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#242424] bg-[#0f0f0f] px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#606060]">{label}</p>
      <div className="mt-1 text-sm text-[#F0EBE0]">{value}</div>
    </div>
  );
}

type TransactionDetailViewProps = {
  type: string;
  id: string;
  onBack: () => void;
};

export default function TransactionDetailView({ type, id, onBack }: TransactionDetailViewProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/user/transactions/${type}/${id}`);
        if (!cancelled) setTransaction(res.data.transaction || null);
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            "Failed to load transaction.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, id]);

  const tx = transaction;

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs text-[#909090] hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Transactions
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--gd)]" />
          <p className="text-xs text-[#909090]">Loading transaction details…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center space-y-3">
          <XCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-sm text-red-300">{error}</p>
          <button type="button" onClick={onBack} className="text-xs text-[var(--gd)] hover:underline">
            Return to transactions
          </button>
        </div>
      ) : tx ? (
        <>
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-xl font-bold text-white">{tx.title}</h1>
                  <Badge variant={tx.type === "course" ? "gold" : "gray"}>
                    {tx.type === "course" ? "Course" : "Subscription"}
                  </Badge>
                  <Badge variant={tx.status === "paid" ? "green" : "red"}>{tx.status}</Badge>
                  <Badge variant={tx.isActive ? "green" : "gray"}>
                    {tx.isActive ? "Active" : "Expired"}
                  </Badge>
                </div>
                {tx.description ? (
                  <p className="text-xs text-[#909090] leading-relaxed max-w-xl">{tx.description}</p>
                ) : null}
                {tx.enrollmentId ? (
                  <p className="text-sm text-[#5298E0] font-mono font-bold">
                    Enrollment ID: {tx.enrollmentId}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">
                  {formatTransactionMoney(tx.amountPaid, tx.currency)}
                </p>
                <p className="text-[10px] text-[#606060] uppercase tracking-wider mt-1">Amount paid</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-[#242424] pt-4">
              <div>
                <p className="text-[#606060] uppercase tracking-wider text-[10px] font-bold">Paid on</p>
                <p className="text-[#F0EBE0] mt-0.5">{formatTransactionDate(tx.createdAt)}</p>
              </div>
              <div>
                <p className="text-[#606060] uppercase tracking-wider text-[10px] font-bold">Valid from</p>
                <p className="text-[#F0EBE0] mt-0.5">{formatTransactionDate(tx.validFrom)}</p>
              </div>
              <div>
                <p className="text-[#606060] uppercase tracking-wider text-[10px] font-bold">Valid until</p>
                <p className="text-[#F0EBE0] mt-0.5">
                  {tx.accessType === "lifetime" ? "Lifetime" : formatTransactionDate(tx.validUntil)}
                </p>
              </div>
              <div>
                <p className="text-[#606060] uppercase tracking-wider text-[10px] font-bold">Provider</p>
                <p className="text-[#F0EBE0] mt-0.5 capitalize">{tx.paymentProvider}</p>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-[#242424] bg-[#161616] p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--gd)]" />
              Access & Validity
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow
                label="Access status"
                value={
                  <span className={tx.isActive ? "text-[#52C07A] font-semibold" : "text-[#909090]"}>
                    {tx.isActive ? "Currently active" : "No longer active"}
                  </span>
                }
              />
              <DetailRow
                label="Access type"
                value={tx.accessType === "lifetime" ? "Lifetime access" : "Time-limited access"}
              />
              <DetailRow label="Transaction date" value={formatTransactionDateTime(tx.createdAt)} />
              <DetailRow
                label="Confirmed at"
                value={formatTransactionDateTime(tx.confirmedAt || tx.createdAt)}
              />
              {tx.daysRemaining !== null ? (
                <DetailRow
                  label="Days remaining"
                  value={
                    tx.daysRemaining > 0
                      ? `${tx.daysRemaining} day${tx.daysRemaining === 1 ? "" : "s"}`
                      : "Expired"
                  }
                />
              ) : null}
              {tx.subscriptionWorld ? <DetailRow label="World" value={tx.subscriptionWorld} /> : null}
              {tx.planName ? <DetailRow label="Plan" value={tx.planName} /> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[#242424] bg-[#161616] p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#52C07A]" />
              Features included
            </h2>
            {tx.features.length === 0 ? (
              <p className="text-xs text-[#909090]">No feature list available for this transaction.</p>
            ) : (
              <ul className="space-y-2.5">
                {tx.features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-2.5 text-sm">
                    {feature.included ? (
                      <CheckCircle2 className="h-4 w-4 text-[#52C07A] shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-[#606060] shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? "text-[#F0EBE0]" : "text-[#606060] line-through"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-[#242424] bg-[#161616] p-6 space-y-4">
            <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[var(--gd)]" />
              Payment details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow label="Amount charged" value={formatTransactionMoney(tx.amountPaid, tx.currency)} />
              <DetailRow label="Currency" value={tx.currency} />
              <DetailRow label="Payment status" value={tx.status} />
              <DetailRow label="Payment provider" value={tx.paymentProvider} />
              {tx.userEmail ? <DetailRow label="Billing email" value={tx.userEmail} /> : null}
              {tx.stripeSessionId ? (
                <DetailRow
                  label="Stripe session"
                  value={<span className="font-mono text-xs break-all">{tx.stripeSessionId}</span>}
                />
              ) : null}
              {tx.source ? <DetailRow label="Source" value={tx.source} /> : null}
              {tx.courseId ? <DetailRow label="Course ID" value={tx.courseId} /> : null}
              {tx.planId ? <DetailRow label="Plan ID" value={tx.planId} /> : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
