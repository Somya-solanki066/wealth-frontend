"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Copy,
  FolderOpen,
  Loader2,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import { fetchPublishedPortfolioUrl } from "@/components/PortfolioBuilderWorkspace";

type FieldDef = {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  multiline?: boolean;
};

type Template = {
  id: string;
  name: string;
  description: string;
  structure: string;
  fields: FieldDef[];
  generateLabel: string;
};

type SavedPitch = {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  pitch: string;
  createdAt: string;
};

type View = "compose" | "saved";

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

export default function PitchTemplatesWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<View>("compose");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [details, setDetails] = useState<Record<string, string>>({});
  const [pitch, setPitch] = useState("");
  const [editing, setEditing] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState<SavedPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const selected = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId]
  );

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/writer/pitch-templates/templates");
      const list = (res.data.templates || []) as Template[];
      setTemplates(list);
      if (list[0]) {
        setTemplateId((prev) => prev || list[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const res = await api.get("/writer/pitch-templates/saved");
      setSaved(res.data.pitches || []);
    } catch {
      /* ignore list errors on first paint */
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
    void loadSaved();
  }, [loadTemplates, loadSaved]);

  useEffect(() => {
    setDetails({});
    setPitch("");
    setGenerated(false);
    setEditing(false);
    setSaveTitle("");
  }, [templateId]);

  const setField = (key: string, value: string) => {
    setDetails((d) => ({ ...d, [key]: value }));
  };

  const generate = async () => {
    if (!selected) return;
    for (const f of selected.fields) {
      if (f.required && !String(details[f.key] || "").trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/pitch-templates/generate", {
        templateId: selected.id,
        details,
      });
      setPitch(res.data.pitch || "");
      setGenerated(true);
      setEditing(false);
      setSaveTitle(`${selected.name}`);
      showToast("Pitch ready");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Could not generate pitch.");
    } finally {
      setBusy(false);
    }
  };

  const copyPitch = async () => {
    if (!pitch.trim()) return;
    try {
      await navigator.clipboard.writeText(pitch);
      showToast("Pitch copied ✓");
    } catch {
      setError("Copy failed.");
    }
  };

  const insertPortfolioLink = async () => {
    const url = await fetchPublishedPortfolioUrl();
    if (!url) {
      setError("Publish a portfolio first in Portfolio Builder.");
      return;
    }
    const block = `\n\nMy portfolio:\n${url}`;
    setPitch((p) => (p.includes(url) ? p : `${p.trim()}${block}`));
    setEditing(true);
    showToast("Portfolio link inserted");
  };

  const savePitch = async () => {
    if (!selected || !pitch.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/writer/pitch-templates/saved", {
        title: saveTitle.trim() || selected.name,
        templateId: selected.id,
        templateName: selected.name,
        pitch,
        details,
      });
      await loadSaved();
      showToast("Pitch saved");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const openSaved = (item: SavedPitch) => {
    setView("compose");
    setTemplateId(item.templateId || templateId);
    setPitch(item.pitch);
    setGenerated(true);
    setEditing(true);
    setSaveTitle(item.title);
    showToast("Loaded saved pitch");
  };

  const removeSaved = async (id: string) => {
    try {
      await api.delete(`/writer/pitch-templates/saved/${id}`);
      setSaved((list) => list.filter((p) => p.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        Content & Freelance
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3a2a12] text-[var(--gd)]">
            <Send size={18} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Pitch Templates</h2>
            <p className="mt-1 text-sm text-[#909090]">Cold outreach and gig applications</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("compose")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              view === "compose"
                ? "bg-[var(--gd)] text-zinc-950"
                : "border border-[#333] text-[#c8c4bc]"
            }`}
          >
            Compose
          </button>
          <button
            type="button"
            onClick={() => {
              setView("saved");
              void loadSaved();
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              view === "saved"
                ? "bg-[var(--gd)] text-zinc-950"
                : "border border-[#333] text-[#c8c4bc]"
            }`}
          >
            <FolderOpen size={12} />
            My Saved Pitches
            {saved.length > 0 && (
              <span className="rounded-full bg-black/20 px-1.5">{saved.length}</span>
            )}
          </button>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-[var(--gd)]" />
        </div>
      ) : view === "saved" ? (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
            My Saved Pitches
          </h3>
          {saved.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No saved pitches yet. Generate one and tap Save Pitch.
            </p>
          ) : (
            saved.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openSaved(item)}
                >
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {item.templateName}
                    {item.createdAt
                      ? ` · ${new Date(item.createdAt).toLocaleDateString()}`
                      : ""}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[#909090]">{item.pitch}</p>
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-2 text-[#909090] hover:bg-[#242424] hover:text-red-300"
                  onClick={() => void removeSaved(item.id)}
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div>
            <p className={labelClass}>Choose a template</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => {
                const on = templateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplateId(t.id)}
                    className={`rounded-full px-4 py-2 text-left text-sm font-semibold transition ${
                      on
                        ? "bg-[var(--gd)] text-zinc-950"
                        : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
            {selected?.description && (
              <p className="mt-2 text-xs text-[#606060]">{selected.description}</p>
            )}
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#242424] bg-[#121212] p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
                  Fill personal details
                </h3>
                <div className="space-y-3">
                  {selected.fields.map((f) => (
                    <label key={f.key} className="block">
                      <span className={labelClass}>
                        {f.label}
                        {f.required ? "" : " (optional)"}
                      </span>
                      {f.multiline ? (
                        <textarea
                          className={`${inputClass} min-h-[88px] resize-y`}
                          value={details[f.key] || ""}
                          placeholder={f.placeholder}
                          onChange={(e) => setField(f.key, e.target.value)}
                        />
                      ) : (
                        <input
                          className={inputClass}
                          value={details[f.key] || ""}
                          placeholder={f.placeholder}
                          onChange={(e) => setField(f.key, e.target.value)}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <Button onClick={() => void generate()} disabled={busy} className="mt-4 w-full">
                  {busy ? (
                    <>
                      <Loader2 size={14} className="mr-1.5 animate-spin" /> Generating…
                    </>
                  ) : (
                    selected.generateLabel || "Generate Pitch"
                  )}
                </Button>
              </div>

              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
                    Preview
                  </h3>
                  {generated && (
                    <button
                      type="button"
                      onClick={() => setEditing((e) => !e)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gd)]"
                    >
                      <Pencil size={12} />
                      {editing ? "Done" : "Edit"}
                    </button>
                  )}
                </div>

                {!generated ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#909090]">
                    {selected.structure}
                  </p>
                ) : editing ? (
                  <textarea
                    className={`${inputClass} min-h-[220px] resize-y`}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F0EBE0]">
                    {pitch}
                  </p>
                )}
              </div>

              {generated && (
                <div className="space-y-3">
                  <label className="block">
                    <span className={labelClass}>Save as (title)</span>
                    <input
                      className={inputClass}
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="e.g. Skincare Agency Pitch"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => void copyPitch()}>
                      <Copy size={14} className="mr-1.5" /> Copy Pitch
                    </Button>
                    <Button onClick={() => void savePitch()} disabled={busy}>
                      <Bookmark size={14} className="mr-1.5" /> Save Pitch
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => void insertPortfolioLink()}
                  >
                    Insert portfolio link
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Pitch Templates"
      />
    </div>
  );
}
