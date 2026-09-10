"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  FolderOpen,
  Loader2,
  Save,
  Shuffle,
  Trash2,
  Zap,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type GenreId = "romance" | "horror" | "scifi" | "comedy";

type PromptInfo = {
  id: string;
  text: string;
  genre: GenreId;
  featured?: boolean;
};

type Draft = {
  id: string;
  title: string;
  genre: GenreId;
  promptId: string;
  promptText: string;
  body: string;
  wordCount: number;
  updatedAt: string;
};

const GENRES: { id: GenreId; label: string }[] = [
  { id: "romance", label: "Romance" },
  { id: "horror", label: "Horror" },
  { id: "scifi", label: "Sci-Fi" },
  { id: "comedy", label: "Comedy" },
];

type Step = "prompt" | "editor" | "drafts";

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";

export default function FlashPromptsWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("prompt");
  const [genre, setGenre] = useState<GenreId>("romance");
  const [prompt, setPrompt] = useState<PromptInfo | null>(null);
  const [dateKey, setDateKey] = useState("");
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [isDaily, setIsDaily] = useState(true);
  const [story, setStory] = useState("");
  const [title, setTitle] = useState("");
  const [draftId, setDraftId] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const genreLabel = useMemo(
    () => GENRES.find((g) => g.id === genre)?.label || "Romance",
    [genre]
  );

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadToday = useCallback(async (g: GenreId) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/writer/flash-prompts/today", { params: { genre: g } });
      const p = res.data.prompt as PromptInfo;
      setPrompt(p);
      setDateKey(res.data.date || "");
      setSeenIds([p.id]);
      setIsDaily(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load today's prompt.");
      setPrompt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDrafts = useCallback(async () => {
    try {
      const res = await api.get("/writer/flash-prompts/drafts");
      setDrafts(res.data.drafts || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadToday(genre);
    void loadDrafts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeGenre = async (g: GenreId) => {
    setGenre(g);
    setStep("prompt");
    setStory("");
    setTitle("");
    setDraftId(undefined);
    await loadToday(g);
  };

  const shuffle = async () => {
    if (!prompt) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/flash-prompts/shuffle", {
        genre,
        currentId: prompt.id,
        excludeIds: seenIds,
      });
      const next = res.data.prompt as PromptInfo;
      setPrompt(next);
      setIsDaily(false);
      setSeenIds((ids) => (ids.includes(next.id) ? ids : [...ids, next.id]));
    } catch (err: any) {
      setError(err.response?.data?.error || "Shuffle failed.");
    } finally {
      setBusy(false);
    }
  };

  const startWriting = () => {
    if (!prompt) return;
    setStep("editor");
    if (!title) setTitle(`${genreLabel} flash`);
  };

  const saveDraft = async () => {
    if (!prompt) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/flash-prompts/drafts", {
        id: draftId,
        title: title.trim() || `${genreLabel} flash`,
        genre,
        promptId: prompt.id,
        promptText: prompt.text,
        body: story,
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
    setGenre(d.genre);
    setPrompt({ id: d.promptId, text: d.promptText, genre: d.genre });
    setStory(d.body);
    setTitle(d.title);
    setDraftId(d.id);
    setIsDaily(false);
    setStep("editor");
  };

  const removeDraft = async (id: string) => {
    try {
      await api.delete(`/writer/flash-prompts/drafts/${id}`);
      setDrafts((list) => list.filter((d) => d.id !== id));
      if (draftId === id) setDraftId(undefined);
      showToast("Draft deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const words = wordCount(story);

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "editor" || step === "drafts") {
            setStep("prompt");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "prompt" ? "Short-Form Fiction" : "Flash Prompts"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3a2a12] text-[var(--gd)]">
            <Zap size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Flash Prompts</h2>
            <p className="mt-1 text-sm text-[#909090]">Pick a genre, get a daily prompt</p>
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
          <FolderOpen size={12} />
          My Drafts
          {drafts.length > 0 && (
            <span className="rounded-full bg-[var(--gd)]/20 px-1.5 text-[var(--gd)]">
              {drafts.length}
            </span>
          )}
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

      {step === "drafts" ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
            Short-Form Fiction Drafts
          </h3>
          {drafts.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No drafts yet. Start writing from a prompt and save.
            </p>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDraft(d)}>
                  <div className="font-medium text-white">{d.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {GENRES.find((g) => g.id === d.genre)?.label || d.genre} · {d.wordCount} words
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[#909090]">{d.promptText}</p>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-2 text-[#909090] hover:bg-[#242424] hover:text-red-300"
                  onClick={() => void removeDraft(d.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : step === "editor" && prompt ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--gm)]/40 bg-[#161616] p-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Prompt
            </p>
            <p className="font-serif text-lg leading-snug text-white">{prompt.text}</p>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[#909090]">Title</span>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Draft title"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[#909090]">Your Story</span>
            <textarea
              className={`${inputClass} min-h-[280px] resize-y font-serif text-base leading-relaxed`}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Start writing..."
            />
          </label>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-[#606060]">Words: {words}</span>
            <Button onClick={() => void saveDraft()} disabled={busy}>
              {busy ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Save size={14} className="mr-1.5" />
              )}
              Save Draft
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className="mb-1.5 text-xs text-[#909090]">Genre</p>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const on = genre === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => void changeGenre(g.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      on
                        ? "bg-[var(--gd)] text-zinc-950"
                        : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[var(--gd)]" />
            </div>
          ) : prompt ? (
            <>
              <div className="rounded-2xl border border-[var(--gm)]/50 bg-[#121212] px-6 py-10 text-center">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd)]">
                  {isDaily ? `Today's ${genreLabel} Prompt` : `${genreLabel} Prompt`}
                  {dateKey && isDaily ? ` · ${dateKey}` : ""}
                </p>
                <p className="mx-auto max-w-md font-serif text-2xl leading-snug text-white sm:text-[1.65rem]">
                  {prompt.text}
                </p>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => void shuffle()}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Shuffle size={14} className="mr-1.5" />
                )}
                Shuffle prompt
              </Button>

              <Button className="w-full" onClick={startWriting}>
                Start writing
              </Button>
            </>
          ) : (
            <p className="text-center text-sm text-[#606060]">No prompts available for this genre.</p>
          )}
        </>
      )}
    </div>
  );
}
