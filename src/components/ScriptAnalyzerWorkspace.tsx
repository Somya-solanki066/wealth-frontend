"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clapperboard, FileUp, Save, Sparkles, Upload } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loader from "@/components/ui/Loader";
import ScoreRing from "@/components/ui/ScoreRing";
import ProgressBar from "@/components/ui/ProgressBar";
import AiToolFeedback from "@/components/AiToolFeedback";
import {
  parseScreenplayIntoScenes,
  readScriptFileAsText,
  SCRIPT_UPLOAD_ACCEPT,
  SCRIPT_UPLOAD_HINT,
  type ParsedScene,
} from "@/lib/scriptUpload";

type ProjectOption = {
  id: string;
  name: string;
  type?: string;
};

type CatalogItem = { id: string; label: string };

type ScriptAnalyzerScores = {
  premise: number;
  dialogue: number;
  structure: number;
  character: number;
  scene_purpose: number;
  formatting: number;
};

type ScriptAnalyzerIssue = {
  category: string;
  label: string;
  detail: string;
  fix: string;
};

type ScriptAnalyzerLineNote = {
  original: string;
  issue: string;
  suggestion: string;
};

type ScriptAnalyzerResult = {
  pitch_readiness_score: number;
  verdict: string;
  editor_note: string;
  scores: ScriptAnalyzerScores;
  strengths: string[];
  issues: ScriptAnalyzerIssue[];
  line_notes: ScriptAnalyzerLineNote[];
};

type UploadMode = "full" | "scene-by-scene";

const CATEGORY_META: { key: keyof ScriptAnalyzerScores; label: string; weight: string }[] = [
  { key: "premise", label: "Premise", weight: "20%" },
  { key: "dialogue", label: "Dialogue", weight: "15%" },
  { key: "structure", label: "Structure", weight: "20%" },
  { key: "character", label: "Character", weight: "20%" },
  { key: "scene_purpose", label: "Scene Purpose", weight: "15%" },
  { key: "formatting", label: "Formatting", weight: "10%" },
];

function verdictBadgeVariant(verdict: string): "green" | "gold" | "red" {
  if (verdict === "PITCH READY") return "green";
  if (verdict === "STRONG CONTENDER") return "gold";
  if (verdict === "REVISE BEFORE PITCHING") return "gold";
  return "red";
}

function htmlToPlainText(html: string) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ScriptAnalyzerWorkspace({
  projects = [],
  onBack,
  onPaywall,
  onToast,
}: {
  projects?: ProjectOption[];
  onBack?: () => void;
  onPaywall?: (feature: string) => void;
  onToast?: (message: string) => void;
}) {
  const scriptProjects = useMemo(
    () => projects.filter((p) => p.type === "script"),
    [projects]
  );

  const [industries, setIndustries] = useState<CatalogItem[]>([]);
  const [formats, setFormats] = useState<CatalogItem[]>([]);
  const [analysisModes, setAnalysisModes] = useState<CatalogItem[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedSceneId, setSelectedSceneId] = useState("");
  const [scenes, setScenes] = useState<any[]>([]);
  const [scriptText, setScriptText] = useState("");
  const [industry, setIndustry] = useState("hollywood");
  const [format, setFormat] = useState("feature");
  const [analysisMode, setAnalysisMode] = useState("full_script");

  const [uploadMode, setUploadMode] = useState<UploadMode>("full");
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadedScenes, setUploadedScenes] = useState<ParsedScene[]>([]);
  const [uploadSceneIndex, setUploadSceneIndex] = useState(0);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScriptAnalyzerResult | null>(null);

  useEffect(() => {
    api
      .get("/script/industries")
      .then((res) => {
        const data = res.data || {};
        setIndustries(data.industries || []);
        setFormats(data.formats || []);
        setAnalysisModes(data.analysisModes || []);
        if (data.industries?.[0]?.id) setIndustry(data.industries[0].id);
        if (data.formats?.[0]?.id) setFormat(data.formats[0].id);
        if (data.analysisModes?.[0]?.id) setAnalysisMode(data.analysisModes[0].id);
      })
      .catch((err) => console.error("Failed to load script analyzer catalog:", err));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) {
      setScenes([]);
      setSelectedSceneId("");
      return;
    }

    (async () => {
      try {
        const response = await api.get(`/projects/${selectedProjectId}/chapters`);
        const list = response.data || [];
        setScenes(list);
        if (list.length > 0) {
          setSelectedSceneId(list[0].id);
          setScriptText(htmlToPlainText(list[0].content || "") || list[0].content || "");
          setUploadedScenes([]);
          setUploadFileName("");
        } else {
          setSelectedSceneId("");
          setScriptText("");
        }
      } catch (err) {
        console.error("Failed to load script scenes:", err);
      }
    })();
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedSceneId || !scenes.length) return;
    if (uploadedScenes.length > 0) return;
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (scene) {
      setScriptText(htmlToPlainText(scene.content || "") || scene.content || "");
    }
  }, [selectedSceneId, scenes, uploadedScenes.length]);

  const loadUploadedScene = (index: number, list: ParsedScene[] = uploadedScenes) => {
    if (!list[index]) return;
    setUploadSceneIndex(index);
    setScriptText(list[index].rawText);
    setResult(null);
  };

  const handleUploadFile = async (file: File | null) => {
    if (!file) return;
    setIsReadingFile(true);
    setResult(null);
    try {
      const text = await readScriptFileAsText(file);
      if (!text.trim()) {
        onToast?.("File is empty.");
        return;
      }
      setUploadFileName(file.name);
      setSelectedProjectId("");
      setSelectedSceneId("");
      setScenes([]);

      if (uploadMode === "full") {
        setUploadedScenes([]);
        setUploadSceneIndex(0);
        setScriptText(text);
        if (analysisModes.some((m) => m.id === "full_script")) {
          setAnalysisMode("full_script");
        }
        onToast?.("Full script loaded into Script Text — ready to analyze.");
      } else {
        const parsed = parseScreenplayIntoScenes(text, file.name.replace(/\.[^.]+$/, ""));
        setUploadedScenes(parsed);
        setUploadSceneIndex(0);
        if (parsed[0]) {
          setScriptText(parsed[0].rawText);
        } else {
          setScriptText(text);
        }
        const sceneMode =
          analysisModes.find((m) => m.id === "single_scene" || m.id === "scene")?.id ||
          analysisMode;
        setAnalysisMode(sceneMode);
        onToast?.(
          parsed.length > 1
            ? `${parsed.length} scenes detected. Analyze one by one from the list.`
            : "Scene loaded into Script Text — ready to analyze."
        );
      }
    } catch (e: any) {
      onToast?.(e.message || "Could not read file.");
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveScene = async () => {
    if (!selectedProjectId || !selectedSceneId) return;
    setIsSaving(true);
    try {
      await api.put(`/projects/${selectedProjectId}/chapters/${selectedSceneId}`, {
        content: scriptText,
      });
      setScenes((prev) =>
        prev.map((s) => (s.id === selectedSceneId ? { ...s, content: scriptText } : s))
      );
      onToast?.("Scene saved.");
    } catch (err) {
      console.error("Failed to save scene:", err);
      onToast?.("Failed to save scene.");
    } finally {
      setIsSaving(false);
    }
  };

  const runAnalysis = async () => {
    if (!scriptText.trim()) {
      onToast?.("Paste, load, or upload script text before running analysis.");
      return;
    }
    setIsAnalyzing(true);
    setResult(null);
    try {
      const response = await api.post("/script/analyze", {
        scriptText,
        industry,
        format,
        analysisMode,
        projectId: selectedProjectId || undefined,
        chapterId: selectedSceneId || undefined,
      });
      const data = response.data || {};
      setResult({
        pitch_readiness_score: data.pitch_readiness_score,
        verdict: data.verdict,
        editor_note: data.editor_note,
        scores: data.scores,
        strengths: data.strengths || [],
        issues: data.issues || [],
        line_notes: data.line_notes || [],
      });
      onToast?.("Script analysis complete.");
    } catch (err: any) {
      console.error("Script analysis failed:", err);
      if (err.response?.data?.limitExceeded) {
        onPaywall?.("Script Analyzer");
      } else {
        onToast?.(err.response?.data?.error || "Script analysis failed.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center border-b border-[#242424] pb-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-black text-white flex items-center gap-2">
            <Clapperboard className="h-7 w-7 text-[var(--gd)]" />
            Script Analyzer
          </h2>
          <p className="text-xs text-[#909090] mt-1">
            Industry-calibrated pitch readiness scoring for Hollywood, Nollywood, BBC/UK, Netflix Africa, and Audio Drama.
          </p>
        </div>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            Back to Tools
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-[#242424] bg-gradient-to-b from-[#161000] to-[#0c0c0c] p-5 md:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gd)] mb-4">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 xl:gap-2">
          {[
            { step: "01", title: "Upload or pick", desc: "Upload a full script / scenes, or open a Script Editor project." },
            { step: "02", title: "Review text", desc: "Uploaded content appears in Script Text — edit before analyzing." },
            { step: "03", title: "Set industry", desc: "Hollywood, Nollywood, BBC/UK, Netflix Africa, or Audio Drama." },
            { step: "04", title: "Run analysis", desc: "GPT scores premise, dialogue, structure, character, scenes, and format." },
            { step: "05", title: "Revise & re-run", desc: "Use issues and line notes to improve pitch readiness." },
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card hoverable={false} className="p-6 space-y-5">
            <div className="space-y-3 rounded-2xl border border-[#242424] bg-[#0c0c0c] p-4">
              <div className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-[var(--gd)]" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                  Upload script document
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("full");
                    setUploadedScenes([]);
                    setUploadFileName("");
                  }}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    uploadMode === "full"
                      ? "border-[var(--gd)] bg-[var(--gd)]/10 text-white"
                      : "border-[#242424] bg-[#161616] text-[#c8c4bc]"
                  }`}
                >
                  <div className="font-semibold">Full script</div>
                  <div className="mt-1 text-[11px] text-[#909090]">
                    Upload entire screenplay into Script Text
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadMode("scene-by-scene");
                    setUploadedScenes([]);
                    setUploadFileName("");
                  }}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                    uploadMode === "scene-by-scene"
                      ? "border-[var(--gd)] bg-[var(--gd)]/10 text-white"
                      : "border-[#242424] bg-[#161616] text-[#c8c4bc]"
                  }`}
                >
                  <div className="font-semibold">Scene by scene</div>
                  <div className="mt-1 text-[11px] text-[#909090]">
                    Upload file, then analyze scenes one by one
                  </div>
                </button>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#333] bg-[#121212] px-4 py-6 text-center hover:border-[var(--gd)]/50">
                {isReadingFile ? (
                  <Loader size="sm" />
                ) : (
                  <Upload className="h-5 w-5 text-[var(--gd)]" />
                )}
                <span className="text-sm font-semibold text-white">
                  {uploadFileName ||
                    (uploadMode === "full"
                      ? "Choose full script (TXT / PDF / Word)"
                      : "Choose script file to split into scenes")}
                </span>
                <span className="text-[11px] text-[#606060]">
                  {SCRIPT_UPLOAD_HINT} — text loads into Script Text below
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SCRIPT_UPLOAD_ACCEPT}
                  className="hidden"
                  onChange={(e) => void handleUploadFile(e.target.files?.[0] || null)}
                />
              </label>

              {uploadMode === "scene-by-scene" && uploadedScenes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#606060]">
                      Scenes ({uploadSceneIndex + 1} / {uploadedScenes.length})
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uploadSceneIndex <= 0}
                        onClick={() => loadUploadedScene(uploadSceneIndex - 1)}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={uploadSceneIndex >= uploadedScenes.length - 1}
                        onClick={() => loadUploadedScene(uploadSceneIndex + 1)}
                      >
                        Next scene
                      </Button>
                    </div>
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-[#242424] p-2">
                    {uploadedScenes.map((scene, i) => (
                      <button
                        key={`${scene.title}-${i}`}
                        type="button"
                        onClick={() => loadUploadedScene(i)}
                        className={`w-full rounded-lg px-2.5 py-2 text-left text-xs transition ${
                          i === uploadSceneIndex
                            ? "bg-[var(--gd)]/15 text-white"
                            : "text-[#909090] hover:bg-[#1a1a1a]"
                        }`}
                      >
                        <span className="block font-semibold line-clamp-1">{scene.title}</span>
                        {scene.heading && (
                          <span className="block text-[10px] text-[#606060] line-clamp-1">
                            {scene.heading}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Or select Script Project"
                options={[
                  { label: "Choose a script...", value: "" },
                  ...scriptProjects.map((p) => ({ label: p.name, value: p.id })),
                ]}
                value={selectedProjectId}
                onChange={(e) => {
                  setUploadedScenes([]);
                  setUploadFileName("");
                  setSelectedProjectId(e.target.value);
                }}
                className="bg-zinc-950"
              />
              {selectedProjectId && (
                <Select
                  label="Select Scene"
                  options={scenes.map((s) => ({ label: s.title, value: s.id }))}
                  value={selectedSceneId}
                  onChange={(e) => setSelectedSceneId(e.target.value)}
                  className="bg-zinc-950"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#242424] pt-4">
              <Select
                label="Industry"
                options={industries.map((item) => ({ label: item.label, value: item.id }))}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="bg-zinc-950 text-[var(--gd)]"
              />
              <Select
                label="Format"
                options={formats.map((item) => ({ label: item.label, value: item.id }))}
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="bg-zinc-950"
              />
              <Select
                label="Analysis Mode"
                options={analysisModes.map((item) => ({ label: item.label, value: item.id }))}
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value)}
                className="bg-zinc-950"
              />
            </div>

            <div className="space-y-4 border-t border-[#242424] pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                  Script Text
                </span>
                {uploadFileName && (
                  <span className="text-[10px] text-[var(--gd)] truncate max-w-[60%]">
                    From: {uploadFileName}
                    {uploadedScenes.length > 0
                      ? ` · ${uploadedScenes[uploadSceneIndex]?.title || ""}`
                      : " · full script"}
                  </span>
                )}
              </div>
              <Textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                className="min-h-[300px] bg-zinc-950 leading-relaxed font-mono text-sm text-[#F0EBE0]"
                placeholder="Paste, write, or upload screenplay text here..."
              />
              <div className="flex gap-3 justify-end flex-wrap">
                {selectedProjectId && selectedSceneId && (
                  <Button variant="outline" onClick={handleSaveScene} isLoading={isSaving}>
                    <Save className="h-4 w-4 mr-1.5 inline text-[var(--gd)]" /> Save Scene
                  </Button>
                )}
                <Button onClick={runAnalysis} isLoading={isAnalyzing}>
                  <Sparkles className="h-4 w-4 mr-1.5 inline text-orange-500 fill-current" /> Run Analysis
                </Button>
              </div>
            </div>
          </Card>

          <AiToolFeedback
            tool="script-analyzer"
            title="Script Analyzer Feedback"
            description="Tell us if the Script Analyzer is working correctly and share any problems you are facing."
            context={{
              industry,
              format,
              analysisMode,
              projectId: selectedProjectId,
              chapterId: selectedSceneId,
              chapterTitle: selectedScene?.title || uploadedScenes[uploadSceneIndex]?.title || "",
              uploadMode,
              uploadFileName,
            }}
          />
        </div>

        <div className="lg:col-span-5 space-y-6">
          {isAnalyzing ? (
            <Card hoverable={false} className="p-8 text-center space-y-4 min-h-[400px] flex flex-col justify-center items-center">
              <Loader size="lg" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-white">Analyzing script for pitch readiness...</p>
                <p className="text-[10px] text-[#606060]">
                  Evaluating premise, dialogue, structure, character, scene purpose, and formatting.
                </p>
              </div>
            </Card>
          ) : result ? (
            <Card hoverable={false} className="p-6 space-y-6 animate-fadeIn bg-zinc-950/40 border border-[#242424]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#242424] pb-5">
                <div className="flex items-center gap-4">
                  <ScoreRing score={result.pitch_readiness_score} />
                  <div>
                    <span className="text-[9px] text-[#606060] font-bold uppercase tracking-wider block">
                      Pitch Readiness
                    </span>
                    <span className="font-serif text-2xl font-black text-white mt-0.5 block">
                      {result.pitch_readiness_score}/100
                    </span>
                    <Badge variant={verdictBadgeVariant(result.verdict)} className="mt-1.5">
                      {result.verdict}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#C0C0C0] leading-relaxed italic border-l-2 border-[var(--gd)] pl-3">
                {result.editor_note}
              </p>

              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#909090] block">
                  Category Scores
                </span>
                {CATEGORY_META.map(({ key, label, weight }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#C0C0C0]">
                        {label} <span className="text-[#606060]">({weight})</span>
                      </span>
                      <span className="font-bold text-white">{result.scores[key]}/10</span>
                    </div>
                    <ProgressBar progress={(result.scores[key] / 10) * 100} />
                  </div>
                ))}
              </div>

              {result.strengths.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gd)] block">
                    Strengths
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#C0C0C0] list-disc list-inside">
                    {result.strengths.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.issues.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                    Issues to Fix
                  </span>
                  {result.issues.map((issue, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-xs space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{issue.label}</span>
                        <Badge variant="gold">{issue.category}</Badge>
                      </div>
                      <p className="text-[#909090]">{issue.detail}</p>
                      {issue.fix && (
                        <p className="text-[#C0C0C0]">
                          <span className="text-[var(--gd)]">Fix:</span> {issue.fix}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {result.line_notes.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#909090] block">
                    Line Notes
                  </span>
                  {result.line_notes.map((note, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#121212] border border-[#242424] text-xs space-y-1">
                      <p className="font-mono text-[#C0C0C0]">{note.original}</p>
                      <p className="text-orange-300">{note.issue}</p>
                      <p className="text-[var(--gd)]">{note.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card
              hoverable={false}
              className="p-8 text-center space-y-3 min-h-[280px] flex flex-col justify-center items-center border-dashed"
            >
              <Clapperboard className="h-8 w-8 text-[#333]" />
              <p className="text-xs text-[#606060]">
                Upload a script or load a scene, then run analysis to see pitch readiness scores here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
