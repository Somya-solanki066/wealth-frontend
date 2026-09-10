"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  IdCard,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Step = "view" | "edit" | "work-detail" | "inquiries";

type Social = {
  youtube?: string;
  tiktok?: string;
  instagram?: string;
  portfolioSite?: string;
  imdb?: string;
  linkedin?: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  year?: string;
  proofUrl?: string;
};

type Work = {
  id: string;
  title: string;
  workType: string;
  genre: string;
  status: string;
  logline: string;
  pagesOrEpisodes?: string;
  role: string;
  year?: string;
  externalLink?: string;
  sampleText?: string;
  sampleLabel?: string;
};

type Portfolio = {
  id?: string;
  displayName: string;
  professionalTitle: string;
  genres: string[];
  about: string;
  yearsExperience?: number;
  location?: string;
  languages?: string;
  availableForWork: boolean;
  pricingModel: string;
  rateAmount: number;
  rateCurrency: string;
  rateNegotiable: boolean;
  social: Social;
  achievements: Achievement[];
  works: Work[];
  photoUrl?: string;
  slug: string;
  publishStatus: string;
  verificationStatus: string;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const emptyPortfolio = (): Portfolio => ({
  displayName: "",
  professionalTitle: "Screenwriter",
  genres: [],
  about: "",
  availableForWork: true,
  pricingModel: "per-page",
  rateAmount: 25000,
  rateCurrency: "NGN",
  rateNegotiable: true,
  social: {},
  achievements: [],
  works: [],
  slug: "",
  publishStatus: "draft",
  verificationStatus: "unverified",
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SW";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "SW";
}

function formatRate(p: Portfolio) {
  const n = Number(p.rateAmount || 0);
  const amt = p.rateCurrency === "NGN" ? (n >= 1000 ? `₦${Math.round(n / 1000)}k` : `₦${n}`) : `${n}`;
  const unit =
    p.pricingModel === "per-page" ? "Per page" : p.pricingModel === "per-script" ? "Per script" : "Per project";
  return { amt, unit };
}

function workTypeLabel(t: string) {
  return t === "short" ? "Short" : t === "tv" ? "TV" : t === "series" ? "Serial" : t === "theatre" ? "Theatre" : "Feature";
}

function workIcon(t: string) {
  if (t === "short") return "🎬";
  if (t === "series") return "📖";
  if (t === "tv") return "🎥";
  return "📜";
}

export default function ScreenwriterPortfolioWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("view");
  const [portfolio, setPortfolio] = useState<Portfolio>(emptyPortfolio());
  const [stats, setStats] = useState({ scriptsSold: 0, rating: null as number | null, responseTimeLabel: null as string | null });
  const [genres, setGenres] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<{ id: string; label: string }[]>([]);
  const [workStatuses, setWorkStatuses] = useState<{ id: string; label: string }[]>([]);
  const [pricingModels, setPricingModels] = useState<{ id: string; label: string }[]>([]);
  const [activeWork, setActiveWork] = useState<Work | null>(null);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [showAchForm, setShowAchForm] = useState(false);
  const [achDraft, setAchDraft] = useState({ title: "", description: "", year: "", proofUrl: "" });
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get("/screenwriter/portfolio/mine");
      if (res.data.portfolio) setPortfolio(res.data.portfolio);
      if (res.data.stats) setStats(res.data.stats);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/screenwriter/portfolio/meta").then((res) => {
      setGenres(res.data.genres || []);
      setWorkTypes(res.data.workTypes || []);
      setWorkStatuses(res.data.workStatuses || []);
      setPricingModels(res.data.pricingModels || []);
    });
    void load();
  }, [load]);

  const rate = useMemo(() => formatRate(portfolio), [portfolio]);
  const socialEntries = useMemo(() => {
    const s = portfolio.social || {};
    return [
      { key: "youtube", label: "YouTube", url: s.youtube },
      { key: "tiktok", label: "TikTok", url: s.tiktok },
      { key: "instagram", label: "Instagram", url: s.instagram },
      { key: "portfolioSite", label: "Portfolio site", url: s.portfolioSite },
      { key: "imdb", label: "IMDb", url: s.imdb },
      { key: "linkedin", label: "LinkedIn", url: s.linkedin },
    ].filter((x) => x.url);
  }, [portfolio.social]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-white" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const save = async (opts?: { publish?: boolean }) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/screenwriter/portfolio/save", {
        ...portfolio,
        publish: opts?.publish,
        publishStatus: opts?.publish ? "published" : portfolio.publishStatus,
      });
      setPortfolio(res.data.portfolio);
      if (res.data.stats) setStats(res.data.stats);
      showToast(opts?.publish ? "Profile published" : "Profile saved");
      setStep("view");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const requestVerify = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/screenwriter/portfolio/verify", {});
      if (res.data.portfolio) setPortfolio(res.data.portfolio);
      showToast("Verification submitted — pending admin review");
    } catch (err: any) {
      setError(err.response?.data?.error || "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadInquiries = async () => {
    try {
      const res = await api.get("/screenwriter/portfolio/inquiries");
      setInquiries(res.data.inquiries || []);
      setStep("inquiries");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load inquiries.");
    }
  };

  const addAchievement = () => {
    if (!achDraft.title.trim()) return;
    setPortfolio({
      ...portfolio,
      achievements: [
        ...portfolio.achievements,
        {
          id: `ach_${Date.now()}`,
          title: achDraft.title.trim(),
          description: achDraft.description.trim(),
          year: achDraft.year.trim() || undefined,
          proofUrl: achDraft.proofUrl.trim() || undefined,
        },
      ],
    });
    setAchDraft({ title: "", description: "", year: "", proofUrl: "" });
    setShowAchForm(false);
  };

  const saveWork = () => {
    if (!editingWork?.title.trim()) {
      setError("Work title is required.");
      return;
    }
    const exists = portfolio.works.some((w) => w.id === editingWork.id);
    setPortfolio({
      ...portfolio,
      works: exists
        ? portfolio.works.map((w) => (w.id === editingWork.id ? editingWork : w))
        : [...portfolio.works, editingWork],
    });
    setEditingWork(null);
    setError("");
  };

  const publicUrl =
    typeof window !== "undefined" && portfolio.slug
      ? `${window.location.origin}/screenwriter-portfolio/${portfolio.slug}`
      : "";

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "edit" || step === "work-detail" || step === "inquiries") {
            setStep("view");
            setActiveWork(null);
            setEditingWork(null);
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "view" ? "Script Hub" : "Screenwriter Portfolio"}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gd)]/40 bg-[#3a1a14] text-[var(--gd)]">
          <IdCard size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Screenwriter Portfolio</h2>
          <p className="mt-1 text-sm text-[#909090]">
            Public profile for directors and producers
          </p>
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

      {step === "inquiries" && (
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No hire inquiries yet.
            </p>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
                <div className="font-medium text-white">{inq.projectTitle}</div>
                <div className="mt-1 text-xs text-[#909090]">
                  From {inq.fromName} · {inq.fromEmail}
                </div>
                <p className="mt-2 text-sm text-[#c8c4bc]">{inq.lookingFor}</p>
                <p className="mt-2 text-sm text-[#F0EBE0]">{inq.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {step === "work-detail" && activeWork && (
        <div className="space-y-4 rounded-2xl border border-[#242424] bg-[#161616] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">Portfolio work</p>
          <h3 className="font-serif text-2xl text-white">{activeWork.title}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-[#242424] py-2">
              <span className="text-[#909090]">Type</span>
              <span>{workTypeLabel(activeWork.workType)}</span>
            </div>
            <div className="flex justify-between border-b border-[#242424] py-2">
              <span className="text-[#909090]">Genre</span>
              <span>{activeWork.genre || "—"}</span>
            </div>
            <div className="flex justify-between border-b border-[#242424] py-2">
              <span className="text-[#909090]">Status</span>
              <span className="capitalize">{activeWork.status}</span>
            </div>
            {activeWork.pagesOrEpisodes && (
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#909090]">Pages / episodes</span>
                <span>{activeWork.pagesOrEpisodes}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-[#242424] py-2">
              <span className="text-[#909090]">Role</span>
              <span>{activeWork.role}</span>
            </div>
            {activeWork.year && (
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#909090]">Year</span>
                <span>{activeWork.year}</span>
              </div>
            )}
          </div>
          {activeWork.logline && (
            <div>
              <p className={labelClass}>Logline</p>
              <p className="text-sm text-[#F0EBE0]">{activeWork.logline}</p>
            </div>
          )}
          {activeWork.sampleText && (
            <div>
              <p className={labelClass}>{activeWork.sampleLabel || "Writing sample (preview)"}</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#242424] bg-[#121212] p-3 font-serif text-xs text-[#c8c4bc]">
                {activeWork.sampleText.slice(0, 1500)}
              </pre>
            </div>
          )}
        </div>
      )}

      {step === "view" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--gd)] font-serif text-xl font-bold text-zinc-950">
                {initials(portfolio.displayName || "SW")}
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-bold text-white">
                  {portfolio.displayName || "Your name"}
                </h3>
                <p className="text-sm text-[#909090]">
                  {portfolio.professionalTitle}
                  {portfolio.genres.length ? ` · ${portfolio.genres.slice(0, 2).join(" & ")}` : ""}
                </p>
                {portfolio.verificationStatus === "approved" ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--gd)]">✓ Verified writer</p>
                ) : (
                  <p className="mt-1 text-xs text-[#606060]">
                    Verification: {portfolio.verificationStatus}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="font-serif text-lg font-bold text-white">{rate.amt}</div>
                <div className="text-[10px] text-[#606060]">{rate.unit}</div>
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-white">
                  {stats.rating != null ? `${stats.rating}★` : "—"}
                </div>
                <div className="text-[10px] text-[#606060]">Rating</div>
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-white">{stats.scriptsSold}</div>
                <div className="text-[10px] text-[#606060]">Scripts sold</div>
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-white">
                  {stats.responseTimeLabel || "—"}
                </div>
                <div className="text-[10px] text-[#606060]">Response</div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[#606060]">
              Scripts sold / rating / response come from marketplace & platform data — not editable here.
            </p>
          </div>

          {portfolio.about && (
            <div>
              <p className={labelClass}>About</p>
              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 text-sm text-[#F0EBE0]">
                {portfolio.about}
              </div>
            </div>
          )}

          {socialEntries.length > 0 && (
            <div>
              <p className={labelClass}>Social & links</p>
              <div className="flex flex-wrap gap-2">
                {socialEntries.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#333] bg-[#161616] px-3 py-1.5 text-xs text-[#c8c4bc]"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {portfolio.achievements.length > 0 && (
            <div>
              <p className={labelClass}>Achievements</p>
              <div className="overflow-hidden rounded-2xl border border-[#242424] bg-[#161616]">
                {portfolio.achievements.map((a, i) => (
                  <div
                    key={a.id}
                    className={`px-4 py-3 ${i > 0 ? "border-t border-[#242424]" : ""}`}
                  >
                    <div className="font-medium text-white">🏆 {a.title}</div>
                    {a.description && (
                      <div className="mt-0.5 text-xs text-[#909090]">{a.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolio.works.length > 0 && (
            <div>
              <p className={labelClass}>Portfolio</p>
              <div className="grid grid-cols-2 gap-3">
                {portfolio.works.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setActiveWork(w);
                      setStep("work-detail");
                    }}
                    className="rounded-2xl border border-[#242424] bg-[#161616] p-4 text-left hover:border-[#333]"
                  >
                    <div className="mb-3 text-2xl">{workIcon(w.workType)}</div>
                    <div className="font-medium text-white line-clamp-2">{w.title}</div>
                    <div className="mt-1 text-[11px] text-[#909090]">
                      {workTypeLabel(w.workType)} · {w.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Button variant="secondary" className="w-full border-[var(--gd)] text-[var(--gd)]" onClick={() => setStep("edit")}>
              Edit profile
            </Button>
            <Button className="w-full bg-[var(--gd)] text-white hover:opacity-90" onClick={() => void save({ publish: true })} disabled={busy}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Publish profile
            </Button>
            {portfolio.verificationStatus !== "approved" && portfolio.verificationStatus !== "pending" && (
              <Button variant="secondary" onClick={() => void requestVerify()} disabled={busy}>
                Request verification
              </Button>
            )}
            <Button variant="secondary" onClick={() => void loadInquiries()}>
              Hire inquiries
            </Button>
            {portfolio.publishStatus === "published" && publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm text-[var(--gd)]"
              >
                <ExternalLink size={14} /> View public profile
              </a>
            )}
          </div>
        </div>
      )}

      {step === "edit" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Profile photo URL</span>
            <input
              className={inputClass}
              placeholder="https://…"
              value={portfolio.photoUrl || ""}
              onChange={(e) => setPortfolio({ ...portfolio, photoUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Name</span>
            <input
              className={inputClass}
              value={portfolio.displayName}
              onChange={(e) => setPortfolio({ ...portfolio, displayName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Professional title</span>
            <input
              className={inputClass}
              value={portfolio.professionalTitle}
              onChange={(e) => setPortfolio({ ...portfolio, professionalTitle: e.target.value })}
            />
          </label>
          <div>
            <p className={labelClass}>Genres</p>
            <div className="flex flex-wrap gap-2">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={pill(portfolio.genres.includes(g))}
                  onClick={() =>
                    setPortfolio({
                      ...portfolio,
                      genres: portfolio.genres.includes(g)
                        ? portfolio.genres.filter((x) => x !== g)
                        : [...portfolio.genres, g],
                    })
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className={labelClass}>About</span>
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={portfolio.about}
              onChange={(e) => setPortfolio({ ...portfolio, about: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Years of experience</span>
              <input
                type="number"
                className={inputClass}
                value={portfolio.yearsExperience ?? ""}
                onChange={(e) =>
                  setPortfolio({ ...portfolio, yearsExperience: Number(e.target.value) || undefined })
                }
              />
            </label>
            <label className="block">
              <span className={labelClass}>Location</span>
              <input
                className={inputClass}
                value={portfolio.location || ""}
                onChange={(e) => setPortfolio({ ...portfolio, location: e.target.value })}
              />
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Languages</span>
            <input
              className={inputClass}
              value={portfolio.languages || ""}
              onChange={(e) => setPortfolio({ ...portfolio, languages: e.target.value })}
            />
          </label>
          <div>
            <p className={labelClass}>Available for work</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={pill(portfolio.availableForWork)}
                onClick={() => setPortfolio({ ...portfolio, availableForWork: true })}
              >
                Yes
              </button>
              <button
                type="button"
                className={pill(!portfolio.availableForWork)}
                onClick={() => setPortfolio({ ...portfolio, availableForWork: false })}
              >
                No
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#121212] p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">Pricing</p>
            <div className="flex flex-wrap gap-2">
              {pricingModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={pill(portfolio.pricingModel === m.id)}
                  onClick={() => setPortfolio({ ...portfolio, pricingModel: m.id })}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className={labelClass}>Rate (₦)</span>
              <input
                type="number"
                className={inputClass}
                value={portfolio.rateAmount}
                onChange={(e) => setPortfolio({ ...portfolio, rateAmount: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-[#c8c4bc]">
              <input
                type="checkbox"
                checked={portfolio.rateNegotiable}
                onChange={(e) => setPortfolio({ ...portfolio, rateNegotiable: e.target.checked })}
              />
              Negotiable
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Social & links
            </p>
            {(
              [
                ["youtube", "YouTube"],
                ["tiktok", "TikTok"],
                ["instagram", "Instagram"],
                ["portfolioSite", "Portfolio Website"],
                ["imdb", "IMDb"],
                ["linkedin", "LinkedIn"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className={labelClass}>{label}</span>
                <input
                  className={inputClass}
                  value={(portfolio.social as any)[key] || ""}
                  onChange={(e) =>
                    setPortfolio({
                      ...portfolio,
                      social: { ...portfolio.social, [key]: e.target.value },
                    })
                  }
                  placeholder="https://"
                />
              </label>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelClass}>Achievements</p>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--gd)]"
                onClick={() => setShowAchForm(true)}
              >
                + Add Achievement
              </button>
            </div>
            {portfolio.achievements.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-[#242424] bg-[#161616] px-3 py-2"
              >
                <div>
                  <div className="text-sm text-white">{a.title}</div>
                  <div className="text-[11px] text-[#909090]">{a.description}</div>
                </div>
                <button
                  type="button"
                  className="text-[#909090]"
                  onClick={() =>
                    setPortfolio({
                      ...portfolio,
                      achievements: portfolio.achievements.filter((x) => x.id !== a.id),
                    })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {showAchForm && (
              <div className="space-y-2 rounded-xl border border-[#333] p-3">
                <input
                  className={inputClass}
                  placeholder="Title"
                  value={achDraft.title}
                  onChange={(e) => setAchDraft({ ...achDraft, title: e.target.value })}
                />
                <textarea
                  className={`${inputClass} min-h-[60px]`}
                  placeholder="Description"
                  value={achDraft.description}
                  onChange={(e) => setAchDraft({ ...achDraft, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={inputClass}
                    placeholder="Year"
                    value={achDraft.year}
                    onChange={(e) => setAchDraft({ ...achDraft, year: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="Proof / link"
                    value={achDraft.proofUrl}
                    onChange={(e) => setAchDraft({ ...achDraft, proofUrl: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setShowAchForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addAchievement}>Save</Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={labelClass}>Portfolio works</p>
              <button
                type="button"
                className="text-xs font-semibold text-[var(--gd)]"
                onClick={() =>
                  setEditingWork({
                    id: `work_${Date.now()}`,
                    title: "",
                    workType: "feature",
                    genre: "Thriller",
                    status: "available",
                    logline: "",
                    role: "Screenwriter",
                    sampleLabel: "First 10 pages",
                  })
                }
              >
                + Add work
              </button>
            </div>
            {portfolio.works.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[#242424] bg-[#161616] px-3 py-2"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setEditingWork(w)}
                >
                  <div className="text-sm text-white">{w.title}</div>
                  <div className="text-[11px] text-[#909090]">
                    {workTypeLabel(w.workType)} · {w.status}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPortfolio({
                      ...portfolio,
                      works: portfolio.works.filter((x) => x.id !== w.id),
                    })
                  }
                >
                  <Trash2 size={14} className="text-[#909090]" />
                </button>
              </div>
            ))}

            {editingWork && (
              <div className="space-y-2 rounded-2xl border border-[#333] bg-[#121212] p-4">
                <p className="text-xs font-semibold text-[var(--gd)]">Add / edit work</p>
                <input
                  className={inputClass}
                  placeholder="Title"
                  value={editingWork.title}
                  onChange={(e) => setEditingWork({ ...editingWork, title: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  {workTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={pill(editingWork.workType === t.id)}
                      onClick={() => setEditingWork({ ...editingWork, workType: t.id })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <select
                  className={inputClass}
                  value={editingWork.genre}
                  onChange={(e) => setEditingWork({ ...editingWork, genre: e.target.value })}
                >
                  {genres.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {workStatuses.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={pill(editingWork.status === s.id)}
                      onClick={() => setEditingWork({ ...editingWork, status: s.id })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <textarea
                  className={`${inputClass} min-h-[70px]`}
                  placeholder="Logline"
                  value={editingWork.logline}
                  onChange={(e) => setEditingWork({ ...editingWork, logline: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Pages / episodes"
                  value={editingWork.pagesOrEpisodes || ""}
                  onChange={(e) =>
                    setEditingWork({ ...editingWork, pagesOrEpisodes: e.target.value })
                  }
                />
                <textarea
                  className={`${inputClass} min-h-[90px]`}
                  placeholder="Writing sample preview (first pages only — not full script)"
                  value={editingWork.sampleText || ""}
                  onChange={(e) => setEditingWork({ ...editingWork, sampleText: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="External link"
                  value={editingWork.externalLink || ""}
                  onChange={(e) => setEditingWork({ ...editingWork, externalLink: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditingWork(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveWork}>
                    <Plus size={14} className="mr-1" /> Add to Portfolio
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Check size={14} className="mr-1.5" />}
              Save profile
            </Button>
            <Button
              className="bg-[var(--gd)] text-white"
              onClick={() => void save({ publish: true })}
              disabled={busy}
            >
              Save & Publish
            </Button>
            {portfolio.publishStatus === "published" && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const res = await api.post("/screenwriter/portfolio/save", {
                        ...portfolio,
                        publishStatus: "private",
                        publish: false,
                      });
                      setPortfolio(res.data.portfolio);
                      showToast("Profile set to private");
                      setStep("view");
                    } catch (err: any) {
                      setError(err.response?.data?.error || "Failed.");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Make private
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
