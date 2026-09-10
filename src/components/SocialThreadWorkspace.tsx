"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  Copy,
  FolderOpen,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Step = "form" | "thread" | "drafts";
type MetaOption = { id: string; label: string };

type Draft = {
  id?: string;
  idea: string;
  audience: string;
  goal: string;
  tone: string;
  length: string;
  cta: string;
  projectName?: string;
  website?: string;
  keyInfo?: string;
  references?: string;
  posts: string[];
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const DEFAULT_AUDIENCES: MetaOption[] = [
  { id: "web3-beginners", label: "Web3 Beginners" },
  { id: "crypto-users", label: "Crypto Users" },
  { id: "developers", label: "Developers" },
  { id: "investors", label: "Investors" },
  { id: "project-community", label: "Project Community" },
  { id: "general", label: "General Audience" },
];
const DEFAULT_GOALS: MetaOption[] = [
  { id: "educate", label: "Educate" },
  { id: "explain-product", label: "Explain a Product" },
  { id: "announce-update", label: "Announce an Update" },
  { id: "build-awareness", label: "Build Awareness" },
  { id: "community-engagement", label: "Community Engagement" },
  { id: "promote-project", label: "Promote a Project" },
];
const DEFAULT_TONES: MetaOption[] = [
  { id: "educational", label: "Educational" },
  { id: "professional", label: "Professional" },
  { id: "conversational", label: "Conversational" },
  { id: "bold", label: "Bold" },
  { id: "technical", label: "Technical" },
  { id: "community", label: "Community-focused" },
];
const DEFAULT_LENGTHS: MetaOption[] = [
  { id: "short", label: "Short — 5 posts" },
  { id: "standard", label: "Standard — 8 posts" },
  { id: "long", label: "Long — 10–12 posts" },
];
const DEFAULT_CTAS: MetaOption[] = [
  { id: "follow", label: "Follow for more" },
  { id: "join-community", label: "Join community" },
  { id: "visit-website", label: "Visit website" },
  { id: "read-docs", label: "Read documentation" },
  { id: "try-product", label: "Try the product" },
  { id: "none", label: "No CTA" },
];

export default function SocialThreadWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("form");
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("web3-beginners");
  const [goal, setGoal] = useState("educate");
  const [tone, setTone] = useState("conversational");
  const [length, setLength] = useState("standard");
  const [cta, setCta] = useState("follow");
  const [projectName, setProjectName] = useState("");
  const [website, setWebsite] = useState("");
  const [keyInfo, setKeyInfo] = useState("");
  const [references, setReferences] = useState("");
  const [posts, setPosts] = useState<string[]>([]);
  const [hookAlts, setHookAlts] = useState<string[]>([]);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [audiences, setAudiences] = useState(DEFAULT_AUDIENCES);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [tones, setTones] = useState(DEFAULT_TONES);
  const [lengths, setLengths] = useState(DEFAULT_LENGTHS);
  const [ctas, setCtas] = useState(DEFAULT_CTAS);
  const [busy, setBusy] = useState(false);
  const [busyPost, setBusyPost] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [copyIndex, setCopyIndex] = useState(0);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadDrafts = useCallback(async () => {
    try {
      const res = await api.get("/writer/web3-thread/drafts");
      setDrafts(res.data.drafts || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/web3-thread/meta").then((res) => {
      if (res.data.audiences?.length) setAudiences(res.data.audiences);
      if (res.data.goals?.length) setGoals(res.data.goals);
      if (res.data.tones?.length) setTones(res.data.tones);
      if (res.data.lengths?.length) setLengths(res.data.lengths);
      if (res.data.ctas?.length) setCtas(res.data.ctas);
    });
    void loadDrafts();
  }, [loadDrafts]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const totalChars = useMemo(
    () => posts.reduce((sum, p) => sum + p.length, 0),
    [posts]
  );

  const payloadBase = () => ({
    idea: idea.trim(),
    audience,
    goal,
    tone,
    length,
    cta,
    projectName: projectName.trim() || undefined,
    website: website.trim() || undefined,
    keyInfo: keyInfo.trim() || undefined,
    references: references.trim() || undefined,
  });

  const handlePremium = (err: any) => {
    if (err.response?.data?.premiumRequired) {
      setShowPaywall(true);
      return true;
    }
    return false;
  };

  const generateThread = async () => {
    if (idea.trim().length < 3) {
      setError("Enter a core idea for the thread.");
      return;
    }
    setBusy(true);
    setError("");
    setHookAlts([]);
    try {
      const res = await api.post("/writer/web3-thread/generate", payloadBase());
      setPosts(res.data.thread.posts || []);
      setCopyIndex(0);
      setStep("thread");
      showToast("Thread ready");
    } catch (err: any) {
      if (handlePremium(err)) return;
      setError(err.response?.data?.error || "Generate failed.");
    } finally {
      setBusy(false);
    }
  };

  const refinePost = async (index: number, action: "rewrite" | "shorten" | "expand") => {
    setBusyPost(index);
    setError("");
    try {
      const res = await api.post("/writer/web3-thread/refine-post", {
        action,
        post: posts[index],
        idea: idea.trim(),
        audience,
        tone,
        index,
        total: posts.length,
      });
      setPosts((list) => list.map((p, i) => (i === index ? res.data.post : p)));
      showToast(action === "shorten" ? "Shortened" : action === "expand" ? "Expanded" : "Rewritten");
    } catch (err: any) {
      if (handlePremium(err)) return;
      setError(err.response?.data?.error || "Refine failed.");
    } finally {
      setBusyPost(null);
    }
  };

  const improveHook = async () => {
    if (!posts[0]) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-thread/improve-hook", {
        idea: idea.trim(),
        currentHook: posts[0],
        audience,
        tone,
        goal,
      });
      setHookAlts(res.data.alternatives || []);
      showToast("Hook options ready");
    } catch (err: any) {
      if (handlePremium(err)) return;
      setError(err.response?.data?.error || "Hook failed.");
    } finally {
      setBusy(false);
    }
  };

  const applyCta = async (nextCta: string) => {
    setCta(nextCta);
    if (!posts.length) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-thread/apply-cta", {
        idea: idea.trim(),
        lastPost: posts[posts.length - 1],
        cta: nextCta,
        projectName: projectName.trim() || undefined,
        website: website.trim() || undefined,
        tone,
      });
      setPosts((list) => {
        const copy = [...list];
        copy[copy.length - 1] = res.data.post;
        return copy;
      });
      showToast("CTA updated");
    } catch (err: any) {
      if (handlePremium(err)) return;
      setError(err.response?.data?.error || "CTA update failed.");
    } finally {
      setBusy(false);
    }
  };

  const formatThread = () =>
    posts.map((p, i) => `${i + 1}/${posts.length}\n${p}`).join("\n\n");

  const copyEntire = async () => {
    try {
      await navigator.clipboard.writeText(formatThread());
      showToast("Entire thread copied");
    } catch {
      setError("Copy failed.");
    }
  };

  const copyPostByPost = async () => {
    if (!posts.length) return;
    const i = copyIndex % posts.length;
    try {
      await navigator.clipboard.writeText(posts[i]);
      const next = (i + 1) % posts.length;
      setCopyIndex(next);
      showToast(`Copied post ${i + 1}/${posts.length}`);
    } catch {
      setError("Copy failed.");
    }
  };

  const saveDraft = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-thread/drafts", {
        id: draftId,
        ...payloadBase(),
        posts,
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
    setDraftId(d.id);
    setIdea(d.idea);
    setAudience(d.audience);
    setGoal(d.goal);
    setTone(d.tone);
    setLength(d.length);
    setCta(d.cta);
    setProjectName(d.projectName || "");
    setWebsite(d.website || "");
    setKeyInfo(d.keyInfo || "");
    setReferences(d.references || "");
    setPosts(d.posts || []);
    setHookAlts([]);
    setCopyIndex(0);
    setStep(d.posts?.length ? "thread" : "form");
  };

  const removeDraft = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/web3-thread/drafts/${id}`);
      setDrafts((list) => list.filter((d) => d.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "thread" || step === "drafts") {
            setStep("form");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "form" ? "Web3 Writing" : "Social Thread Generator"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <AlignLeft size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Social Thread Generator</h2>
            <p className="mt-1 text-sm text-[#909090]">Turn one idea into a Twitter/X thread</p>
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
          <FolderOpen size={12} /> Saved drafts
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

      {step === "drafts" && (
        <div className="space-y-3">
          {drafts.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No saved threads yet.
            </p>
          ) : (
            drafts.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-2 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openDraft(d)}>
                  <div className="font-medium text-white line-clamp-2">{d.idea}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {d.posts?.length || 0} posts
                  </div>
                </button>
                <button
                  type="button"
                  className="p-2 text-[#909090] hover:text-red-300"
                  onClick={() => void removeDraft(d.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {step === "form" && (
        <div className="space-y-5">
          <label className="block">
            <span className={labelClass}>Core idea for the thread</span>
            <textarea
              className={`${inputClass} min-h-[110px]`}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. Why our new token model rewards long-term holders"
            />
          </label>

          <div>
            <p className={labelClass}>Who is this thread for?</p>
            <div className="flex flex-wrap gap-2">
              {audiences.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={pill(audience === a.id)}
                  onClick={() => setAudience(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>What&apos;s the goal?</p>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={pill(goal === g.id)}
                  onClick={() => setGoal(g.id)}
                >
                  {g.label}
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
            <p className={labelClass}>Thread length</p>
            <div className="flex flex-wrap gap-2">
              {lengths.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={pill(length === l.id)}
                  onClick={() => setLength(l.id)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelClass}>Final CTA</p>
            <div className="flex flex-wrap gap-2">
              {ctas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={pill(cta === c.id)}
                  onClick={() => setCta(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Project context (optional)
            </p>
            <p className="text-[11px] text-[#606060]">
              AI uses this as source of truth and will not invent tokenomics or roadmap claims.
            </p>
            <label className="block">
              <span className={labelClass}>Project name</span>
              <input
                className={inputClass}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Acme Protocol"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Website</span>
              <input
                className={inputClass}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Key information</span>
              <textarea
                className={`${inputClass} min-h-[72px]`}
                value={keyInfo}
                onChange={(e) => setKeyInfo(e.target.value)}
                placeholder="What the project does, key features…"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Reference docs</span>
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder="Paste project details…"
              />
            </label>
          </div>

          <Button className="w-full" onClick={() => void generateThread()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Break into a thread
          </Button>
        </div>
      )}

      {step === "thread" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#52C07A]/25 bg-[#52C07A]/10 px-4 py-3">
            <p className="text-sm font-semibold text-[#52C07A]">Thread Ready ✓</p>
            <p className="mt-1 text-xs text-[#909090]">
              {posts.length} posts · {totalChars.toLocaleString()} characters
            </p>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Thread hook
            </p>
            <p className="mt-2 text-sm text-[#c8c4bc] line-clamp-4">{posts[0]}</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => void improveHook()}
              disabled={busy}
            >
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Improve Hook
            </Button>
            {hookAlts.length > 0 && (
              <div className="mt-3 space-y-2">
                {hookAlts.map((alt, i) => (
                  <button
                    key={alt}
                    type="button"
                    className="w-full rounded-xl border border-[#333] bg-[#121212] px-3 py-2.5 text-left text-sm text-[#F0EBE0] hover:border-[var(--gd)]"
                    onClick={() => {
                      setPosts((list) => list.map((p, idx) => (idx === 0 ? alt : p)));
                      showToast("Hook applied");
                    }}
                  >
                    <span className="mr-2 font-bold text-[var(--gd)]">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {alt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className={labelClass}>Final CTA</p>
            <div className="flex flex-wrap gap-2">
              {ctas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={pill(cta === c.id)}
                  onClick={() => void applyCta(c.id)}
                  disabled={busy}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
            Thread preview
          </p>

          {posts.map((post, i) => (
            <div key={i} className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--gd)]">
                  Post {i + 1} / {posts.length}
                </p>
                <p
                  className={`text-[11px] ${
                    post.length > 280 ? "text-amber-400" : "text-[#606060]"
                  }`}
                >
                  {post.length} chars
                </p>
              </div>
              <textarea
                className={`${inputClass} min-h-[96px]`}
                value={post}
                onChange={(e) =>
                  setPosts((list) => list.map((p, idx) => (idx === i ? e.target.value : p)))
                }
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={busyPost === i}
                  onClick={() => void refinePost(i, "rewrite")}
                >
                  {busyPost === i ? (
                    <Loader2 size={12} className="mr-1 animate-spin" />
                  ) : null}
                  Rewrite
                </Button>
                <Button
                  variant="secondary"
                  disabled={busyPost === i}
                  onClick={() => void refinePost(i, "shorten")}
                >
                  Shorten
                </Button>
                <Button
                  variant="secondary"
                  disabled={busyPost === i}
                  onClick={() => void refinePost(i, "expand")}
                >
                  Expand
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(post);
                      showToast(`Copied post ${i + 1}`);
                    } catch {
                      setError("Copy failed.");
                    }
                  }}
                >
                  <Copy size={12} className="mr-1" /> Copy
                </Button>
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void copyEntire()}>
              <Copy size={14} className="mr-1.5" /> Copy Entire Thread
            </Button>
            <Button variant="secondary" onClick={() => void copyPostByPost()}>
              <Copy size={14} className="mr-1.5" /> Copy Post by Post
            </Button>
            <Button
              variant="secondary"
              className="col-span-2"
              onClick={() => void generateThread()}
              disabled={busy}
            >
              <RefreshCw size={14} className="mr-1.5" /> Regenerate
            </Button>
          </div>
          <Button className="w-full" onClick={() => void saveDraft()} disabled={busy}>
            {busy ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Save size={14} className="mr-1.5" />
            )}
            Save Draft
          </Button>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Social Thread Generator"
      />
    </div>
  );
}
