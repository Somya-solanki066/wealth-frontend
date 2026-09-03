"use client";

import { useState } from "react";
import api from "@/services/api";
import Link from "next/link";

type Props = {
  endpoint: string;
  payload: Record<string, unknown>;
  buttonLabel: string;
  successToast: string;
  onToast: (msg: string) => void;
  onClose: () => void;
  validate?: () => string | null;
};

export default function WealthAiGenerateButton({
  endpoint,
  payload,
  buttonLabel,
  successToast,
  onToast,
  onClose,
  validate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const run = async () => {
    const v = validate?.();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await api.post(endpoint, payload);
      setResult(res.data.content || "");
      onToast(successToast);
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setError("Premium required for WEALTH AI tools.");
      } else {
        setError(err.response?.data?.error || "Generation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      onToast("Copied to clipboard.");
    } catch {
      onToast("Could not copy.");
    }
  };

  return (
    <div className="mt-1">
      {error ? (
        <div className="mb-3 rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
          {error.includes("Premium") ? (
            <Link href="/pricing" className="ml-2 underline text-[var(--gd)]">
              View plans
            </Link>
          ) : null}
        </div>
      ) : null}

      {result ? (
        <div className="mb-3">
          <pre className="max-h-[280px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#242424] bg-[#0f0f0f] p-3 text-xs leading-relaxed text-[#F0EBE0]">
            {result}
          </pre>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex-1 rounded-xl border border-[var(--gm)] bg-[var(--gf)] py-2.5 text-xs font-bold text-[var(--gd)]"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#242424] py-2.5 text-xs font-bold text-[#909090]"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={run}
          className="w-full rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] py-3.5 text-sm font-bold text-[#080808] transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {loading ? "Generating…" : buttonLabel}
        </button>
      )}
    </div>
  );
}
