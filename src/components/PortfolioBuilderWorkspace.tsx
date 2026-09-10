"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Step = "list" | "view" | "edit" | "select" | "work-detail" | "inquiries";
type Visibility = "public" | "private" | "unlisted";

type Social = {
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  portfolioSite?: string;
  medium?: string;
  behance?: string;
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  year?: string;
  proofUrl?: string;
};

type WorkItem = {
  id: string;
  title: string;
  projectType: string;
  description: string;
  role: string;
  skills: string[];
  clientCompany?: string;
  projectLink?: string;
  sampleText?: string;
  sampleLabel?: string;
  year?: string;
  status?: string;
  sourceType: string;
  sourceId?: string;
  visibility: Visibility;
  sortOrder: number;
};

type Source = {
  id: string;
  sourceType: string;
  title: string;
  projectType: string;
  excerpt: string;
};

type Portfolio = {
  id: string;
  portfolioName: string;
  displayName: string;
  professionalTitle: string;
  bio: string;
  photoUrl?: string;
  specialties: string[];
  yearsExperience?: number | null;
  location?: string;
  languages?: string;
  availableForWork: boolean;
  pricingModel: string;
  rateAmount: number;
  rateCurrency: string;
  rateNegotiable: boolean;
  social: Social;
  achievements: Achievement[];
  slug: string;
  layout: string;
  status: string;
  verificationStatus: string;
  works: WorkItem[];
  publishedAt?: string | null;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

function emptyPortfolio(): Portfolio {
  return {
    id: "",
    portfolioName: "",
    displayName: "",
    professionalTitle: "Freelance Writer",
    bio: "",
    specialties: [],
    availableForWork: true,
    pricingModel: "per-project",
    rateAmount: 50000,
    rateCurrency: "NGN",
    rateNegotiable: true,
    social: {},
    achievements: [],
    slug: "",
    layout: "classic",
    status: "draft",
    verificationStatus: "unverified",
    works: [],
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "WR";
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "WR";
}

function formatRate(p: Portfolio) {
  const n = Number(p.rateAmount || 0);
  const amt =
    p.rateCurrency === "NGN" ? (n >= 1000 ? `₦${Math.round(n / 1000)}k` : `₦${n}`) : `${n}`;
  const unit =
    p.pricingModel === "per-word"
      ? "Per word"
      : p.pricingModel === "per-article"
        ? "Per article"
        : p.pricingModel === "retainer"
          ? "Retainer"
          : "Per project";
  return { amt, unit };
}

function newWorkFromSource(s: Source): WorkItem {
  return {
    id: `work_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: s.title,
    projectType: s.projectType,
    description: s.excerpt,
    role: "Writing",
    skills: [],
    clientCompany: "",
    projectLink: "",
    sampleText: s.excerpt,
    sampleLabel: "Writing sample",
    year: "",
    status: "published",
    sourceType: s.sourceType,
    sourceId: s.id,
    visibility: "public",
    sortOrder: 0,
  };
}

function emptyExternal(): WorkItem {
  return {
    id: `ext_${Date.now()}`,
    title: "",
    projectType: "External",
    description: "",
    role: "",
    skills: [],
    clientCompany: "",
    projectLink: "",
    sampleText: "",
    sampleLabel: "Writing sample",
    year: "",
    status: "published",
    sourceType: "external",
    sourceId: "",
    visibility: "public",
    sortOrder: 0,
  };
}

export default function PortfolioBuilderWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("list");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio>(emptyPortfolio());
  const [stats, setStats] = useState({
    projectsCompleted: 0,
    rating: null as number | null,
    responseTimeLabel: null as string | null,
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [pricingModels, setPricingModels] = useState<{ id: string; label: string }[]>([]);
  const [workStatuses, setWorkStatuses] = useState<{ id: string; label: string }[]>([]);
  const [activeWork, setActiveWork] = useState<WorkItem | null>(null);
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null);
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

  const publicUrl = useMemo(() => {
    if (!portfolio?.slug) return "";
    if (typeof window === "undefined") return `/portfolio/${portfolio.slug}`;
    return `${window.location.origin}/portfolio/${portfolio.slug}`;
  }, [portfolio?.slug]);

  const loadMine = useCallback(async () => {
    try {
      const res = await api.get("/writer/portfolio/mine");
      setPortfolios(res.data.portfolios || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadSources = useCallback(async () => {
    try {
      const res = await api.get("/writer/portfolio/sources");
      setSources(res.data.sources || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/portfolio/meta").then((res) => {
      setSpecialties(res.data.specialties || []);
      setPricingModels(res.data.pricingModels || []);
      setWorkStatuses(res.data.workStatuses || []);
    });
    void loadMine();
    void loadSources();
  }, [loadMine, loadSources]);

  const rate = useMemo(() => formatRate(portfolio), [portfolio]);
  const socialEntries = useMemo(() => {
    const s = portfolio.social || {};
    return [
      { key: "linkedin", label: "LinkedIn", url: s.linkedin },
      { key: "twitter", label: "X / Twitter", url: s.twitter },
      { key: "instagram", label: "Instagram", url: s.instagram },
      { key: "portfolioSite", label: "Portfolio site", url: s.portfolioSite },
      { key: "medium", label: "Medium", url: s.medium },
      { key: "behance", label: "Behance", url: s.behance },
    ].filter((x) => x.url);
  }, [portfolio.social]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const openPortfolio = async (p: Portfolio) => {
    setError("");
    try {
      const res = await api.get(`/writer/portfolio/${p.id}`);
      setPortfolio({
        ...emptyPortfolio(),
        ...res.data.portfolio,
        specialties: res.data.portfolio.specialties || [],
        social: res.data.portfolio.social || {},
        achievements: res.data.portfolio.achievements || [],
        works: res.data.portfolio.works || [],
      });
      if (res.data.stats) setStats(res.data.stats);
      setStep("view");
    } catch {
      setPortfolio({ ...emptyPortfolio(), ...p, specialties: p.specialties || [], social: p.social || {}, achievements: p.achievements || [] });
      setStep("view");
    }
  };

  const createNew = () => {
    setPortfolio(emptyPortfolio());
    setSelectedSourceIds([]);
    setStats({ projectsCompleted: 0, rating: null, responseTimeLabel: null });
    setStep("edit");
    setError("");
  };

  const save = async (opts?: { publish?: boolean; next?: Step }) => {
    if (!portfolio.displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/portfolio/save", {
        id: portfolio.id || undefined,
        portfolioName: portfolio.portfolioName || `${portfolio.displayName} — Writing Portfolio`,
        displayName: portfolio.displayName,
        professionalTitle: portfolio.professionalTitle,
        bio: portfolio.bio,
        photoUrl: portfolio.photoUrl,
        specialties: portfolio.specialties,
        yearsExperience: portfolio.yearsExperience,
        location: portfolio.location,
        languages: portfolio.languages,
        availableForWork: portfolio.availableForWork,
        pricingModel: portfolio.pricingModel,
        rateAmount: portfolio.rateAmount,
        rateCurrency: portfolio.rateCurrency,
        rateNegotiable: portfolio.rateNegotiable,
        social: portfolio.social,
        achievements: portfolio.achievements,
        slug: portfolio.slug || undefined,
        layout: portfolio.layout,
        works: portfolio.works.map((w, i) => ({ ...w, sortOrder: i })),
        status: opts?.publish ? undefined : portfolio.status === "published" ? "published" : portfolio.status,
        publish: Boolean(opts?.publish),
      });
      setPortfolio({
        ...emptyPortfolio(),
        ...res.data.portfolio,
        specialties: res.data.portfolio.specialties || [],
        social: res.data.portfolio.social || {},
        achievements: res.data.portfolio.achievements || [],
      });
      if (res.data.stats) setStats(res.data.stats);
      await loadMine();
      showToast(opts?.publish ? "Portfolio published" : "Saved");
      setStep(opts?.next || "view");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const requestVerify = async () => {
    if (!portfolio.id) {
      setError("Save your profile first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/writer/portfolio/${portfolio.id}/verify`, {});
      if (res.data.portfolio) setPortfolio({ ...portfolio, ...res.data.portfolio });
      showToast("Verification submitted — pending admin review");
    } catch (err: any) {
      setError(err.response?.data?.error || "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadInquiries = async () => {
    try {
      const res = await api.get("/writer/portfolio/inquiries", {
        params: portfolio.id ? { portfolioId: portfolio.id } : undefined,
      });
      setInquiries(res.data.inquiries || []);
      setStep("inquiries");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load inquiries.");
    }
  };

  const addSelectedWorks = () => {
    const picked = sources.filter((s) => selectedSourceIds.includes(`${s.sourceType}:${s.id}`));
    const existingKeys = new Set(portfolio.works.map((w) => `${w.sourceType}:${w.sourceId}`));
    const next = [
      ...portfolio.works,
      ...picked
        .filter((s) => !existingKeys.has(`${s.sourceType}:${s.id}`))
        .map(newWorkFromSource),
    ];
    setPortfolio({ ...portfolio, works: next });
    setSelectedSourceIds([]);
    setStep("edit");
    showToast("Works added");
  };

  const saveWork = () => {
    if (!editingWork?.title.trim()) return;
    const exists = portfolio.works.some((w) => w.id === editingWork.id);
    const works = exists
      ? portfolio.works.map((w) => (w.id === editingWork.id ? editingWork : w))
      : [...portfolio.works, editingWork];
    setPortfolio({ ...portfolio, works });
    setEditingWork(null);
  };

  const removeWork = (id: string) => {
    setPortfolio({ ...portfolio, works: portfolio.works.filter((w) => w.id !== id) });
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

  const removePortfolio = async (id: string) => {
    if (!confirm("Delete this portfolio?")) return;
    try {
      await api.delete(`/writer/portfolio/${id}`);
      await loadMine();
      if (portfolio.id === id) {
        setPortfolio(emptyPortfolio());
        setStep("list");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const goBack = () => {
    if (step === "list") onBack?.();
    else if (step === "work-detail") setStep("view");
    else if (step === "inquiries" || step === "select") setStep("view");
    else if (step === "edit") setStep(portfolio.id ? "view" : "list");
    else setStep("list");
  };

  return (
    <div className="mx-auto max-w-xl space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <button type="button" onClick={goBack} className="text-[#909090] hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
            Portfolio Builder
          </p>
          <h2 className="font-serif text-xl font-bold text-white">
            {step === "list"
              ? "Your Portfolios"
              : step === "edit"
                ? "Edit Profile"
                : step === "select"
                  ? "Add Work from Drafts"
                  : step === "inquiries"
                    ? "Hire Inquiries"
                    : step === "work-detail"
                      ? "Work Details"
                      : "Writer Portfolio"}
          </h2>
        </div>
        <Briefcase className="h-5 w-5 text-[var(--gd)]" />
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
        <div className="space-y-4">
          <Button className="w-full bg-[var(--gd)] text-zinc-950" onClick={createNew}>
            <Plus size={14} className="mr-1.5" /> New portfolio
          </Button>
          {portfolios.length === 0 ? (
            <p className="text-center text-sm text-[#606060]">
              Build a public writer profile — rate, work samples, achievements, and hire inquiries.
            </p>
          ) : (
            portfolios.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => void openPortfolio(p)}>
                  <div className="font-serif font-bold text-white">{p.displayName || p.portfolioName}</div>
                  <div className="text-xs text-[#909090]">
                    {p.professionalTitle} · {p.status}
                    {p.slug ? ` · /portfolio/${p.slug}` : ""}
                  </div>
                </button>
                <button
                  type="button"
                  className="text-[#606060] hover:text-red-400"
                  onClick={() => void removePortfolio(p.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {step === "work-detail" && activeWork && (
        <div className="space-y-4 rounded-2xl border border-[#242424] bg-[#161616] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">Portfolio work</p>
          <h3 className="font-serif text-2xl font-bold text-white">{activeWork.title}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between border-b border-[#242424] py-2">
              <span className="text-[#909090]">Type</span>
              <span>{activeWork.projectType}</span>
            </div>
            {activeWork.status && (
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#909090]">Status</span>
                <span className="capitalize">{activeWork.status}</span>
              </div>
            )}
            {activeWork.role && (
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#909090]">Role</span>
                <span>{activeWork.role}</span>
              </div>
            )}
            {activeWork.year && (
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#909090]">Year</span>
                <span>{activeWork.year}</span>
              </div>
            )}
            {activeWork.clientCompany && (
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#909090]">Client</span>
                <span>{activeWork.clientCompany}</span>
              </div>
            )}
          </div>
          {activeWork.description && <p className="text-sm text-[#F0EBE0]">{activeWork.description}</p>}
          {activeWork.skills?.length > 0 && (
            <p className="text-xs text-[#909090]">Skills: {activeWork.skills.join(", ")}</p>
          )}
          {activeWork.sampleText && (
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#242424] bg-[#121212] p-3 font-serif text-xs text-[#c8c4bc]">
              {activeWork.sampleText.slice(0, 1500)}
            </pre>
          )}
          {activeWork.projectLink && (
            <a href={activeWork.projectLink} target="_blank" rel="noreferrer" className="text-sm text-[var(--gd)]">
              External link →
            </a>
          )}
        </div>
      )}

      {step === "inquiries" && (
        <div className="space-y-3">
          {inquiries.length === 0 ? (
            <p className="text-sm text-[#606060]">No hire inquiries yet.</p>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-1">
                <div className="font-medium text-white">{inq.projectTitle}</div>
                <div className="text-xs text-[#909090]">
                  {inq.fromName} · {inq.fromEmail}
                </div>
                <p className="text-sm text-[#c8c4bc]">{inq.lookingFor}</p>
                {inq.budget && <p className="text-xs text-[#606060]">Budget: {inq.budget}</p>}
                <p className="text-sm text-[#F0EBE0]">{inq.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {step === "view" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--gd)] font-serif text-xl font-bold text-zinc-950">
                {initials(portfolio.displayName || "WR")}
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-bold text-white">
                  {portfolio.displayName || "Your name"}
                </h3>
                <p className="text-sm text-[#909090]">
                  {portfolio.professionalTitle}
                  {portfolio.specialties?.length
                    ? ` · ${portfolio.specialties.slice(0, 2).join(" & ")}`
                    : ""}
                </p>
                {portfolio.verificationStatus === "approved" ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--gd)]">✓ Verified writer</p>
                ) : (
                  <p className="mt-1 text-xs text-[#606060]">
                    Verification: {portfolio.verificationStatus || "unverified"}
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
                <div className="font-serif text-lg font-bold text-white">{stats.projectsCompleted}</div>
                <div className="text-[10px] text-[#606060]">Projects</div>
              </div>
              <div>
                <div className="font-serif text-lg font-bold text-white">
                  {stats.responseTimeLabel || "—"}
                </div>
                <div className="text-[10px] text-[#606060]">Response</div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[#606060]">
              Projects / rating / response come from platform data — not editable here.
            </p>
          </div>

          {portfolio.bio && (
            <div>
              <p className={labelClass}>About</p>
              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 text-sm text-[#F0EBE0]">
                {portfolio.bio}
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

          {portfolio.achievements?.length > 0 && (
            <div>
              <p className={labelClass}>Achievements</p>
              <div className="overflow-hidden rounded-2xl border border-[#242424] bg-[#161616]">
                {portfolio.achievements.map((a, i) => (
                  <div key={a.id} className={`px-4 py-3 ${i ? "border-t border-[#242424]" : ""}`}>
                    <div className="font-medium text-white">🏆 {a.title}</div>
                    {a.description && <div className="text-xs text-[#909090]">{a.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {portfolio.works?.length > 0 && (
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
                    <div className="mb-2 text-xl">📄</div>
                    <div className="font-medium text-white line-clamp-2">{w.title}</div>
                    <div className="mt-1 text-[11px] text-[#909090]">
                      {w.projectType}
                      {w.status ? ` · ${w.status}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Button
              variant="secondary"
              className="w-full border-[var(--gd)] text-[var(--gd)]"
              onClick={() => setStep("edit")}
            >
              Edit profile
            </Button>
            <Button
              className="w-full bg-[var(--gd)] text-zinc-950 hover:opacity-90"
              onClick={() => void save({ publish: true })}
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Publish profile
            </Button>
            <Button variant="secondary" onClick={() => setStep("select")}>
              Add work from drafts
            </Button>
            {portfolio.verificationStatus !== "approved" &&
              portfolio.verificationStatus !== "pending" && (
                <Button variant="secondary" onClick={() => void requestVerify()} disabled={busy}>
                  Request verification
                </Button>
              )}
            <Button variant="secondary" onClick={() => void loadInquiries()}>
              Hire inquiries
            </Button>
            {portfolio.status === "published" && publicUrl && (
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

      {step === "select" && (
        <div className="space-y-4">
          <p className="text-sm text-[#909090]">
            Import drafts from your projects, flash fiction, nonfiction, and Web3 tools.
          </p>
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {sources.map((s) => {
              const key = `${s.sourceType}:${s.id}`;
              const on = selectedSourceIds.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedSourceIds((prev) =>
                      on ? prev.filter((x) => x !== key) : [...prev, key]
                    )
                  }
                  className={`w-full rounded-xl border p-3 text-left ${
                    on ? "border-[var(--gd)] bg-[var(--gd)]/10" : "border-[#242424] bg-[#161616]"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{s.title}</div>
                  <div className="text-[11px] text-[#909090]">{s.projectType}</div>
                </button>
              );
            })}
          </div>
          <Button onClick={addSelectedWorks} disabled={!selectedSourceIds.length}>
            Add selected ({selectedSourceIds.length})
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setEditingWork(emptyExternal());
              setStep("edit");
            }}
          >
            Or add external work
          </Button>
        </div>
      )}

      {step === "edit" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Portfolio name</span>
            <input
              className={inputClass}
              value={portfolio.portfolioName}
              onChange={(e) => setPortfolio({ ...portfolio, portfolioName: e.target.value })}
              placeholder="My Writing Portfolio"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Profile photo URL</span>
            <input
              className={inputClass}
              value={portfolio.photoUrl || ""}
              onChange={(e) => setPortfolio({ ...portfolio, photoUrl: e.target.value })}
              placeholder="https://…"
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
            <p className={labelClass}>Specialties</p>
            <div className="flex flex-wrap gap-2">
              {specialties.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={pill(portfolio.specialties.includes(g))}
                  onClick={() =>
                    setPortfolio({
                      ...portfolio,
                      specialties: portfolio.specialties.includes(g)
                        ? portfolio.specialties.filter((x) => x !== g)
                        : [...portfolio.specialties, g],
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
              value={portfolio.bio}
              onChange={(e) => setPortfolio({ ...portfolio, bio: e.target.value })}
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
                  setPortfolio({
                    ...portfolio,
                    yearsExperience: e.target.value === "" ? null : Number(e.target.value),
                  })
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
              placeholder="English, Yoruba…"
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

          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
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
                value={portfolio.rateAmount || ""}
                onChange={(e) =>
                  setPortfolio({ ...portfolio, rateAmount: Number(e.target.value || 0) })
                }
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
              Social & Links
            </p>
            {(
              [
                ["linkedin", "LinkedIn"],
                ["twitter", "X / Twitter"],
                ["instagram", "Instagram"],
                ["portfolioSite", "Portfolio Website"],
                ["medium", "Medium"],
                ["behance", "Behance"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className={labelClass}>{label}</span>
                <input
                  className={inputClass}
                  placeholder="URL"
                  value={(portfolio.social as any)?.[key] || ""}
                  onChange={(e) =>
                    setPortfolio({
                      ...portfolio,
                      social: { ...portfolio.social, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
                Achievements
              </p>
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
                className="flex items-start justify-between rounded-xl border border-[#242424] bg-[#161616] px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-[#909090]">{a.description}</div>
                </div>
                <button
                  type="button"
                  className="text-[#606060] hover:text-red-400"
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
                  placeholder="Achievement title"
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
                    placeholder="Proof / Link"
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
                Portfolio works
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--gd)]"
                  onClick={() => setStep("select")}
                >
                  + From drafts
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-[var(--gd)]"
                  onClick={() => setEditingWork(emptyExternal())}
                >
                  + Add work
                </button>
              </div>
            </div>
            {portfolio.works.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-xl border border-[#242424] bg-[#161616] px-3 py-2"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setEditingWork(w)}
                >
                  <div className="truncate text-sm font-medium">{w.title || "Untitled"}</div>
                  <div className="text-[11px] text-[#909090]">
                    {w.projectType} · {w.visibility}
                  </div>
                </button>
                <button type="button" className="text-[#606060] hover:text-red-400" onClick={() => removeWork(w.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {editingWork && (
              <div className="space-y-2 rounded-xl border border-[#333] p-3">
                <p className="text-xs font-semibold text-[var(--gd)]">Add / edit work</p>
                <input
                  className={inputClass}
                  placeholder="Title"
                  value={editingWork.title}
                  onChange={(e) => setEditingWork({ ...editingWork, title: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Work type (e.g. Blog, Whitepaper)"
                  value={editingWork.projectType}
                  onChange={(e) => setEditingWork({ ...editingWork, projectType: e.target.value })}
                />
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
                  placeholder="Description"
                  value={editingWork.description}
                  onChange={(e) => setEditingWork({ ...editingWork, description: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Role"
                  value={editingWork.role}
                  onChange={(e) => setEditingWork({ ...editingWork, role: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Skills (comma-separated)"
                  value={editingWork.skills.join(", ")}
                  onChange={(e) =>
                    setEditingWork({
                      ...editingWork,
                      skills: e.target.value
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
                <input
                  className={inputClass}
                  placeholder="Client / company"
                  value={editingWork.clientCompany || ""}
                  onChange={(e) => setEditingWork({ ...editingWork, clientCompany: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Year"
                  value={editingWork.year || ""}
                  onChange={(e) => setEditingWork({ ...editingWork, year: e.target.value })}
                />
                <textarea
                  className={`${inputClass} min-h-[90px]`}
                  placeholder="Writing sample preview (not full copyrighted work)"
                  value={editingWork.sampleText || ""}
                  onChange={(e) => setEditingWork({ ...editingWork, sampleText: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="External link"
                  value={editingWork.projectLink || ""}
                  onChange={(e) => setEditingWork({ ...editingWork, projectLink: e.target.value })}
                />
                <div className="flex flex-wrap gap-2">
                  {(["public", "unlisted", "private"] as Visibility[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={pill(editingWork.visibility === v)}
                      onClick={() => setEditingWork({ ...editingWork, visibility: v })}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setEditingWork(null)}>
                    Cancel
                  </Button>
                  <Button onClick={saveWork}>
                    <Plus size={14} className="mr-1" /> Save work
                  </Button>
                </div>
              </div>
            )}
          </div>

          <label className="block">
            <span className={labelClass}>Custom slug (optional)</span>
            <input
              className={inputClass}
              value={portfolio.slug}
              onChange={(e) => setPortfolio({ ...portfolio, slug: e.target.value })}
              placeholder="your-name"
            />
          </label>

          <div className="grid gap-2">
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Check size={14} className="mr-1.5" />
              )}
              Save profile
            </Button>
            <Button
              className="bg-[var(--gd)] text-zinc-950"
              onClick={() => void save({ publish: true })}
              disabled={busy}
            >
              Save & Publish
            </Button>
            {portfolio.status === "published" && (
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    try {
                      const res = await api.post("/writer/portfolio/save", {
                        ...portfolio,
                        id: portfolio.id || undefined,
                        works: portfolio.works,
                        status: "draft",
                        publish: false,
                      });
                      setPortfolio({ ...emptyPortfolio(), ...res.data.portfolio });
                      showToast("Profile unpublished (draft)");
                      setStep("view");
                    } catch (err: any) {
                      setError(err.response?.data?.error || "Failed.");
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
              >
                Unpublish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export async function fetchPublishedPortfolioUrl(): Promise<string | null> {
  try {
    const res = await api.get("/writer/portfolio/mine");
    const published = (res.data.portfolios || []).find((p: any) => p.status === "published" && p.slug);
    if (!published) return null;
    if (typeof window !== "undefined") return `${window.location.origin}/portfolio/${published.slug}`;
    return `/portfolio/${published.slug}`;
  } catch {
    return null;
  }
}
