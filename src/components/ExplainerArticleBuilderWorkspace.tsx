"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  FolderOpen,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Smile,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Step = "form" | "outline" | "article" | "drafts";

type MetaOption = { id: string; label: string };

type Draft = {
  id?: string;
  topic: string;
  audience: string;
  goal: string;
  tone: string;
  length: string;
  references?: string;
  outline: string[];
  title: string;
  body: string;
  wordCount: number;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const DEFAULT_AUDIENCES: MetaOption[] = [
  { id: "beginners", label: "Total Beginners" },
  { id: "web3-beginners", label: "Web3 Beginners" },
  { id: "intermediate", label: "Intermediate" },
  { id: "developers", label: "Developers" },
  { id: "investors", label: "Investors / Founders" },
  { id: "general-tech", label: "General Tech Audience" },
];
const DEFAULT_GOALS: MetaOption[] = [
  { id: "educational", label: "Educational Explainer" },
  { id: "project-overview", label: "Project Overview" },
  { id: "docs", label: "Product Documentation" },
  { id: "blog", label: "Blog Article" },
  { id: "marketing", label: "Marketing / Landing Page" },
];
const DEFAULT_TONES: MetaOption[] = [
  { id: "simple", label: "Simple & Educational" },
  { id: "professional", label: "Professional" },
  { id: "conversational", label: "Conversational" },
  { id: "technical", label: "Technical" },
  { id: "persuasive", label: "Persuasive" },
];
const DEFAULT_LENGTHS: MetaOption[] = [
  { id: "short", label: "Short — 500–800 words" },
  { id: "standard", label: "Standard — 1,000–1,500 words" },
  { id: "long", label: "Long — 2,000–3,000 words" },
];

export default function ExplainerArticleBuilderWorkspace({
  onBack,
}: {
  onBack?: () => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("beginners");
  const [goal, setGoal] = useState("educational");
  const [tone, setTone] = useState("simple");
  const [length, setLength] = useState("standard");
  const [references, setReferences] = useState("");
  const [outlineTitle, setOutlineTitle] = useState("");
  const [outline, setOutline] = useState<string[]>([]);
  const [editingOutline, setEditingOutline] = useState(false);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [editingArticle, setEditingArticle] = useState(true);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [audiences, setAudiences] = useState(DEFAULT_AUDIENCES);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [tones, setTones] = useState(DEFAULT_TONES);
  const [lengths, setLengths] = useState(DEFAULT_LENGTHS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadDrafts = useCallback(async () => {
    try {
      const res = await api.get("/writer/web3-explainer/drafts");
      setDrafts(res.data.drafts || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/web3-explainer/meta").then((res) => {
      if (res.data.audiences?.length) setAudiences(res.data.audiences);
      if (res.data.goals?.length) setGoals(res.data.goals);
      if (res.data.tones?.length) setTones(res.data.tones);
      if (res.data.lengths?.length) setLengths(res.data.lengths);
    });
    void loadDrafts();
  }, [loadDrafts]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const generateOutline = async () => {
    if (topic.trim().length < 2) {
      setError("Enter a technical concept to explain.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-explainer/outline", {
        topic: topic.trim(),
        audience,
        goal,
        tone,
        length,
        references: references.trim() || undefined,
      });
      const o = res.data.outline;
      setOutlineTitle(o.title || topic);
      setOutline(o.outline || []);
      setEditingOutline(true);
      setStep("outline");
      showToast("Outline ready");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Outline failed.");
    } finally {
      setBusy(false);
    }
  };

  const generateArticle = async () => {
    if (outline.length < 3) {
      setError("Add at least 3 outline sections.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-explainer/article", {
        topic: topic.trim(),
        audience,
        goal,
        tone,
        length,
        references: references.trim() || undefined,
        outline,
        title: outlineTitle,
      });
      const a = res.data.article;
      setArticleTitle(a.title);
      setArticleBody(a.body);
      setWordCount(a.wordCount || 0);
      setEditingArticle(true);
      setStep("article");
      showToast("Article drafted");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Article failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyArticle = async () => {
    try {
      await navigator.clipboard.writeText(`${articleTitle}\n\n${articleBody}`);
      showToast("Copied");
    } catch {
      setError("Copy failed.");
    }
  };

  const downloadArticle = () => {
    const blob = new Blob([`${articleTitle}\n\n${articleBody}`], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(articleTitle || "web3-explainer").replace(/[^\w\-]+/g, "_").slice(0, 60)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded");
  };

  const saveDraft = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-explainer/drafts", {
        id: draftId,
        topic,
        audience,
        goal,
        tone,
        length,
        references,
        outline,
        title: articleTitle || outlineTitle || topic,
        body: articleBody,
        wordCount:
          wordCount ||
          articleBody
            .trim()
            .split(/\s+/)
            .filter(Boolean).length,
      });
      setDraftId(res.data.draft.id);
      await loadDrafts();
      showToast("Draft saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const openDraft = (d: Draft) => {
    setDraftId(d.id);
    setTopic(d.topic);
    setAudience(d.audience);
    setGoal(d.goal);
    setTone(d.tone);
    setLength(d.length);
    setReferences(d.references || "");
    setOutline(d.outline || []);
    setOutlineTitle(d.title);
    setArticleTitle(d.title);
    setArticleBody(d.body || "");
    setWordCount(d.wordCount || 0);
    setStep(d.body ? "article" : d.outline?.length ? "outline" : "form");
  };

  const removeDraft = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/web3-explainer/drafts/${id}`);
      setDrafts((list) => list.filter((d) => d.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "article") {
            setStep("outline");
            return;
          }
          if (step === "outline" || step === "drafts") {
            setStep("form");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "form" ? "Web3 Writing" : "Explainer Article Builder"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <Smile size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Explainer Article Builder</h2>
            <p className="mt-1 text-sm text-[#909090]">
              Turn a technical concept into a plain-English post
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("drafts");
            void loadDrafts();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
        >
          <FolderOpen size={12} /> Saved drafts
        </button>
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

      {step === "drafts" && (
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No saved explainers yet.
            </p>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openDraft(d)}
                >
                  <div className="font-medium text-white">{d.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {d.topic} · {d.wordCount || 0} words
                  </div>
                </button>
                <button
                  type="button"
                  className="p-2 text-[#909090] hover:text-red-300"
                  onClick={() => void removeDraft(d.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {step === "form" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>What do you want to explain?</span>
            <input
              className={inputClass}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Zero-knowledge proofs"
            />
          </label>

          <div>
            <p className={labelClass}>Audience</p>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={pill(audience === a.id)}
                  onClick={() => setAudience(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>What are you creating?</p>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={pill(goal === g.id)}
                  onClick={() => setGoal(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>Writing tone</p>
            <div className="flex flex-wrap gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={pill(tone === t.id)}
                  onClick={() => setTone(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>Length</p>
            <div className="flex flex-wrap gap-2">
              {lengths.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={pill(length === l.id)}
                  onClick={() => setLength(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={labelClass}>Reference material (optional)</span>
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="Paste project docs, whitepaper excerpt, or notes. AI will treat this as source of truth and will not invent tokenomics/fees/roadmap claims."
            />
          </label>

          <Button className="w-full" onClick={() => void generateOutline()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Draft explainer outline
          </Button>
        </div>
      )}

      {step === "outline" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Explainer Outline
            </p>
            <p className="mt-2 text-xs text-[#606060]">Topic: {topic}</p>
            {editingOutline ? (
              <input
                className={`${inputClass} mt-3`}
                value={outlineTitle}
                onChange={(e) => setOutlineTitle(e.target.value)}
              />
            ) : (
              <h3 className="mt-2 font-serif text-xl text-white">{outlineTitle}</h3>
            )}
            {editingOutline ? (
              <textarea
                className={`${inputClass} mt-3 min-h-[220px]`}
                value={outline.map((s, i) => `${i + 1}. ${s}`).join("\n")}
                onChange={(e) =>
                  setOutline(
                    e.target.value
                      .split("\n")
                      .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
                      .filter(Boolean)
                  )
                }
              />
            ) : (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#F0EBE0]">
                {outline.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditingOutline((v) => !v)}>
              <Pencil size={14} className="mr-1.5" />
              {editingOutline ? "Done" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={() => void generateOutline()} disabled={busy}>
              <RefreshCw size={14} className="mr-1.5" /> Regenerate Outline
            </Button>
          </div>
          <Button className="w-full" onClick={() => void generateArticle()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Generate Full Article
          </Button>
        </div>
      )}

      {step === "article" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            {editingArticle ? (
              <input
                className={`${inputClass} font-serif text-lg`}
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
              />
            ) : (
              <h3 className="font-serif text-2xl font-bold text-white">{articleTitle}</h3>
            )}
            <textarea
              className={`${inputClass} mt-3 min-h-[320px] resize-y font-serif text-base leading-relaxed`}
              value={articleBody}
              readOnly={!editingArticle}
              onChange={(e) => {
                setArticleBody(e.target.value);
                setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
              }}
            />
            <p className="mt-3 text-xs text-[#606060]">
              Word count: {wordCount.toLocaleString()}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditingArticle((v) => !v)}>
              <Pencil size={14} className="mr-1.5" />
              {editingArticle ? "Lock edit" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={() => void generateArticle()} disabled={busy}>
              <RefreshCw size={14} className="mr-1.5" /> Regenerate
            </Button>
            <Button variant="secondary" onClick={() => void copyArticle()}>
              <Copy size={14} className="mr-1.5" /> Copy
            </Button>
            <Button variant="secondary" onClick={downloadArticle}>
              <Download size={14} className="mr-1.5" /> Download
            </Button>
          </div>
          <Button className="w-full" onClick={() => void saveDraft()} disabled={busy}>
            {busy ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Save size={14} className="mr-1.5" />
            )}
            Save Draft
          </Button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Explainer Article Builder"
      />
    </div>
  );
}
