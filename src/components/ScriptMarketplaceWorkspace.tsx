"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Lock,
  Loader2,
  Search,
  Store,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isFreePlan } from "@/lib/plans";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import Modal from "@/components/ui/Modal";

type Listing = {
  id: string;
  writerId: string;
  writerName: string;
  title: string;
  scriptType: string;
  genre: string;
  logline: string;
  description: string;
  pageCount: number;
  priceNGN: number;
  optionPriceNGN: number;
  dealType: string;
  status: string;
  views: number;
  hasPurchased?: boolean;
  canAccessFull?: boolean;
  isOwner?: boolean;
  optionStatus?: string | null;
};

type Tab = "browse" | "detail" | "preview" | "sell" | "listings" | "purchases" | "earnings" | "options" | "full";

function naira(n: number) {
  if (!n) return "—";
  return `₦${Number(n).toLocaleString()}`;
}

export default function ScriptMarketplaceWorkspace({ onBack }: { onBack?: () => void }) {
  const { profile, loading: authLoading } = useAuth();
  const locked =
    !authLoading &&
    (isFreePlan({ id: profile?.subscriptionPlan || "free" }) || !profile?.subscriptionPlan);

  const [tab, setTab] = useState<Tab>("browse");
  const [listings, setListings] = useState<Listing[]>([]);
  const [commissionRate, setCommissionRate] = useState(0.12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const [search, setSearch] = useState("");
  const [scriptType, setScriptType] = useState("");
  const [genre, setGenre] = useState("");
  const [dealType, setDealType] = useState("");

  const [active, setActive] = useState<Listing | null>(null);
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [fullText, setFullText] = useState("");

  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [buyerOptions, setBuyerOptions] = useState<any[]>([]);
  const [writerOptions, setWriterOptions] = useState<any[]>([]);

  const [draftId, setDraftId] = useState("");
  const [form, setForm] = useState({
    title: "",
    scriptType: "Feature",
    genre: "Drama",
    logline: "",
    description: "",
    pageCount: "0",
    priceNGN: "",
    optionPriceNGN: "",
    dealType: "purchase",
  });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [optionMsg, setOptionMsg] = useState("");
  const [showOptionModal, setShowOptionModal] = useState(false);

  const requirePremium = () => {
    if (!locked) return true;
    setShowPaywall(true);
    return false;
  };

  const loadBrowse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (scriptType) params.set("scriptType", scriptType);
      if (genre) params.set("genre", genre);
      if (dealType) params.set("dealType", dealType);
      const res = await api.get(`/marketplace/listings?${params.toString()}`);
      setListings(res.data?.listings || []);
      if (res.data?.commissionRate) setCommissionRate(res.data.commissionRate);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load marketplace.");
    } finally {
      setLoading(false);
    }
  }, [search, scriptType, genre, dealType]);

  useEffect(() => {
    if (tab === "browse") void loadBrowse();
  }, [tab, loadBrowse]);

  const openDetail = async (id: string) => {
    setError("");
    try {
      const res = await api.get(`/marketplace/listings/${id}`);
      setActive(res.data.listing);
      setTab("detail");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to open listing.");
    }
  };

  const openPreview = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const res = await api.get(`/marketplace/listings/${active.id}/preview`);
      setPreviewPages(res.data.pages || []);
      setPreviewIndex(0);
      setTab("preview");
    } catch (err: any) {
      setError(err.response?.data?.error || "Preview failed.");
    } finally {
      setBusy(false);
    }
  };

  const openFull = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const res = await api.get(`/marketplace/listings/${active.id}/full`);
      setFullText(res.data.fullText || "");
      setTab("full");
    } catch (err: any) {
      setError(err.response?.data?.error || "Access denied.");
    } finally {
      setBusy(false);
    }
  };

  const checkout = async (type: "purchase" | "option", optionRequestId?: string) => {
    if (!active) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/marketplace/checkout", {
        listingId: active.id,
        dealType: type,
        optionRequestId,
      });
      if (res.data?.url) window.location.href = res.data.url;
    } catch (err: any) {
      setError(err.response?.data?.error || "Checkout failed.");
    } finally {
      setBusy(false);
    }
  };

  const sendOptionRequest = async () => {
    if (!active) return;
    setBusy(true);
    try {
      await api.post(`/marketplace/listings/${active.id}/option-request`, {
        message: optionMsg,
      });
      setShowOptionModal(false);
      setOptionMsg("");
      await openDetail(active.id);
      alert("Option request sent to the writer.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to request option.");
    } finally {
      setBusy(false);
    }
  };

  const saveListing = async (): Promise<string | null> => {
    if (!requirePremium()) return null;
    if (!form.title.trim()) {
      setError("Title is required.");
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        pageCount: Number(form.pageCount) || 0,
        priceNGN: Number(form.priceNGN) || 0,
        optionPriceNGN: Number(form.optionPriceNGN) || 0,
      };
      let listing: Listing;
      if (draftId) {
        const res = await api.put(`/marketplace/listings/${draftId}`, payload);
        listing = res.data.listing;
      } else {
        const res = await api.post("/marketplace/listings", payload);
        listing = res.data.listing;
      }
      setDraftId(listing.id);
      return listing.id;
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "Failed to save listing.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadScript = async (file: File) => {
    if (!requirePremium()) return;
    const id = draftId || (await saveListing());
    if (!id) return;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api.post(`/marketplace/listings/${id}/upload`, body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({
        ...f,
        pageCount: String(res.data.listing.pageCount || f.pageCount),
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitListing = async () => {
    const id = draftId || (await saveListing());
    if (!id) return;
    setBusy(true);
    try {
      await api.post(`/marketplace/listings/${id}/submit`);
      setTab("listings");
      setDraftId("");
      void loadMyListings();
    } catch (err: any) {
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setBusy(false);
    }
  };

  const loadMyListings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/marketplace/mine/listings");
      setMyListings(res.data.listings || []);
    } catch {
      setMyListings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get("/marketplace/mine/purchases");
      setPurchases(res.data.purchases || []);
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/marketplace/mine/earnings");
      setEarnings(res.data.earnings);
      setTransactions(res.data.transactions || []);
    } catch {
      setEarnings(null);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    setLoading(true);
    try {
      const [b, w] = await Promise.all([
        api.get("/marketplace/mine/options?role=buyer"),
        api.get("/marketplace/mine/options?role=writer"),
      ]);
      setBuyerOptions(b.data.options || []);
      setWriterOptions(w.data.options || []);
    } catch {
      setBuyerOptions([]);
      setWriterOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "listings") void loadMyListings();
    if (tab === "purchases") void loadPurchases();
    if (tab === "earnings") void loadEarnings();
    if (tab === "options") void loadOptions();
  }, [tab]);

  const respondOption = async (id: string, action: "accept" | "reject") => {
    setBusy(true);
    try {
      await api.post(`/marketplace/options/${id}/respond`, { action });
      void loadOptions();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to respond.");
    } finally {
      setBusy(false);
    }
  };

  const startSell = () => {
    if (!requirePremium()) return;
    setDraftId("");
    setForm({
      title: "",
      scriptType: "Feature",
      genre: "Drama",
      logline: "",
      description: "",
      pageCount: "0",
      priceNGN: "",
      optionPriceNGN: "",
      dealType: "purchase",
    });
    setTab("sell");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 animate-fadeIn">
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
            <Store className="h-6 w-6 text-[var(--gd)]" />
            Script Marketplace
            {locked && <Lock className="h-4 w-4 text-[var(--gd)]" />}
          </h2>
          <p className="mt-1 text-xs text-[#707070]">
            Browse scripts, preview 10 pages, purchase or option — platform fee{" "}
            {Math.round(commissionRate * 100)}%.
          </p>
        </div>
        <Button size="sm" onClick={startSell}>
          List Script
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-[#2a1018] bg-[#160004]/80 p-1">
        {(
          [
            ["browse", "Browse"],
            ["purchases", "My Purchases"],
            ["listings", "My Listings"],
            ["options", "Options"],
            ["earnings", "Earnings"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-2.5 py-2 text-[11px] font-semibold ${
              tab === id || (tab === "detail" && id === "browse") || (tab === "preview" && id === "browse") || (tab === "full" && id === "purchases") || (tab === "sell" && id === "listings")
                ? "bg-[var(--gd)] text-white"
                : "text-[#909090]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {tab === "browse" && (
        <>
          <div className="space-y-3 rounded-2xl border border-[#2a1018] bg-[#160004] p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#606060]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search scripts..."
                className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] py-2.5 pl-9 pr-3 text-sm text-[#f0ebe0]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={scriptType}
                onChange={(e) => setScriptType(e.target.value)}
                className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-2 py-2 text-xs text-[#f0ebe0]"
              >
                <option value="">Type</option>
                {["Feature", "Short", "Series", "TV"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-2 py-2 text-xs text-[#f0ebe0]"
              >
                <option value="">Genre</option>
                {["Drama", "Thriller", "Romance", "Comedy", "Legal Thriller", "Romantic Drama"].map(
                  (g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  )
                )}
              </select>
              <select
                value={dealType}
                onChange={(e) => setDealType(e.target.value)}
                className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-2 py-2 text-xs text-[#f0ebe0]"
              >
                <option value="">Deal</option>
                <option value="purchase">Purchase</option>
                <option value="option">Option</option>
              </select>
            </div>
            <Button variant="outline" className="w-full" onClick={() => loadBrowse()}>
              Search
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#2a1018] bg-[#160004] p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-serif text-lg font-bold text-white">{item.title}</h3>
                    <div className="text-right shrink-0">
                      {item.dealType === "option" || item.dealType === "both" ? (
                        <div className="text-sm font-bold text-[var(--gd)]">
                          Option — {naira(item.optionPriceNGN)}
                        </div>
                      ) : null}
                      {item.dealType === "purchase" || item.dealType === "both" ? (
                        <div className="text-sm font-bold text-[var(--gd)]">
                          {naira(item.priceNGN)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-xs text-[#909090] mb-1">
                    {item.scriptType} · {item.pageCount} pages · {item.genre}
                  </p>
                  <p className="text-xs text-[#707070] mb-4">Writer: {item.writerName}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openDetail(item.id)}
                  >
                    Preview first 10 pages
                  </Button>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "detail" && active && (
        <div className="space-y-4">
          <button type="button" className="text-xs text-[#909090]" onClick={() => setTab("browse")}>
            ← Marketplace
          </button>
          <div>
            <h3 className="font-serif text-2xl font-bold text-white">{active.title}</h3>
            <p className="mt-1 text-xs text-[#909090]">
              {active.scriptType} · {active.pageCount} pages · {active.genre}
            </p>
            <p className="mt-1 text-xs text-[var(--gd)]">Written by {active.writerName}</p>
          </div>
          {active.logline && (
            <p className="text-sm italic text-[#c0c0c0]">&ldquo;{active.logline}&rdquo;</p>
          )}
          {active.description && (
            <p className="text-sm text-[#909090] leading-relaxed">{active.description}</p>
          )}
          <Button variant="outline" className="w-full" disabled={busy} onClick={openPreview}>
            <BookOpen className="h-4 w-4 mr-1.5" /> Preview First 10 Pages
          </Button>
          {active.canAccessFull ? (
            <Button className="w-full" onClick={openFull}>
              Read Full Script
            </Button>
          ) : (
            <div className="space-y-2">
              {(active.dealType === "purchase" || active.dealType === "both") && (
                <Button className="w-full" disabled={busy} onClick={() => checkout("purchase")}>
                  Purchase Script — {naira(active.priceNGN)}
                </Button>
              )}
              {(active.dealType === "option" || active.dealType === "both") && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={busy}
                  onClick={() => {
                    if (active.optionStatus === "accepted") {
                      // need option id - load options and checkout
                      void (async () => {
                        const res = await api.get("/marketplace/mine/options?role=buyer");
                        const opt = (res.data.options || []).find(
                          (o: any) => o.listingId === active.id && o.status === "accepted"
                        );
                        if (opt) void checkout("option", opt.id);
                        else setShowOptionModal(true);
                      })();
                    } else {
                      setShowOptionModal(true);
                    }
                  }}
                >
                  {active.optionStatus === "pending"
                    ? "Option request pending"
                    : active.optionStatus === "accepted"
                      ? `Pay Option — ${naira(active.optionPriceNGN)}`
                      : `Request Option — ${naira(active.optionPriceNGN)}`}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "preview" && active && (
        <div className="space-y-4">
          <button type="button" className="text-xs text-[#909090]" onClick={() => setTab("detail")}>
            ← Back to details
          </button>
          <h3 className="font-serif text-xl font-bold text-white">{active.title}</h3>
          <div className="min-h-[280px] rounded-2xl border border-[#2a1018] bg-[#0a0004] p-5">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#d0d0d0]">
              {previewPages[previewIndex] || "No preview available."}
            </pre>
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={previewIndex <= 0}
              onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-[#909090]">
              Page {previewIndex + 1} / {previewPages.length || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={previewIndex >= previewPages.length - 1}
              onClick={() => setPreviewIndex((i) => Math.min(previewPages.length - 1, i + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="rounded-xl border border-[#2a1018] bg-[#160004] px-4 py-3 text-center text-xs text-[#909090]">
            🔒 Pages 11+ available after purchase
          </p>
        </div>
      )}

      {tab === "full" && (
        <div className="space-y-3">
          <button type="button" className="text-xs text-[#909090]" onClick={() => setTab("purchases")}>
            ← My Purchases
          </button>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl border border-[#2a1018] bg-[#0a0004] p-5 font-mono text-xs text-[#d0d0d0]">
            {fullText}
          </pre>
        </div>
      )}

      {tab === "sell" && (
        <div className="rounded-2xl border border-[#2a1018] bg-[#160004] p-5 space-y-3">
          <h3 className="font-serif text-lg font-bold text-white">List Script on Marketplace</h3>
          {(
            [
              ["title", "Script Title"],
              ["logline", "Logline"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="block space-y-1">
              <span className="text-[10px] uppercase text-[#707070]">{label}</span>
              <input
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="text-[10px] uppercase text-[#707070]">Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0] resize-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.scriptType}
              onChange={(e) => setForm((f) => ({ ...f, scriptType: e.target.value }))}
              className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
            >
              {["Feature", "Short", "Series", "TV"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
              className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
            >
              {["Drama", "Thriller", "Romance", "Comedy", "Legal Thriller", "Romantic Drama"].map(
                (g) => (
                  <option key={g}>{g}</option>
                )
              )}
            </select>
          </div>
          <select
            value={form.dealType}
            onChange={(e) => setForm((f) => ({ ...f, dealType: e.target.value }))}
            className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
          >
            <option value="purchase">Purchase only</option>
            <option value="option">Option only</option>
            <option value="both">Purchase + Option</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Purchase ₦"
              value={form.priceNGN}
              onChange={(e) => setForm((f) => ({ ...f, priceNGN: e.target.value }))}
              className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
            />
            <input
              placeholder="Option ₦"
              value={form.optionPriceNGN}
              onChange={(e) => setForm((f) => ({ ...f, optionPriceNGN: e.target.value }))}
              className="rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
            />
          </div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#2a1018] py-6 text-xs text-[#909090]">
            Upload Script (PDF / TXT)
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadScript(f);
              }}
            />
          </label>
          <p className="text-[11px] text-[#606060]">
            Pages detected: {form.pageCount || "—"} · Preview = first 10 pages only
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={saving || busy} onClick={() => saveListing()}>
              Save Draft
            </Button>
            <Button disabled={saving || busy} onClick={submitListing}>
              Submit for Review
            </Button>
          </div>
        </div>
      )}

      {tab === "listings" && (
        <div className="space-y-3">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--gd)]" />
          ) : myListings.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#707070]">No listings yet.</p>
          ) : (
            myListings.map((l) => (
              <div key={l.id} className="rounded-2xl border border-[#2a1018] bg-[#160004] p-4">
                <div className="font-serif font-bold text-white">{l.title}</div>
                <div className="text-[10px] uppercase text-[#707070]">
                  {l.status.replace("_", " ")} · {l.views} views
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "purchases" && (
        <div className="space-y-3">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--gd)]" />
          ) : purchases.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#707070]">No purchases yet.</p>
          ) : (
            purchases.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#2a1018] bg-[#160004] p-4 flex justify-between gap-3">
                <div>
                  <div className="font-serif font-bold text-white">{p.listingTitle}</div>
                  <div className="text-[10px] text-[#707070]">
                    {p.dealType} · {naira(p.amountNGN)} · {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setActive({ id: p.listingId, title: p.listingTitle } as Listing);
                    const res = await api.get(`/marketplace/listings/${p.listingId}/full`);
                    setFullText(res.data.fullText || "");
                    setTab("full");
                  }}
                >
                  Open Script
                </Button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "earnings" && (
        <div className="space-y-4">
          {loading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--gd)]" />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-[#2a1018] bg-[#160004] p-3 text-center">
                  <div className="text-[10px] text-[#707070]">Total Sales</div>
                  <div className="text-sm font-bold text-white">
                    {naira(Number(earnings?.totalSales || 0))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#2a1018] bg-[#160004] p-3 text-center">
                  <div className="text-[10px] text-[#707070]">Commission</div>
                  <div className="text-sm font-bold text-white">
                    {naira(Number(earnings?.totalCommission || 0))}
                  </div>
                </div>
                <div className="rounded-xl border border-[#2a1018] bg-[#160004] p-3 text-center">
                  <div className="text-[10px] text-[#707070]">Available</div>
                  <div className="text-sm font-bold text-[var(--gd)]">
                    {naira(Number(earnings?.availableBalance || 0))}
                  </div>
                </div>
              </div>
              {transactions.map((t) => (
                <div key={t.id} className="rounded-xl border border-[#2a1018] bg-[#160004] p-3 text-xs text-[#909090]">
                  <div className="font-semibold text-white">{t.listingTitle}</div>
                  Sale {naira(t.amount)} · Commission {naira(t.commission)} · Net {naira(t.writerAmount)}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "options" && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase text-[#707070]">Incoming (writer)</h4>
          {writerOptions.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[#2a1018] bg-[#160004] p-4 space-y-2">
              <div className="font-serif font-bold text-white">{o.listingTitle}</div>
              <div className="text-xs text-[#909090]">
                From {o.buyerName} · {naira(o.optionPriceNGN)} · {o.status}
              </div>
              {o.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => respondOption(o.id, "accept")}>
                    Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respondOption(o.id, "reject")}>
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
          <h4 className="text-xs uppercase text-[#707070]">My requests (buyer)</h4>
          {buyerOptions.map((o) => (
            <div key={o.id} className="rounded-2xl border border-[#2a1018] bg-[#160004] p-4">
              <div className="font-serif font-bold text-white">{o.listingTitle}</div>
              <div className="text-xs text-[#909090] mb-2">
                {o.status} · {naira(o.optionPriceNGN)}
              </div>
              {o.status === "accepted" && (
                <Button size="sm" onClick={() => checkout("option", o.id)}>
                  Pay Option Fee
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showOptionModal} onClose={() => setShowOptionModal(false)} title="Request Option">
        <div className="space-y-3">
          <p className="text-xs text-[#909090]">
            The writer must accept before payment. Option terms are between parties — platform only
            facilitates payment and access.
          </p>
          <textarea
            rows={3}
            value={optionMsg}
            onChange={(e) => setOptionMsg(e.target.value)}
            placeholder="Message to writer (optional)"
            className="w-full rounded-xl border border-[#2a1018] bg-[#0a0004] px-3 py-2.5 text-sm text-[#f0ebe0]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOptionModal(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={sendOptionRequest}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
