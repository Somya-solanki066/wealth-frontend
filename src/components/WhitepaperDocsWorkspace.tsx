"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Step = "form" | "structure" | "document" | "drafts";
type DocType = "whitepaper" | "user-guide" | "faq";
type MetaOption = { id: string; label: string };

type Draft = {
  id?: string;
  docType: DocType;
  topic: string;
  projectName?: string;
  projectDescription?: string;
  technicalNotes?: string;
  docsUrl?: string;
  references?: string;
  audience: string;
  userLevel?: string;
  faqCount?: number;
  structure: string[];
  title: string;
  body: string;
  wordCount: number;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const DEFAULT_DOC_TYPES: MetaOption[] = [
  { id: "whitepaper", label: "Whitepaper section" },
  { id: "user-guide", label: "User guide" },
  { id: "faq", label: "FAQ" },
];
const DEFAULT_AUDIENCES: MetaOption[] = [
  { id: "general", label: "General users" },
  { id: "web3-beginners", label: "Web3 beginners" },
  { id: "crypto-users", label: "Crypto users" },
  { id: "developers", label: "Developers" },
  { id: "technical", label: "Technical users" },
];
const DEFAULT_LEVELS: MetaOption[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];
const DEFAULT_FAQ_COUNTS: MetaOption[] = [
  { id: "10", label: "10 questions" },
  { id: "15", label: "15 questions" },
  { id: "20", label: "20 questions" },
];

function docTypeLabel(id: string) {
  return DEFAULT_DOC_TYPES.find((d) => d.id === id)?.label || id;
}

export default function WhitepaperDocsWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("form");
  const [docType, setDocType] = useState<DocType>("whitepaper");
  const [topic, setTopic] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [technicalNotes, setTechnicalNotes] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [references, setReferences] = useState("");
  const [audience, setAudience] = useState("web3-beginners");
  const [userLevel, setUserLevel] = useState("beginner");
  const [faqCount, setFaqCount] = useState("10");
  const [structureTitle, setStructureTitle] = useState("");
  const [structure, setStructure] = useState<string[]>([]);
  const [editingStructure, setEditingStructure] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docBody, setDocBody] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [editingDoc, setEditingDoc] = useState(true);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [docTypes, setDocTypes] = useState(DEFAULT_DOC_TYPES);
  const [audiences, setAudiences] = useState(DEFAULT_AUDIENCES);
  const [userLevels, setUserLevels] = useState(DEFAULT_LEVELS);
  const [faqCounts, setFaqCounts] = useState(DEFAULT_FAQ_COUNTS);
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
      const res = await api.get("/writer/web3-docs/drafts");
      setDrafts(res.data.drafts || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/web3-docs/meta").then((res) => {
      if (res.data.docTypes?.length) setDocTypes(res.data.docTypes);
      if (res.data.audiences?.length) setAudiences(res.data.audiences);
      if (res.data.userLevels?.length) setUserLevels(res.data.userLevels);
      if (res.data.faqCounts?.length) setFaqCounts(res.data.faqCounts);
    });
    void loadDrafts();
  }, [loadDrafts]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const payloadBase = () => ({
    docType,
    topic: topic.trim(),
    projectName: projectName.trim() || undefined,
    projectDescription: projectDescription.trim() || undefined,
    technicalNotes: technicalNotes.trim() || undefined,
    docsUrl: docsUrl.trim() || undefined,
    references: references.trim() || undefined,
    audience,
    userLevel: docType === "user-guide" ? userLevel : undefined,
    faqCount: docType === "faq" ? Number(faqCount) : undefined,
  });

  const generateStructure = async () => {
    if (topic.trim().length < 2) {
      setError(
        docType === "user-guide"
          ? "Enter the feature or task for the guide."
          : "Enter a feature or topic."
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-docs/structure", payloadBase());
      const s = res.data.structure;
      setStructureTitle(s.title || topic);
      setStructure(s.structure || []);
      setEditingStructure(true);
      setStep("structure");
      showToast("Structure ready");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Structure failed.");
    } finally {
      setBusy(false);
    }
  };

  const generateDocument = async () => {
    if (structure.length < 3) {
      setError("Add at least 3 structure items.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-docs/document", {
        ...payloadBase(),
        structure,
        title: structureTitle,
      });
      const d = res.data.document;
      setDocTitle(d.title);
      setDocBody(d.body);
      setWordCount(d.wordCount || 0);
      setEditingDoc(true);
      setStep("document");
      showToast("Document drafted");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Document failed.");
    } finally {
      setBusy(false);
    }
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= structure.length) return;
    setStructure((list) => {
      const copy = [...list];
      const tmp = copy[index];
      copy[index] = copy[next];
      copy[next] = tmp;
      return copy;
    });
  };

  const addSection = () => {
    setStructure((list) => [...list, docType === "faq" ? "New question?" : "New section"]);
    setEditingStructure(true);
  };

  const copyDoc = async () => {
    try {
      await navigator.clipboard.writeText(`${docTitle}\n\n${docBody}`);
      showToast("Copied");
    } catch {
      setError("Copy failed.");
    }
  };

  const downloadDoc = () => {
    const blob = new Blob([`${docTitle}\n\n${docBody}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(docTitle || "web3-doc").replace(/[^\w\-]+/g, "_").slice(0, 60)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded");
  };

  const saveDraft = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-docs/drafts", {
        id: draftId,
        ...payloadBase(),
        structure,
        title: docTitle || structureTitle || topic,
        body: docBody,
        wordCount:
          wordCount ||
          docBody
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
    setDocType((d.docType as DocType) || "whitepaper");
    setTopic(d.topic);
    setProjectName(d.projectName || "");
    setProjectDescription(d.projectDescription || "");
    setTechnicalNotes(d.technicalNotes || "");
    setDocsUrl(d.docsUrl || "");
    setReferences(d.references || "");
    setAudience(d.audience || "web3-beginners");
    setUserLevel(d.userLevel || "beginner");
    setFaqCount(String(d.faqCount || 10));
    setStructure(d.structure || []);
    setStructureTitle(d.title);
    setDocTitle(d.title);
    setDocBody(d.body || "");
    setWordCount(d.wordCount || 0);
    setStep(d.body ? "document" : d.structure?.length ? "structure" : "form");
  };

  const removeDraft = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/web3-docs/drafts/${id}`);
      setDrafts((list) => list.filter((d) => d.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const topicPlaceholder =
    docType === "user-guide"
      ? "e.g. How to stake tokens"
      : docType === "faq"
        ? "e.g. Staking Rewards"
        : "e.g. Staking rewards";

  const structureCta =
    docType === "faq"
      ? "Structure FAQ"
      : docType === "user-guide"
        ? "Structure this guide"
        : "Structure this doc";

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "document") {
            setStep("structure");
            return;
          }
          if (step === "structure" || step === "drafts") {
            setStep("form");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "form" ? "Web3 Writing" : "Whitepaper & Docs Assistant"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Whitepaper & Docs Assistant</h2>
            <p className="mt-1 text-sm text-[#909090]">Structure documentation and user guides.</p>
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
          <FolderOpen size={12} /> My Documents
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
              No saved Web3 documents yet.
            </p>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDraft(d)}>
                  <div className="font-medium text-white">{d.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {docTypeLabel(d.docType)} · {d.topic} · {d.wordCount || 0} words
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
          <div>
            <p className={labelClass}>Doc type</p>
            <div className="flex flex-wrap gap-2">
              {docTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={pill(docType === t.id)}
                  onClick={() => setDocType(t.id as DocType)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={labelClass}>
              {docType === "user-guide" ? "Feature" : "Feature or topic"}
            </span>
            <input
              className={inputClass}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={topicPlaceholder}
            />
          </label>

          {docType === "user-guide" && (
            <div>
              <p className={labelClass}>User level</p>
              <div className="flex flex-wrap gap-2">
                {userLevels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={pill(userLevel === l.id)}
                    onClick={() => setUserLevel(l.id)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {docType === "faq" && (
            <div>
              <p className={labelClass}>Number of questions</p>
              <div className="flex flex-wrap gap-2">
                {faqCounts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={pill(faqCount === c.id)}
                    onClick={() => setFaqCount(c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Project context
            </p>
            <p className="text-[11px] text-[#606060]">
              Optional. AI treats this as source of truth and will not invent protocol facts.
            </p>
            <label className="block">
              <span className={labelClass}>Project / protocol name</span>
              <input
                className={inputClass}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Acme Protocol"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Project description</span>
              <textarea
                className={`${inputClass} min-h-[72px]`}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="What the project does"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Official documentation URL</span>
              <input
                className={inputClass}
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                placeholder="https://"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Technical notes</span>
              <textarea
                className={`${inputClass} min-h-[72px]`}
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                placeholder="Lockups, eligibility, reward formula notes…"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Reference material</span>
              <textarea
                className={`${inputClass} min-h-[100px]`}
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder="Paste docs, whitepaper excerpts, or notes"
              />
            </label>
          </div>

          <div>
            <p className={labelClass}>Target audience</p>
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

          <Button className="w-full" onClick={() => void generateStructure()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            {structureCta}
          </Button>
        </div>
      )}

      {step === "structure" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Generated Structure
            </p>
            <p className="mt-2 text-xs text-[#606060]">
              {docTypeLabel(docType)} · {topic}
            </p>
            {editingStructure ? (
              <input
                className={`${inputClass} mt-3`}
                value={structureTitle}
                onChange={(e) => setStructureTitle(e.target.value)}
              />
            ) : (
              <h3 className="mt-2 font-serif text-xl text-white">{structureTitle}</h3>
            )}

            {editingStructure ? (
              <div className="mt-3 space-y-2">
                {structure.map((item, i) => (
                  <div key={`${i}-${item}`} className="flex items-center gap-2">
                    <span className="w-5 shrink-0 text-xs text-[#606060]">{i + 1}.</span>
                    <input
                      className={inputClass}
                      value={item}
                      onChange={(e) =>
                        setStructure((list) => list.map((s, idx) => (idx === i ? e.target.value : s)))
                      }
                    />
                    <button
                      type="button"
                      className="p-1.5 text-[#909090] hover:text-white"
                      onClick={() => moveItem(i, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-[#909090] hover:text-white"
                      onClick={() => moveItem(i, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-[#909090] hover:text-red-300"
                      onClick={() => setStructure((list) => list.filter((_, idx) => idx !== i))}
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#F0EBE0]">
                {structure.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditingStructure((v) => !v)}>
              <Pencil size={14} className="mr-1.5" />
              {editingStructure ? "Done" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={addSection}>
              <Plus size={14} className="mr-1.5" /> Add Section
            </Button>
            <Button
              variant="secondary"
              className="col-span-2"
              onClick={() => void generateStructure()}
              disabled={busy}
            >
              <RefreshCw size={14} className="mr-1.5" /> Regenerate
            </Button>
          </div>
          <Button className="w-full" onClick={() => void generateDocument()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Generate Document
          </Button>
        </div>
      )}

      {step === "document" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            {editingDoc ? (
              <input
                className={`${inputClass} font-serif text-lg`}
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
              />
            ) : (
              <h3 className="font-serif text-2xl font-bold text-white">{docTitle}</h3>
            )}
            <textarea
              className={`${inputClass} mt-3 min-h-[320px] resize-y font-serif text-base leading-relaxed`}
              value={docBody}
              readOnly={!editingDoc}
              onChange={(e) => {
                setDocBody(e.target.value);
                setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
              }}
            />
            <p className="mt-3 text-xs text-[#606060]">Word count: {wordCount.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditingDoc((v) => !v)}>
              <Pencil size={14} className="mr-1.5" />
              {editingDoc ? "Lock edit" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={() => void generateDocument()} disabled={busy}>
              <RefreshCw size={14} className="mr-1.5" /> Regenerate
            </Button>
            <Button variant="secondary" onClick={() => void copyDoc()}>
              <Copy size={14} className="mr-1.5" /> Copy
            </Button>
            <Button variant="secondary" onClick={downloadDoc}>
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
        featureName="Whitepaper & Docs Assistant"
      />
    </div>
  );
}
