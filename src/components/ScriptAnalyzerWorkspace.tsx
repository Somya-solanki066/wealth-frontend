"use client";

import { useEffect, useMemo, useState } from "react";
import { Clapperboard, Save, Sparkles } from "lucide-react";
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
      setScriptText("");
      return;
    }

    (async () => {
      try {
        const response = await api.get(`/projects/${selectedProjectId}/chapters`);
        const list = response.data || [];
        setScenes(list);
        if (list.length > 0) {
          setSelectedSceneId(list[0].id);
          setScriptText(list[0].content || "");
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
    const scene = scenes.find((s) => s.id === selectedSceneId);
    if (scene) setScriptText(scene.content || "");
  }, [selectedSceneId, scenes]);

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
      onToast?.("Paste or load script text before running analysis.");
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
            { step: "01", title: "Pick a script", desc: "Choose a screenplay project from Script Editor." },
            { step: "02", title: "Load a scene", desc: "Open the scene text. You can edit before analyzing." },
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Script Project"
                options={[
                  { label: "Choose a script...", value: "" },
                  ...scriptProjects.map((p) => ({ label: p.name, value: p.id })),
                ]}
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
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
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                Script Text
              </span>
              <Textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                className="min-h-[300px] bg-zinc-950 leading-relaxed font-mono text-sm text-[#F0EBE0]"
                placeholder="Paste or write screenplay text here..."
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
              chapterTitle: selectedScene?.title || "",
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
                      <span className="text-[#C0C0C0]">{label} <span className="text-[#606060]">({weight})</span></span>
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
                        <p className="text-[#C0C0C0]"><span className="text-[var(--gd)]">Fix:</span> {issue.fix}</p>
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
                    <div key={i} className="p-3 rounded-xl bg-[#141414] border border-[#242424] text-xs space-y-1">
                      <code className="block text-[#F0EBE0] font-mono text-[11px]">{note.original}</code>
                      <p className="text-[#909090]">{note.issue}</p>
                      {note.suggestion && (
                        <p className="text-[var(--gd)]">→ {note.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card hoverable={false} className="p-8 text-center min-h-[400px] flex flex-col justify-center items-center border border-dashed border-[#242424]">
              <Clapperboard className="h-10 w-10 text-[#404040] mb-3" />
              <p className="text-xs text-[#606060]">
                Load script text and run analysis to see your pitch readiness report.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
