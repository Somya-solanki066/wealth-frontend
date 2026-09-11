"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp, Loader2, Upload } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  appendScriptHtml,
  parseScreenplayIntoScenes,
  readScriptFileAsText,
  SCRIPT_UPLOAD_ACCEPT,
  SCRIPT_UPLOAD_HINT,
  wordCountFromHtml,
  type ParsedScene,
} from "@/lib/scriptUpload";

type UploadMode = "full" | "scene-by-scene";

type ScriptProject = {
  id: string;
  name: string;
  type?: string;
};

type ChapterOption = {
  id: string;
  title: string;
  content?: string;
  wordCount?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  scripts: ScriptProject[];
  /** Prefill when uploading into the open script */
  defaultTargetId?: string;
  /** Prefill append target when a scene is open in the editor */
  defaultChapterId?: string;
  onDone: (project: any) => void;
  onToast?: (msg: string) => void;
};

export default function ScriptUploadModal({
  isOpen,
  onClose,
  scripts,
  defaultTargetId,
  defaultChapterId,
  onDone,
  onToast,
}: Props) {
  const [mode, setMode] = useState<UploadMode>("full");
  const [scriptName, setScriptName] = useState("");
  const [targetId, setTargetId] = useState("__new__");
  const [appendChapterId, setAppendChapterId] = useState("__new_scenes__");
  const [targetChapters, setTargetChapters] = useState<ChapterOption[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedScene[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const scriptOptions = useMemo(
    () => scripts.filter((s) => !s.type || s.type === "script"),
    [scripts]
  );

  useEffect(() => {
    if (!isOpen) return;
    setMode(defaultTargetId ? "scene-by-scene" : "full");
    setScriptName("");
    setTargetId(defaultTargetId || "__new__");
    setAppendChapterId(defaultChapterId || "__new_scenes__");
    setTargetChapters([]);
    setFileName("");
    setParsed([]);
    setSelected(new Set());
    setError("");
    setBusy(false);
  }, [isOpen, defaultTargetId, defaultChapterId]);

  useEffect(() => {
    if (!isOpen || targetId === "__new__") {
      setTargetChapters([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingChapters(true);
      try {
        const res = await api.get(`/projects/${targetId}/chapters`);
        if (cancelled) return;
        const list: ChapterOption[] = res.data || [];
        setTargetChapters(list);
        setAppendChapterId((prev) => {
          if (prev !== "__new_scenes__" && list.some((c) => c.id === prev)) return prev;
          if (defaultChapterId && list.some((c) => c.id === defaultChapterId)) {
            return defaultChapterId;
          }
          return "__new_scenes__";
        });
      } catch {
        if (!cancelled) setTargetChapters([]);
      } finally {
        if (!cancelled) setLoadingChapters(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, targetId, defaultChapterId]);

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    setError("");
    try {
      const text = await readScriptFileAsText(file);
      if (!text.trim()) {
        setError("File is empty.");
        return;
      }
      const baseName = file.name.replace(/\.[^.]+$/, "");
      if (!scriptName.trim()) setScriptName(baseName);
      setFileName(file.name);

      const scenes = parseScreenplayIntoScenes(text, baseName);
      setParsed(scenes);
      if (mode === "full") {
        setSelected(new Set(scenes.map((_, i) => i)));
      } else {
        setSelected(new Set(scenes.length ? [0] : []));
      }
    } catch (e: any) {
      setError(e.message || "Could not read file.");
      setParsed([]);
      setFileName("");
    }
  };

  const toggleScene = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const resolveProject = async (id: string) => {
    try {
      const list = await api.get("/projects");
      return (list.data || []).find((p: any) => p.id === id) || { id };
    } catch {
      return { id };
    }
  };

  /** Replace an existing script's scenes with a full upload (old content removed). */
  const replaceFullScript = async (projectId: string, chosen: ParsedScene[]) => {
    const chaptersRes = await api.get(`/projects/${projectId}/chapters`);
    const existing: ChapterOption[] = chaptersRes.data || [];

    for (let i = 0; i < chosen.length; i++) {
      const scene = chosen[i];
      if (existing[i]) {
        await api.put(`/projects/${projectId}/chapters/${existing[i].id}`, {
          title: scene.title,
          content: scene.html,
          wordCount: wordCountFromHtml(scene.html),
        });
      } else {
        const created = await api.post(`/projects/${projectId}/chapters`, {
          title: scene.title,
        });
        await api.put(`/projects/${projectId}/chapters/${created.data.id}`, {
          title: scene.title,
          content: scene.html,
          wordCount: wordCountFromHtml(scene.html),
        });
      }
    }

    // Remove leftover old scenes after the uploaded set
    for (let i = chosen.length; i < existing.length; i++) {
      await api.delete(`/projects/${projectId}/chapters/${existing[i].id}`);
    }
  };

  const createScriptWithScenes = async (name: string, chosen: ParsedScene[]) => {
    const createRes = await api.post("/projects", { name, type: "script" });
    const project = createRes.data;
    await replaceFullScript(project.id, chosen);
    return project;
  };

  const importScenes = async () => {
    const chosen = parsed.filter((_, i) => selected.has(i));
    if (!chosen.length) {
      setError("Select at least one scene to upload.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      let project: any;

      if (mode === "full") {
        const name =
          scriptName.trim() || fileName.replace(/\.[^.]+$/, "") || "Uploaded Script";

        if (targetId === "__new__") {
          project = await createScriptWithScenes(name, chosen);
          onToast?.(
            `Uploaded full script — ${chosen.length} scene${chosen.length > 1 ? "s" : ""}.`
          );
        } else {
          // Into existing script: replace content; other scripts stay
          project = await resolveProject(targetId);
          if (scriptName.trim()) {
            try {
              await api.put(`/projects/${targetId}`, { name: scriptName.trim() });
            } catch {
              /* name update optional */
            }
          }
          await replaceFullScript(targetId, chosen);
          project = await resolveProject(targetId);
          onToast?.(
            `Full script replaced — ${chosen.length} scene${chosen.length > 1 ? "s" : ""}. Previous text in this script was overwritten.`
          );
        }
      } else if (targetId === "__new__") {
        const name = scriptName.trim() || "Uploaded Script";
        project = await createScriptWithScenes(name, chosen);
        onToast?.(
          `Created script with ${chosen.length} scene${chosen.length > 1 ? "s" : ""}.`
        );
      } else if (appendChapterId !== "__new_scenes__") {
        // Append into one existing scene — keep prior text
        project = await resolveProject(targetId);
        const chaptersRes = await api.get(`/projects/${targetId}/chapters`);
        const existing: ChapterOption[] = chaptersRes.data || [];
        const target = existing.find((c) => c.id === appendChapterId);
        if (!target) {
          setError("Selected scene not found.");
          setBusy(false);
          return;
        }

        let merged = String(target.content || "");
        for (const scene of chosen) {
          merged = appendScriptHtml(merged, scene.html);
        }

        const title =
          chosen.length === 1 && chosen[0].heading
            ? target.title || chosen[0].title
            : target.title;

        await api.put(`/projects/${targetId}/chapters/${target.id}`, {
          title,
          content: merged,
          wordCount: wordCountFromHtml(merged),
        });

        onToast?.(
          `Appended ${chosen.length} scene${chosen.length > 1 ? "s" : ""} below existing text in “${title}”.`
        );
      } else {
        // Add as new scenes — never touch existing scene bodies
        project = await resolveProject(targetId);
        const chaptersRes = await api.get(`/projects/${targetId}/chapters`);
        const existing: ChapterOption[] = chaptersRes.data || [];
        const startIndex = existing.length;

        for (let i = 0; i < chosen.length; i++) {
          const title = chosen[i].title.startsWith("Scene ")
            ? `Scene ${startIndex + i + 1}${chosen[i].heading ? `: ${chosen[i].heading}` : ""}`
            : chosen[i].title;
          const created = await api.post(`/projects/${targetId}/chapters`, { title });
          await api.put(`/projects/${targetId}/chapters/${created.data.id}`, {
            title,
            content: chosen[i].html,
            wordCount: wordCountFromHtml(chosen[i].html),
          });
        }

        onToast?.(
          `Added ${chosen.length} new scene${chosen.length > 1 ? "s" : ""} — existing scenes unchanged.`
        );
      }

      onDone(project);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload Script">
      <div className="space-y-5">
        <p className="text-xs text-[#909090]">
          TXT, PDF, or Word (max 20 MB). Full upload into an existing script replaces that
          script only. Scene-by-scene can append under existing text or add new scenes — other
          scripts are never removed.
        </p>

        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#606060]">
            Upload mode
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("full");
                setParsed([]);
                setSelected(new Set());
                setFileName("");
              }}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                mode === "full"
                  ? "border-[var(--gd)] bg-[var(--gd)]/10 text-white"
                  : "border-[#242424] bg-[#161616] text-[#c8c4bc]"
              }`}
            >
              <div className="font-semibold">Full script</div>
              <div className="mt-1 text-[11px] text-[#909090]">
                New script, or replace one existing script completely
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("scene-by-scene");
                setParsed([]);
                setSelected(new Set());
                setFileName("");
              }}
              className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                mode === "scene-by-scene"
                  ? "border-[var(--gd)] bg-[var(--gd)]/10 text-white"
                  : "border-[#242424] bg-[#161616] text-[#c8c4bc]"
              }`}
            >
              <div className="font-semibold">Scene by scene</div>
              <div className="mt-1 text-[11px] text-[#909090]">
                Append under a scene’s text, or add as new scenes
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-[#909090]">
            Target script
            <select
              className="mt-1 w-full rounded-xl border border-[#242424] bg-[#161616] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--gd)]"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="__new__">Create new script</option>
              {scriptOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {(targetId === "__new__" || mode === "full") && (
            <label className="block text-xs text-[#909090]">
              {targetId === "__new__" ? "New script name" : "Script name (optional rename)"}
              <input
                className="mt-1 w-full rounded-xl border border-[#242424] bg-[#161616] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--gd)]"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder="My Screenplay"
              />
            </label>
          )}

          {mode === "full" && targetId !== "__new__" && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200/90">
              Full upload will overwrite all scenes in this script. Your other scripts stay as
              they are.
            </p>
          )}

          {mode === "scene-by-scene" && targetId !== "__new__" && (
            <label className="block text-xs text-[#909090]">
              Where to put uploaded scenes
              <select
                className="mt-1 w-full rounded-xl border border-[#242424] bg-[#161616] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--gd)]"
                value={appendChapterId}
                onChange={(e) => setAppendChapterId(e.target.value)}
                disabled={loadingChapters}
              >
                <option value="__new_scenes__">Add as new scenes (keep all existing)</option>
                {targetChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Append below: {c.title}
                    {c.wordCount ? ` (${c.wordCount} words)` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {mode === "scene-by-scene" &&
            targetId !== "__new__" &&
            appendChapterId !== "__new_scenes__" && (
              <p className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200/90">
                Existing writing in that scene stays. Uploaded text is added underneath.
              </p>
            )}
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#333] bg-[#121212] px-4 py-8 text-center hover:border-[var(--gd)]/50">
          <Upload className="h-6 w-6 text-[var(--gd)]" />
          <span className="text-sm font-semibold text-white">
            {fileName || "Choose TXT, PDF, or Word file"}
          </span>
          <span className="text-[11px] text-[#606060]">{SCRIPT_UPLOAD_HINT}</span>
          <input
            type="file"
            accept={SCRIPT_UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0] || null)}
          />
        </label>

        {parsed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#606060]">
                Detected scenes ({parsed.length})
              </p>
              <button
                type="button"
                className="text-[11px] font-semibold text-[var(--gd)]"
                onClick={() =>
                  setSelected(
                    selected.size === parsed.length
                      ? new Set()
                      : new Set(parsed.map((_, i) => i))
                  )
                }
              >
                {selected.size === parsed.length ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-[#242424] p-2">
              {parsed.map((scene, i) => {
                const on = selected.has(i);
                return (
                  <button
                    key={`${scene.title}-${i}`}
                    type="button"
                    onClick={() => toggleScene(i)}
                    className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs ${
                      on ? "bg-[var(--gd)]/15 text-white" : "text-[#909090] hover:bg-[#1a1a1a]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                        on
                          ? "border-[var(--gd)] bg-[var(--gd)] text-zinc-950"
                          : "border-[#444]"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold line-clamp-1">{scene.title}</span>
                      {scene.heading && (
                        <span className="block text-[10px] text-[#606060] line-clamp-1">
                          {scene.heading}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => void importScenes()}
            disabled={busy || !parsed.length || selected.size === 0}
          >
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-1.5 h-4 w-4" />
            )}
            {busy ? "Uploading…" : "Upload into My Scripts"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
