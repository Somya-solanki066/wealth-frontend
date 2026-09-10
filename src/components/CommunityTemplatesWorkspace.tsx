"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Copy,
  FolderOpen,
  Loader2,
  Pencil,
  Save,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Step = "form" | "library";
type MetaOption = { id: string; label: string };
type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
};
type PostTypeMeta = MetaOption & { core?: boolean; fields: FieldDef[] };

type SavedItem = {
  id?: string;
  templateName?: string;
  postType: string;
  tone: string;
  length: string;
  projectName?: string;
  website?: string;
  communityName?: string;
  socialLinks?: string;
  fields: Record<string, string>;
  body: string;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

const FALLBACK_TYPES: PostTypeMeta[] = [
  {
    id: "product-update",
    label: "Product update announcement",
    core: true,
    fields: [
      { key: "featureName", label: "Feature / Product Name", placeholder: "Staking Dashboard", required: true },
      { key: "whatChanged", label: "What changed?", multiline: true, required: true },
      { key: "whyItMatters", label: "Why it matters", multiline: true },
      { key: "link", label: "Link", placeholder: "https://" },
      { key: "cta", label: "CTA" },
    ],
  },
  {
    id: "ama-recap",
    label: "AMA recap",
    core: true,
    fields: [
      { key: "amaTopic", label: "AMA Topic", required: true },
      { key: "date", label: "Date" },
      { key: "discussionPoints", label: "Key Discussion Points", multiline: true, required: true },
      { key: "importantAnswers", label: "Important Answers", multiline: true },
      { key: "recordingLink", label: "Recording Link" },
    ],
  },
  {
    id: "roadmap-milestone",
    label: "Roadmap milestone hit",
    core: true,
    fields: [
      { key: "milestone", label: "Milestone", required: true },
      { key: "achieved", label: "What was achieved?", multiline: true, required: true },
      { key: "whatsNext", label: "What's next?", multiline: true },
      { key: "link", label: "Link" },
    ],
  },
  {
    id: "community-shoutout",
    label: "Community shoutout",
    core: true,
    fields: [
      { key: "personName", label: "Person / Community Name", required: true },
      { key: "reason", label: "Reason for shoutout", multiline: true, required: true },
      { key: "achievement", label: "Achievement", multiline: true },
      { key: "profileLink", label: "Link / Profile" },
    ],
  },
];

const DEFAULT_TONES: MetaOption[] = [
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "excited", label: "Excited" },
  { id: "technical", label: "Technical" },
  { id: "community", label: "Community-focused" },
];
const DEFAULT_LENGTHS: MetaOption[] = [
  { id: "short", label: "Short" },
  { id: "standard", label: "Standard" },
  { id: "detailed", label: "Detailed" },
];

export default function CommunityTemplatesWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("form");
  const [libraryTab, setLibraryTab] = useState<"drafts" | "templates">("drafts");
  const [postTypes, setPostTypes] = useState(FALLBACK_TYPES);
  const [showMoreTypes, setShowMoreTypes] = useState(false);
  const [postType, setPostType] = useState("product-update");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [tone, setTone] = useState("friendly");
  const [length, setLength] = useState("standard");
  const [projectName, setProjectName] = useState("");
  const [website, setWebsite] = useState("");
  const [communityName, setCommunityName] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(true);
  const [draftId, setDraftId] = useState<string | undefined>();
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [templateName, setTemplateName] = useState("");
  const [drafts, setDrafts] = useState<SavedItem[]>([]);
  const [templates, setTemplates] = useState<SavedItem[]>([]);
  const [tones, setTones] = useState(DEFAULT_TONES);
  const [lengths, setLengths] = useState(DEFAULT_LENGTHS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const currentType = useMemo(
    () => postTypes.find((t) => t.id === postType) || postTypes[0],
    [postTypes, postType]
  );

  const visibleTypes = useMemo(() => {
    if (showMoreTypes) return postTypes;
    const core = postTypes.filter((t) => t.core);
    return (core.length ? core : postTypes).slice(0, 4);
  }, [postTypes, showMoreTypes]);

  const loadLibrary = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([
        api.get("/writer/web3-community/drafts"),
        api.get("/writer/web3-community/templates"),
      ]);
      setDrafts(d.data.drafts || []);
      setTemplates(t.data.templates || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/web3-community/meta").then((res) => {
      if (res.data.postTypes?.length) setPostTypes(res.data.postTypes);
      if (res.data.tones?.length) setTones(res.data.tones);
      if (res.data.lengths?.length) setLengths(res.data.lengths);
    });
    void loadLibrary();
  }, [loadLibrary]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const selectType = (id: string) => {
    setPostType(id);
    setFields({});
    setBody("");
    setDraftId(undefined);
  };

  const payload = () => ({
    postType,
    tone,
    length,
    projectName: projectName.trim() || undefined,
    website: website.trim() || undefined,
    communityName: communityName.trim() || undefined,
    socialLinks: socialLinks.trim() || undefined,
    fields,
  });

  const generatePost = async () => {
    const required = (currentType?.fields || []).filter((f) => f.required);
    for (const f of required) {
      if (!String(fields[f.key] || "").trim()) {
        setError(`Fill in: ${f.label}`);
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-community/assemble", payload());
      setBody(res.data.post.body || "");
      setEditing(true);
      showToast("Post ready");
    } catch (err: any) {
      setError(err.response?.data?.error || "Generate failed.");
    } finally {
      setBusy(false);
    }
  };

  const polishPost = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-community/polish", {
        ...payload(),
        draftBody: body || undefined,
      });
      setBody(res.data.post.body || "");
      setEditing(true);
      showToast("Polished with AI");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Polish failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyPost = async () => {
    if (!body.trim()) {
      setError("Generate a post first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(body);
      showToast("Copied");
    } catch {
      setError("Copy failed.");
    }
  };

  const saveDraft = async () => {
    if (!body.trim()) {
      setError("Generate a post before saving a draft.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-community/drafts", {
        id: draftId,
        ...payload(),
        body,
      });
      setDraftId(res.data.draft.id);
      await loadLibrary();
      showToast("Draft saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveTemplate = async () => {
    if (templateName.trim().length < 2) {
      setError("Enter a name for your template.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/web3-community/templates", {
        id: templateId,
        templateName: templateName.trim(),
        ...payload(),
        body,
      });
      setTemplateId(res.data.template.id);
      setShowSaveTemplate(false);
      await loadLibrary();
      showToast("Template saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const openItem = (item: SavedItem, asTemplate: boolean) => {
    setPostType(item.postType);
    setTone(item.tone || "friendly");
    setLength(item.length || "standard");
    setProjectName(item.projectName || "");
    setWebsite(item.website || "");
    setCommunityName(item.communityName || "");
    setSocialLinks(item.socialLinks || "");
    setFields(item.fields || {});
    setBody(item.body || "");
    setEditing(true);
    if (asTemplate) {
      setTemplateId(item.id);
      setTemplateName(item.templateName || "");
      setDraftId(undefined);
    } else {
      setDraftId(item.id);
      setTemplateId(undefined);
    }
    setStep("form");
  };

  const removeDraft = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/web3-community/drafts/${id}`);
      setDrafts((list) => list.filter((d) => d.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const removeTemplate = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/web3-community/templates/${id}`);
      setTemplates((list) => list.filter((d) => d.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const typeLabel = (id: string) => postTypes.find((t) => t.id === id)?.label || id;

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (step === "library") {
            setStep("form");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {step === "form" ? "Web3 Writing" : "Community Post Templates"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <Send size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Community Post Templates</h2>
            <p className="mt-1 text-sm text-[#909090]">Announcements, AMA recaps, updates</p>
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
          <FolderOpen size={12} /> Saved
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

      {step === "library" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button type="button" className={pill(libraryTab === "drafts")} onClick={() => setLibraryTab("drafts")}>
              Drafts
            </button>
            <button
              type="button"
              className={pill(libraryTab === "templates")}
              onClick={() => setLibraryTab("templates")}
            >
              My Templates
            </button>
          </div>
          {libraryTab === "drafts" &&
            (drafts.length === 0 ? (
              <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
                No drafts yet.
              </p>
            ) : (
              drafts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-start gap-2 rounded-xl border border-[#242424] bg-[#161616] p-4"
                >
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openItem(d, false)}>
                    <div className="font-medium text-white line-clamp-2">{d.body || typeLabel(d.postType)}</div>
                    <div className="mt-1 text-[11px] text-[#606060]">{typeLabel(d.postType)}</div>
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
            ))}
          {libraryTab === "templates" &&
            (templates.length === 0 ? (
              <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
                No saved templates yet.
              </p>
            ) : (
              templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-2 rounded-xl border border-[#242424] bg-[#161616] p-4"
                >
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openItem(t, true)}>
                    <div className="font-medium text-white">{t.templateName || "Untitled template"}</div>
                    <div className="mt-1 text-[11px] text-[#606060]">{typeLabel(t.postType)}</div>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-[#909090] hover:text-red-300"
                    onClick={() => void removeTemplate(t.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ))}
        </div>
      )}

      {step === "form" && (
        <div className="space-y-5">
          <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Project / community (optional)
            </p>
            <label className="block">
              <span className={labelClass}>Project name</span>
              <input
                className={inputClass}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My DeFi Project"
              />
            </label>
            <label className="block">
              <span className={labelClass}>Community name</span>
              <input
                className={inputClass}
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                placeholder="Acme Discord"
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
              <span className={labelClass}>Social links</span>
              <input
                className={inputClass}
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
                placeholder="X / Discord / Telegram"
              />
            </label>
          </div>

          <div>
            <p className={labelClass}>Choose a template</p>
            <div className="flex flex-wrap gap-2">
              {visibleTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={pill(postType === t.id)}
                  onClick={() => selectType(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {postTypes.length > 4 && (
              <button
                type="button"
                className="mt-2 text-xs font-semibold text-[var(--gd)]"
                onClick={() => setShowMoreTypes((v) => !v)}
              >
                {showMoreTypes ? "Show fewer" : "More templates"}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(currentType?.fields || []).map((f) => (
              <label key={f.key} className="block">
                <span className={labelClass}>
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                {f.multiline ? (
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={fields[f.key] || ""}
                    onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                ) : (
                  <input
                    className={inputClass}
                    value={fields[f.key] || ""}
                    onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                  />
                )}
              </label>
            ))}
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
            <p className={labelClass}>Length</p>
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="w-full" onClick={() => void generatePost()} disabled={busy}>
              {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
              Generate Post
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => void polishPost()} disabled={busy}>
              <Sparkles size={14} className="mr-1.5" />
              Polish with AI
            </Button>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">Preview</p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#c8c4bc]"
                onClick={() => setEditing((v) => !v)}
              >
                <Pencil size={12} />
                {editing ? "Lock" : "Edit"}
              </button>
            </div>
            {body ? (
              <textarea
                className={`${inputClass} mt-3 min-h-[180px] resize-y`}
                value={body}
                readOnly={!editing}
                onChange={(e) => setBody(e.target.value)}
              />
            ) : (
              <p className="mt-3 text-sm text-[#606060]">
                Fill the fields and generate a post to see the preview here.
              </p>
            )}
            {body ? (
              <p className="mt-3 text-xs text-[#606060]">Character count: {body.length}</p>
            ) : null}
          </div>

          {showSaveTemplate && (
            <div className="rounded-2xl border border-[#242424] bg-[#121212] p-4 space-y-3">
              <p className="text-xs text-[#909090]">Name your reusable template</p>
              <input
                className={inputClass}
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="My Product Update Template"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setShowSaveTemplate(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveTemplate()} disabled={busy}>
                  Save
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" onClick={() => void copyPost()}>
              <Copy size={14} className="mr-1.5" /> Copy Post
            </Button>
            <Button variant="secondary" onClick={() => void saveDraft()} disabled={busy}>
              <Save size={14} className="mr-1.5" /> Save Draft
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowSaveTemplate(true);
                if (!templateName) {
                  setTemplateName(`My ${currentType?.label || "template"}`);
                }
              }}
            >
              Save Template
            </Button>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Community Post Templates AI"
      />
    </div>
  );
}
