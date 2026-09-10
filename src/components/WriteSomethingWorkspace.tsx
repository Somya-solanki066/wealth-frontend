"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import { ACTIVE_BRIEF_KEY } from "@/components/BriefBuilderWorkspace";

type FormatId = "blog" | "social" | "newsletter" | "memo" | "ugc";
type Step = "format" | "brief" | "structure" | "draft" | "finalize";

type FormatDef = {
  id: FormatId;
  label: string;
  structureTitle: string;
  beats: string[];
  targetLength: string;
  fields: { key: string; label: string; placeholder?: string; type?: "text" | "textarea" | "select"; options?: string[] }[];
};

const FORMATS: FormatDef[] = [
  {
    id: "blog",
    label: "Blog / Article",
    structureTitle: "Blog / Article structure",
    beats: ["Hook opening line", "3–5 subheaded sections", "Actionable close or CTA"],
    targetLength: "800–1,500 words",
    fields: [
      { key: "topic", label: "Topic", placeholder: "What is the article about?" },
      { key: "audience", label: "Audience", placeholder: "Who will read this?" },
      { key: "purpose", label: "Purpose / Goal", placeholder: "Inform, convert, educate…" },
      { key: "keywords", label: "Keywords (optional)", placeholder: "SEO keywords" },
      {
        key: "tone",
        label: "Tone",
        type: "select",
        options: ["Professional", "Conversational", "Authoritative", "Friendly", "Bold"],
      },
      { key: "wordCount", label: "Target word count", placeholder: "e.g. 1200" },
      { key: "instructions", label: "Additional instructions", type: "textarea" },
    ],
  },
  {
    id: "social",
    label: "Social Post",
    structureTitle: "Social Post structure",
    beats: ["Scroll-stopping first line", "One clear idea", "Call to engage (question, poll, or CTA)"],
    targetLength: "50–150 words",
    fields: [
      {
        key: "platform",
        label: "Platform",
        type: "select",
        options: ["Instagram", "LinkedIn", "X / Twitter", "TikTok caption", "Facebook"],
      },
      { key: "topic", label: "Topic", placeholder: "Post topic or angle" },
      { key: "goal", label: "Goal", placeholder: "Engagement, traffic, awareness…" },
      { key: "audience", label: "Audience" },
      {
        key: "tone",
        label: "Tone",
        type: "select",
        options: ["Punchy", "Witty", "Inspirational", "Educational", "Promotional"],
      },
      { key: "cta", label: "CTA", placeholder: "Comment, click, share…" },
      { key: "instructions", label: "Additional instructions", type: "textarea" },
    ],
  },
  {
    id: "newsletter",
    label: "Newsletter / Email",
    structureTitle: "Newsletter / Email structure",
    beats: ["Subject line + preview text", "Personal opening line", "One main story or tip", "Single CTA"],
    targetLength: "300–600 words",
    fields: [
      {
        key: "emailType",
        label: "Email type",
        type: "select",
        options: ["Newsletter", "Welcome", "Promo", "Announcement", "Nurture"],
      },
      { key: "audience", label: "Recipient / Audience" },
      { key: "purpose", label: "Purpose" },
      { key: "mainMessage", label: "Main message", type: "textarea" },
      {
        key: "tone",
        label: "Tone",
        type: "select",
        options: ["Warm", "Professional", "Playful", "Urgent", "Personal"],
      },
      { key: "cta", label: "CTA" },
      { key: "instructions", label: "Additional instructions", type: "textarea" },
    ],
  },
  {
    id: "memo",
    label: "Business Memo",
    structureTitle: "Business Memo structure",
    beats: [
      "Subject & purpose line",
      "Context in 2–3 sentences",
      "Clear ask or decision needed",
      "Next steps with owner + date",
    ],
    targetLength: "150–400 words",
    fields: [
      { key: "company", label: "Company / Client" },
      { key: "purpose", label: "Memo purpose" },
      { key: "audience", label: "Audience" },
      { key: "keyInfo", label: "Key information", type: "textarea" },
      {
        key: "tone",
        label: "Tone",
        type: "select",
        options: ["Formal", "Neutral", "Direct", "Diplomatic"],
      },
      { key: "instructions", label: "Additional instructions", type: "textarea" },
    ],
  },
  {
    id: "ugc",
    label: "UGC Script",
    structureTitle: "UGC Script structure",
    beats: ["Hook in first 3 seconds", "Problem → product moment", "Natural, unscripted-sounding close"],
    targetLength: "15–30 sec spoken",
    fields: [
      { key: "product", label: "Product / Brand" },
      {
        key: "platform",
        label: "Platform",
        type: "select",
        options: ["TikTok", "Instagram Reels", "YouTube Shorts", "Facebook"],
      },
      {
        key: "duration",
        label: "Video duration",
        type: "select",
        options: ["15 sec", "30 sec", "45 sec", "60 sec"],
      },
      { key: "audience", label: "Target audience" },
      {
        key: "style",
        label: "Video style",
        type: "select",
        options: ["Talking head", "Voiceover + B-roll", "Testimonial", "Demo", "Storytime"],
      },
      { key: "sellingPoint", label: "Main selling point" },
      { key: "cta", label: "CTA" },
      { key: "instructions", label: "Additional instructions", type: "textarea" },
    ],
  },
];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function defaultStructureText(fmt: FormatDef) {
  return [fmt.structureTitle, "", ...fmt.beats.map((b, i) => `${i + 1}. ${b}`), "", `Target length: ${fmt.targetLength}`].join(
    "\n"
  );
}

export default function WriteSomethingWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("format");
  const [formatId, setFormatId] = useState<FormatId>("blog");
  const [brief, setBrief] = useState<Record<string, string>>({});
  const [structure, setStructure] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [editTone, setEditTone] = useState("Professional but warm");

  const format = useMemo(() => FORMATS.find((f) => f.id === formatId)!, [formatId]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ACTIVE_BRIEF_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const fmt = (data.format || "blog") as FormatId;
      if (FORMATS.some((f) => f.id === fmt)) {
        setFormatId(fmt);
        const f = FORMATS.find((x) => x.id === fmt)!;
        setStructure(defaultStructureText(f));
      }
      if (data.briefFields && typeof data.briefFields === "object") {
        setBrief(data.briefFields);
        setStep("brief");
      }
      sessionStorage.removeItem(ACTIVE_BRIEF_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const selectFormat = (id: FormatId) => {
    setFormatId(id);
    const f = FORMATS.find((x) => x.id === id)!;
    setStructure(defaultStructureText(f));
    setBrief({});
  };

  const continueFromFormat = () => {
    setStructure(defaultStructureText(format));
    setStep("brief");
  };

  const generateStructure = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/write-something/structure", {
        format: formatId,
        brief,
      });
      setStructure(res.data.content || defaultStructureText(format));
      setStep("structure");
      showToast("Structure generated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        setStructure(defaultStructureText(format));
        setStep("structure");
        return;
      }
      setError(err.response?.data?.error || "Could not generate structure.");
      setStructure(defaultStructureText(format));
      setStep("structure");
    } finally {
      setBusy(false);
    }
  };

  const generateDraft = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/write-something/draft", {
        format: formatId,
        brief,
        structure,
      });
      setDraft(res.data.content || "");
      setStep("draft");
      showToast("Draft ready");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Could not generate draft.");
    } finally {
      setBusy(false);
    }
  };

  const runEdit = async (action: string) => {
    if (!draft.trim()) {
      setError("Write or generate a draft first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/write-something/edit", {
        format: formatId,
        draft,
        action,
        tone: editTone,
      });
      setDraft(res.data.content || draft);
      showToast("Draft updated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Edit failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      showToast("Copied");
    } catch {
      setError("Copy failed.");
    }
  };

  const saveLocal = () => {
    try {
      const key = "ink2wealth_write_something_drafts";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.unshift({
        id: Date.now(),
        format: formatId,
        label: format.label,
        draft,
        structure,
        brief,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
      showToast("Draft saved");
    } catch {
      setError("Could not save draft.");
    }
  };

  const startNew = () => {
    setStep("format");
    setBrief({});
    setStructure(defaultStructureText(format));
    setDraft("");
    setError("");
  };

  const inputClass =
    "w-full rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
  const labelClass = "mb-1.5 block text-xs text-[#909090]";

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "format" && onBack) onBack();
          else if (step === "brief") setStep("format");
          else if (step === "structure") setStep("brief");
          else if (step === "draft") setStep("structure");
          else if (step === "finalize") setStep("draft");
          else onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "format" ? "Content & Freelance" : "Back"}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3a2a12] text-[var(--gd)]">
          <Pencil size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Write Something</h2>
          <p className="mt-1 text-sm text-[#909090]">Pick a format — get a tailored structure.</p>
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

      {/* Progress */}
      <div className="flex gap-1.5">
        {(["format", "brief", "structure", "draft", "finalize"] as Step[]).map((s, i) => {
          const order: Step[] = ["format", "brief", "structure", "draft", "finalize"];
          const activeIdx = order.indexOf(step);
          return (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${i <= activeIdx ? "bg-[var(--gd)]" : "bg-[#2a2a2a]"}`}
            />
          );
        })}
      </div>

      {step === "format" && (
        <div className="space-y-5">
          <p className="text-sm font-medium text-[#c8c4bc]">What are you writing today?</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => {
              const on = formatId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => selectFormat(f.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    on
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] bg-[#161616] text-[#F0EBE0] hover:border-[var(--gd)]/50"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <h3 className="mb-3 text-sm font-bold text-[var(--gd)]">{format.structureTitle}</h3>
            <ul className="divide-y divide-[#242424]">
              {format.beats.map((b) => (
                <li key={b} className="py-2.5 text-sm text-[#c8c4bc]">
                  {b}
                </li>
              ))}
              <li className="flex items-center justify-between gap-3 py-2.5 text-sm text-[#c8c4bc]">
                <span>Target length:</span>
                <span className="rounded-full bg-[#52C07A]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#52C07A]">
                  {format.targetLength}
                </span>
              </li>
            </ul>
          </div>

          <Button onClick={continueFromFormat} className="w-full">
            Continue to brief →
          </Button>
        </div>
      )}

      {step === "brief" && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-white">{format.label} brief</h3>
          {format.fields.map((field) => (
            <label key={field.key} className="block">
              <span className={labelClass}>{field.label}</span>
              {field.type === "textarea" ? (
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder={field.placeholder}
                  value={brief[field.key] || ""}
                  onChange={(e) => setBrief({ ...brief, [field.key]: e.target.value })}
                />
              ) : field.type === "select" ? (
                <select
                  className={inputClass}
                  value={brief[field.key] || field.options?.[0] || ""}
                  onChange={(e) => setBrief({ ...brief, [field.key]: e.target.value })}
                >
                  {(field.options || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  placeholder={field.placeholder}
                  value={brief[field.key] || ""}
                  onChange={(e) => setBrief({ ...brief, [field.key]: e.target.value })}
                />
              )}
            </label>
          ))}
          <Button onClick={() => void generateStructure()} disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-1.5" /> Generate Structure
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStructure(defaultStructureText(format));
              setStep("structure");
            }}
          >
            Use default structure
          </Button>
        </div>
      )}

      {step === "structure" && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-white">Review structure</h3>
          <textarea
            className={`${inputClass} min-h-[200px]`}
            rows={10}
            value={structure}
            onChange={(e) => setStructure(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void generateStructure()} disabled={busy}>
              Regenerate
            </Button>
            <Button onClick={() => void generateDraft()} disabled={busy} className="flex-1">
              {busy ? "Generating draft…" : "Generate Draft →"}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep("draft");
            }}
          >
            Skip — write manually
          </Button>
        </div>
      )}

      {step === "draft" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-serif text-xl font-bold text-white">Draft</h3>
            <span className="text-[10px] text-[#606060]">{format.label}</span>
          </div>
          <textarea
            className={`${inputClass} min-h-[240px]`}
            rows={12}
            placeholder="Start writing..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#606060]">Edit with AI</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["rewrite", "Rewrite"],
                ["expand", "Expand"],
                ["shorten", "Shorten"],
                ["grammar", "Fix Grammar"],
                ["continue", "Continue Writing"],
                ...(formatId === "blog" ? [["seo", "SEO Improve"] as const] : []),
                ...(formatId === "social" ? [["alternatives", "Alt Versions"] as const] : []),
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  disabled={busy}
                  onClick={() => void runEdit(id)}
                  className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc] hover:border-[var(--gd)]/50 disabled:opacity-50"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={editTone}
                onChange={(e) => setEditTone(e.target.value)}
                placeholder="Tone for Change Tone"
              />
              <Button variant="secondary" onClick={() => void runEdit("tone")} disabled={busy}>
                Change Tone
              </Button>
            </div>
          </div>

          <Button onClick={() => setStep("finalize")} className="w-full" disabled={!draft.trim()}>
            Continue to finalize →
          </Button>
          <Button variant="secondary" onClick={saveLocal} className="w-full">
            Save draft
          </Button>
        </div>
      )}

      {step === "finalize" && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-white">Final content</h3>
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#c8c4bc]">{draft}</pre>
          </div>
          <ul className="space-y-1 text-sm text-[#909090]">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-[#52C07A]" /> {format.label}
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-[#52C07A]" /> Ready to copy, save, or download
            </li>
          </ul>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void copyDraft()}>
              <Copy size={14} className="mr-1.5" /> Copy
            </Button>
            <Button variant="secondary" onClick={saveLocal}>
              Save Draft
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadText(
                  `${formatId}_draft.txt`,
                  draft
                )
              }
            >
              <Download size={14} className="mr-1.5" /> Download
            </Button>
            <Button onClick={startNew}>Start New</Button>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStep("draft")}>
            Back to editor
          </Button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Write Something AI"
      />
    </div>
  );
}
