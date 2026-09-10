"use client";

import { useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  Copy,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

export type WorkingBrief = {
  project: string;
  deliverables: string;
  contentType: string;
  topic: string;
  tone: string;
  seo: string;
  quantity: string;
  budget: string;
  budgetMonthly: string;
  targetAudience: string;
  wordCount: string;
  deadline: string;
  cta: string;
  platform: string;
  keywords: string;
  keyPoints: string[];
  missingInformation: string[];
  status: string;
  plainText: string;
};

const ACTIVE_BRIEF_KEY = "ink2wealth_active_brief";
const SAVED_BRIEFS_KEY = "ink2wealth_saved_briefs";

function val(v: unknown) {
  const s = String(v ?? "").trim();
  return s || "Not specified";
}

function buildPlainText(b: WorkingBrief) {
  if (b.plainText?.trim()) return b.plainText.trim();
  const lines = [
    "WORKING BRIEF",
    "",
    `Project: ${val(b.project)}`,
    "",
    `Deliverables: ${val(b.deliverables)}`,
    `Content Type: ${val(b.contentType)}`,
    `Topic: ${val(b.topic)}`,
    `Tone: ${val(b.tone)}`,
    `SEO: ${val(b.seo)}`,
    `Quantity: ${val(b.quantity)}`,
    "",
    `Budget: ${val(b.budget)}`,
    b.budgetMonthly && b.budgetMonthly !== "Not specified"
      ? `Monthly estimate: ${b.budgetMonthly}`
      : null,
    "",
    `Target Audience: ${val(b.targetAudience)}`,
    `Word Count: ${val(b.wordCount)}`,
    `Deadline: ${val(b.deadline)}`,
    `CTA: ${val(b.cta)}`,
    `Platform: ${val(b.platform)}`,
    `Keywords: ${val(b.keywords)}`,
    "",
    "Key Points:",
    ...(b.keyPoints?.length ? b.keyPoints.map((p) => `• ${p}`) : ["• Not specified"]),
    "",
    "Missing Information:",
    ...(b.missingInformation?.length
      ? b.missingInformation.map((m) => `• ${m}`)
      : ["• None noted"]),
    "",
    `Status: ${val(b.status)}`,
  ];
  return lines.filter((l) => l !== null).join("\n");
}

const FIELDS: { key: keyof WorkingBrief; label: string }[] = [
  { key: "project", label: "Project" },
  { key: "deliverables", label: "Deliverables" },
  { key: "contentType", label: "Content Type" },
  { key: "topic", label: "Topic" },
  { key: "tone", label: "Tone / Style" },
  { key: "seo", label: "SEO / Platform Requirements" },
  { key: "quantity", label: "Quantity" },
  { key: "budget", label: "Budget / Rate" },
  { key: "budgetMonthly", label: "Monthly Estimate" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "wordCount", label: "Word Count" },
  { key: "deadline", label: "Deadline" },
  { key: "cta", label: "CTA" },
  { key: "platform", label: "Publishing Platform" },
  { key: "keywords", label: "Keywords" },
];

export default function BriefBuilderWorkspace({
  onBack,
  onStartWriting,
  onOpenClientHandoff,
}: {
  onBack?: () => void;
  onStartWriting?: () => void;
  onOpenClientHandoff?: () => void;
}) {
  const [step, setStep] = useState<"form" | "result">("form");
  const [clientAsk, setClientAsk] = useState("");
  const [budget, setBudget] = useState("");
  const [brief, setBrief] = useState<WorkingBrief | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const generate = async () => {
    if (clientAsk.trim().length < 10) {
      setError("Paste what the client asked for.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/write-something/brief", {
        clientAsk: clientAsk.trim(),
        budget: budget.trim(),
      });
      const data = res.data.brief as WorkingBrief;
      data.plainText = buildPlainText(data);
      setBrief(data);
      setEditing(false);
      setStep("result");
      showToast("Brief ready");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Could not build brief.");
    } finally {
      setBusy(false);
    }
  };

  const updateField = (key: keyof WorkingBrief, value: string) => {
    if (!brief) return;
    const next = { ...brief, [key]: value };
    next.plainText = buildPlainText(next);
    setBrief(next);
  };

  const copyBrief = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(buildPlainText(brief));
      showToast("Copied");
    } catch {
      setError("Copy failed.");
    }
  };

  const saveBrief = () => {
    if (!brief) return;
    try {
      const prev = JSON.parse(localStorage.getItem(SAVED_BRIEFS_KEY) || "[]");
      prev.unshift({
        id: Date.now(),
        ...brief,
        clientAsk,
        budget,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(SAVED_BRIEFS_KEY, JSON.stringify(prev.slice(0, 30)));
      showToast("Brief saved");
    } catch {
      setError("Could not save brief.");
    }
  };

  const sendToClientHandoff = () => {
    if (!brief) return;
    try {
      sessionStorage.setItem(
        ACTIVE_BRIEF_KEY,
        JSON.stringify({
          content: buildPlainText(brief),
          text: buildPlainText(brief),
          clientName: "",
          projectTitle: brief.topic !== "Not specified" ? brief.topic : "",
          title: brief.topic !== "Not specified" ? brief.topic : "",
        })
      );
      showToast("Opening Client Handoff…");
      onOpenClientHandoff?.();
    } catch {
      setError("Could not hand off brief.");
    }
  };

  const startWriting = () => {
    if (!brief) return;
    const contentType = String(brief.contentType || "").toLowerCase();
    let format: "blog" | "social" | "newsletter" | "memo" | "ugc" = "blog";
    if (contentType.includes("social") || contentType.includes("post")) format = "social";
    else if (contentType.includes("newsletter") || contentType.includes("email")) format = "newsletter";
    else if (contentType.includes("memo")) format = "memo";
    else if (contentType.includes("ugc") || contentType.includes("script")) format = "ugc";

    const payload = {
      format,
      briefFields: {
        topic: brief.topic !== "Not specified" ? brief.topic : "",
        audience: brief.targetAudience !== "Not specified" ? brief.targetAudience : "",
        purpose: brief.deliverables !== "Not specified" ? brief.deliverables : "",
        tone: brief.tone !== "Not specified" ? brief.tone : "",
        keywords: brief.keywords !== "Not specified" ? brief.keywords : "",
        wordCount: brief.wordCount !== "Not specified" ? brief.wordCount : "",
        instructions: [
          brief.seo !== "Not specified" ? `SEO: ${brief.seo}` : "",
          brief.quantity !== "Not specified" ? `Quantity: ${brief.quantity}` : "",
          brief.cta !== "Not specified" ? `CTA: ${brief.cta}` : "",
          `Client ask: ${clientAsk}`,
        ]
          .filter(Boolean)
          .join("\n"),
      },
      workingBrief: brief,
      clientAsk,
      budget,
    };
    sessionStorage.setItem(ACTIVE_BRIEF_KEY, JSON.stringify(payload));
    onStartWriting?.();
  };

  const inputClass =
    "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)] placeholder:text-[#555]";
  const labelClass = "mb-1.5 block text-xs text-[#909090]";

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "result") setStep("form");
          else onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "result" ? "Edit ask" : "Content & Freelance"}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3a2a12] text-[var(--gd)]">
          <AlignLeft size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Brief Builder</h2>
          <p className="mt-1 text-sm text-[#909090]">Turn a client ask into a working brief</p>
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

      {step === "form" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>What did the client ask for?</span>
            <textarea
              className={`${inputClass} min-h-[120px]`}
              rows={5}
              placeholder={`e.g. "We need 4 blog posts a month about skincare, casual tone, SEO-friendly"`}
              value={clientAsk}
              onChange={(e) => setClientAsk(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Budget or rate mentioned</span>
            <input
              className={inputClass}
              placeholder="e.g. $80 per post"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </label>
          <Button onClick={() => void generate()} disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Building brief…
              </>
            ) : (
              "Turn into a brief"
            )}
          </Button>
        </div>
      )}

      {step === "result" && brief && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-xl font-bold text-white">Working Brief</h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                String(brief.status).toLowerCase().includes("ready")
                  ? "bg-[#52C07A]/15 text-[#52C07A]"
                  : "bg-[var(--gd)]/15 text-[var(--gd)]"
              }`}
            >
              {brief.status || "Needs clarification"}
            </span>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] divide-y divide-[#242424]">
            {FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-[#606060]">
                  {label}
                </span>
                {editing ? (
                  <input
                    className={`${inputClass} sm:max-w-[60%]`}
                    value={String(brief[key] ?? "")}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                ) : (
                  <span className="text-sm text-[#c8c4bc] sm:text-right">{val(brief[key])}</span>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--gd)]">
              Missing Information
            </h4>
            {editing ? (
              <textarea
                className={`${inputClass} min-h-[100px]`}
                value={(brief.missingInformation || []).join("\n")}
                onChange={(e) => {
                  const list = e.target.value
                    .split("\n")
                    .map((s) => s.replace(/^[•\-]\s*/, "").trim())
                    .filter(Boolean);
                  const next = { ...brief, missingInformation: list };
                  next.plainText = buildPlainText(next);
                  setBrief(next);
                }}
                placeholder="One question per line"
              />
            ) : (brief.missingInformation || []).length ? (
              <ul className="space-y-1.5 text-sm text-[#c8c4bc]">
                {brief.missingInformation.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#606060]">None noted</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditing((e) => !e)}>
              <Pencil size={14} className="mr-1.5" />
              {editing ? "Done editing" : "Edit Brief"}
            </Button>
            <Button variant="secondary" onClick={() => void generate()} disabled={busy}>
              <RefreshCw size={14} className="mr-1.5" />
              Regenerate
            </Button>
            <Button variant="secondary" onClick={() => void copyBrief()}>
              <Copy size={14} className="mr-1.5" />
              Copy Brief
            </Button>
            <Button variant="secondary" onClick={saveBrief}>
              <Save size={14} className="mr-1.5" />
              Save Brief
            </Button>
          </div>

          <Button onClick={startWriting} className="w-full">
            Start Writing →
          </Button>
          {onOpenClientHandoff && (
            <Button variant="secondary" className="w-full" onClick={sendToClientHandoff}>
              Use in Client Handoff
            </Button>
          )}
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Brief Builder"
      />
    </div>
  );
}

export { ACTIVE_BRIEF_KEY };
