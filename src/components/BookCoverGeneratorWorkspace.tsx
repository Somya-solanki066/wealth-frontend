"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookImage,
  Download,
  ImageIcon,
  Loader2,
  Lock,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isFreePlan } from "@/lib/plans";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import Modal from "@/components/ui/Modal";

type ProjectOption = { id: string; name: string; type?: string; coverImageUrl?: string };

type CoverResult = {
  id: string;
  title: string;
  authorName: string;
  showAuthor: boolean;
  platform: string;
  genre: string;
  mood: string;
  visualStyle: string;
  sceneDescription: string;
  coverFormat: string;
  artworkUrl: string;
  finalImageUrl?: string | null;
  thumbnailUrl?: string;
  version?: number;
  createdAt?: string | null;
};

type Phase = "form" | "preview" | "library";

const DEFAULT_PLATFORMS = [
  { id: "pocketfm", label: "PocketFM" },
  { id: "dreame", label: "Dreame" },
  { id: "goodnovel", label: "GoodNovel" },
  { id: "webnovel", label: "WebNovel" },
];

const DEFAULT_GENRES = [
  "Werewolf",
  "Vampire",
  "Billionaire Romance",
  "Contemporary Romance",
  "Fantasy",
  "Dark Romance",
  "Thriller",
  "Mystery",
  "Historical",
  "Urban Fiction",
  "Sci-Fi",
  "Horror",
];

const DEFAULT_MOODS = [
  "Dark",
  "Romantic",
  "Emotional",
  "Mysterious",
  "Intense",
  "Elegant",
  "Dangerous",
  "Cinematic",
  "Dreamy",
];

const DEFAULT_STYLES = [
  { id: "cinematic", label: "Cinematic", hint: "Movie-poster look" },
  { id: "illustrated", label: "Illustrated", hint: "Painted digital art" },
  { id: "photographic", label: "Photographic", hint: "Photoreal characters" },
  { id: "dark_fantasy", label: "Dark Fantasy", hint: "Mythic shadows" },
  { id: "minimal", label: "Minimal", hint: "Clean focal subject" },
  { id: "dramatic", label: "Dramatic", hint: "High contrast emotion" },
];

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load artwork"));
    img.src = src;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines;
}

async function composeCoverPng(opts: {
  artworkUrl: string;
  title: string;
  authorName: string;
  showAuthor: boolean;
}): Promise<Blob> {
  const img = await loadImage(opts.artworkUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || 1024;
  canvas.height = img.naturalHeight || 1792;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Soft vignette bands for readable typography
  const topGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.38);
  topGrad.addColorStop(0, "rgba(0,0,0,0.72)");
  topGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

  const bottomGrad = ctx.createLinearGradient(0, canvas.height * 0.72, 0, canvas.height);
  bottomGrad.addColorStop(0, "rgba(0,0,0,0)");
  bottomGrad.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

  const pad = canvas.width * 0.08;
  const titleSize = Math.round(canvas.width * 0.085);
  ctx.fillStyle = "#F7F1E3";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `700 ${titleSize}px Georgia, "Times New Roman", serif`;
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;

  const titleLines = wrapLines(ctx, opts.title, canvas.width - pad * 2, 3);
  const lineHeight = titleSize * 1.15;
  const titleStartY = canvas.height * 0.08;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, titleStartY + i * lineHeight);
  });

  if (opts.showAuthor && opts.authorName.trim()) {
    const authorSize = Math.round(canvas.width * 0.045);
    ctx.font = `600 ${authorSize}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = "#E8D9A8";
    ctx.shadowBlur = 8;
    ctx.fillText(
      opts.authorName.trim().toUpperCase(),
      canvas.width / 2,
      canvas.height - canvas.height * 0.08 - authorSize
    );
  }

  ctx.shadowBlur = 0;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to export cover"))),
      "image/png",
      0.95
    );
  });
}

export default function BookCoverGeneratorWorkspace({
  projects = [],
  onBack,
  onOpenProject,
  onProjectUpdated,
}: {
  projects?: ProjectOption[];
  onBack?: () => void;
  onOpenProject?: (project: ProjectOption) => void;
  onProjectUpdated?: (project: ProjectOption) => void;
}) {
  const { profile, loading: authLoading } = useAuth();
  const locked =
    !authLoading &&
    (isFreePlan({ id: profile?.subscriptionPlan || "free" }) || !profile?.subscriptionPlan);

  const [phase, setPhase] = useState<Phase>("form");
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [genres, setGenres] = useState(DEFAULT_GENRES);
  const [moods, setMoods] = useState(DEFAULT_MOODS);
  const [styles, setStyles] = useState(DEFAULT_STYLES);
  const [formats, setFormats] = useState([{ id: "serialized", label: "Serialized Fiction" }]);

  const [platform, setPlatform] = useState("dreame");
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showAuthor, setShowAuthor] = useState(true);
  const [genre, setGenre] = useState("Werewolf");
  const [mood, setMood] = useState("Dark");
  const [visualStyle, setVisualStyle] = useState("cinematic");
  const [sceneDescription, setSceneDescription] = useState("");
  const [coverFormat, setCoverFormat] = useState("serialized");

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [cover, setCover] = useState<CoverResult | null>(null);
  const [library, setLibrary] = useState<CoverResult[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectAction, setProjectAction] = useState<"save" | "use">("use");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const previewRef = useRef<HTMLDivElement>(null);

  const novelProjects = useMemo(
    () => projects.filter((p) => !p.type || p.type === "novel"),
    [projects]
  );

  const requirePremium = () => {
    if (!locked) return true;
    setShowPaywall(true);
    return false;
  };

  useEffect(() => {
    api
      .get("/writer/book-cover/meta")
      .then((res) => {
        if (res.data?.platforms?.length) setPlatforms(res.data.platforms);
        if (res.data?.genres?.length) setGenres(res.data.genres);
        if (res.data?.moods?.length) setMoods(res.data.moods);
        if (res.data?.visualStyles?.length) setStyles(res.data.visualStyles);
        if (res.data?.formats?.length) setFormats(res.data.formats);
      })
      .catch(() => undefined);
  }, []);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await api.get("/writer/book-cover/library");
      setLibrary(res.data?.covers || []);
    } catch {
      setLibrary([]);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const generate = async (parentCoverId?: string | null) => {
    if (!requirePremium()) return;
    if (!title.trim()) {
      setError("Enter a book title.");
      return;
    }
    setGenerating(true);
    setError("");
    try {
      const res = await api.post("/writer/book-cover/generate", {
        title: title.trim(),
        authorName: showAuthor ? authorName.trim() : "",
        showAuthor,
        platform,
        genre,
        mood,
        visualStyle,
        sceneDescription: sceneDescription.trim(),
        coverFormat,
        parentCoverId: parentCoverId || null,
      });
      setCover(res.data.cover);
      setPhase("preview");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired || err.response?.status === 403) {
        setShowPaywall(true);
      }
      setError(err.response?.data?.error || "Failed to generate cover.");
    } finally {
      setGenerating(false);
    }
  };

  const syncFormFromCover = (c: CoverResult) => {
    setTitle(c.title || "");
    setAuthorName(c.authorName || "");
    setShowAuthor(c.showAuthor !== false);
    setPlatform(c.platform || "dreame");
    setGenre(c.genre || "Werewolf");
    setMood(c.mood || "Dark");
    setVisualStyle(c.visualStyle || "cinematic");
    setSceneDescription(c.sceneDescription || "");
    setCoverFormat(c.coverFormat || "serialized");
  };

  const uploadFinal = async (c: CoverResult) => {
    const artBlob = await composeCoverPng({
      artworkUrl: c.artworkUrl,
      title: c.title,
      authorName: c.authorName,
      showAuthor: c.showAuthor !== false,
    });
    const form = new FormData();
    form.append("file", artBlob, `${c.id}-final.png`);
    const res = await api.post(`/writer/book-cover/${c.id}/final`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const finalImageUrl = res.data?.finalImageUrl as string;
    setCover((prev) => (prev ? { ...prev, finalImageUrl, thumbnailUrl: finalImageUrl } : prev));
    return finalImageUrl;
  };

  const downloadCover = async () => {
    if (!cover) return;
    setBusyAction("download");
    setError("");
    try {
      const composed = await composeCoverPng({
        artworkUrl: cover.artworkUrl,
        title: cover.title,
        authorName: cover.authorName,
        showAuthor: cover.showAuthor !== false,
      });
      const url = URL.createObjectURL(composed);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cover.title.replace(/[^\w\-]+/g, "_") || "cover"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Download failed.");
    } finally {
      setBusyAction("");
    }
  };

  const openProjectModal = (action: "save" | "use") => {
    if (!cover) return;
    setProjectAction(action);
    setSelectedProjectId(novelProjects[0]?.id || "");
    setShowProjectModal(true);
  };

  const confirmProjectAction = async () => {
    if (!cover || !selectedProjectId) {
      setError("Select a novel project.");
      return;
    }
    setBusyAction(projectAction);
    setError("");
    try {
      await uploadFinal(cover);
      if (projectAction === "use" || projectAction === "save") {
        const res = await api.post(`/writer/book-cover/${cover.id}/apply-to-project`, {
          projectId: selectedProjectId,
        });
        const project = res.data?.project as ProjectOption;
        onProjectUpdated?.(project);
        setShowProjectModal(false);
        if (projectAction === "use" && project && onOpenProject) {
          onOpenProject(project);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to save cover to project.");
    } finally {
      setBusyAction("");
    }
  };

  const saveCoverOnly = async () => {
    if (!cover) return;
    setBusyAction("save");
    setError("");
    try {
      await uploadFinal(cover);
      await loadLibrary();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save cover.");
    } finally {
      setBusyAction("");
    }
  };

  const deleteCover = async (id: string) => {
    try {
      await api.delete(`/writer/book-cover/${id}`);
      setLibrary((prev) => prev.filter((c) => c.id !== id));
      if (cover?.id === id) {
        setCover(null);
        setPhase("form");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete cover.");
    }
  };

  const openLibraryItem = (c: CoverResult) => {
    syncFormFromCover(c);
    setCover(c);
    setPhase("preview");
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
            <BookImage className="h-6 w-6 text-[var(--gd)]" />
            Book Cover Generator
            {locked && <Lock className="h-4 w-4 text-[var(--gd)]" />}
          </h2>
          <p className="mt-1 text-xs text-[#707070]">
            Platform-aware artwork + exact title/author typography — then save to your novel.
          </p>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl border border-[#2a1e00] bg-[#161000]/80 p-1">
        {(
          [
            { id: "form", label: "Create" },
            { id: "preview", label: "Preview" },
            { id: "library", label: "My Covers" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setPhase(t.id);
              if (t.id === "library") void loadLibrary();
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              phase === t.id
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

      {phase === "form" && (
        <div className="rounded-2xl border border-[#2a1e00] bg-[#161000] p-5 space-y-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#707070] mb-2">
              Platform aesthetic
            </div>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    platform === p.id
                      ? "border-[var(--gd)] bg-[var(--gd)]/15 text-[var(--gd)]"
                      : "border-[#2a1e00] bg-[#0f0f00] text-[#c0c0c0] hover:border-[var(--gm)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
              Book title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Finding My Fated Mate"
              className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0] outline-none focus:border-[var(--gd)]"
            />
          </label>

          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
              Author name
            </span>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              disabled={!showAuthor}
              placeholder="Somya Solanki"
              className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0] outline-none focus:border-[var(--gd)] disabled:opacity-40"
            />
            <label className="flex items-center gap-2 text-xs text-[#808080]">
              <input
                type="checkbox"
                checked={!showAuthor}
                onChange={(e) => setShowAuthor(!e.target.checked)}
              />
              Don&apos;t show author name
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
                Genre
              </span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0]"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
                Mood
              </span>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0]"
              >
                {moods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#707070] mb-2">
              Visual style
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setVisualStyle(s.id)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    visualStyle === s.id
                      ? "border-[var(--gd)] bg-[var(--gd)]/10"
                      : "border-[#2a1e00] bg-[#0f0f00] hover:border-[var(--gm)]"
                  }`}
                >
                  <div className="text-xs font-bold text-[#f0ebe0]">{s.label}</div>
                  <div className="mt-1 text-[10px] text-[#606060]">{s.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
              Character / scene{" "}
              <span className="normal-case font-normal text-[#505050]">(optional)</span>
            </span>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              rows={3}
              placeholder="A powerful alpha standing behind a woman under a full moon..."
              className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0] outline-none focus:border-[var(--gd)] resize-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
              Cover format
            </span>
            <select
              value={coverFormat}
              onChange={(e) => setCoverFormat(e.target.value)}
              className="w-full rounded-xl border border-[#2a1e00] bg-[#0f0f00] px-3 py-2.5 text-sm text-[#f0ebe0]"
            >
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            onClick={() => generate()}
            disabled={generating}
            className="w-full !bg-[var(--gd)] !text-[#0a0a0a] hover:!bg-[var(--gl)] font-bold"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Generating…
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-1.5" /> Generate cover
              </>
            )}
          </Button>
        </div>
      )}

      {phase === "preview" && (
        <div className="space-y-4">
          {!cover ? (
            <p className="rounded-2xl border border-[#2a1e00] bg-[#161000] px-5 py-10 text-center text-sm text-[#707070]">
              Generate a cover to see the preview here.
            </p>
          ) : (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#707070]">
                Generated cover · v{cover.version || 1}
              </div>
              <div
                ref={previewRef}
                className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-2xl border border-[#2a1e00] shadow-2xl aspect-[9/16] bg-[#0a0a0a]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.artworkUrl}
                  alt={cover.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/75 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute inset-x-0 top-6 px-4 text-center">
                  <h3 className="font-serif text-xl font-bold leading-tight text-[#f7f1e3] drop-shadow-lg">
                    {cover.title}
                  </h3>
                </div>
                {cover.showAuthor !== false && cover.authorName ? (
                  <div className="absolute inset-x-0 bottom-5 px-4 text-center">
                    <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#e8d9a8]">
                      {cover.authorName}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  disabled={generating}
                  onClick={() => generate(cover.id)}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                  )}
                  Regenerate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    syncFormFromCover(cover);
                    setPhase("form");
                  }}
                >
                  Edit details
                </Button>
                <Button
                  variant="outline"
                  disabled={!!busyAction}
                  onClick={saveCoverOnly}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {busyAction === "save" ? "Saving…" : "Save cover"}
                </Button>
                <Button variant="outline" disabled={!!busyAction} onClick={downloadCover}>
                  <Download className="h-4 w-4 mr-1.5" />
                  {busyAction === "download" ? "…" : "Download"}
                </Button>
              </div>
              <Button
                className="w-full"
                disabled={!!busyAction}
                onClick={() => openProjectModal("use")}
              >
                Use in My Project
              </Button>
            </>
          )}
        </div>
      )}

      {phase === "library" && (
        <div className="space-y-3">
          {libraryLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : library.length === 0 ? (
            <p className="rounded-2xl border border-[#2a1e00] bg-[#161000] px-5 py-10 text-center text-sm text-[#707070]">
              No saved covers yet. Generate one and hit Save cover.
            </p>
          ) : (
            library.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 rounded-2xl border border-[#2a1e00] bg-[#161000] p-3"
              >
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-[#0a0a0a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl || item.finalImageUrl || item.artworkUrl}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <div className="truncate font-serif text-sm font-bold text-[#f0ebe0]">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[#606060]">
                      v{item.version || 1}
                      {item.createdAt
                        ? ` · ${new Date(item.createdAt).toLocaleDateString()}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openLibraryItem(item)}>
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCover(item);
                        syncFormFromCover(item);
                        openProjectModal("use");
                      }}
                    >
                      Use
                    </Button>
                    <button
                      type="button"
                      onClick={() => deleteCover(item.id)}
                      className="inline-flex items-center gap-1 text-xs text-[#909090] hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title={projectAction === "use" ? "Use in My Project" : "Save to Project"}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#909090]">
            The finished cover (artwork + exact title/author) will be attached to the selected
            novel project.
          </p>
          {novelProjects.length === 0 ? (
            <p className="text-sm text-[#c0c0c0]">Create a novel project first.</p>
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
              onClick={confirmProjectAction}
              disabled={!selectedProjectId || !!busyAction || novelProjects.length === 0}
            >
              {busyAction ? "Working…" : "Continue"}
            </Button>
          </div>
        </div>
      </Modal>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
