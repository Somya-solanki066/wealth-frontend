"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Clapperboard,
  Flag,
  Heart,
  Loader2,
  Lock,
  Plus,
  Search,
  Share2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isFreePlan } from "@/lib/plans";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import Modal from "@/components/ui/Modal";

type Film = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  genre: string;
  language: string;
  contentRating: string;
  director: string;
  writer: string;
  cast: string;
  productionYear?: number | null;
  country?: string;
  durationSeconds: number;
  durationLabel: string;
  thumbnailUrl: string;
  videoUrl: string;
  externalVideoUrl: string;
  status: string;
  rejectReason?: string | null;
  views: number;
  likes: number;
  publishedAt?: string | null;
  liked?: boolean;
  saved?: boolean;
  isOwner?: boolean;
};

type Tab = "discover" | "watch" | "upload" | "mine" | "saved" | "creator";

const GENRES = [
  "All",
  "Drama",
  "Thriller",
  "Comedy",
  "Romance",
  "Horror",
  "Action",
  "Documentary",
  "Animation",
];

function youtubeEmbed(url: string) {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const m = url.match(/(?:youtu\.be\/|v=|\/shorts\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function FilmCard({
  film,
  onOpen,
}: {
  film: Film;
  onOpen: (f: Film) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(film)}
      className="group text-left overflow-hidden rounded-2xl border border-[#2a1018] bg-[#160004] transition hover:border-[var(--gd)]"
    >
      <div className="relative aspect-video bg-[#0a0004]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={film.thumbnailUrl || "/placeholder-film.jpg"}
          alt={film.title}
          className="h-full w-full object-cover opacity-90 group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
          {film.durationLabel}
        </span>
      </div>
      <div className="p-3">
        <h3 className="font-serif text-sm font-bold text-[#f0ebe0] line-clamp-2">{film.title}</h3>
        <p className="mt-1 text-[11px] text-[#808080]">
          {film.genre} · {film.durationLabel}
        </p>
        <p className="mt-0.5 text-[11px] text-[#606060]">by {film.creatorName}</p>
      </div>
    </button>
  );
}

export default function ShortFilmShowcaseWorkspace({ onBack }: { onBack?: () => void }) {
  const { profile, loading: authLoading } = useAuth();
  const locked =
    !authLoading &&
    (isFreePlan({ id: profile?.subscriptionPlan || "free" }) || !profile?.subscriptionPlan);

  const [tab, setTab] = useState<Tab>("discover");
  const [films, setFilms] = useState<Film[]>([]);
  const [mine, setMine] = useState<Film[]>([]);
  const [saved, setSaved] = useState<Film[]>([]);
  const [genre, setGenre] = useState("All");
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const [active, setActive] = useState<Film | null>(null);
  const [creatorId, setCreatorId] = useState("");
  const [creatorFilms, setCreatorFilms] = useState<Film[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<{
    name: string;
    filmsCount: number;
    totalViews: number;
  } | null>(null);

  const [draftId, setDraftId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    genre: "Drama",
    language: "English",
    contentRating: "General",
    director: "",
    writer: "",
    cast: "",
    productionYear: String(new Date().getFullYear()),
    country: "Nigeria",
    durationSeconds: "0",
    externalVideoUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Inappropriate content");
  const viewCounted = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const requirePremiumForUpload = () => {
    if (!locked) return true;
    setShowPaywall(true);
    return false;
  };

  const loadDiscover = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (genre !== "All") params.set("genre", genre);
      if (search.trim()) params.set("search", search.trim());
      params.set("sort", sort);
      const res = await api.get(`/showcase/films?${params.toString()}`);
      setFilms(res.data?.films || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load films.");
    } finally {
      setLoading(false);
    }
  }, [genre, search, sort]);

  const loadMine = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/showcase/mine");
      setMine(res.data?.films || []);
    } catch {
      setMine([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/showcase/saved");
      setSaved(res.data?.films || []);
    } catch {
      setSaved([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "discover") void loadDiscover();
    if (tab === "mine") void loadMine();
    if (tab === "saved") void loadSaved();
  }, [tab, loadDiscover, loadMine, loadSaved]);

  const openFilm = async (film: Film) => {
    setError("");
    viewCounted.current = false;
    try {
      const res = await api.get(`/showcase/films/${film.id}`);
      setActive(res.data.film);
      setTab("watch");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to open film.");
    }
  };

  const onPlaybackProgress = async () => {
    if (!active || viewCounted.current) return;
    const v = videoRef.current;
    if (v && v.currentTime >= 3) {
      viewCounted.current = true;
      try {
        const res = await api.post(`/showcase/films/${active.id}/view`);
        setActive((prev) => (prev ? { ...prev, views: res.data.views } : prev));
      } catch {
        /* ignore */
      }
    }
  };

  const toggleLike = async () => {
    if (!active) return;
    try {
      const res = await api.post(`/showcase/films/${active.id}/like`);
      setActive((prev) =>
        prev ? { ...prev, liked: res.data.liked, likes: res.data.likes } : prev
      );
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to like.");
    }
  };

  const toggleSave = async () => {
    if (!active) return;
    try {
      const res = await api.post(`/showcase/films/${active.id}/save`);
      setActive((prev) => (prev ? { ...prev, saved: res.data.saved } : prev));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save.");
    }
  };

  const shareFilm = async () => {
    if (!active) return;
    const url = `${window.location.origin}/dashboard?tab=short-film-showcase&film=${active.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: active.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setError("");
        alert("Link copied.");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* ignore */
      }
    }
  };

  const submitReport = async () => {
    if (!active) return;
    try {
      await api.post(`/showcase/films/${active.id}/report`, { reason: reportReason });
      setReportOpen(false);
      alert("Report submitted. Thank you.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to report.");
    }
  };

  const openCreator = async (id: string) => {
    setCreatorId(id);
    setLoading(true);
    try {
      const res = await api.get(`/showcase/creator/${id}`);
      setCreatorProfile(res.data.profile);
      setCreatorFilms(res.data.films || []);
      setTab("creator");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load creator.");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (): Promise<string | null> => {
    if (!requirePremiumForUpload()) return null;
    if (!form.title.trim()) {
      setError("Title is required.");
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        productionYear: Number(form.productionYear) || null,
        durationSeconds: Number(form.durationSeconds) || 0,
      };
      let film: Film;
      if (draftId) {
        const res = await api.put(`/showcase/films/${draftId}`, payload);
        film = res.data.film;
      } else {
        const res = await api.post("/showcase/films", payload);
        film = res.data.film;
        setDraftId(film.id);
      }
      setDraftId(film.id);
      return film.id;
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "Failed to save draft.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadFile = async (kind: "video" | "thumbnail", file: File) => {
    if (!requirePremiumForUpload()) return;
    let id = draftId || (await saveDraft());
    if (!id) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      await api.post(`/showcase/films/${id}/upload`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (kind === "video" && file.type.startsWith("video/")) {
        const url = URL.createObjectURL(file);
        const vid = document.createElement("video");
        vid.preload = "metadata";
        vid.onloadedmetadata = async () => {
          const secs = Math.round(vid.duration || 0);
          URL.revokeObjectURL(url);
          setForm((f) => ({ ...f, durationSeconds: String(secs) }));
          await api.put(`/showcase/films/${id}`, { durationSeconds: secs });
        };
        vid.src = url;
      }
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const submitReview = async () => {
    if (!requirePremiumForUpload()) return;
    const id = draftId || (await saveDraft());
    if (!id) {
      setError("Save a draft first.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/showcase/films/${id}/submit`);
      setTab("mine");
      setDraftId("");
      void loadMine();
    } catch (err: any) {
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setSaving(false);
    }
  };

  const startUpload = () => {
    if (!requirePremiumForUpload()) return;
    setDraftId("");
    setForm({
      title: "",
      description: "",
      genre: "Drama",
      language: "English",
      contentRating: "General",
      director: "",
      writer: "",
      cast: "",
      productionYear: String(new Date().getFullYear()),
      country: "Nigeria",
      durationSeconds: "0",
      externalVideoUrl: "",
    });
    setTab("upload");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const filmId = params.get("film");
    if (filmId) {
      void openFilm({ id: filmId } as Film);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recent = useMemo(() => films.slice(0, 12), [films]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-[#909090] hover:text-[var(--gd)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          )}
          <h2 className="font-serif text-2xl font-bold text-[#f0ebe0] flex items-center gap-2">
            <Clapperboard className="h-6 w-6 text-[var(--gd)]" />
            Short Film Showcase
            {locked && <Lock className="h-4 w-4 text-[var(--gd)]" />}
          </h2>
          <p className="mt-1 text-xs text-[#707070]">
            Discover indie shorts — watch, like, save, or upload for review.
          </p>
        </div>
        <Button size="sm" onClick={startUpload}>
          <Plus className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-[#2a1018] bg-[#160004]/80 p-1">
        {(
          [
            { id: "discover", label: "Discover" },
            { id: "mine", label: "My Films" },
            { id: "saved", label: "Saved" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === t.id ? "bg-[var(--gd)] text-white" : "text-[#909090] hover:text-[#f0ebe0]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {tab === "discover" && (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#606060]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDiscover()}
                placeholder="Search films..."
                className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] py-2.5 pl-9 pr-3 text-sm text-[#f0ebe0] outline-none focus:border-[var(--gd)]"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-[#2a1018] bg-[#160004] px-3 py-2.5 text-xs text-[#f0ebe0]"
            >
              <option value="latest">Latest</option>
              <option value="views">Most Viewed</option>
              <option value="likes">Most Liked</option>
            </select>
            <Button variant="outline" onClick={() => loadDiscover()}>
              Search
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  genre === g
                    ? "bg-[var(--gd)] text-white"
                    : "bg-[#160004] text-[#909090] border border-[#2a1018]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#707070]">
            Recently uploaded
          </h3>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#2a1018] py-12 text-center text-sm text-[#707070]">
              No published films yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {recent.map((f) => (
                <FilmCard key={f.id} film={f} onOpen={openFilm} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "watch" && active && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setTab("discover")}
            className="text-xs text-[#909090] hover:text-[var(--gd)]"
          >
            ← Back to showcase
          </button>

          <div className="overflow-hidden rounded-2xl border border-[#2a1018] bg-black aspect-video">
            {active.videoUrl ? (
              <video
                ref={videoRef}
                src={active.videoUrl}
                poster={active.thumbnailUrl || undefined}
                controls
                playsInline
                className="h-full w-full"
                onTimeUpdate={onPlaybackProgress}
              />
            ) : active.externalVideoUrl ? (
              <iframe
                title={active.title}
                src={youtubeEmbed(active.externalVideoUrl)}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => {
                  if (!viewCounted.current) {
                    viewCounted.current = true;
                    void api.post(`/showcase/films/${active.id}/view`).then((res) => {
                      setActive((prev) => (prev ? { ...prev, views: res.data.views } : prev));
                    });
                  }
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#707070]">
                No video available
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold text-[#f0ebe0]">{active.title}</h3>
            <p className="mt-1 text-xs text-[#808080]">
              {active.genre} · {active.durationLabel}
              {active.views ? ` · ${active.views} views` : ""}
            </p>
            <button
              type="button"
              onClick={() => openCreator(active.creatorId)}
              className="mt-1 text-xs text-[var(--gd)] hover:underline"
            >
              by {active.creatorName}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={toggleLike}>
              <Heart
                className={`h-4 w-4 mr-1 ${active.liked ? "fill-[var(--gd)] text-[var(--gd)]" : ""}`}
              />
              {active.likes || 0}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleSave}>
              {active.saved ? (
                <BookmarkCheck className="h-4 w-4 mr-1" />
              ) : (
                <Bookmark className="h-4 w-4 mr-1" />
              )}
              {active.saved ? "Saved" : "Save"}
            </Button>
            <Button variant="outline" size="sm" onClick={shareFilm}>
              <Share2 className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4 mr-1" /> Report
            </Button>
          </div>

          {active.description && (
            <div className="rounded-2xl border border-[#2a1018] bg-[#160004] p-4">
              <h4 className="text-[11px] font-semibold uppercase text-[#707070] mb-2">
                Description
              </h4>
              <p className="text-sm text-[#c0c0c0] leading-relaxed">{active.description}</p>
            </div>
          )}

          <div className="rounded-2xl border border-[#2a1018] bg-[#160004] p-4 space-y-1 text-xs text-[#909090]">
            <h4 className="text-[11px] font-semibold uppercase text-[#707070] mb-2">Credits</h4>
            {active.director && <p>Director: {active.director}</p>}
            {active.writer && <p>Writer: {active.writer}</p>}
            {active.cast && <p>Cast: {active.cast}</p>}
            {active.productionYear && <p>Year: {active.productionYear}</p>}
            {active.language && <p>Language: {active.language}</p>}
          </div>
        </div>
      )}

      {tab === "upload" && (
        <div className="rounded-2xl border border-[#2a1018] bg-[#160004] p-5 space-y-3">
          <h3 className="font-serif text-lg font-bold text-[#f0ebe0]">Upload Short Film</h3>
          {(
            [
              ["title", "Film Title"],
              ["director", "Director"],
              ["writer", "Writer"],
              ["cast", "Cast"],
              ["country", "Country / Location"],
              ["externalVideoUrl", "External Video URL (optional YouTube)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#707070]">{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold uppercase text-[#707070]">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0] resize-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#707070]">Genre</span>
              <select
                value={form.genre}
                onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
                className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
              >
                {GENRES.filter((g) => g !== "All").map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-[10px] font-semibold uppercase text-[#707070]">
                Content Rating
              </span>
              <select
                value={form.contentRating}
                onChange={(e) => setForm((f) => ({ ...f, contentRating: e.target.value }))}
                className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
              >
                <option value="General">General</option>
                <option value="Mature">Mature</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a1018] px-3 py-6 text-xs text-[#909090] hover:border-[var(--gd)]">
              <Upload className="h-5 w-5" />
              {uploading ? "Uploading…" : "Upload Video"}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile("video", f);
                }}
              />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a1018] px-3 py-6 text-xs text-[#909090] hover:border-[var(--gd)]">
              <Upload className="h-5 w-5" />
              Upload Thumbnail
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile("thumbnail", f);
                }}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" disabled={saving || uploading} onClick={saveDraft}>
              {saving ? "Saving…" : "Save Draft"}
            </Button>
            <Button disabled={saving || uploading} onClick={submitReview}>
              Submit for Review
            </Button>
          </div>
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : mine.length === 0 ? (
            <p className="text-center text-sm text-[#707070] py-10">No films uploaded yet.</p>
          ) : (
            mine.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#2a1018] bg-[#160004] p-4"
              >
                <div>
                  <div className="font-serif text-sm font-bold text-[#f0ebe0]">{f.title}</div>
                  <div className="text-[10px] uppercase text-[#707070]">
                    {f.status.replace("_", " ")}
                    {f.rejectReason ? ` · ${f.rejectReason}` : ""}
                  </div>
                </div>
                {f.status === "published" ? (
                  <Button size="sm" variant="outline" onClick={() => openFilm(f)}>
                    Open
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-2 flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : saved.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-[#707070] py-10">No saved films.</p>
          ) : (
            saved.map((f) => <FilmCard key={f.id} film={f} onOpen={openFilm} />)
          )}
        </div>
      )}

      {tab === "creator" && creatorProfile && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setTab("watch")}
            className="text-xs text-[#909090] hover:text-[var(--gd)]"
          >
            ← Back
          </button>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#f0ebe0]">{creatorProfile.name}</h3>
            <p className="text-xs text-[#707070]">Short Film Creator</p>
            <p className="mt-2 text-xs text-[#909090]">
              Films: {creatorProfile.filmsCount} · Total Views: {creatorProfile.totalViews}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {creatorFilms.map((f) => (
              <FilmCard key={f.id} film={f} onOpen={openFilm} />
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Report Film">
        <div className="space-y-3">
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
          >
            {[
              "Inappropriate content",
              "Copyright concern",
              "Spam",
              "Violence",
              "Other",
            ].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport}>Submit Report</Button>
          </div>
        </div>
      </Modal>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
