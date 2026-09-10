"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  FolderOpen,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Send,
  Square,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Step = "input" | "preview" | "publish" | "library";

type GenreOpt = { id: string; label: string };

type StoryRecord = {
  id: string;
  title: string;
  formattedText: string;
  originalText?: string;
  genre: string;
  description: string;
  visibility: "public" | "private";
  status: "draft" | "published";
  wordCount: number;
  readingMinutes: number;
  views?: number;
  likes?: number;
  updatedAt: string;
  publishedAt?: string | null;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

export default function OneShotFormatterWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("input");
  const [rawStory, setRawStory] = useState("");
  const [title, setTitle] = useState("");
  const [formatted, setFormatted] = useState("");
  const [editing, setEditing] = useState(false);
  const [storyId, setStoryId] = useState<string | undefined>();
  const [wordCount, setWordCount] = useState(0);
  const [readingMinutes, setReadingMinutes] = useState(1);
  const [genres, setGenres] = useState<GenreOpt[]>([]);
  const [genre, setGenre] = useState("literary");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [library, setLibrary] = useState<StoryRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [warning, setWarning] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get("/writer/one-shot-formatter/meta");
      const list = (res.data.genres || []) as GenreOpt[];
      setGenres(list);
      if (list[0]) setGenre((g) => g || list[0].id);
    } catch {
      /* ignore */
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    try {
      const res = await api.get("/writer/one-shot-formatter/mine");
      setLibrary(res.data.stories || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadMeta();
    void loadLibrary();
  }, [loadMeta, loadLibrary]);

  const formatStory = async () => {
    if (rawStory.trim().length < 40) {
      setError("Paste your full one-shot story first.");
      return;
    }
    setBusy(true);
    setError("");
    setWarning("");
    try {
      const res = await api.post("/writer/one-shot-formatter/format", {
        title: title.trim(),
        story: rawStory.trim(),
      });
      setTitle(res.data.title || title);
      setFormatted(res.data.formattedText || "");
      setWordCount(res.data.wordCount || 0);
      setReadingMinutes(res.data.readingMinutes || 1);
      if (res.data.warning) setWarning(res.data.warning);
      setEditing(false);
      setStep("preview");
      showToast("Formatted");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Format failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/one-shot-formatter/save", {
        id: storyId,
        title: title.trim() || "Untitled",
        originalText: rawStory,
        formattedText: formatted,
        genre,
        description,
        visibility,
      });
      setStoryId(res.data.story.id);
      await loadLibrary();
      showToast("Draft saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const confirmPublish = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/one-shot-formatter/publish", {
        id: storyId,
        title: title.trim() || "Untitled",
        originalText: rawStory,
        formattedText: formatted,
        genre,
        description,
        visibility,
      });
      setStoryId(res.data.story.id);
      await loadLibrary();
      showToast(visibility === "public" ? "Published" : "Saved as private");
      setStep("library");
    } catch (err: any) {
      setError(err.response?.data?.error || "Publish failed.");
    } finally {
      setBusy(false);
    }
  };

  const openStory = (s: StoryRecord) => {
    setStoryId(s.id);
    setTitle(s.title);
    setFormatted(s.formattedText);
    setRawStory(s.originalText || s.formattedText);
    setWordCount(s.wordCount);
    setReadingMinutes(s.readingMinutes);
    setGenre(s.genre || "literary");
    setDescription(s.description || "");
    setVisibility(s.visibility || "public");
    setEditing(false);
    setStep("preview");
  };

  const removeStory = async (id: string) => {
    try {
      await api.delete(`/writer/one-shot-formatter/${id}`);
      setLibrary((list) => list.filter((s) => s.id !== id));
      if (storyId === id) setStoryId(undefined);
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const backNav = () => {
    if (step === "publish") {
      setStep("preview");
      return;
    }
    if (step === "preview" || step === "library") {
      setStep("input");
      return;
    }
    onBack?.();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={backNav}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "input" ? "Short-Form Fiction" : "One-Shot Formatter"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <Square size={18} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">One-Shot Formatter</h2>
            <p className="mt-1 text-sm text-[#909090]">Format and post a single-chapter story</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStep("library");
            void loadLibrary();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
        >
          <FolderOpen size={12} />
          My Stories
          {library.length > 0 && (
            <span className="rounded-full bg-[var(--gd)]/20 px-1.5 text-[var(--gd)]">
              {library.length}
            </span>
          )}
        </button>
      </div>

      {toast && (
        <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-2 text-sm text-[#52C07A]">
          {toast}
        </div>
      )}
      {warning && (
        <div className="rounded-xl border border-[var(--gm)]/30 bg-[var(--gd)]/10 px-4 py-2 text-sm text-[var(--gd)]">
          {warning}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {step === "library" && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
            My Short-Form Stories
          </h3>
          {library.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No one-shots yet. Format a story and save a draft.
            </p>
          ) : (
            library.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openStory(s)}>
                  <div className="font-medium text-white">{s.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {s.status === "published" ? "Published" : "Draft"} · {s.wordCount} words
                    {s.genre ? ` · ${s.genre}` : ""}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[#909090]">{s.formattedText}</p>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-2 text-[#909090] hover:bg-[#242424] hover:text-red-300"
                  onClick={() => void removeStory(s.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
          <Button variant="secondary" className="w-full" onClick={() => setStep("input")}>
            New one-shot
          </Button>
        </div>
      )}

      {step === "input" && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Paste your one-shot story</span>
            <textarea
              className={`${inputClass} min-h-[220px] resize-y`}
              value={rawStory}
              onChange={(e) => setRawStory(e.target.value)}
              placeholder="Paste the full story text..."
            />
          </label>
          <label className="block">
            <span className={labelClass}>Title</span>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Last Bus Home"
            />
          </label>
          <Button className="w-full" onClick={() => void formatStory()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Formatting…
              </>
            ) : (
              "Format & preview"
            )}
          </Button>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
                One-Shot Preview
              </h3>
              <button
                type="button"
                onClick={() => setEditing((e) => !e)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gd)]"
              >
                <Pencil size={12} />
                {editing ? "Done" : "Edit"}
              </button>
            </div>

            {editing ? (
              <div className="space-y-3">
                <input
                  className={inputClass}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  className={`${inputClass} min-h-[280px] resize-y font-serif text-base leading-relaxed`}
                  value={formatted}
                  onChange={(e) => {
                    setFormatted(e.target.value);
                    const w = e.target.value.trim()
                      ? e.target.value.trim().split(/\s+/).filter(Boolean).length
                      : 0;
                    setWordCount(w);
                    setReadingMinutes(Math.max(1, Math.ceil(w / 225)));
                  }}
                />
              </div>
            ) : (
              <>
                <h4 className="mb-4 font-serif text-2xl font-bold text-white">{title}</h4>
                <div className="mb-4 border-t border-[#242424]" />
                <p className="whitespace-pre-wrap font-serif text-[15px] leading-relaxed text-[#F0EBE0]">
                  {formatted}
                </p>
                <div className="mt-4 border-t border-[#242424] pt-3 text-xs text-[#606060]">
                  Words: {wordCount.toLocaleString()} · Reading time: ~{readingMinutes} min
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => void formatStory()}
              disabled={busy}
            >
              <RefreshCw size={14} className="mr-1.5" /> Re-format
            </Button>
            <Button variant="secondary" onClick={() => void saveDraft()} disabled={busy}>
              <Save size={14} className="mr-1.5" /> Save Draft
            </Button>
          </div>
          <Button className="w-full" onClick={() => setStep("publish")}>
            <Send size={14} className="mr-1.5" /> Publish
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-[#606060] hover:text-[#909090]"
            onClick={() => setStep("input")}
          >
            ← Back to paste
          </button>
        </div>
      )}

      {step === "publish" && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
            Publish One-Shot
          </h3>
          <p className="font-serif text-lg text-white">{title}</p>

          <label className="block">
            <span className={labelClass}>Genre</span>
            <select
              className={inputClass}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              className={`${inputClass} min-h-[88px] resize-y`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short blurb for readers…"
            />
          </label>

          <div>
            <p className={labelClass}>Visibility</p>
            <div className="flex gap-2">
              {(["public", "private"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                    visibility === v
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={() => void confirmPublish()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" /> Publishing…
              </>
            ) : (
              "Confirm Publish"
            )}
          </Button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="One-Shot Formatter"
      />
    </div>
  );
}
