"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBackendApiUrl } from "@/lib/backendUrl";

type Work = {
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
};

type Portfolio = {
  displayName: string;
  professionalTitle: string;
  bio: string;
  specialties?: string[];
  pricingModel: string;
  rateAmount: number;
  rateCurrency: string;
  rateNegotiable: boolean;
  social?: Record<string, string>;
  achievements?: { id: string; title: string; description: string }[];
  works: Work[];
  slug: string;
  availableForWork?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
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

export default function PublicPortfolioPage() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [active, setActive] = useState<Work | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiry, setInquiry] = useState({
    fromName: "",
    fromEmail: "",
    projectTitle: "",
    lookingFor: "",
    budget: "",
    deadline: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const base = getBackendApiUrl();
        const res = await fetch(`${base}/public/portfolio/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Not found");
        if (!cancelled) {
          setPortfolio(data.portfolio);
          setStats(data.stats);
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const rate = useMemo(() => (portfolio ? formatRate(portfolio) : null), [portfolio]);
  const socials = useMemo(() => {
    if (!portfolio?.social) return [];
    return Object.entries(portfolio.social)
      .filter(([, v]) => v)
      .map(([k, v]) => ({
        label:
          k === "portfolioSite"
            ? "Portfolio site"
            : k === "twitter"
              ? "X / Twitter"
              : k.charAt(0).toUpperCase() + k.slice(1),
        url: v,
      }));
  }, [portfolio]);

  const sendInquiry = async () => {
    setSending(true);
    setError("");
    try {
      const base = getBackendApiUrl();
      const res = await fetch(`${base}/public/portfolio/${encodeURIComponent(slug)}/inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inquiry),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setToast("Inquiry sent");
      setShowInquiry(false);
      setInquiry({
        fromName: "",
        fromEmail: "",
        projectTitle: "",
        lookingFor: "",
        budget: "",
        deadline: "",
        message: "",
      });
    } catch (e: any) {
      setError(e.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-16 text-center text-[#909090]">
        Loading portfolio…
      </main>
    );
  }

  if (!portfolio) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] px-4 py-16 text-center">
        <p className="text-red-300">{error || "Not found"}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-[#c9a84c]">
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#F0EBE0]">
      <div className="mx-auto max-w-xl px-4 py-10 space-y-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c]">
          Writer Portfolio
        </p>

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

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c9a84c] font-serif text-xl font-bold text-zinc-950">
              {initials(portfolio.displayName)}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-white">{portfolio.displayName}</h1>
              <p className="text-sm text-[#909090]">
                {portfolio.professionalTitle}
                {portfolio.specialties?.length
                  ? ` · ${portfolio.specialties.slice(0, 2).join(" & ")}`
                  : ""}
              </p>
              {stats?.verified && (
                <p className="mt-1 text-xs font-semibold text-[#c9a84c]">✓ Verified writer</p>
              )}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="font-serif text-lg font-bold">{rate?.amt}</div>
              <div className="text-[10px] text-[#606060]">{rate?.unit}</div>
            </div>
            <div>
              <div className="font-serif text-lg font-bold">
                {stats?.rating != null ? `${stats.rating}★` : "—"}
              </div>
              <div className="text-[10px] text-[#606060]">Rating</div>
            </div>
            <div>
              <div className="font-serif text-lg font-bold">{stats?.projectsCompleted ?? 0}</div>
              <div className="text-[10px] text-[#606060]">Projects</div>
            </div>
            <div>
              <div className="font-serif text-lg font-bold">{stats?.responseTimeLabel || "—"}</div>
              <div className="text-[10px] text-[#606060]">Response</div>
            </div>
          </div>
        </div>

        {portfolio.bio && (
          <div>
            <p className="mb-2 text-xs text-[#909090]">About</p>
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 text-sm">
              {portfolio.bio}
            </div>
          </div>
        )}

        {socials.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-[#909090]">Social & links</p>
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#333] px-3 py-1.5 text-xs text-[#c8c4bc]"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}

        {(portfolio.achievements?.length || 0) > 0 && (
          <div>
            <p className="mb-2 text-xs text-[#909090]">Achievements</p>
            <div className="overflow-hidden rounded-2xl border border-[#242424] bg-[#161616]">
              {portfolio.achievements!.map((a, i) => (
                <div key={a.id} className={`px-4 py-3 ${i ? "border-t border-[#242424]" : ""}`}>
                  <div className="font-medium">🏆 {a.title}</div>
                  {a.description && <div className="text-xs text-[#909090]">{a.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {portfolio.works?.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-[#909090]">Portfolio</p>
            <div className="grid grid-cols-2 gap-3">
              {portfolio.works.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActive(w)}
                  className="rounded-2xl border border-[#242424] bg-[#161616] p-4 text-left"
                >
                  <div className="font-medium line-clamp-2">{w.title}</div>
                  <div className="mt-1 text-[11px] text-[#909090]">
                    {w.projectType}
                    {w.status ? ` · ${w.status}` : ""}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {active && (
          <div className="space-y-2 rounded-2xl border border-[#333] bg-[#121212] p-4">
            <h3 className="font-serif text-xl">{active.title}</h3>
            <p className="text-sm text-[#909090]">
              {active.projectType}
              {active.status ? ` · ${active.status}` : ""}
            </p>
            {active.description && <p className="text-sm">{active.description}</p>}
            {active.sampleText && (
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#242424] p-3 font-serif text-xs text-[#c8c4bc]">
                {active.sampleText}
              </pre>
            )}
            {active.projectLink && (
              <a href={active.projectLink} target="_blank" rel="noreferrer" className="text-xs text-[#c9a84c]">
                External link →
              </a>
            )}
            <button type="button" className="text-xs text-[#c9a84c]" onClick={() => setActive(null)}>
              Close
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowInquiry(true)}
          className="w-full rounded-xl bg-[#c9a84c] px-4 py-3 text-sm font-bold text-zinc-950"
        >
          Contact / Hire Writer
        </button>

        {showInquiry && (
          <div className="space-y-3 rounded-2xl border border-[#333] bg-[#161616] p-4">
            <p className="text-sm font-semibold text-[#c9a84c]">Send Inquiry</p>
            {(
              [
                ["fromName", "Your name"],
                ["fromEmail", "Email"],
                ["projectTitle", "Project"],
                ["lookingFor", "What are you looking for?"],
                ["budget", "Budget"],
                ["deadline", "Deadline"],
              ] as const
            ).map(([key, ph]) => (
              <input
                key={key}
                className="w-full rounded-xl border border-[#2a2a2a] bg-[#121212] px-3 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
                placeholder={ph}
                value={(inquiry as any)[key]}
                onChange={(e) => setInquiry({ ...inquiry, [key]: e.target.value })}
              />
            ))}
            <textarea
              className="min-h-[90px] w-full rounded-xl border border-[#2a2a2a] bg-[#121212] px-3 py-2.5 text-sm outline-none focus:border-[#c9a84c]"
              placeholder="Message"
              value={inquiry.message}
              onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-xl border border-[#333] py-2 text-sm"
                onClick={() => setShowInquiry(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#c9a84c] py-2 text-sm font-bold text-zinc-950"
                onClick={() => void sendInquiry()}
                disabled={sending}
              >
                {sending ? "Sending…" : "Send Inquiry"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
