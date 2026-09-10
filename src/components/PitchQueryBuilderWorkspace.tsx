"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Download, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isFreePlan } from "@/lib/plans";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";
import Modal from "@/components/ui/Modal";

type Character = { id: string; role: string; name: string; notes: string };

type PitchDoc = {
  id: string;
  currentStep: number;
  status: string;
  projectDetails: {
    title: string;
    format: string;
    formatFamily: "novel" | "screenplay";
    genre: string;
    subGenre: string;
    targetPlatform: string;
    wordOrPageCount: string;
    authorName: string;
  };
  storyDetails: {
    logline: string;
    protagonist: string;
    goal: string;
    conflict: string;
    antagonist: string;
    loveInterest: string;
    uniquePremise: string;
    setting: string;
    themes: string;
    characters: Character[];
  };
  synopsis: string;
  queryLetter: string;
  agentName: string;
  personalization: string;
  authorBio: string;
  pitchDeck: string;
  linkedProjectId?: string | null;
  updatedAt?: string;
};

const NOVEL_FORMATS = ["Novel", "Novella", "Short Fiction", "Series"];
const SCRIPT_FORMATS = ["Feature Film", "Short Film", "TV Pilot", "Series"];
const GENRES = [
  "Romance",
  "Thriller",
  "Drama",
  "Comedy",
  "Horror",
  "Action",
  "Sci-Fi",
  "Fantasy",
  "Literary",
  "Crime",
];
const STEP_LABELS = ["Project", "Story", "Synopsis", "Query"];

function uid() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const emptyDoc = (): Omit<PitchDoc, "id"> => ({
  currentStep: 1,
  status: "draft",
  projectDetails: {
    title: "",
    format: "Novel",
    formatFamily: "novel",
    genre: "Romance",
    subGenre: "",
    targetPlatform: "",
    wordOrPageCount: "",
    authorName: "",
  },
  storyDetails: {
    logline: "",
    protagonist: "",
    goal: "",
    conflict: "",
    antagonist: "",
    loveInterest: "",
    uniquePremise: "",
    setting: "",
    themes: "",
    characters: [],
  },
  synopsis: "",
  queryLetter: "",
  agentName: "",
  personalization: "",
  authorBio: "",
  pitchDeck: "",
});

export default function PitchQueryBuilderWorkspace({ onBack }: { onBack?: () => void }) {
  const { profile, loading: authLoading } = useAuth();
  const locked =
    !authLoading &&
    (isFreePlan({ id: profile?.subscriptionPlan || "free" }) || !profile?.subscriptionPlan);

  const [showPaywall, setShowPaywall] = useState(false);
  const [screen, setScreen] = useState<"list" | "wizard" | "package">("list");
  const [drafts, setDrafts] = useState<PitchDoc[]>([]);
  const [doc, setDoc] = useState<PitchDoc | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [saveModal, setSaveModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const requirePremium = () => {
    if (!locked) return true;
    setShowPaywall(true);
    return false;
  };

  const loadList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/pitch-builder/projects");
      setDrafts(res.data.projects || []);
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "Failed to load drafts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!locked) void loadList();
    else {
      setLoading(false);
      setShowPaywall(true);
    }
  }, [locked, loadList]);

  const persist = async (next: PitchDoc, silent = true) => {
    if (!next.id) return next;
    setSaving(true);
    try {
      const { id, ...body } = next;
      const res = await api.put(`/pitch-builder/projects/${id}`, {
        ...body,
        currentStep: step,
      });
      const updated = res.data.project as PitchDoc;
      if (!silent) showToast("Saved");
      return updated;
    } catch (err: any) {
      if (!silent) setError(err.response?.data?.error || "Save failed.");
      return next;
    } finally {
      setSaving(false);
    }
  };

  const scheduleSave = (next: PitchDoc) => {
    setDoc(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist(next);
    }, 800);
  };

  const startNew = async () => {
    if (!requirePremium()) return;
    setError("");
    try {
      const res = await api.post("/pitch-builder/projects", emptyDoc());
      const project = res.data.project as PitchDoc;
      setDoc(project);
      setStep(1);
      setScreen("wizard");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "Could not start builder.");
    }
  };

  const openDraft = (d: PitchDoc) => {
    setDoc(d);
    setStep(Math.min(4, Math.max(1, d.currentStep || 1)));
    setScreen(d.status === "completed" && d.queryLetter && d.pitchDeck ? "package" : "wizard");
  };

  const updateProjectDetails = (patch: Partial<PitchDoc["projectDetails"]>) => {
    if (!doc) return;
    const format = patch.format ?? doc.projectDetails.format;
    const formatFamily =
      patch.formatFamily ||
      (SCRIPT_FORMATS.includes(format) ? "screenplay" : "novel");
    scheduleSave({
      ...doc,
      projectDetails: { ...doc.projectDetails, ...patch, format, formatFamily },
    });
  };

  const updateStory = (patch: Partial<PitchDoc["storyDetails"]>) => {
    if (!doc) return;
    scheduleSave({ ...doc, storyDetails: { ...doc.storyDetails, ...patch } });
  };

  const goNext = async () => {
    if (!doc) return;
    if (step === 1 && !doc.projectDetails.title.trim()) {
      setError("Project title is required.");
      return;
    }
    if (step === 2 && !doc.storyDetails.logline.trim()) {
      setError("Logline is required before continuing.");
      return;
    }
    setError("");
    const nextStep = Math.min(4, step + 1);
    setStep(nextStep);
    await persist({ ...doc, currentStep: nextStep });
  };

  const goBack = async () => {
    if (!doc) return;
    if (step <= 1) {
      setScreen("list");
      void loadList();
      return;
    }
    const nextStep = step - 1;
    setStep(nextStep);
    await persist({ ...doc, currentStep: nextStep });
  };

  const runSynopsisAi = async (mode: "generate" | "improve") => {
    if (!doc || !requirePremium()) return;
    setAiBusy(true);
    setError("");
    try {
      await persist(doc);
      const res = await api.post(`/pitch-builder/projects/${doc.id}/ai/synopsis`, {
        mode,
        previous: doc.synopsis,
      });
      setDoc(res.data.project);
      showToast(mode === "improve" ? "Synopsis improved" : "Synopsis generated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "AI synopsis failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const runQueryAi = async (mode: "generate" | "improve" | "regenerate") => {
    if (!doc || !requirePremium()) return;
    setAiBusy(true);
    setError("");
    try {
      await persist(doc);
      const res = await api.post(`/pitch-builder/projects/${doc.id}/ai/query`, {
        mode,
        previous: doc.queryLetter,
        agentName: doc.agentName,
        personalization: doc.personalization,
        authorBio: doc.authorBio,
      });
      setDoc(res.data.project);
      showToast("Query letter updated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "AI query failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const runPitchDeckAi = async () => {
    if (!doc || !requirePremium()) return;
    setAiBusy(true);
    setError("");
    try {
      await persist(doc);
      const res = await api.post(`/pitch-builder/projects/${doc.id}/ai/pitch-deck`, {
        mode: doc.pitchDeck ? "improve" : "generate",
        previous: doc.pitchDeck,
      });
      setDoc(res.data.project);
      setScreen("package");
      showToast("Pitch deck ready");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      setError(err.response?.data?.error || "Pitch deck failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const finishToPackage = async () => {
    if (!doc) return;
    if (!doc.queryLetter.trim()) {
      setError("Generate or write a query letter first.");
      return;
    }
    setError("");
    if (!doc.pitchDeck.trim()) {
      await runPitchDeckAi();
    } else {
      await persist({ ...doc, status: "completed" as any });
      setScreen("package");
    }
  };

  const openSaveModal = async () => {
    try {
      const res = await api.get("/projects");
      setUserProjects(Array.isArray(res.data) ? res.data : res.data?.projects || []);
      setSaveModal(true);
    } catch {
      setError("Could not load your projects.");
    }
  };

  const saveToProject = async () => {
    if (!doc || !selectedProjectId) return;
    setAiBusy(true);
    try {
      await api.post(`/pitch-builder/projects/${doc.id}/save-to-project`, {
        projectId: selectedProjectId,
      });
      setSaveModal(false);
      showToast("Saved to project");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save to project failed.");
    } finally {
      setAiBusy(false);
    }
  };

  const downloadAll = async () => {
    if (!doc) return;
    try {
      const res = await api.get(`/pitch-builder/projects/${doc.id}/download`);
      const pack = res.data;
      if (pack.combined) downloadText(pack.combinedFilename, pack.combined);
      for (const f of pack.files || []) {
        downloadText(f.filename, f.content);
      }
      showToast("Downloads started");
    } catch (err: any) {
      setError(err.response?.data?.error || "Download failed.");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
  const labelClass = "mb-1.5 block text-xs text-[#909090]";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (screen === "list" && onBack) onBack();
              else if (screen === "package") setScreen("wizard");
              else if (screen === "wizard") {
                setScreen("list");
                void loadList();
              }
            }}
            className="rounded-lg border border-[#242424] p-2 text-[#909090] hover:text-white"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-serif text-2xl font-bold text-white">Pitch Deck & Query Builder</h2>
            <p className="text-xs text-[#909090]">
              Submission package · novel & screenplay · AI-assisted drafts
            </p>
          </div>
        </div>
        {saving && <span className="text-[10px] text-[#606060]">Saving…</span>}
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

      {screen === "list" && (
        <div className="space-y-4">
          <Button onClick={() => void startNew()} className="w-full sm:w-auto">
            + New Submission Package
          </Button>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-[var(--gd)]" />
            </div>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-[#606060]">
              No drafts yet. Start a package — progress autosaves if you leave mid-flow.
            </p>
          ) : (
            <div className="space-y-2">
              {drafts.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openDraft(d)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#242424] bg-[#121212] px-4 py-3 text-left hover:border-[var(--gd)]/40"
                >
                  <div>
                    <div className="font-serif font-bold text-white">
                      {d.projectDetails?.title || "Untitled"}
                    </div>
                    <div className="text-xs text-[#606060]">
                      Step {d.currentStep || 1}/4 · {d.status} · {d.projectDetails?.format}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--gd)]">Continue →</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {screen === "wizard" && doc && (
        <div className="mx-auto max-w-xl space-y-6">
          {/* Progress */}
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={`h-1.5 flex-1 rounded-full ${
                  n <= step ? "bg-[var(--gd)]" : "bg-[#2a2a2a]"
                }`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[#606060]">
            {STEP_LABELS.map((label, i) => {
              const n = i + 1;
              return (
                <span
                  key={label}
                  className={n === step ? "text-[var(--gd)]" : n < step ? "text-[#909090]" : ""}
                >
                  {n < step ? "✓ " : n === step ? "● " : "○ "}
                  {label}
                </span>
              );
            })}
          </div>
          <p className="text-sm text-[#909090]">
            Step {step} of 4 — {STEP_LABELS[step - 1]}
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>Project / Book Title</span>
                <input
                  className={inputClass}
                  value={doc.projectDetails.title}
                  onChange={(e) => updateProjectDetails({ title: e.target.value })}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Format family</span>
                  <select
                    className={inputClass}
                    value={doc.projectDetails.formatFamily}
                    onChange={(e) => {
                      const family = e.target.value as "novel" | "screenplay";
                      updateProjectDetails({
                        formatFamily: family,
                        format: family === "novel" ? "Novel" : "Feature Film",
                      });
                    }}
                  >
                    <option value="novel">Novel / Fiction</option>
                    <option value="screenplay">Screenplay</option>
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Format</span>
                  <select
                    className={inputClass}
                    value={doc.projectDetails.format}
                    onChange={(e) => updateProjectDetails({ format: e.target.value })}
                  >
                    {(doc.projectDetails.formatFamily === "screenplay"
                      ? SCRIPT_FORMATS
                      : NOVEL_FORMATS
                    ).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Genre</span>
                  <select
                    className={inputClass}
                    value={doc.projectDetails.genre}
                    onChange={(e) => updateProjectDetails({ genre: e.target.value })}
                  >
                    {GENRES.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelClass}>Sub-genre</span>
                  <input
                    className={inputClass}
                    value={doc.projectDetails.subGenre}
                    onChange={(e) => updateProjectDetails({ subGenre: e.target.value })}
                    placeholder="e.g. Dark Romance"
                  />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Target Platform / Publisher (optional)</span>
                <input
                  className={inputClass}
                  value={doc.projectDetails.targetPlatform}
                  onChange={(e) => updateProjectDetails({ targetPlatform: e.target.value })}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>
                    {doc.projectDetails.formatFamily === "screenplay"
                      ? "Page Count"
                      : "Word Count"}
                  </span>
                  <input
                    className={inputClass}
                    value={doc.projectDetails.wordOrPageCount}
                    onChange={(e) => updateProjectDetails({ wordOrPageCount: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Author / Writer Name</span>
                  <input
                    className={inputClass}
                    value={doc.projectDetails.authorName}
                    onChange={(e) => updateProjectDetails({ authorName: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block">
                <span className={labelClass}>Logline</span>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={doc.storyDetails.logline}
                  onChange={(e) => updateStory({ logline: e.target.value })}
                  placeholder="One to two sentences that sell the story…"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Protagonist</span>
                  <input
                    className={inputClass}
                    value={doc.storyDetails.protagonist}
                    onChange={(e) => updateStory({ protagonist: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Goal</span>
                  <input
                    className={inputClass}
                    value={doc.storyDetails.goal}
                    onChange={(e) => updateStory({ goal: e.target.value })}
                  />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Main Conflict</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={doc.storyDetails.conflict}
                  onChange={(e) => updateStory({ conflict: e.target.value })}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Main Antagonist</span>
                  <input
                    className={inputClass}
                    value={doc.storyDetails.antagonist}
                    onChange={(e) => updateStory({ antagonist: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Love Interest / Supporting</span>
                  <input
                    className={inputClass}
                    value={doc.storyDetails.loveInterest}
                    onChange={(e) => updateStory({ loveInterest: e.target.value })}
                  />
                </label>
              </div>
              {doc.projectDetails.formatFamily === "screenplay" && (
                <label className="block">
                  <span className={labelClass}>Setting / World</span>
                  <input
                    className={inputClass}
                    value={doc.storyDetails.setting}
                    onChange={(e) => updateStory({ setting: e.target.value })}
                  />
                </label>
              )}
              <label className="block">
                <span className={labelClass}>What makes this story unique?</span>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={doc.storyDetails.uniquePremise}
                  onChange={(e) => updateStory({ uniquePremise: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Themes (optional)</span>
                <input
                  className={inputClass}
                  value={doc.storyDetails.themes}
                  onChange={(e) => updateStory({ themes: e.target.value })}
                />
              </label>

              {(doc.storyDetails.characters || []).map((c, idx) => (
                <div key={c.id} className="grid gap-2 rounded-xl border border-[#242424] p-3 sm:grid-cols-3">
                  <input
                    className={inputClass}
                    placeholder="Role"
                    value={c.role}
                    onChange={(e) => {
                      const characters = [...doc.storyDetails.characters];
                      characters[idx] = { ...c, role: e.target.value };
                      updateStory({ characters });
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => {
                      const characters = [...doc.storyDetails.characters];
                      characters[idx] = { ...c, name: e.target.value };
                      updateStory({ characters });
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="Notes"
                    value={c.notes}
                    onChange={(e) => {
                      const characters = [...doc.storyDetails.characters];
                      characters[idx] = { ...c, notes: e.target.value };
                      updateStory({ characters });
                    }}
                  />
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() =>
                  updateStory({
                    characters: [
                      ...(doc.storyDetails.characters || []),
                      { id: uid(), role: "", name: "", notes: "" },
                    ],
                  })
                }
              >
                + Add Character
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <span className={labelClass}>Logline</span>
                <div className="rounded-xl border border-[#2a2a2a] bg-[#0c0c0c] px-4 py-3 text-sm leading-relaxed text-[#F0EBE0]">
                  {doc.storyDetails.logline || (
                    <span className="text-[#606060]">Add a logline in Step 2</span>
                  )}
                </div>
              </div>
              <div>
                <span className={labelClass}>One-paragraph synopsis</span>
                <textarea
                  className={`${inputClass} min-h-[140px]`}
                  rows={6}
                  value={doc.synopsis}
                  onChange={(e) => scheduleSave({ ...doc, synopsis: e.target.value })}
                  placeholder="Write or generate your synopsis…"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {doc.synopsis.trim() ? (
                    <Button
                      variant="secondary"
                      onClick={() => void runSynopsisAi("improve")}
                      disabled={aiBusy}
                    >
                      <Sparkles size={14} className="mr-1.5" />
                      Improve with AI
                    </Button>
                  ) : (
                    <Button onClick={() => void runSynopsisAi("generate")} disabled={aiBusy}>
                      <Sparkles size={14} className="mr-1.5" />
                      Generate Synopsis with AI
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Agent / Publisher Name</span>
                  <input
                    className={inputClass}
                    value={doc.agentName}
                    onChange={(e) => scheduleSave({ ...doc, agentName: e.target.value })}
                    placeholder="Dear [Name],"
                  />
                </label>
                <label className="block">
                  <span className={labelClass}>Optional personalization</span>
                  <input
                    className={inputClass}
                    value={doc.personalization}
                    onChange={(e) => scheduleSave({ ...doc, personalization: e.target.value })}
                  />
                </label>
              </div>
              <label className="block">
                <span className={labelClass}>Author bio (notes for AI)</span>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={doc.authorBio}
                  onChange={(e) => scheduleSave({ ...doc, authorBio: e.target.value })}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Query Letter (editable)</span>
                <textarea
                  className={`${inputClass} min-h-[220px] font-serif`}
                  rows={12}
                  value={doc.queryLetter}
                  onChange={(e) => scheduleSave({ ...doc, queryLetter: e.target.value })}
                  placeholder="AI draft will appear here — edit freely…"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void runQueryAi(doc.queryLetter ? "regenerate" : "generate")}
                  disabled={aiBusy}
                >
                  <Sparkles size={14} className="mr-1.5" />
                  {doc.queryLetter ? "Regenerate" : "Generate Draft"}
                </Button>
                {doc.queryLetter && (
                  <Button
                    variant="secondary"
                    onClick={() => void runQueryAi("improve")}
                    disabled={aiBusy}
                  >
                    Improve
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button variant="secondary" onClick={() => void goBack()}>
              ← Back
            </Button>
            {step < 4 ? (
              <Button onClick={() => void goNext()} disabled={aiBusy}>
                {step === 3 ? "Continue to query letter →" : "Continue →"}
              </Button>
            ) : (
              <Button onClick={() => void finishToPackage()} disabled={aiBusy}>
                {aiBusy ? (
                  <>
                    <Loader2 size={14} className="mr-1.5 animate-spin" /> Building package…
                  </>
                ) : (
                  "Build Submission Package →"
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {screen === "package" && doc && (
        <div className="mx-auto max-w-2xl space-y-6">
          <h3 className="font-serif text-2xl font-bold text-white">Your Submission Package</h3>
          <ul className="space-y-2 text-sm text-[#c8c4bc]">
            {[
              ["Query Letter", doc.queryLetter],
              ["One-Paragraph Synopsis", doc.synopsis],
              ["Logline", doc.storyDetails.logline],
              ["Author Bio", doc.authorBio],
              ["Pitch Deck", doc.pitchDeck],
            ].map(([label, val]) => (
              <li key={String(label)} className="flex items-center gap-2">
                <Check
                  size={16}
                  className={val ? "text-[#52C07A]" : "text-[#404040]"}
                />
                {label}
                {!val && <span className="text-xs text-[#606060]">(missing)</span>}
              </li>
            ))}
          </ul>

          {!doc.pitchDeck && (
            <Button onClick={() => void runPitchDeckAi()} disabled={aiBusy}>
              <Sparkles size={14} className="mr-1.5" /> Generate Pitch Deck
            </Button>
          )}

          {doc.pitchDeck && (
            <div>
              <span className={labelClass}>Pitch Deck (editable)</span>
              <textarea
                className={`${inputClass} min-h-[180px]`}
                rows={10}
                value={doc.pitchDeck}
                onChange={(e) => scheduleSave({ ...doc, pitchDeck: e.target.value })}
              />
              <Button
                variant="secondary"
                className="mt-2"
                onClick={() => void runPitchDeckAi()}
                disabled={aiBusy}
              >
                Improve Pitch Deck
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
              Preview Package
            </Button>
            <Button variant="secondary" onClick={() => void downloadAll()}>
              <Download size={14} className="mr-1.5" /> Download
            </Button>
            <Button onClick={() => void openSaveModal()}>Save to Project</Button>
            <Button variant="secondary" onClick={() => setScreen("wizard")}>
              Edit steps
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={saveModal} onClose={() => setSaveModal(false)} title="Save to Project">
        <div className="space-y-3">
          <p className="text-xs text-[#909090]">
            Adds Logline, Synopsis, Query Letter, Pitch Deck, and Bio as documents in the project.
          </p>
          <select
            className={inputClass}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">Select project…</option>
            {userProjects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name || p.title || p.id}
              </option>
            ))}
          </select>
          <Button
            onClick={() => void saveToProject()}
            disabled={!selectedProjectId || aiBusy}
            className="w-full"
          >
            Save
          </Button>
        </div>
      </Modal>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Package Preview">
        <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm text-[#c8c4bc]">
          <section>
            <h4 className="font-bold text-white">Logline</h4>
            <p className="whitespace-pre-wrap">{doc?.storyDetails.logline}</p>
          </section>
          <section>
            <h4 className="font-bold text-white">Synopsis</h4>
            <p className="whitespace-pre-wrap">{doc?.synopsis}</p>
          </section>
          <section>
            <h4 className="font-bold text-white">Query Letter</h4>
            <p className="whitespace-pre-wrap font-serif">{doc?.queryLetter}</p>
          </section>
          <section>
            <h4 className="font-bold text-white">Pitch Deck</h4>
            <p className="whitespace-pre-wrap">{doc?.pitchDeck}</p>
          </section>
        </div>
      </Modal>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Pitch Deck & Query Builder"
      />
    </div>
  );
}
