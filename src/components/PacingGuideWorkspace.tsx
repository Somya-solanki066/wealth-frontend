"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  FolderOpen,
  Loader2,
  Minus,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

export const PACING_HANDOFF_KEY = "ink2wealth_pacing_plan";

type Chapter = {
  index: number;
  title: string;
  purpose: string;
  targetWords: number;
};

type Plan = {
  id?: string;
  bookId?: string | null;
  bookTitle?: string;
  goalWords?: number;
  totalWords: number;
  chapterCount: number;
  averageWords: number;
  bookType: string;
  pacingStyle: string;
  chapters: Chapter[];
  createdAt?: string;
};

type BookOption = {
  id: string;
  title: string;
  clientName?: string;
  mode?: string;
  bookType?: string;
  chapters?: Array<{
    id: string;
    title: string;
    purpose?: string;
    targetWords?: number;
    wordCount?: number;
  }>;
};

type Step = "calc" | "plan" | "saved";

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

export default function PacingGuideWorkspace({
  onBack,
  onOpenOutlineBuilder,
}: {
  onBack?: () => void;
  onOpenOutlineBuilder?: () => void;
}) {
  const [step, setStep] = useState<Step>("calc");
  const [totalWords, setTotalWords] = useState(45000);
  const [bookType, setBookType] = useState("memoir");
  const [pacingStyle, setPacingStyle] = useState("narrative");
  const [useCustomChapters, setUseCustomChapters] = useState(false);
  const [customChapters, setCustomChapters] = useState(16);
  const [suggested, setSuggested] = useState(16);
  const [average, setAverage] = useState(2813);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [savedPlans, setSavedPlans] = useState<Plan[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [bookId, setBookId] = useState("");
  const [newBookTitle, setNewBookTitle] = useState("");
  const [bookTypes, setBookTypes] = useState<{ id: string; label: string }[]>([]);
  const [styles, setStyles] = useState<{ id: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === bookId) || null,
    [books, bookId]
  );

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const chapterCount = useCustomChapters ? customChapters : suggested;
  const planOutOfSync =
    !!plan &&
    ((plan.goalWords || plan.totalWords) !== totalWords ||
      plan.chapterCount !== chapterCount ||
      plan.bookType !== bookType ||
      plan.pacingStyle !== pacingStyle);

  const recalculate = useCallback(async () => {
    try {
      const res = await api.post("/writer/pacing-guide/calculate", {
        totalWords,
        bookType,
        chapterCount: useCustomChapters ? customChapters : undefined,
      });
      const m = res.data.meta;
      setSuggested(m.suggestedChapters);
      setAverage(m.averageWords);
      if (!useCustomChapters) setCustomChapters(m.suggestedChapters);
    } catch {
      const avgTarget = bookType === "memoir" ? 2600 : 2700;
      const s = Math.min(24, Math.max(8, Math.round(totalWords / avgTarget)));
      const count = useCustomChapters ? customChapters : s;
      setSuggested(s);
      setAverage(Math.round(totalWords / count));
    }
  }, [totalWords, bookType, useCustomChapters, customChapters]);

  useEffect(() => {
    void api.get("/writer/pacing-guide/meta").then((res) => {
      setBookTypes(res.data.bookTypes || []);
      setStyles(res.data.pacingStyles || []);
    });
    void api.get("/writer/pacing-guide/plans").then((res) => {
      setSavedPlans(res.data.plans || []);
    });
    void api.get("/writer/self-interview/books").then((res) => {
      setBooks(res.data.books || []);
    });
  }, []);

  useEffect(() => {
    void recalculate();
  }, [recalculate]);

  // Prefill from selected book outline chapter count / type
  useEffect(() => {
    if (!selectedBook) return;
    if (selectedBook.bookType) setBookType(selectedBook.bookType);
    const n = selectedBook.chapters?.length || 0;
    if (n >= 5) {
      setUseCustomChapters(true);
      setCustomChapters(n);
    }
  }, [selectedBook]);

  const pct = useMemo(() => ((totalWords - 20000) / (100000 - 20000)) * 100, [totalWords]);

  const generate = async (force = false) => {
    if (plan && planOutOfSync && !force) {
      setConfirmRegen(true);
      return;
    }
    setBusy(true);
    setError("");
    setConfirmRegen(false);
    try {
      const chs = selectedBook?.chapters || [];
      const useBookChapters = chs.length > 0 && useCustomChapters && customChapters === chs.length;
      const res = await api.post("/writer/pacing-guide/generate", {
        totalWords,
        bookType,
        chapterCount,
        pacingStyle,
        bookId: bookId || undefined,
        bookTitle: selectedBook?.title || newBookTitle || undefined,
        chapterTitles: useBookChapters ? chs.map((c) => c.title) : undefined,
        chapterPurposes: useBookChapters
          ? chs.map((c) => c.purpose || "")
          : undefined,
      });
      const next: Plan = {
        ...res.data.plan,
        goalWords: totalWords,
        bookId: bookId || null,
        bookTitle: selectedBook?.title || newBookTitle || res.data.plan.bookTitle,
      };
      setPlan(next);
      setStep("plan");
      showToast(force ? "Pacing plan updated" : "Pacing plan ready");
    } catch (err: any) {
      setError(err.response?.data?.error || "Generate failed.");
    } finally {
      setBusy(false);
    }
  };

  const updateChapterTarget = (index: number, value: number) => {
    if (!plan) return;
    const words = Math.max(200, Math.round(value) || 0);
    const chapters = plan.chapters.map((c) =>
      c.index === index ? { ...c, targetWords: words } : c
    );
    const planned = chapters.reduce((s, c) => s + c.targetWords, 0);
    setPlan({
      ...plan,
      chapters,
      totalWords: planned,
      averageWords: Math.round(planned / Math.max(chapters.length, 1)),
      chapterCount: chapters.length,
    });
  };

  const updateChapterTitle = (index: number, title: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      chapters: plan.chapters.map((c) => (c.index === index ? { ...c, title } : c)),
    });
  };

  const goalWords = plan?.goalWords || totalWords;
  const planTotal = plan?.chapters.reduce((s, c) => s + c.targetWords, 0) || 0;
  const delta = planTotal - goalWords;

  const savePlan = async () => {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      const payload = {
        ...plan,
        goalWords,
        totalWords: planTotal,
        averageWords: Math.round(planTotal / Math.max(plan.chapters.length, 1)),
        chapterCount: plan.chapters.length,
        bookId: bookId || plan.bookId || null,
        bookTitle: selectedBook?.title || newBookTitle || plan.bookTitle || "",
      };
      const res = await api.post("/writer/pacing-guide/plans", { plan: payload });
      setPlan(res.data.plan);
      setSavedPlans((list) => {
        const rest = list.filter((p) => p.id !== res.data.plan.id);
        return [res.data.plan, ...rest];
      });
      setStep("saved");
      showToast("Pacing plan saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const syncToOutlineBook = async () => {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      let targetBookId = bookId || plan.bookId || "";
      if (targetBookId) {
        const existing = await api.get(`/writer/self-interview/books/${targetBookId}`);
        const book = existing.data.book;
        const chapters = (book.chapters || []).map((c: any, i: number) => {
          const p = plan.chapters[i];
          if (!p) return c;
          const points = Array.isArray(c.keyPoints) ? [...c.keyPoints] : [];
          const filtered = points.filter((x: string) => !/^Target:/i.test(x));
          filtered.unshift(`Target: ${p.targetWords.toLocaleString()} words`);
          return {
            ...c,
            title: p.title || c.title,
            purpose: p.purpose || c.purpose,
            targetWords: p.targetWords,
            keyPoints: filtered,
          };
        });
        // If pacing has more chapters than outline, append
        if (plan.chapters.length > chapters.length) {
          for (let i = chapters.length; i < plan.chapters.length; i++) {
            const p = plan.chapters[i];
            chapters.push({
              id: `ch_${Date.now()}_${i}`,
              title: p.title,
              topic: p.title,
              purpose: p.purpose,
              keyPoints: [`Target: ${p.targetWords.toLocaleString()} words`],
              targetWords: p.targetWords,
              transcript: "",
              body: "",
              status: "planned",
              length: "medium",
              style: "personal",
            });
          }
        }
        await api.post("/writer/self-interview/books", {
          id: targetBookId,
          mode: book.mode || "own",
          title: book.title,
          clientName: book.clientName,
          bookType: book.bookType || bookType,
          mainIdea: book.mainIdea,
          targetAudience: book.targetAudience,
          chapters,
        });
        showToast("Outline word targets updated");
      }

      sessionStorage.setItem(
        PACING_HANDOFF_KEY,
        JSON.stringify({
          totalWords: goalWords,
          bookType: plan.bookType,
          bookId: targetBookId || undefined,
          bookTitle: selectedBook?.title || plan.bookTitle,
          chapters: plan.chapters.map((c) => ({
            title: c.title,
            purpose: c.purpose,
            targetWords: c.targetWords,
            keyPoints: [`Target: ${c.targetWords.toLocaleString()} words`],
          })),
        })
      );
      onOpenOutlineBuilder?.();
    } catch (err: any) {
      // Still hand off to outline even if sync failed
      sessionStorage.setItem(
        PACING_HANDOFF_KEY,
        JSON.stringify({
          totalWords: goalWords,
          bookType: plan.bookType,
          chapters: plan.chapters.map((c) => ({
            title: c.title,
            purpose: c.purpose,
            targetWords: c.targetWords,
            keyPoints: [`Target: ${c.targetWords.toLocaleString()} words`],
          })),
        })
      );
      onOpenOutlineBuilder?.();
      if (err.response?.data?.error) setError(err.response.data.error);
    } finally {
      setBusy(false);
    }
  };

  const removePlan = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/pacing-guide/plans/${id}`);
      setSavedPlans((list) => list.filter((p) => p.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const bumpChapters = (dir: -1 | 1) => {
    setUseCustomChapters(true);
    setCustomChapters((n) => Math.min(30, Math.max(5, n + dir)));
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (showHistory) {
            setShowHistory(false);
            return;
          }
          if (step === "plan" || step === "saved") {
            setStep("calc");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "calc" && !showHistory ? "Nonfiction & Ghostwriting" : "Pacing Guide"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Pacing Guide</h2>
            <p className="mt-1 text-sm text-[#909090]">
              Chapter length and structure for nonfiction
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
        >
          <FolderOpen size={12} /> Saved plans
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

      {showHistory ? (
        <div className="space-y-3">
          {savedPlans.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No saved pacing plans yet.
            </p>
          ) : (
            savedPlans.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setPlan(p);
                    setTotalWords(p.goalWords || p.totalWords);
                    setBookType(p.bookType);
                    setPacingStyle(p.pacingStyle);
                    if (p.bookId) setBookId(p.bookId);
                    setUseCustomChapters(true);
                    setCustomChapters(p.chapterCount);
                    setStep("plan");
                    setShowHistory(false);
                  }}
                >
                  <div className="font-medium text-white">
                    {p.bookTitle ? `${p.bookTitle} · ` : ""}
                    {(p.goalWords || p.totalWords).toLocaleString()} words · {p.chapterCount}{" "}
                    chapters
                  </div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {p.bookType} · {p.pacingStyle}
                  </div>
                </button>
                <button
                  type="button"
                  className="p-2 text-[#909090] hover:text-red-300"
                  onClick={() => void removePlan(p.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : step === "calc" ? (
        <div className="space-y-6">
          {/* Book select */}
          <div className="space-y-2">
            <p className={labelClass}>Select book</p>
            <select
              className={inputClass}
              value={bookId}
              onChange={(e) => setBookId(e.target.value)}
            >
              <option value="">No book linked yet</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.clientName ? `Client — ${b.clientName}: ` : ""}
                  {b.title}
                  {b.chapters?.length ? ` (${b.chapters.length} ch)` : ""}
                </option>
              ))}
            </select>
            {!bookId && (
              <input
                className={inputClass}
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="+ Create / name a new book for this plan"
              />
            )}
            {selectedBook?.chapters && selectedBook.chapters.length > 0 && (
              <p className="text-[11px] text-[#606060]">
                Outline has {selectedBook.chapters.length} chapters — generating will assign word
                targets to those titles when chapter count matches.
              </p>
            )}
          </div>

          <div>
            <p className={labelClass}>Book type</p>
            <div className="flex flex-wrap gap-2">
              {(bookTypes.length
                ? bookTypes
                : [
                    { id: "memoir", label: "Memoir" },
                    { id: "self-help", label: "Self-help" },
                    { id: "business", label: "Business" },
                    { id: "other", label: "Other" },
                  ]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBookType(t.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    bookType === t.id
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] text-[#c8c4bc]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-[#F0EBE0]">Book length target</p>
            <input
              type="range"
              min={20000}
              max={100000}
              step={1000}
              value={totalWords}
              onChange={(e) => setTotalWords(Number(e.target.value))}
              className="w-full accent-[var(--gd)]"
              style={{
                background: `linear-gradient(to right, var(--gd) ${pct}%, #333 ${pct}%)`,
              }}
            />
            <div className="mt-1 flex justify-between text-[10px] text-[#606060]">
              <span>20,000</span>
              <span>100,000 words</span>
            </div>
          </div>

          <div className="py-2 text-center">
            <div className="font-serif text-5xl font-bold text-[var(--gd)]">
              {totalWords.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-[#606060]">total words</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#242424] bg-[#161616] px-4 py-5 text-center">
              <div className="font-serif text-3xl font-bold text-white">{chapterCount}</div>
              <p className="mt-1 text-[11px] text-[#606060]">
                {useCustomChapters ? "Chapter count" : "Suggested chapters"}
              </p>
            </div>
            <div className="rounded-2xl border border-[#242424] bg-[#161616] px-4 py-5 text-center">
              <div className="font-serif text-3xl font-bold text-white">
                {average.toLocaleString()}
              </div>
              <p className="mt-1 text-[11px] text-[#606060]">Avg. words/chapter</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#242424] bg-[#121212] p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setUseCustomChapters(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  !useCustomChapters
                    ? "bg-[var(--gd)] text-zinc-950"
                    : "border border-[#333] text-[#c8c4bc]"
                }`}
              >
                Use suggested ({suggested})
              </button>
              <button
                type="button"
                onClick={() => setUseCustomChapters(true)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  useCustomChapters
                    ? "bg-[var(--gd)] text-zinc-950"
                    : "border border-[#333] text-[#c8c4bc]"
                }`}
              >
                Set my own chapter count
              </button>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => bumpChapters(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333] text-white"
              >
                <Minus size={16} />
              </button>
              <div className="min-w-[3rem] text-center font-serif text-2xl font-bold text-white">
                {chapterCount}
              </div>
              <button
                type="button"
                onClick={() => bumpChapters(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#333] text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-center text-[11px] text-[#606060]">
              {totalWords.toLocaleString()} words ÷ {chapterCount} chapters ≈{" "}
              {average.toLocaleString()} words/chapter
            </p>
            <div>
              <p className={labelClass}>Pacing style</p>
              <select
                className={inputClass}
                value={pacingStyle}
                onChange={(e) => setPacingStyle(e.target.value)}
              >
                {(styles.length
                  ? styles
                  : [
                      { id: "narrative", label: "Narrative arc" },
                      { id: "even", label: "Even" },
                      { id: "instructional", label: "Instructional" },
                    ]
                ).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {confirmRegen && plan && (
            <div className="space-y-3 rounded-xl border border-[var(--gm)]/40 bg-[#1a150c] p-4">
              <p className="text-sm text-[#F0EBE0]">
                Your pacing plan already has {plan.chapterCount} chapters.
              </p>
              <p className="text-xs text-[#909090]">
                Changing the target length may update chapter word targets.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => void generate(true)} disabled={busy}>
                  Update Targets
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmRegen(false);
                    setTotalWords(plan.goalWords || plan.totalWords);
                    setBookType(plan.bookType);
                    setPacingStyle(plan.pacingStyle);
                    setUseCustomChapters(true);
                    setCustomChapters(plan.chapterCount);
                    setStep("plan");
                  }}
                >
                  Keep Current Plan
                </Button>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            onClick={() => void generate(false)}
            disabled={busy || confirmRegen}
          >
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Generate Pacing Plan
          </Button>
        </div>
      ) : step === "saved" && plan ? (
        <div className="space-y-3 rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 p-4">
          <p className="text-sm font-semibold text-[#52C07A]">Pacing plan saved ✓</p>
          <p className="text-xs text-[#c8c4bc]">
            {plan.chapters.length} chapters · {planTotal.toLocaleString()} planned words
          </p>
          <Button className="w-full" onClick={() => void syncToOutlineBook()}>
            Open Outline Builder
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setStep("plan")}>
            Keep editing targets
          </Button>
        </div>
      ) : (
        plan && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
                Book Pacing Plan
              </h3>
              {(selectedBook?.title || plan.bookTitle) && (
                <p className="mt-2 text-sm text-white">
                  {selectedBook?.title || plan.bookTitle}
                </p>
              )}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between border-b border-[#242424] py-2">
                  <span className="text-[#606060]">Book target</span>
                  <span className="text-white">{goalWords.toLocaleString()} words</span>
                </div>
                <div className="flex justify-between border-b border-[#242424] py-2">
                  <span className="text-[#606060]">Total planned</span>
                  <span className="text-white">{planTotal.toLocaleString()} words</span>
                </div>
                <div className="flex justify-between border-b border-[#242424] py-2">
                  <span className="text-[#606060]">Chapters</span>
                  <span className="text-white">{plan.chapters.length}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-[#606060]">Average</span>
                  <span className="text-white">
                    {Math.round(planTotal / Math.max(plan.chapters.length, 1)).toLocaleString()}{" "}
                    words/chapter
                  </span>
                </div>
              </div>
              {delta !== 0 && (
                <div
                  className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs ${
                    delta > 0
                      ? "border border-[var(--gm)]/40 bg-[#1a150c] text-[var(--gd)]"
                      : "border border-[#52C07A]/30 bg-[#52C07A]/10 text-[#52C07A]"
                  }`}
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  {delta > 0
                    ? `${delta.toLocaleString()} words over target`
                    : `${Math.abs(delta).toLocaleString()} words under target`}
                </div>
              )}
            </div>

            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {plan.chapters.map((c) => {
                const actual =
                  selectedBook?.chapters?.[c.index - 1]?.wordCount || 0;
                const target = c.targetWords || 1;
                const writePct = Math.min(100, Math.round((actual / target) * 100));
                return (
                  <div
                    key={c.index}
                    className="rounded-xl border border-[#242424] bg-[#121212] px-4 py-3 space-y-2"
                  >
                    <input
                      className={`${inputClass} text-sm font-medium`}
                      value={c.title}
                      onChange={(e) => updateChapterTitle(c.index, e.target.value)}
                    />
                    {c.purpose ? (
                      <p className="text-[11px] text-[#606060]">{c.purpose}</p>
                    ) : null}
                    <label className="block">
                      <span className={labelClass}>Target words</span>
                      <input
                        className={inputClass}
                        type="number"
                        min={200}
                        value={c.targetWords}
                        onChange={(e) =>
                          updateChapterTarget(c.index, Number(e.target.value))
                        }
                      />
                    </label>
                    {actual > 0 && (
                      <div>
                        <p className="text-[11px] text-[#909090]">
                          Current: {actual.toLocaleString()} / {c.targetWords.toLocaleString()}
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#2a2a2a]">
                          <div
                            className="h-full rounded-full bg-[var(--gd)]"
                            style={{ width: `${writePct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => void savePlan()} disabled={busy}>
                {busy ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Save size={14} className="mr-1.5" />
                )}
                Save Plan
              </Button>
              <Button onClick={() => void syncToOutlineBook()} disabled={busy}>
                {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Sync Outline Builder
              </Button>
            </div>
            <button
              type="button"
              className="w-full text-center text-xs text-[#606060] hover:text-[#909090]"
              onClick={() => {
                setConfirmRegen(false);
                setStep("calc");
              }}
            >
              ← Recalculate length
            </button>
          </div>
        )
      )}
    </div>
  );
}
