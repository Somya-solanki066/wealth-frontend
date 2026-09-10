"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Circle,
  FolderOpen,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type Part = {
  id: string;
  title: string;
  whatHappens: string;
  purpose: string;
  endingHook: string;
  body: string;
  status: "outline" | "draft" | "done";
};

type Serial = {
  id?: string;
  title: string;
  storyIdea: string;
  genre: string;
  partCount: number;
  parts: Part[];
  status?: string;
  updatedAt?: string;
};

type View = "library" | "setup" | "outline" | "dashboard" | "write";

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

function newPart(index: number): Part {
  const defaults = [
    "The setup",
    "The twist",
    "Escalation",
    "Rising stakes",
    "The turn",
    "Confrontation",
    "Resolution",
  ];
  return {
    id: `part_${Date.now()}_${index}`,
    title: defaults[index] || `Part ${index + 1}`,
    whatHappens: "",
    purpose: index === 0 ? "Setup" : "",
    endingHook: "",
    body: "",
    status: "outline",
  };
}

export default function MicroSerialWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<View>("library");
  const [library, setLibrary] = useState<Serial[]>([]);
  const [genres, setGenres] = useState<{ id: string; label: string }[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [serial, setSerial] = useState<Serial | null>(null);
  const [writeIndex, setWriteIndex] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get("/writer/micro-serial/meta");
      setGenres(res.data.genres || []);
      setPurposes(res.data.purposes || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadLibrary = useCallback(async () => {
    try {
      const res = await api.get("/writer/micro-serial/mine");
      setLibrary(res.data.serials || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadMeta();
    void loadLibrary();
  }, [loadMeta, loadLibrary]);

  const startNew = () => {
    setSerial({
      title: "",
      storyIdea: "",
      genre: "romance",
      partCount: 5,
      parts: [0, 1, 2, 3, 4].map((i) => newPart(i)),
    });
    setView("setup");
    setError("");
  };

  const openSerial = (s: Serial) => {
    setSerial(s);
    setView(s.parts?.some((p) => p.body?.trim()) ? "dashboard" : "outline");
    setExpanded(0);
  };

  const setPartCount = (n: number) => {
    setSerial((s) => {
      if (!s) return s;
      const parts = [...s.parts];
      while (parts.length < n) parts.push(newPart(parts.length));
      while (parts.length > n) parts.pop();
      return { ...s, partCount: n, parts };
    });
  };

  const updatePart = (idx: number, patch: Partial<Part>) => {
    setSerial((s) => {
      if (!s) return s;
      const parts = s.parts.map((p, i) => (i === idx ? { ...p, ...patch } : p));
      return { ...s, parts };
    });
  };

  const movePart = (idx: number, dir: -1 | 1) => {
    setSerial((s) => {
      if (!s) return s;
      const j = idx + dir;
      if (j < 0 || j >= s.parts.length) return s;
      const parts = [...s.parts];
      [parts[idx], parts[j]] = [parts[j], parts[idx]];
      return { ...s, parts };
    });
    setExpanded((e) => {
      if (e == null) return e;
      if (e === idx) return idx + dir;
      if (e === idx + dir) return idx;
      return e;
    });
  };

  const addPart = () => {
    setSerial((s) => {
      if (!s || s.parts.length >= 7) return s;
      return { ...s, partCount: s.parts.length + 1, parts: [...s.parts, newPart(s.parts.length)] };
    });
  };

  const removePart = (idx: number) => {
    setSerial((s) => {
      if (!s || s.parts.length <= 3) return s;
      return {
        ...s,
        partCount: s.parts.length - 1,
        parts: s.parts.filter((_, i) => i !== idx),
      };
    });
  };

  const generateOutline = async () => {
    if (!serial) return;
    if (serial.storyIdea.trim().length < 20) {
      setError("Enter a story idea first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/micro-serial/generate-outline", {
        storyIdea: serial.storyIdea,
        genre: serial.genre,
        partCount: serial.partCount,
        title: serial.title,
      });
      const o = res.data.outline;
      setSerial({
        ...serial,
        title: o.title || serial.title,
        genre: o.genre || serial.genre,
        partCount: o.partCount,
        parts: o.parts,
      });
      setView("outline");
      setExpanded(0);
      showToast("Outline generated");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Generate failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveOutline = async (nextView: View = "dashboard") => {
    if (!serial) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/micro-serial/save", {
        id: serial.id,
        title: serial.title || "Untitled serial",
        storyIdea: serial.storyIdea,
        genre: serial.genre,
        parts: serial.parts,
      });
      setSerial(res.data.serial);
      await loadLibrary();
      showToast("Outline saved");
      setView(nextView);
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const savePartBody = async (markDone?: boolean) => {
    if (!serial) return;
    const parts = serial.parts.map((p, i) =>
      i === writeIndex
        ? {
            ...p,
            status: markDone || p.body.trim().length > 40 ? ("done" as const) : ("draft" as const),
          }
        : p
    );
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/micro-serial/save", {
        id: serial.id,
        title: serial.title,
        storyIdea: serial.storyIdea,
        genre: serial.genre,
        parts,
        status: "writing",
      });
      setSerial(res.data.serial);
      await loadLibrary();
      showToast("Part saved");
      setView("dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Save failed.");
    } finally {
      setBusy(false);
    }
  };

  const assistWrite = async () => {
    if (!serial?.id) {
      setError("Save the outline first, then use AI assist.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/writer/micro-serial/${serial.id}/assist-part`, {
        partIndex: writeIndex,
      });
      updatePart(writeIndex, { body: res.data.body, status: "draft" });
      showToast("Draft assisted");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setShowPaywall(true);
        return;
      }
      setError(err.response?.data?.error || "Assist failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeSerial = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/micro-serial/${id}`);
      setLibrary((list) => list.filter((s) => s.id !== id));
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const backNav = () => {
    if (view === "write") {
      setView("dashboard");
      return;
    }
    if (view === "dashboard" || view === "outline") {
      setView(serial?.id ? "library" : "setup");
      return;
    }
    if (view === "setup") {
      setView("library");
      return;
    }
    onBack?.();
  };

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={backNav}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {view === "library" ? "Short-Form Fiction" : "Micro-Serial Mode"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Micro-Serial Mode</h2>
          <p className="mt-1 text-sm text-[#909090]">5–7 part flash serials, not full-length</p>
        </div>
        {view !== "library" && (
          <button
            type="button"
            onClick={() => {
              setView("library");
              void loadLibrary();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
          >
            <FolderOpen size={12} />
            My serials
          </button>
        )}
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

      {view === "library" && (
        <div className="space-y-3">
          <Button className="w-full" onClick={startNew}>
            <Plus size={14} className="mr-1.5" /> Create new micro-serial
          </Button>
          {library.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No serials yet. Start with a story idea and 5–7 parts.
            </p>
          ) : (
            library.map((s) => (
              <div
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] p-4"
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => openSerial(s)}>
                  <div className="font-medium text-white">{s.title}</div>
                  <div className="mt-1 text-[11px] text-[#606060]">
                    {s.parts?.length || s.partCount} parts · {s.status || "outline"} · {s.genre}
                  </div>
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-[#909090] hover:text-red-300"
                  onClick={() => void removeSerial(s.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {view === "setup" && serial && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Story idea</span>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={serial.storyIdea}
              onChange={(e) => setSerial({ ...serial, storyIdea: e.target.value })}
              placeholder="A detective discovers his missing sister is connected to the city's biggest crime family…"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Title (optional)</span>
            <input
              className={inputClass}
              value={serial.title}
              onChange={(e) => setSerial({ ...serial, title: e.target.value })}
              placeholder="Working title"
            />
          </label>
          <label className="block">
            <span className={labelClass}>Genre</span>
            <select
              className={inputClass}
              value={serial.genre}
              onChange={(e) => setSerial({ ...serial, genre: e.target.value })}
            >
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <p className={labelClass}>Number of parts</p>
            <div className="flex gap-2">
              {[5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPartCount(n)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    serial.partCount === n
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
                  }`}
                >
                  {n} Parts
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={() => void generateOutline()} disabled={busy}>
            {busy ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <Sparkles size={14} className="mr-1.5" />
            )}
            AI generate outline
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setView("outline");
              setExpanded(0);
            }}
          >
            Build outline manually
          </Button>
        </div>
      )}

      {view === "outline" && serial && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Story title</span>
            <input
              className={inputClass}
              value={serial.title}
              onChange={(e) => setSerial({ ...serial, title: e.target.value })}
            />
          </label>

          <p className={labelClass}>Parts (5–7 recommended)</p>
          <div className="space-y-2">
            {serial.parts.map((p, idx) => {
              const open = expanded === idx;
              return (
                <div key={p.id} className="rounded-xl border border-[#242424] bg-[#161616]">
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left text-sm text-[#F0EBE0]"
                      onClick={() => setExpanded(open ? null : idx)}
                    >
                      Part {idx + 1} — {p.title || "Untitled"}
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[#606060] hover:text-white"
                      onClick={() => movePart(idx, -1)}
                      aria-label="Move up"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-[#606060] hover:text-white"
                      onClick={() => movePart(idx, 1)}
                      aria-label="Move down"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  {open && (
                    <div className="space-y-3 border-t border-[#242424] px-3 py-3">
                      <label className="block">
                        <span className={labelClass}>Title</span>
                        <input
                          className={inputClass}
                          value={p.title}
                          onChange={(e) => updatePart(idx, { title: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>What happens</span>
                        <textarea
                          className={`${inputClass} min-h-[72px] resize-y`}
                          value={p.whatHappens}
                          onChange={(e) => updatePart(idx, { whatHappens: e.target.value })}
                          placeholder="Describe what happens in this part"
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Purpose</span>
                        <select
                          className={inputClass}
                          value={p.purpose}
                          onChange={(e) => updatePart(idx, { purpose: e.target.value })}
                        >
                          <option value="">Select…</option>
                          {purposes.map((x) => (
                            <option key={x} value={x}>
                              {x}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className={labelClass}>Ending hook</span>
                        <textarea
                          className={`${inputClass} min-h-[64px] resize-y`}
                          value={p.endingHook}
                          onChange={(e) => updatePart(idx, { endingHook: e.target.value })}
                          placeholder="What makes the reader continue?"
                        />
                      </label>
                      {serial.parts.length > 3 && (
                        <button
                          type="button"
                          className="text-xs text-red-300"
                          onClick={() => removePart(idx)}
                        >
                          Remove part
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {serial.parts.length < 7 && (
            <Button variant="secondary" className="w-full" onClick={addPart}>
              <Plus size={14} className="mr-1.5" /> Add part
            </Button>
          )}
          <Button className="w-full" onClick={() => void saveOutline("dashboard")} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Save outline
          </Button>
        </div>
      )}

      {view === "dashboard" && serial && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Micro-Serial
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-white">{serial.title}</h3>
            <p className="mt-1 text-xs text-[#606060]">{serial.parts.length} Parts</p>
          </div>
          <div className="space-y-2">
            {serial.parts.map((p, idx) => {
              const done = p.status === "done" || (p.body || "").trim().length > 40;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setWriteIndex(idx);
                    setView("write");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3 text-left"
                >
                  {done ? (
                    <Check size={16} className="shrink-0 text-[#52C07A]" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-[#606060]" />
                  )}
                  <span className="text-sm text-[#F0EBE0]">
                    Part {idx + 1} — {p.title}
                  </span>
                </button>
              );
            })}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const next = serial.parts.findIndex(
                (p) => !(p.status === "done" || (p.body || "").trim().length > 40)
              );
              setWriteIndex(next >= 0 ? next : 0);
              setView("write");
            }}
          >
            Continue writing
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => setView("outline")}>
            Edit outline
          </Button>
        </div>
      )}

      {view === "write" && serial && serial.parts[writeIndex] && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--gm)]/30 bg-[#121212] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Part {writeIndex + 1} of {serial.parts.length}
            </p>
            <h3 className="mt-1 font-serif text-xl text-white">{serial.parts[writeIndex].title}</h3>
            {serial.parts[writeIndex].whatHappens && (
              <p className="mt-2 text-xs text-[#909090]">{serial.parts[writeIndex].whatHappens}</p>
            )}
            {serial.parts[writeIndex].endingHook && (
              <p className="mt-2 text-xs text-[var(--gd)]">
                Hook: {serial.parts[writeIndex].endingHook}
              </p>
            )}
            {writeIndex > 0 && (
              <p className="mt-3 text-[11px] text-[#606060]">
                Continuity: prior parts ({writeIndex}) are sent as context when you use AI assist.
              </p>
            )}
          </div>
          <textarea
            className={`${inputClass} min-h-[280px] resize-y font-serif text-base leading-relaxed`}
            value={serial.parts[writeIndex].body}
            onChange={(e) => updatePart(writeIndex, { body: e.target.value, status: "draft" })}
            placeholder="Write this part..."
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => void assistWrite()} disabled={busy}>
              {busy ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Sparkles size={14} className="mr-1.5" />
              )}
              AI assist
            </Button>
            <Button onClick={() => void savePartBody(true)} disabled={busy}>
              Save part
            </Button>
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Micro-Serial Mode"
      />
    </div>
  );
}
