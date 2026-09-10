"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calculator, Copy, Loader2, Plus } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Model = "perWord" | "perProject" | "retainer";

type Meta = {
  currency: string;
  perWord: { rate: number; minWords: number; maxWords: number; label: string };
  perProject: Array<{ id: string; name: string; rate: number }>;
  retainer: Array<{ id: string; name: string; quantity: string; monthlyRate: number }>;
};

type Estimate = {
  model: string;
  breakdown: Array<{ label: string; value: string }>;
  estimatedFeeLabel: string;
  note: string;
};

const MODELS: { id: Model; label: string }[] = [
  { id: "perWord", label: "Per word" },
  { id: "perProject", label: "Per project" },
  { id: "retainer", label: "Retainer" },
];

function moneyPreview(currency: string, n: number) {
  return currency === "USD" ? `$${n}` : `${n} ${currency}`;
}

export default function RateCalculatorWorkspace({ onBack }: { onBack?: () => void }) {
  const [model, setModel] = useState<Model>("perWord");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [wordCount, setWordCount] = useState("1500");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [retainerId, setRetainerId] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadMeta = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/writer/rate-calculator/meta");
      const m = res.data.meta as Meta;
      setMeta(m);
      if (m.perProject?.[0]) setProjectTypeId(m.perProject[0].id);
      if (m.retainer?.[0]) setRetainerId(m.retainer[0].id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load platform pricing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const calculate = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/rate-calculator/calculate", {
        model,
        wordCount: model === "perWord" ? Number(wordCount) : undefined,
        projectTypeId: model === "perProject" ? projectTypeId : undefined,
        retainerId: model === "retainer" ? retainerId : undefined,
      });
      setEstimate(res.data.estimate);
    } catch (err: any) {
      setError(err.response?.data?.error || "Calculation failed.");
      setEstimate(null);
    } finally {
      setBusy(false);
    }
  };

  const copyEstimate = async () => {
    if (!estimate) return;
    const text = [
      "RATE ESTIMATE",
      "",
      `Pricing Model: ${estimate.model}`,
      ...estimate.breakdown.map((b) => `${b.label}: ${b.value}`),
      "",
      estimate.note,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setToast("Estimate copied");
      setTimeout(() => setToast(""), 2000);
    } catch {
      setError("Copy failed.");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
  const labelClass = "mb-1.5 block text-xs text-[#909090]";

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        Content & Freelance
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3a2a12] text-[var(--gd)]">
          <Plus size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Rate Calculator</h2>
          <p className="mt-1 text-sm text-[#909090]">Per-word, per-project, retainer pricing</p>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-2 text-sm text-[#52C07A]">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading || !meta ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[var(--gd)]" />
        </div>
      ) : (
        <>
          <div>
            <p className={labelClass}>Pricing model</p>
            <div className="flex flex-wrap gap-2">
              {MODELS.map((m) => {
                const on = model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setModel(m.id);
                      setEstimate(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      on
                        ? "bg-[var(--gd)] text-zinc-950"
                        : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {model === "perWord" && (
            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>Word count</span>
                <input
                  className={inputClass}
                  type="number"
                  min={meta.perWord.minWords}
                  max={meta.perWord.maxWords}
                  value={wordCount}
                  onChange={(e) => {
                    setWordCount(e.target.value);
                    setEstimate(null);
                  }}
                />
              </label>
              <div className="rounded-xl border border-[#242424] bg-[#121212] px-4 py-3 text-sm">
                <span className="text-[#606060]">Current platform rate</span>
                <div className="mt-1 font-bold text-[var(--gd)]">{meta.perWord.label}</div>
                <p className="mt-1 text-[11px] text-[#606060]">
                  Allowed range: {meta.perWord.minWords.toLocaleString()}–
                  {meta.perWord.maxWords.toLocaleString()} words
                </p>
              </div>
            </div>
          )}

          {model === "perProject" && (
            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>Project / Content type</span>
                <select
                  className={inputClass}
                  value={projectTypeId}
                  onChange={(e) => {
                    setProjectTypeId(e.target.value);
                    setEstimate(null);
                  }}
                >
                  {meta.perProject.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {moneyPreview(meta.currency, p.rate)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-[#242424] bg-[#121212] px-4 py-3 text-sm text-[#909090]">
                Rate is set by platform pricing. You cannot override it here.
              </div>
            </div>
          )}

          {model === "retainer" && (
            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>Retainer package</span>
                <select
                  className={inputClass}
                  value={retainerId}
                  onChange={(e) => {
                    setRetainerId(e.target.value);
                    setEstimate(null);
                  }}
                >
                  {meta.retainer.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.quantity} — {moneyPreview(meta.currency, r.monthlyRate)}/mo
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {!estimate ? (
            <Button onClick={() => void calculate()} disabled={busy} className="w-full">
              {busy ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" /> Calculating…
                </>
              ) : (
                <>
                  <Calculator size={14} className="mr-1.5" /> Calculate
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
                  Rate Estimate
                </h3>
                <div className="divide-y divide-[#242424]">
                  <div className="flex justify-between gap-3 py-2.5 text-sm">
                    <span className="text-[#606060]">Pricing Model</span>
                    <span className="text-[#c8c4bc]">{estimate.model}</span>
                  </div>
                  {estimate.breakdown.map((row) => (
                    <div key={row.label} className="flex justify-between gap-3 py-2.5 text-sm">
                      <span className="text-[#606060]">{row.label}</span>
                      <span
                        className={
                          row.label.toLowerCase().includes("fee")
                            ? "font-bold text-white"
                            : "text-[#c8c4bc]"
                        }
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-[#242424] pt-3 text-[11px] text-[#606060]">
                  {estimate.note}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => void copyEstimate()}>
                  <Copy size={14} className="mr-1.5" /> Copy Estimate
                </Button>
                <Button
                  onClick={() => {
                    setEstimate(null);
                  }}
                >
                  Recalculate
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
