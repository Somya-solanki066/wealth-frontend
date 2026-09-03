"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Ghost, Lock, Plus, RefreshCw, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCatalog } from "@/hooks/useCatalog";
import { isFreePlan } from "@/lib/plans";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import PaywallModal from "@/components/ui/PaywallModal";
import Modal from "@/components/ui/Modal";

type GhostMode = "novel" | "script";

type ProjectOption = {
  id: string;
  name: string;
  type?: string;
};

const TONES = ["Emotional", "Dark", "Slow burn", "Fast-paced", "Humorous", "Gritty"];
const LENGTHS = [
  { value: "short", label: "Short (800–1,000 words)" },
  { value: "standard", label: "Standard (1,200–1,500 words)" },
  { value: "long", label: "Long (1,800–2,000 words)" },
];
const SCRIPT_LENGTHS = [
  { value: "short", label: "Short scene" },
  { value: "standard", label: "Standard scene" },
  { value: "long", label: "Long / full sequence" },
];
const SCRIPT_FORMATS = ["Film", "TV", "Audio drama"];
const CHAPTER_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const n = i + 1;
  return { value: String(n), label: n > 10 ? `Chapter ${n}` : `Chapter ${n}` };
});

function countWords(text: string): number {
  return text.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

export default function GhostWriterWorkspace({
  projects = [],
  initialMode = "novel",
  onOpenProject,
  onProjectCreated,
}: {
  projects?: ProjectOption[];
  initialMode?: GhostMode;
  onOpenProject?: (project: ProjectOption) => void;
  onProjectCreated?: (project: ProjectOption) => void;
}) {
  const { profile, loading: authLoading } = useAuth();
  const { platforms, genres } = useCatalog();
  const [mode, setMode] = useState<GhostMode>(initialMode);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const locked =
    !authLoading &&
    (isFreePlan({ id: profile?.subscriptionPlan || "free" }) || !profile?.subscriptionPlan);

  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("Film");
  const [genre, setGenre] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [characters, setCharacters] = useState("");
  const [chapterNumber, setChapterNumber] = useState("1");
  const [plotSummary, setPlotSummary] = useState("");
  const [tone, setTone] = useState("Emotional");
  const [length, setLength] = useState("standard");
  const [projectId, setProjectId] = useState("");
  const [createdProjects, setCreatedProjects] = useState<ProjectOption[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [generated, setGenerated] = useState("");
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (platforms.length && !platforms.some((p) => p.id === platform)) {
      setPlatform(platforms[0].id);
    }
  }, [platforms, platform]);

  useEffect(() => {
    if (genres.length && !genres.some((g) => g.id === genre)) {
      setGenre(genres[0].id);
    }
  }, [genres, genre]);

  const filteredProjects = useMemo(() => {
    const merged = [...createdProjects, ...projects];
    const seen = new Set<string>();
    return merged.filter((p) => {
      if ((p.type || "novel") !== mode) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [projects, createdProjects, mode]);

  useEffect(() => {
    if (projectId && !filteredProjects.some((p) => p.id === projectId)) {
      setProjectId("");
    }
  }, [filteredProjects, projectId]);

  const requirePremium = () => {
    if (locked) {
      setShowPaywall(true);
      return false;
    }
    return true;
  };

  const generate = async (rewrite = false) => {
    if (!requirePremium()) return;
    if (!storyTitle.trim() || !plotSummary.trim()) {
      setError(mode === "script" ? "Title and scene summary are required." : "Story title and chapter summary are required.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const endpoint = mode === "script" ? "/writer/generateScript" : "/writer/generateChapter";
      const payload =
        mode === "script"
          ? {
              format,
              genre,
              title: storyTitle,
              characters,
              sceneNumber: Number(chapterNumber),
              whatHappens: plotSummary,
              tone,
              length,
              projectId: projectId || null,
              previousContent: rewrite ? generated : undefined,
            }
          : {
              platform,
              genre,
              storyTitle,
              characters,
              chapterNumber: Number(chapterNumber),
              plotSummary,
              tone,
              length,
              projectId: projectId || null,
              previousContent: rewrite ? generated : undefined,
            };

      const res = await api.post(endpoint, payload);
      setSessionId(res.data.sessionId);
      setGenerated(res.data.generatedContent || "");
      setWordCount(res.data.wordCount || countWords(res.data.generatedContent || ""));
    } catch (err: any) {
      if (err.response?.data?.premiumRequired || err.response?.status === 403) {
        setShowPaywall(true);
        setError(err.response?.data?.error || "Premium subscription required.");
      } else {
        setError(err.response?.data?.error || "Generation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    if (!generated) return;
    try {
      await navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  const saveToProject = async () => {
    if (!requirePremium()) return;
    if (!sessionId || !generated.trim()) {
      setError("Generate a chapter first.");
      return;
    }
    if (!projectId) {
      setError("Select a project to save into.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const title =
        mode === "script" ? `Scene ${chapterNumber}` : `Chapter ${chapterNumber}`;
      const res = await api.post(`/writer/sessions/${sessionId}/save`, {
        projectId,
        title,
        content: generated,
      });
      const project = filteredProjects.find((p) => p.id === projectId);
      if (project && onOpenProject) {
        onOpenProject(project);
      }
      void res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save to project.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async () => {
    if (!requirePremium()) return;
    const name = newProjectName.trim() || storyTitle.trim();
    if (!name) {
      setError(mode === "script" ? "Enter a script name." : "Enter a novel name.");
      return;
    }
    setCreatingProject(true);
    setError("");
    try {
      const res = await api.post("/projects", {
        name,
        type: mode,
      });
      const created = res.data as ProjectOption;
      const withType = { ...created, type: created.type || mode };
      setCreatedProjects((prev) => [withType, ...prev]);
      onProjectCreated?.(withType);
      setProjectId(withType.id);
      setShowCreateProject(false);
      setNewProjectName("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create project.");
    } finally {
      setCreatingProject(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
          <Ghost className="h-6 w-6 text-[var(--gd)]" />
          AI Ghost Writer
        </h2>
        <p className="text-xs text-[#909090] mt-1">
          Generate a full novel chapter or screenplay scene with GPT, then copy, rewrite, or save it into the editor.
        </p>
      </div>

      <div className="rounded-2xl border border-[#242424] bg-gradient-to-b from-[#161000] to-[#0c0c0c] p-5 md:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd)] mb-4">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 xl:gap-2">
          {[
            {
              step: "01",
              title: "Choose mode",
              desc: "Switch Novel Chapter or Screenplay — same tool, different output format.",
            },
            {
              step: "02",
              title: "Fill the brief",
              desc: "Platform/format, genre, title, characters, chapter/scene, tone, and length.",
            },
            {
              step: "03",
              title: "Generate with GPT",
              desc: "Premium gate unlocks a full draft written to your plot notes and style.",
            },
            {
              step: "04",
              title: "Preview & polish",
              desc: "Edit the result, copy it, or rewrite/regenerate with the same brief.",
            },
            {
              step: "05",
              title: "Save to editor",
              desc: "Send it into a Novel or Script project and keep writing there.",
            },
          ].map((item, index) => (
            <div key={item.step} className="relative flex gap-3 xl:flex-col xl:gap-3">
              {index < 4 ? (
                <span
                  className="hidden xl:block absolute top-4 left-[2.15rem] right-[-0.5rem] h-px bg-gradient-to-r from-[var(--gm)]/70 to-transparent"
                  aria-hidden
                />
              ) : null}
              <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--gm)] bg-[#1a1200] text-[10px] font-bold text-[var(--gd)]">
                {item.step}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-sm font-bold text-white">{item.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#909090]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "novel" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("novel")}
        >
          Novel Chapter
        </Button>
        <Button
          type="button"
          variant={mode === "script" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setMode("script")}
        >
          Screenplay
        </Button>
      </div>

      {locked ? (
        <div className="bg-[#161616] border border-[#242424] rounded-xl p-8 text-center space-y-4">
          <Lock className="h-8 w-8 text-[var(--gd)] mx-auto" />
          <p className="text-sm text-[#F0EBE0]">
            AI Ghost Writer is a premium feature. Upgrade to generate full chapters and scenes.
          </p>
          <Button type="button" onClick={() => setShowPaywall(true)}>
            Upgrade to unlock
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-[#161616] border border-[#242424] rounded-xl p-6 space-y-4">
            {mode === "novel" ? (
              <Select
                label="Target platform"
                options={platforms.map((p) => ({ label: p.name, value: p.id }))}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              />
            ) : (
              <Select
                label="Format"
                options={SCRIPT_FORMATS.map((f) => ({ label: f, value: f }))}
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              />
            )}

            <Select
              label="Genre"
              options={genres.map((g) => ({ label: g.name, value: g.id }))}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            />

            <Input
              label={mode === "script" ? "Script title" : "Story title"}
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder={mode === "script" ? "Working title" : "Story title"}
            />

            <Input
              label="Main characters"
              value={characters}
              onChange={(e) => setCharacters(e.target.value)}
              placeholder="Names, comma-separated"
            />

            <Select
              label={mode === "script" ? "Scene number" : "Chapter number"}
              options={CHAPTER_OPTIONS.map((opt) => ({
                ...opt,
                label: mode === "script" ? opt.label.replace("Chapter", "Scene") : opt.label,
              }))}
              value={chapterNumber}
              onChange={(e) => setChapterNumber(e.target.value)}
            />

            <Textarea
              label={mode === "script" ? "What should happen in this scene" : "What should happen in this chapter"}
              value={plotSummary}
              onChange={(e) => setPlotSummary(e.target.value)}
              rows={5}
              placeholder="Plot beats, conflict, ending hook..."
            />

            <Select
              label="Writing tone"
              options={TONES.map((t) => ({ label: t, value: t }))}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />

            <Select
              label={mode === "script" ? "Scene length" : "Chapter length"}
              options={(mode === "script" ? SCRIPT_LENGTHS : LENGTHS).map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              value={length}
              onChange={(e) => setLength(e.target.value)}
            />

            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1 min-w-0">
                  <Select
                    label={mode === "script" ? "Save to script project (optional)" : "Save to novel project (optional)"}
                    options={[
                      { label: "None — generate only", value: "" },
                      ...filteredProjects.map((p) => ({ label: p.name, value: p.id })),
                    ]}
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 mb-0.5"
                  onClick={() => {
                    setNewProjectName(storyTitle.trim());
                    setShowCreateProject(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {mode === "script" ? "New Script" : "New Novel"}
                </Button>
              </div>
            </div>

            {error ? <p className="text-xs text-red-400">{error}</p> : null}

            <Button
              type="button"
              className="w-full"
              isLoading={loading}
              onClick={() => generate(false)}
            >
              {mode === "script" ? "Generate scene" : "Generate chapter"}
            </Button>
          </div>

          <div className="bg-[#161616] border border-[#242424] rounded-xl p-6 space-y-4 min-h-[420px]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-serif text-sm font-bold text-[var(--gd)]">Preview / Edit</h3>
              {generated ? (
                <span className="text-[10px] uppercase tracking-wider text-[#909090]">
                  {countWords(generated) || wordCount} words
                </span>
              ) : null}
            </div>

            <textarea
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
              className="w-full h-[360px] bg-[#080808] border border-[#242424] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[var(--gd)] resize-y"
              placeholder="Generated chapter or scene will appear here."
            />

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={copyText} disabled={!generated}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={loading}
                onClick={() => generate(true)}
                disabled={!generated}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Rewrite / Regenerate
              </Button>
              <Button
                type="button"
                size="sm"
                isLoading={saving}
                onClick={saveToProject}
                disabled={!generated || !projectId}
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save to project
              </Button>
            </div>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="AI Ghost Writer"
      />

      <Modal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        title={mode === "script" ? "Create New Script" : "Create New Novel"}
      >
        <div className="space-y-4">
          <Input
            label={mode === "script" ? "Script name" : "Novel name"}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder={mode === "script" ? "My screenplay" : "My novel"}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateProject(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" isLoading={creatingProject} onClick={handleCreateProject}>
              Create & select
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
