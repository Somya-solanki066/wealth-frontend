"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Smile,
  Upload,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Mode = "own" | "client";
type Step = "project" | "chapter" | "transcript" | "options" | "result" | "saved";

type Chapter = {
  id: string;
  title: string;
  topic?: string;
  purpose?: string;
  wordCount?: number;
  targetWords?: number;
  status?: string;
  body?: string;
  transcript?: string;
};

type Book = {
  id: string;
  title: string;
  mode: Mode;
  clientName?: string;
  chapters: Chapter[];
};

type Draft = {
  title: string;
  topic: string;
  transcript: string;
  body: string;
  length: string;
  style: string;
  pov?: string;
  tone?: string;
  targetWords?: number;
  wordCount: number;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const DEFAULT_LENGTHS = [
  { id: "short", label: "1,500 words" },
  { id: "medium", label: "2,500 words" },
  { id: "long", label: "3,500 words" },
];
const DEFAULT_POVS = [
  { id: "first", label: "First Person" },
  { id: "third", label: "Third Person" },
];
const DEFAULT_TONES = [
  { id: "personal", label: "Personal" },
  { id: "inspirational", label: "Inspirational" },
  { id: "professional", label: "Professional" },
  { id: "conversational", label: "Conversational" },
];

function lengthFromTarget(words?: number) {
  if (!words) return "medium";
  if (words <= 1800) return "short";
  if (words >= 3200) return "long";
  return "medium";
}

export default function SelfInterviewBuilderWorkspace({
  onBack,
  mode = "own",
}: {
  onBack?: () => void;
  mode?: Mode;
}) {
  const toolTitle = mode === "client" ? "Interview → Manuscript" : "Self-Interview Builder";
  const toolDesc =
    mode === "client"
      ? "Turn recorded interviews into chapters"
      : "Turn your own memories into chapter material";

  const [step, setStep] = useState<Step>("project");
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState("");
  const [newBookTitle, setNewBookTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [chapterId, setChapterId] = useState<string | undefined>();
  const [chapterTitle, setChapterTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [createNewChapter, setCreateNewChapter] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [transcriptPart, setTranscriptPart] = useState("Interview 1 — Part 1");
  const [length, setLength] = useState("medium");
  const [pov, setPov] = useState("first");
  const [tone, setTone] = useState("personal");
  const [targetWords, setTargetWords] = useState<number | undefined>(2500);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [lengths, setLengths] = useState(DEFAULT_LENGTHS);
  const [povs, setPovs] = useState(DEFAULT_POVS);
  const [tones, setTones] = useState(DEFAULT_TONES);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === bookId) || null,
    [books, bookId]
  );

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
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
    void api.get("/writer/self-interview/meta").then((res) => {
      if (res.data.lengths?.length) setLengths(res.data.lengths);
      if (res.data.povs?.length) setPovs(res.data.povs);
      if (res.data.tones?.length) setTones(res.data.tones);
    });
    try {
      const raw = sessionStorage.getItem("ink2wealth_outline_chapter");
      if (raw) {
        const h = JSON.parse(raw);
        sessionStorage.removeItem("ink2wealth_outline_chapter");
        if (h.bookId) setBookId(String(h.bookId));
        if (h.chapterId) setChapterId(String(h.chapterId));
        if (h.chapterTitle) setChapterTitle(String(h.chapterTitle));
        if (h.topic) setTopic(String(h.topic));
        if (h.bookTitle) setNewBookTitle(String(h.bookTitle));
        if (h.clientName) setClientName(String(h.clientName));
        if (h.targetWords) {
          setTargetWords(Number(h.targetWords));
          setLength(lengthFromTarget(Number(h.targetWords)));
        }
        setCreateNewChapter(false);
        setStep(h.bookId ? (h.chapterId ? "transcript" : "chapter") : "project");
        showToast("Loaded from Outline Builder");
      }
    } catch {
      /* ignore */
    }
  }, [loadBooks]);

  // When books load after outline handoff, pull chapter target words
  useEffect(() => {
    if (!bookId || !chapterId || !selectedBook) return;
    const ch = selectedBook.chapters.find((c) => c.id === chapterId);
    if (ch?.targetWords) {
      setTargetWords(ch.targetWords);
      setLength(lengthFromTarget(ch.targetWords));
    }
    if (ch?.title && !chapterTitle) setChapterTitle(ch.title);
    if (ch?.purpose && !topic) setTopic(ch.purpose);
  }, [bookId, chapterId, selectedBook, chapterTitle, topic]);

  const goBack = () => {
    if (step === "saved") {
      setStep("result");
      return;
    }
    if (step === "result") {
      setStep("options");
      return;
    }
    if (step === "options") {
      setStep("transcript");
      return;
    }
    if (step === "transcript") {
      setStep("chapter");
      return;
    }
    if (step === "chapter") {
      setStep("project");
      return;
    }
    onBack?.();
  };

  const selectBook = (b: Book) => {
    setBookId(b.id);
    setNewBookTitle(b.title);
    if (b.clientName) setClientName(b.clientName);
    setChapterId(undefined);
    setChapterTitle("");
    setTopic("");
    setCreateNewChapter(false);
    setStep("chapter");
  };

  const createProject = async () => {
    const title =
      newBookTitle.trim() ||
      (mode === "client"
        ? `${clientName.trim() || "Client"} book`
        : "My nonfiction book");
    if (mode === "client" && !clientName.trim()) {
      setError("Enter the client name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/self-interview/books", {
        mode,
        title,
        clientName: mode === "client" ? clientName.trim() : undefined,
        chapters: [],
      });
      await loadBooks();
      setBookId(res.data.book.id);
      setNewBookTitle(res.data.book.title);
      setCreateNewChapter(true);
      setChapterId(undefined);
      setChapterTitle("");
      setStep("chapter");
      showToast("Project created");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not create project.");
    } finally {
      setBusy(false);
    }
  };

  const selectChapter = (ch: Chapter) => {
    setCreateNewChapter(false);
    setChapterId(ch.id);
    setChapterTitle(ch.title);
    setTopic(ch.purpose || ch.topic || "");
    if (ch.targetWords) {
      setTargetWords(ch.targetWords);
      setLength(lengthFromTarget(ch.targetWords));
    }
    setStep("transcript");
  };

  const continueNewChapter = () => {
    setCreateNewChapter(true);
    setChapterId(undefined);
    if (!chapterTitle.trim()) setChapterTitle("New chapter");
    setStep("transcript");
  };

  const onUpload = async (file: File) => {
    setError("");
    const name = file.name.toLowerCase();
    if (name.endsWith(".txt") || file.type.startsWith("text/")) {
      const text = await file.text();
      setTranscript((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text));
      showToast("Transcript loaded");
      return;
    }
    if (name.endsWith(".docx")) {
      setError("DOCX upload isn’t supported yet — paste the transcript text, or upload a .txt file.");
      return;
    }
    setError("Please upload a .txt file or paste the transcript.");
  };

  const draftChapter = async () => {
    if (transcript.trim().length < 40) {
      setError("Paste a longer interview transcript (at least a short excerpt).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const words =
        targetWords ||
        (length === "short" ? 1500 : length === "long" ? 3500 : 2500);
      const res = await api.post("/writer/self-interview/draft", {
        transcript: transcript.trim(),
        topic: topic.trim() || chapterTitle.trim(),
        chapterTitle: chapterTitle.trim(),
        length,
        style: tone === "professional" ? "professional" : "personal",
        pov,
        tone,
        targetWords: words,
        mode,
        clientName: mode === "client" ? clientName.trim() : undefined,
        bookId: bookId || undefined,
        chapterId,
      });
      setDraft(res.data.draft);
      setEditing(true);
      setStep("result");
      showToast("Chapter drafted");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Draft failed.");
    } finally {
      setBusy(false);
    }
  };

  const refine = async (action: string) => {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/self-interview/refine", {
        action,
        title: draft.title,
        body: draft.body,
        transcript: draft.transcript || transcript,
        topic: draft.topic || topic,
        length,
        style: draft.style || tone,
        pov,
        tone,
      });
      setDraft({
        ...draft,
        title: res.data.draft.title,
        body: res.data.draft.body,
        wordCount: res.data.draft.wordCount,
      });
      showToast("Updated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Refine failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(`${draft.title}\n\n${draft.body}`);
      showToast("Copied");
    } catch {
      setError("Could not copy.");
    }
  };

  const saveChapter = async () => {
    if (!draft) return;
    if (!bookId) {
      setError("Select a project first.");
      setStep("project");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/writer/self-interview/books/${bookId}/chapters`, {
        chapterId: createNewChapter ? undefined : chapterId,
        title: draft.title,
        topic: draft.topic || topic || draft.title,
        transcript: draft.transcript || transcript,
        body: draft.body,
        length: draft.length || length,
        style: draft.style || (tone === "professional" ? "professional" : "personal"),
        pov,
        tone,
        targetWords: draft.targetWords || targetWords,
        status: mode === "client" ? "review" : "draft",
      });
      const savedBook = res.data.book as Book;
      const match =
        savedBook.chapters?.find((c) => c.id === chapterId) ||
        savedBook.chapters?.[savedBook.chapters.length - 1];
      if (match?.id) {
        setChapterId(match.id);
        setCreateNewChapter(false);
      }
      await loadBooks();
      setStep("saved");
      showToast("Saved to chapter");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const startNext = () => {
    setDraft(null);
    setTranscript("");
    setChapterId(undefined);
    setChapterTitle("");
    setTopic("");
    setCreateNewChapter(false);
    setStep("chapter");
  };

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "project" ? "Nonfiction & Ghostwriting" : toolTitle}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
          <Smile size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">{toolTitle}</h2>
          <p className="mt-1 text-sm text-[#909090]">{toolDesc}</p>
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

      {step === "project" && (
        <div className="space-y-4">
          <p className="text-sm text-[#F0EBE0]">Select project</p>
          {mode === "client" && (
            <label className="block">
              <span className={labelClass}>Client name</span>
              <input
                className={inputClass}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Founder / client name"
              />
            </label>
          )}
          <div className="space-y-2">
            {books.length === 0 ? (
              <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-6 text-center text-sm text-[#606060]">
                No projects yet. Create one below.
              </p>
            ) : (
              books.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => selectBook(b)}
                  className="flex w-full items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3.5 text-left hover:border-[#333]"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {mode === "client" && b.clientName
                        ? `Client — ${b.clientName}`
                        : b.title}
                    </div>
                    <div className="mt-1 text-[11px] text-[#606060]">
                      {b.title} · {b.chapters?.length || 0} chapters
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="rounded-xl border border-[#242424] bg-[#121212] p-4 space-y-3">
            <p className="text-xs text-[#909090]">New project</p>
            <input
              className={inputClass}
              value={newBookTitle}
              onChange={(e) => setNewBookTitle(e.target.value)}
              placeholder={mode === "client" ? "Client book title" : "My memoir / business book"}
            />
            <Button className="w-full" disabled={busy} onClick={() => void createProject()}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Plus size={14} className="mr-1.5" />}
              Create project
            </Button>
          </div>
        </div>
      )}

      {step === "chapter" && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              {selectedBook?.title || newBookTitle || "Project"}
            </p>
            <h3 className="mt-1 text-lg font-medium text-white">Select chapter</h3>
          </div>
          <div className="space-y-2">
            {(selectedBook?.chapters || []).map((ch, i) => {
              const active = chapterId === ch.id && !createNewChapter;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => selectChapter(ch)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left ${
                    active
                      ? "border-[var(--gd)] bg-[#1a150c]"
                      : "border-[#242424] bg-[#161616] hover:border-[#333]"
                  }`}
                >
                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${
                      active ? "border-[var(--gd)] bg-[var(--gd)]" : "border-[#606060]"
                    }`}
                  />
                  <div>
                    <div className="text-sm text-white">
                      {i === 0 && /intro/i.test(ch.title)
                        ? ch.title
                        : ch.title.startsWith("Chapter")
                          ? ch.title
                          : `Chapter ${i + 1} — ${ch.title}`}
                    </div>
                    {ch.targetWords ? (
                      <div className="mt-1 text-[11px] text-[var(--gd)]">
                        Target: {ch.targetWords.toLocaleString()} words
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-[#606060]">
                        {ch.status || "planned"}
                        {ch.wordCount ? ` · ${ch.wordCount} words` : ""}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl border border-[#242424] bg-[#121212] p-4 space-y-3">
            <p className="text-xs text-[#909090]">Or create a new chapter</p>
            <input
              className={inputClass}
              value={createNewChapter ? chapterTitle : ""}
              onChange={(e) => {
                setCreateNewChapter(true);
                setChapterId(undefined);
                setChapterTitle(e.target.value);
              }}
              placeholder="Chapter title"
            />
            <Button className="w-full" variant="secondary" onClick={continueNewChapter}>
              <Plus size={14} className="mr-1.5" /> Create New Chapter
            </Button>
          </div>
          {(selectedBook?.chapters?.length || 0) === 0 && (
            <Button className="w-full" onClick={continueNewChapter}>
              Continue with new chapter
            </Button>
          )}
        </div>
      )}

      {step === "transcript" && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              {chapterTitle || "Chapter"}
            </p>
            <h3 className="mt-1 text-lg font-medium text-white">Interview transcript</h3>
            <p className="mt-1 text-xs text-[#909090]">
              Paste the complete interview transcript or a relevant section.
            </p>
          </div>
          <label className="block">
            <span className={labelClass}>Part label (optional)</span>
            <input
              className={inputClass}
              value={transcriptPart}
              onChange={(e) => setTranscriptPart(e.target.value)}
              placeholder="Interview 1 — Part 1"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Transcript</span>
            <textarea
              className={`${inputClass} min-h-[200px] resize-y`}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste the complete interview transcript or relevant section here..."
            />
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} className="mr-1.5" /> Upload TXT
          </Button>
          <Button
            className="w-full"
            disabled={transcript.trim().length < 40}
            onClick={() => {
              setError("");
              setStep("options");
            }}
          >
            Continue to writing options
          </Button>
        </div>
      )}

      {step === "options" && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-medium text-white">Writing instructions</h3>
            <p className="mt-1 text-xs text-[#909090]">
              Ghostwriting defaults to first person — the author’s voice.
            </p>
          </div>

          <div>
            <p className={labelClass}>Writing style</p>
            <div className="flex flex-wrap gap-2">
              {povs.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={pill(pov === p.id)}
                  onClick={() => setPov(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>Tone</p>
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
            <p className={labelClass}>Chapter length</p>
            <div className="flex flex-wrap gap-2">
              {lengths.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={pill(length === l.id)}
                  onClick={() => {
                    setLength(l.id);
                    setTargetWords(l.id === "short" ? 1500 : l.id === "long" ? 3500 : 2500);
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
            {targetWords ? (
              <p className="mt-2 text-[11px] text-[#606060]">
                Target ≈ {targetWords.toLocaleString()} words
                {selectedBook && chapterId
                  ? " (from pacing / outline when available)"
                  : ""}
              </p>
            ) : null}
          </div>

          <label className="block">
            <span className={labelClass}>Chapter title</span>
            <input
              className={inputClass}
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
          </label>

          <Button className="w-full" onClick={() => void draftChapter()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Drafting…
              </>
            ) : (
              "Draft chapter from this"
            )}
          </Button>
        </div>
      )}

      {step === "result" && draft && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Generated chapter
            </p>
            {editing ? (
              <input
                className={`${inputClass} mt-2 font-serif text-lg`}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            ) : (
              <h3 className="mt-2 font-serif text-2xl font-bold text-white">{draft.title}</h3>
            )}
            <textarea
              className={`${inputClass} mt-3 min-h-[280px] resize-y font-serif text-base leading-relaxed`}
              value={draft.body}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  body: e.target.value,
                  wordCount: e.target.value.trim().split(/\s+/).filter(Boolean).length,
                })
              }
              readOnly={!editing}
            />
            <p className="mt-3 text-xs text-[#606060]">
              Word count: {draft.wordCount.toLocaleString()}
              {draft.targetWords
                ? ` · Target ${draft.targetWords.toLocaleString()}`
                : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setEditing((v) => !v)}>
              <Pencil size={14} className="mr-1.5" />
              {editing ? "Lock edit" : "Edit"}
            </Button>
            <Button variant="secondary" onClick={() => void refine("regenerate")} disabled={busy}>
              <RefreshCw size={14} className="mr-1.5" /> Regenerate
            </Button>
            <Button variant="secondary" onClick={() => void copyDraft()}>
              <Copy size={14} className="mr-1.5" /> Copy
            </Button>
            <Button onClick={() => void saveChapter()} disabled={busy}>
              {busy ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Save size={14} className="mr-1.5" />
              )}
              Save to Chapter
            </Button>
          </div>

          <div>
            <p className={labelClass}>AI actions</p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "more-personal", label: "Make More Personal" },
                { id: "improve-flow", label: "Improve Flow" },
                { id: "shorten", label: "Shorten" },
                { id: "expand", label: "Expand" },
                { id: "rewrite", label: "Rewrite" },
              ].map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void refine(a.id)}
                  className="rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc] disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "saved" && draft && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#52C07A]/30 bg-[#52C07A]/10 p-5 space-y-2">
            <p className="font-serif text-xl font-bold text-white">{draft.title}</p>
            <p className="text-sm text-[#52C07A]">
              Status: {mode === "client" ? "Review" : "Draft"}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-[#c8c4bc]">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#52C07A]" /> Interview processed
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#52C07A]" /> Chapter draft created
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#52C07A]" /> Saved to book
              </li>
            </ul>
          </div>
          <Button className="w-full" onClick={startNext}>
            Draft next chapter
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setStep("result")}>
            Back to draft
          </Button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName={toolTitle}
      />
    </div>
  );
}
