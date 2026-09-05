"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import api from "@/services/api";
import Badge from "@/components/ui/Badge";
import TransactionDetailView from "@/components/TransactionDetailView";
import {
  formatTransactionDate,
  formatTransactionMoney,
  transactionDetailPath,
  transactionsListPath,
} from "@/lib/transactionUtils";

type Transaction = {
  id: string;
  type: "course" | "subscription";
  enrollmentId: string | null;
  title: string;
  courseId: string | null;
  amountPaid: number;
  currency: string;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  accessType: "lifetime" | "limited";
  createdAt: string | null;
  paymentProvider: string;
};

export default function TransactionsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const txType = searchParams.get("txType");
  const txId = searchParams.get("txId");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (txType && txId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/user/transactions");
        setTransactions(res.data.transactions || []);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          "Failed to load transactions.";
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [txType, txId]);

  if (txType && txId) {
    return (
      <TransactionDetailView
        type={txType}
        id={txId}
        onBack={() => router.push(transactionsListPath())}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-white">Transactions</h2>
        <p className="text-xs text-[#909090] mt-1">
          All course enrollments and subscription payments — enrollment IDs, amounts, and validity.
        </p>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {loading ? (
        <p className="text-xs text-[#909090]">Loading transactions…</p>
      ) : transactions.length === 0 ? (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center space-y-2">
          <p className="text-sm font-semibold text-white">No transactions yet</p>
          <p className="text-xs text-[#909090]">
            Enroll in a course or upgrade your plan to see payment history here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <button
              key={`${tx.type}-${tx.id}`}
              type="button"
              onClick={() => router.push(transactionDetailPath(tx.type, tx.id))}
              className="w-full text-left block rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3 hover:border-[var(--gm)]/40 hover:bg-[#1a1a1a] transition-all group"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-sm font-bold text-white group-hover:text-[var(--gd)] transition-colors">
                      {tx.title}
                    </h3>
                    <Badge variant={tx.type === "course" ? "gold" : "gray"}>
                      {tx.type === "course" ? "Course" : "Subscription"}
                    </Badge>
                    <Badge variant={tx.status === "paid" ? "green" : "red"}>{tx.status}</Badge>
                  </div>
                  {tx.enrollmentId ? (
                    <p className="text-[11px] text-[#5298E0] font-mono font-bold mt-1">
                      ID: {tx.enrollmentId}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-black text-white">{formatTransactionMoney(tx.amountPaid, tx.currency)}</p>
                  <ChevronRight className="h-4 w-4 text-[#606060] group-hover:text-[var(--gd)] transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
