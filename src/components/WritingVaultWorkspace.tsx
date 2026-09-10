"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Copy,
  FileText,
  Lightbulb,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

type VaultTab = "discover" | "saved" | "recent";

type ProjectOption = {
  id: string;
  name: string;
  type?: string;
};

type PromptCard = {
  promptId: string;
  promptText: string;
  title?: string;
  category: string;
  categoryLabel?: string;
  genre: string;
  tone: string;
  source?: string;
  id?: string;
};

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  fire_starters: { label: "Fire Starters", emoji: "🔥" },
  scene_builders: { label: "Scene Builders", emoji: "🎬" },
  character_voice: { label: "Character Voice", emoji: "🎭" },
};

export default function WritingVaultWorkspace({
  projects = [],
  onBack,
  onOpenProject,
}: {
  projects?: ProjectOption[];
  onBack?: () => void;
  onOpenProject?: (project: ProjectOption) => void;
}) {
  const [tab, setTab] = useState<VaultTab>("discover");
  const [category, setCategory] = useState("fire_starters");
  const [genre, setGenre] = useState("All Genres");
  const [tone, setTone] = useState("Any");
  const [genres, setGenres] = useState<string[]>(["All Genres"]);
  const [tones, setTones] = useState<string[]>(["Any"]);
  const [categories, setCategories] = useState<
    Array<{ id: string; label: string; description?: string }>
  >([]);

  const [prompt, setPrompt] = useState<PromptCard | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [savedList, setSavedList] = useState<PromptCard[]>([]);
  const [recentList, setRecentList] = useState<PromptCard[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [applying, setApplying] = useState(false);
  const [useAi, setUseAi] = useState(false);

  const novelProjects = useMemo(
    () => projects.filter((p) => !p.type || p.type === "novel"),
    [projects]
  );

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get("/writer/writing-vault/meta");
      if (res.data?.categories?.length) setCategories(res.data.categories);
      if (res.data?.genres?.length) setGenres(res.data.genres);
      if (res.data?.tones?.length) setTones(res.data.tones);
    } catch {
      setCategories([
        { id: "fire_starters", label: "Fire Starters" },
        { id: "scene_builders", label: "Scene Builders" },
        { id: "character_voice", label: "Character Voice" },
      ]);
    }
  }, []);

  const fetchPrompt = useCallback(
    async (opts?: { category?: string; preferAi?: boolean }) => {
      setLoadingPrompt(true);
      setError("");
      setCopied(false);
      setSavedFlash(false);
      setIsSaved(false);
      try {
        const res = await api.post("/writer/writing-vault/prompt", {
          category: opts?.category || category,
          genre,
          tone,
          preferAi: opts?.preferAi ?? useAi,
        });
        const p = res.data?.prompt as PromptCard;
        setPrompt(p);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load prompt.");
      } finally {
        setLoadingPrompt(false);
      }
    },
    [category, genre, tone, useAi]
  );

  const loadSaved = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await api.get("/writer/writing-vault/saved");
      setSavedList(res.data?.prompts || []);
    } catch {
      setSavedList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadRecent = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await api.get("/writer/writing-vault/recent");
      setRecentList(res.data?.prompts || []);
    } catch {
      setRecentList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (tab === "discover" && !prompt) void fetchPrompt();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "saved") void loadSaved();
    if (tab === "recent") void loadRecent();
  }, [tab, loadSaved, loadRecent]);

  useEffect(() => {
    if (tab === "discover" && prompt) {
      void fetchPrompt({ category });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleCopy = async () => {
    if (!prompt?.promptText) return;
    try {
      await navigator.clipboard.writeText(prompt.promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const handleSave = async (target?: PromptCard) => {
    const p = target || prompt;
    if (!p) return;
    setError("");
    try {
      await api.post("/writer/writing-vault/save", {
        promptId: p.promptId,
        promptText: p.promptText,
        category: p.category,
        genre: p.genre,
        tone: p.tone,
        title: p.title,
        source: p.source,
      });
      setIsSaved(true);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      if (tab === "saved") void loadSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save prompt.");
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await api.delete(`/writer/writing-vault/saved/${id}`);
      setSavedList((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove saved prompt.");
    }
  };

  const openUseInProject = (p?: PromptCard) => {
    if (p) setPrompt(p);
    setSelectedProjectId(novelProjects[0]?.id || "");
    setShowProjectModal(true);
  };

  const applyToProject = async () => {
    if (!prompt || !selectedProjectId) {
      setError("Select a novel project.");
      return;
    }
    setApplying(true);
    setError("");
    try {
      const res = await api.post("/writer/writing-vault/apply-to-project", {
        projectId: selectedProjectId,
        promptId: prompt.promptId,
        promptText: prompt.promptText,
        category: prompt.category,
        genre: prompt.genre,
        tone: prompt.tone,
        source: prompt.source,
      });
      setShowProjectModal(false);
      const project =
        res.data?.project ||
        novelProjects.find((p) => p.id === selectedProjectId);
      if (project && onOpenProject) onOpenProject(project);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to insert prompt into project.");
    } finally {
      setApplying(false);
    }
  };

  const showPromptFromList = (p: PromptCard) => {
    setPrompt(p);
    setTab("discover");
    if (p.category) setCategory(p.category);
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-[#909090] hover:text-[var(--gd)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All tools
            </button>
          )}
          <h2 className="font-serif text-2xl font-bold text-[#f0ebe0] flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-[var(--gd)]" />
            Writing Vault
          </h2>
          <p className="mt-1 text-xs text-[#707070]">
            Idea engine for stories, scenes, and character voice — then write in Novel Editor.
          </p>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl border border-[#2a1e00] bg-[#161000]/80 p-1">
        {(
          [
            { id: "discover", label: "Discover" },
            { id: "saved", label: "Saved" },
            { id: "recent", label: "Recently Used" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === t.id
                ? "bg-[var(--gd)] text-[#0a0a0a]"
                : "text-[#909090] hover:text-[#f0ebe0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {tab === "discover" && (
        <>
          <div className="rounded-2xl border border-[#2a1e00] bg-[#161000] p-4 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
              Category
            </div>
            <div className="flex flex-wrap gap-2">
              {(categories.length
                ? categories
                : Object.entries(CATEGORY_META).map(([id, m]) => ({
                    id,
                    label: m.label,
                  }))
              ).map((c) => {
                const meta = CATEGORY_META[c.id];
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-[var(--gd)] bg-[var(--gd)]/15 text-[var(--gd)]"
                        : "border-[#2a1e00] bg-[#0f0f00] text-[#c0c0c0] hover:border-[var(--gm)]"
                    }`}
                  >
                    {meta?.emoji ? `${meta.emoji} ` : ""}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="rounded-2xl border border-[#2a1e00] bg-[#161000] p-4 block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
                Genre
              </span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0] outline-none focus:border-[var(--gd)]"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-[#2a1e00] bg-[#161000] p-4 block">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
                Tone
              </span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0] outline-none focus:border-[var(--gd)]"
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 px-1 text-xs text-[#808080]">
            <input
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="rounded border-[#2a1e00]"
            />
            Prefer AI-generated prompt (hybrid library still used when AI fails)
          </label>

          <div className="min-h-[160px] rounded-2xl border border-[#2a1e00] bg-[#161000] px-5 py-8 flex items-center justify-center">
            {loadingPrompt ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            ) : (
              <p className="text-center font-serif text-[17px] leading-relaxed text-[#f0ebe0] italic">
                {prompt?.promptText
                  ? `"${prompt.promptText}"`
                  : "Pick a category and tap for a prompt."}
              </p>
            )}
          </div>

          {prompt && (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#606060]">
              <span className="rounded-md bg-[#1a1400] px-2 py-1 text-[var(--gd)]">
                {prompt.categoryLabel || CATEGORY_META[prompt.category]?.label || prompt.category}
              </span>
              {prompt.genre && prompt.genre !== "All Genres" && (
                <span className="rounded-md bg-[#1a1400] px-2 py-1">{prompt.genre}</span>
              )}
              {prompt.tone && prompt.tone !== "Any" && (
                <span className="rounded-md bg-[#1a1400] px-2 py-1">{prompt.tone}</span>
              )}
              {prompt.source && (
                <span className="rounded-md bg-[#1a1400] px-2 py-1 uppercase tracking-wide">
                  {prompt.source}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSave()}
              disabled={!prompt || loadingPrompt}
              className="w-full"
            >
              {isSaved || savedFlash ? (
                <>
                  <BookmarkCheck className="h-4 w-4 mr-1.5" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 mr-1.5" /> Save Prompt
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={!prompt || loadingPrompt}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-1.5" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => openUseInProject()}
            disabled={!prompt || loadingPrompt}
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-1.5" /> Use in My Project
          </Button>

          <Button
            onClick={() => fetchPrompt()}
            disabled={loadingPrompt}
            className="w-full !bg-[var(--gd)] !text-[#0a0a0a] hover:!bg-[var(--gl)] font-bold"
          >
            {loadingPrompt ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            )}
            Tap for another prompt
          </Button>
        </>
      )}

      {tab === "saved" && (
        <div className="space-y-3">
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : savedList.length === 0 ? (
            <p className="rounded-2xl border border-[#2a1e00] bg-[#161000] px-5 py-10 text-center text-sm text-[#707070]">
              No saved prompts yet. Save ones you like from Discover.
            </p>
          ) : (
            savedList.map((item) => (
              <div
                key={item.id || item.promptId}
                className="rounded-2xl border border-[#2a1e00] bg-[#161000] p-4 space-y-3"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gd)]">
                  {CATEGORY_META[item.category]?.emoji}{" "}
                  {item.categoryLabel || CATEGORY_META[item.category]?.label || item.category}
                  {item.genre && item.genre !== "All Genres" ? ` · ${item.genre}` : ""}
                </div>
                <p className="text-sm italic text-[#f0ebe0] leading-relaxed">
                  &ldquo;{item.promptText}&rdquo;
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => showPromptFromList(item)}>
                    Open
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openUseInProject(item)}>
                    Use in Project
                  </Button>
                  {item.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(item.id!)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 text-xs text-[#909090] hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "recent" && (
        <div className="space-y-3">
          {listLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : recentList.length === 0 ? (
            <p className="rounded-2xl border border-[#2a1e00] bg-[#161000] px-5 py-10 text-center text-sm text-[#707070]">
              Prompts you view or use will show up here.
            </p>
          ) : (
            recentList.map((item) => (
              <button
                key={item.id || item.promptId}
                type="button"
                onClick={() => showPromptFromList(item)}
                className="w-full text-left rounded-2xl border border-[#2a1e00] bg-[#161000] p-4 hover:border-[var(--gd)] transition"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--gd)] mb-2">
                  {CATEGORY_META[item.category]?.emoji}{" "}
                  {item.categoryLabel || CATEGORY_META[item.category]?.label || item.category}
                </div>
                <p className="text-sm italic text-[#f0ebe0] leading-relaxed line-clamp-3">
                  &ldquo;{item.promptText}&rdquo;
                </p>
              </button>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Use in My Project"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#909090]">
            Prompt will be inserted at the top of your novel&apos;s first chapter as a writing
            starter block.
          </p>
          {novelProjects.length === 0 ? (
            <p className="text-sm text-[#c0c0c0]">
              No novel projects found. Create a novel first from the Novels tab.
            </p>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0]"
            >
              {novelProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowProjectModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={applyToProject}
              disabled={!selectedProjectId || applying || novelProjects.length === 0}
            >
              {applying ? "Inserting…" : "Continue"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
