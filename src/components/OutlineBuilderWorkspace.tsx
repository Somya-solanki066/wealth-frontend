"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  Check,
  Circle,
  FolderOpen,
  GripVertical,
  Loader2,
  Plus,
  Smile,
  Sparkles,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import { PACING_HANDOFF_KEY } from "@/components/PacingGuideWorkspace";

export const OUTLINE_HANDOFF_KEY = "ink2wealth_outline_chapter";

type Mode = "own" | "client";
type Step = "list" | "setup" | "outline" | "saved" | "workspace" | "write";

type Chapter = {
  id: string;
  title: string;
  topic?: string;
  purpose?: string;
  keyPoints?: string[];
  body?: string;
  transcript?: string;
  status?: string;
  wordCount?: number;
  targetWords?: number;
};

type PacingHandoff = {
  totalWords?: number;
  bookType?: string;
  chapters: {
    title: string;
    purpose?: string;
    targetWords?: number;
    keyPoints?: string[];
  }[];
};

type Book = {
  id?: string;
  title: string;
  mode: Mode;
  clientName?: string;
  bookType?: string;
  mainIdea?: string;
  targetAudience?: string;
  chapters: Chapter[];
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const DEFAULT_CHAPTERS: Chapter[] = [
  { id: "c1", title: "Introduction — Why write at all", purpose: "", keyPoints: [], status: "planned" },
  { id: "c2", title: "Chapter 1 — Finding your lane", purpose: "", keyPoints: [], status: "planned" },
  { id: "c3", title: "Chapter 2 — The first draft", purpose: "", keyPoints: [], status: "planned" },
];

function newChapter(title = ""): Chapter {
  return {
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: title || "New chapter",
    purpose: "",
    keyPoints: [],
    body: "",
    status: "planned",
  };
}

function isDone(c: Chapter) {
  return c.status === "approved" || c.status === "review" || (c.body || "").trim().length > 40;
}

export default function OutlineBuilderWorkspace({
  onBack,
  mode = "own",
  onOpenSelfInterview,
}: {
  onBack?: () => void;
  mode?: Mode;
  onOpenSelfInterview?: () => void;
}) {
  const [step, setStep] = useState<Step>("list");
  const [books, setBooks] = useState<Book[]>([]);
  const [book, setBook] = useState<Book | null>(null);
  const [bookTypes, setBookTypes] = useState<{ id: string; label: string }[]>([]);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [writeIndex, setWriteIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    purpose: "",
    keyPoints: "",
    targetWords: "2500",
  });

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const chaptersFromPacing = (data: PacingHandoff): Chapter[] =>
    (data.chapters || []).map((c, i) => {
      const target = Number(c.targetWords) || undefined;
      const points = Array.isArray(c.keyPoints) ? [...c.keyPoints] : [];
      if (target && !points.some((p) => /target:/i.test(p))) {
        points.unshift(`Target: ${target.toLocaleString()} words`);
      }
      return {
        id: `ch_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
        title: c.title || `Chapter ${i + 1}`,
        purpose: c.purpose || "",
        keyPoints: points,
        targetWords: target,
        body: "",
        status: "planned",
      };
    });

  const applyPacingToNewBook = (data: PacingHandoff) => {
    setBook({
      title: "",
      mode,
      bookType: data.bookType || "memoir",
      mainIdea: data.totalWords
        ? `Pacing target: ${data.totalWords.toLocaleString()} words`
        : "",
      targetAudience: "",
      clientName: "",
      chapters: chaptersFromPacing(data),
    });
    setStep("outline");
    setExpanded(0);
    showToast("Loaded from Pacing Guide");
  };

  const loadBooks = useCallback(async () => {
    try {
      const res = await api.get("/writer/self-interview/books", { params: { mode } });
      setBooks(res.data.books || []);
    } catch {
      /* ignore */
    }
  }, [mode]);

  useEffect(() => {
    void loadBooks();
    void api
      .get("/writer/self-interview/meta")
      .then((res) => setBookTypes(res.data.bookTypes || []))
      .catch(() => undefined);
  }, [loadBooks]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PACING_HANDOFF_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PACING_HANDOFF_KEY);
      const data = JSON.parse(raw) as PacingHandoff;
      if (!Array.isArray(data?.chapters) || !data.chapters.length) return;
      applyPacingToNewBook(data);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- consume handoff once on mount
  }, []);

  const startNew = () => {
    setBook({
      title: "",
      mode,
      bookType: "memoir",
      mainIdea: "",
      targetAudience: "",
      clientName: "",
      chapters: DEFAULT_CHAPTERS.map((c) => ({ ...c, id: newChapter(c.title).id })),
    });
    setStep("setup");
    setError("");
  };

  const openBook = (b: Book) => {
    setBook({
      ...b,
      bookType: b.bookType || "other",
      mainIdea: b.mainIdea || "",
      targetAudience: b.targetAudience || "",
      chapters: (b.chapters || []).map((c) => ({
        ...c,
        purpose: c.purpose || "",
        keyPoints: c.keyPoints || [],
        targetWords: c.targetWords,
      })),
    });
    setStep(b.chapters?.length ? "workspace" : "outline");
  };

  const updateChapter = (idx: number, patch: Partial<Chapter>) => {
    setBook((b) => {
      if (!b) return b;
      const chapters = b.chapters.map((c, i) => (i === idx ? { ...c, ...patch } : c));
      return { ...b, chapters };
    });
  };

  const moveChapter = (idx: number, dir: -1 | 1) => {
    setBook((b) => {
      if (!b) return b;
      const j = idx + dir;
      if (j < 0 || j >= b.chapters.length) return b;
      const chapters = [...b.chapters];
      [chapters[idx], chapters[j]] = [chapters[j], chapters[idx]];
      return { ...b, chapters };
    });
  };

  const reorderChapter = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setBook((b) => {
      if (!b) return b;
      if (to >= b.chapters.length) return b;
      const chapters = [...b.chapters];
      const [item] = chapters.splice(from, 1);
      chapters.splice(to, 0, item);
      return { ...b, chapters };
    });
  };

  const addChapterFromForm = () => {
    if (!book) return;
    if (!addForm.title.trim()) {
      setError("Enter a chapter title.");
      return;
    }
    const points = addForm.keyPoints
      .split("\n")
      .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
      .filter(Boolean);
    const target = Number(addForm.targetWords) || undefined;
    const ch = {
      ...newChapter(addForm.title.trim()),
      purpose: addForm.purpose.trim(),
      keyPoints: points,
      targetWords: target,
    };
    setBook({ ...book, chapters: [...book.chapters, ch] });
    setAddForm({ title: "", purpose: "", keyPoints: "", targetWords: "2500" });
    setShowAdd(false);
    setExpanded(book.chapters.length);
    setError("");
  };

  const generateOutline = async () => {
    if (!book) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/self-interview/generate-outline", {
        title: book.title,
        bookType: book.bookType,
        mainIdea: book.mainIdea,
        targetAudience: book.targetAudience,
        chapterCount: 10,
        mode,
        clientName: book.clientName,
      });
      const o = res.data.outline;
      setBook({
        ...book,
        title: o.title || book.title,
        bookType: o.bookType || book.bookType,
        mainIdea: o.mainIdea || book.mainIdea,
        targetAudience: o.targetAudience || book.targetAudience,
        chapters: o.chapters,
      });
      setStep("outline");
      setExpanded(0);
      showToast("Outline generated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Generate failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveOutline = async (next: Step = "workspace") => {
    if (!book) return;
    if (!book.title.trim()) {
      setError("Enter a book title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/self-interview/books", {
        id: book.id,
        mode,
        title: book.title,
        clientName: mode === "client" ? book.clientName : undefined,
        bookType: book.bookType,
        mainIdea: book.mainIdea,
        targetAudience: book.targetAudience,
        chapters: book.chapters.map((c) => ({
          ...c,
          topic: c.topic || c.title,
          transcript: c.transcript || "",
          body: c.body || "",
          status: c.status || "planned",
          targetWords: c.targetWords,
          length: "medium",
          style: "personal",
        })),
      });
      setBook(res.data.book);
      await loadBooks();
      showToast("Outline saved");
      setStep(next === "workspace" ? "saved" : next);
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveDirectDraft = async () => {
    if (!book?.id || !book.chapters[writeIndex]) return;
    const ch = book.chapters[writeIndex];
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/writer/self-interview/books/${book.id}/chapters`, {
        chapterId: ch.id,
        title: ch.title,
        topic: ch.topic || ch.title,
        purpose: ch.purpose,
        keyPoints: ch.keyPoints,
        transcript: ch.transcript || "",
        body: ch.body || "",
        status: (ch.body || "").trim().length > 40 ? "draft" : "planned",
        allowShort: true,
        length: "medium",
        style: "personal",
        targetWords: ch.targetWords,
      });
      setBook(res.data.book);
      await loadBooks();
      showToast("Chapter saved");
      setStep("workspace");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const handoffToSelfInterview = async (idx: number) => {
    if (!book) return;
    setBusy(true);
    setError("");
    try {
      let current = book;
      if (!current.id) {
        const res = await api.post("/writer/self-interview/books", {
          mode,
          title: current.title || "Untitled book",
          clientName: mode === "client" ? current.clientName : undefined,
          bookType: current.bookType,
          mainIdea: current.mainIdea,
          targetAudience: current.targetAudience,
          chapters: current.chapters.map((c) => ({
            ...c,
            topic: c.topic || c.title,
            transcript: c.transcript || "",
            body: c.body || "",
            status: c.status || "planned",
            length: "medium",
            style: "personal",
          })),
        });
        current = res.data.book;
        setBook(current);
      }
      const ch = current.chapters[idx];
      sessionStorage.setItem(
        OUTLINE_HANDOFF_KEY,
        JSON.stringify({
          bookId: current.id,
          chapterId: ch.id,
          chapterTitle: ch.title,
          topic: ch.purpose || ch.title,
          bookTitle: current.title,
          clientName: current.clientName,
          targetWords: ch.targetWords,
          mode,
        })
      );
      onOpenSelfInterview?.();
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not open Interview → Manuscript.");
    } finally {
      setBusy(false);
    }
  };

  const removeBook = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/self-interview/books/${id}`);
      setBooks((list) => list.filter((b) => b.id !== id));
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
          if (step === "write") setStep("workspace");
          else if (step === "saved") setStep("outline");
          else if (step === "workspace" || step === "outline") setStep(book?.id ? "list" : "setup");
          else if (step === "setup") setStep("list");
          else onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "list" ? "Nonfiction & Ghostwriting" : "Outline Builder"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <AlignLeft size={18} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Outline Builder</h2>
            <p className="mt-1 text-sm text-[#909090]">Structure a full-length nonfiction book</p>
          </div>
        </div>
        {step !== "list" && (
          <button
            type="button"
            onClick={() => {
              setStep("list");
              void loadBooks();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
          >
            <FolderOpen size={12} /> My books
          </button>
        )}
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

      {step === "list" && (
        <div className="space-y-3">
          <Button className="w-full" onClick={startNew}>
            <Plus size={14} className="mr-1.5" /> New book outline
          </Button>
          {books.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No books yet. Create an outline to plan chapters.
            </p>
          ) : (
            books.map((b) => (
              <div
                key={b.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openBook(b)}>
                  <div className="font-medium text-white">{b.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {b.chapters?.length || 0} chapters · {b.bookType || "nonfiction"}
                  </div>
                </button>
                <button
                  type="button"
                  className="p-2 text-[#909090] hover:text-red-300"
                  onClick={() => void removeBook(b.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {step === "setup" && book && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Book title</span>
            <input
              className={inputClass}
              value={book.title}
              onChange={(e) => setBook({ ...book, title: e.target.value })}
              placeholder="e.g. Ink to Wealth: A Writer's Guide"
            />
          </label>
          {mode === "client" && (
            <label className="block">
              <span className={labelClass}>Client name</span>
              <input
                className={inputClass}
                value={book.clientName || ""}
                onChange={(e) => setBook({ ...book, clientName: e.target.value })}
              />
            </label>
          )}
          <div>
            <p className={labelClass}>Book type</p>
            <div className="flex flex-wrap gap-2">
              {(bookTypes.length
                ? bookTypes
                : [
                    { id: "memoir", label: "Memoir" },
                    { id: "self-help", label: "Self-help" },
                    { id: "business", label: "Business" },
                    { id: "other", label: "Other Nonfiction" },
                  ]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBook({ ...book, bookType: t.id })}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    book.bookType === t.id
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] text-[#c8c4bc]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className={labelClass}>Book goal / Main idea</span>
            <textarea
              className={`${inputClass} min-h-[88px]`}
              value={book.mainIdea || ""}
              onChange={(e) => setBook({ ...book, mainIdea: e.target.value })}
              placeholder="Lessons from starting and growing a small business"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Target audience</span>
            <input
              className={inputClass}
              value={book.targetAudience || ""}
              onChange={(e) => setBook({ ...book, targetAudience: e.target.value })}
              placeholder="First-time entrepreneurs"
            />
          </label>
          <Button className="w-full" onClick={() => void generateOutline()} disabled={busy}>
            {busy ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Sparkles size={14} className="mr-1.5" />
            )}
            Generate Outline with AI
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStep("outline");
              setExpanded(0);
            }}
          >
            Build outline manually
          </Button>
        </div>
      )}

      {step === "outline" && book && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Book title</span>
            <input
              className={inputClass}
              value={book.title}
              onChange={(e) => setBook({ ...book, title: e.target.value })}
              placeholder="e.g. Ink to Wealth: A Writer's Guide"
            />
          </label>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void generateOutline()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Sparkles size={14} className="mr-1.5" />
            )}
            Generate Outline with AI
          </Button>

          <p className={labelClass}>Chapters · drag to reorder</p>
          <div className="space-y-2">
            {book.chapters.map((c, idx) => {
              const open = expanded === idx;
              return (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIdx != null) reorderChapter(dragIdx, idx);
                    setDragIdx(null);
                  }}
                  onDragEnd={() => setDragIdx(null)}
                  className={`rounded-xl border bg-[#161616] ${
                    dragIdx === idx ? "border-[var(--gd)] opacity-70" : "border-[#242424]"
                  }`}
                >
                  <div className="flex items-start gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      className="mt-1 cursor-grab p-1 text-[#606060] active:cursor-grabbing"
                      aria-label="Drag to reorder"
                      onClick={(e) => e.preventDefault()}
                    >
                      <GripVertical size={16} />
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setExpanded(open ? null : idx)}
                    >
                      <span className="block text-sm text-white">{c.title}</span>
                      {c.purpose ? (
                        <span className="mt-1 block text-[11px] text-[#909090]">
                          Purpose: {c.purpose}
                        </span>
                      ) : null}
                      {c.targetWords ? (
                        <span className="mt-0.5 block text-[11px] text-[var(--gd)]">
                          Target: {c.targetWords.toLocaleString()} words
                        </span>
                      ) : null}
                    </button>
                    <div className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        className="px-1 text-[10px] text-[#606060]"
                        onClick={() => moveChapter(idx, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="px-1 text-[10px] text-[#606060]"
                        onClick={() => moveChapter(idx, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="space-y-2 border-t border-[#242424] px-3 py-3">
                      <label className="block">
                        <span className={labelClass}>Chapter title</span>
                        <input
                          className={inputClass}
                          value={c.title}
                          onChange={(e) => updateChapter(idx, { title: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Chapter purpose</span>
                        <textarea
                          className={`${inputClass} min-h-[64px]`}
                          value={c.purpose || ""}
                          onChange={(e) => updateChapter(idx, { purpose: e.target.value })}
                          placeholder="Help reader identify their niche"
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Key points</span>
                        <textarea
                          className={`${inputClass} min-h-[72px]`}
                          value={(c.keyPoints || []).join("\n")}
                          onChange={(e) =>
                            updateChapter(idx, {
                              keyPoints: e.target.value
                                .split("\n")
                                .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder={"One per line\n• Wrong pricing\n• Poor marketing"}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Target word count</span>
                        <input
                          className={inputClass}
                          type="number"
                          min={500}
                          max={20000}
                          value={c.targetWords || ""}
                          onChange={(e) =>
                            updateChapter(idx, {
                              targetWords: Number(e.target.value) || undefined,
                            })
                          }
                          placeholder="2500"
                        />
                      </label>
                      {book.chapters.length > 1 && (
                        <button
                          type="button"
                          className="text-xs text-red-300"
                          onClick={() =>
                            setBook({
                              ...book,
                              chapters: book.chapters.filter((_, i) => i !== idx),
                            })
                          }
                        >
                          Remove chapter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAdd ? (
            <div className="space-y-3 rounded-xl border border-[#333] bg-[#121212] p-4">
              <p className="text-sm font-medium text-white">Add Chapter</p>
              <label className="block">
                <span className={labelClass}>Chapter title</span>
                <input
                  className={inputClass}
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  placeholder="Chapter 3 — Building the Business"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Chapter purpose</span>
                <textarea
                  className={`${inputClass} min-h-[64px]`}
                  value={addForm.purpose}
                  onChange={(e) => setAddForm({ ...addForm, purpose: e.target.value })}
                  placeholder="What this chapter should accomplish"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Key points</span>
                <textarea
                  className={`${inputClass} min-h-[72px]`}
                  value={addForm.keyPoints}
                  onChange={(e) => setAddForm({ ...addForm, keyPoints: e.target.value })}
                  placeholder="One per line"
                />
              </label>
              <label className="block">
                <span className={labelClass}>Target word count</span>
                <input
                  className={inputClass}
                  type="number"
                  value={addForm.targetWords}
                  onChange={(e) => setAddForm({ ...addForm, targetWords: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addChapterFromForm}>Save Chapter</Button>
                <Button variant="secondary" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setShowAdd(true)}>
              <Plus size={14} className="mr-1.5" /> Add chapter
            </Button>
          )}

          <Button className="w-full" onClick={() => void saveOutline("workspace")} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Save outline
          </Button>
        </div>
      )}

      {step === "saved" && book && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#52C07A]/30 bg-[#52C07A]/10 p-5 text-center">
            <p className="font-serif text-2xl font-bold text-white">Outline Saved ✓</p>
            <p className="mt-2 text-sm text-[#c8c4bc]">Your book outline is ready.</p>
            <p className="mt-1 text-xs text-[#606060]">
              {book.chapters.length} chapters
              {book.chapters.some((c) => c.targetWords)
                ? ` · ${book.chapters
                    .reduce((s, c) => s + (c.targetWords || 0), 0)
                    .toLocaleString()} target words`
                : ""}
            </p>
          </div>
          <Button className="w-full" onClick={() => setStep("workspace")}>
            Open Book Workspace
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setStep("outline")}>
            Keep editing outline
          </Button>
        </div>
      )}

      {step === "workspace" && book && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              My Book
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-white">{book.title}</h3>
            <p className="mt-1 text-xs text-[#606060]">
              Progress: {book.chapters.filter(isDone).length} / {book.chapters.length} chapters
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
            <div
              className="h-full rounded-full bg-[var(--gd)] transition-all"
              style={{
                width: `${
                  book.chapters.length
                    ? Math.round(
                        (book.chapters.filter(isDone).length / book.chapters.length) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="space-y-2 rounded-xl border border-[#242424] bg-[#121212] p-3">
            {book.chapters.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setWriteIndex(idx);
                  setStep("write");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#1a1a1a]"
              >
                {isDone(c) ? (
                  <Check size={16} className="shrink-0 text-[#52C07A]" />
                ) : (
                  <Circle size={16} className="shrink-0 text-[#606060]" />
                )}
                <span className="min-w-0 flex-1 text-sm text-[#F0EBE0]">{c.title}</span>
                {c.targetWords ? (
                  <span className="shrink-0 text-[11px] text-[var(--gd)]">
                    {c.targetWords.toLocaleString()} w
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setStep("outline")}>
            Edit outline
          </Button>
        </div>
      )}

      {step === "write" && book && book.chapters[writeIndex] && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--gm)]/30 bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Chapter {writeIndex + 1}
            </p>
            <h3 className="mt-1 font-serif text-xl text-white">{book.chapters[writeIndex].title}</h3>
            {book.chapters[writeIndex].purpose && (
              <p className="mt-2 text-xs text-[#909090]">
                <span className="text-[#606060]">Purpose: </span>
                {book.chapters[writeIndex].purpose}
              </p>
            )}
            {book.chapters[writeIndex].targetWords ? (
              <p className="mt-2 text-xs font-semibold text-[var(--gd)]">
                Target: {book.chapters[writeIndex].targetWords!.toLocaleString()} words
              </p>
            ) : null}
            {(book.chapters[writeIndex].keyPoints || []).length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-[#606060]">
                {book.chapters[writeIndex].keyPoints!.map((k) => (
                  <li key={k}>• {k}</li>
                ))}
              </ul>
            )}
          </div>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => void handoffToSelfInterview(writeIndex)}
          >
            <Smile size={14} className="mr-1.5" /> Interview → Manuscript
          </Button>
          <label className="block">
            <span className={labelClass}>Start Writing</span>
            <textarea
              className={`${inputClass} min-h-[240px] resize-y font-serif text-base leading-relaxed`}
              value={book.chapters[writeIndex].body || ""}
              onChange={(e) => updateChapter(writeIndex, { body: e.target.value })}
              placeholder="Write this chapter..."
            />
          </label>
          <Button className="w-full" onClick={() => void saveDirectDraft()} disabled={busy || !book.id}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Save Chapter
          </Button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Outline Builder"
      />
    </div>
  );
}
