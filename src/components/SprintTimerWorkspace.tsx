"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  FolderOpen,
  Loader2,
  Pause,
  Play,
  Save,
  Square,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

const STORAGE_KEY = "ink2wealth_active_sprint";

const WORD_PRESETS = [250, 500, 750, 1000, 1500];
const TIME_PRESETS = [
  { minutes: 10, label: "10 min" },
  { minutes: 15, label: "15 min" },
  { minutes: 20, label: "20 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 45, label: "45 min" },
  { minutes: 60, label: "60 min" },
];

type View = "setup" | "running" | "result" | "history" | "continue";

type ActiveSprint = {
  sessionLocalId: string;
  wordGoal: number;
  timeGoalSeconds: number;
  startedAt: string;
  deadlineAt: number | null;
  remainingMs: number;
  status: "running" | "paused";
  body: string;
  goalCelebrated: boolean;
};

type HistoryItem = {
  id: string;
  wordGoal: number;
  timeGoalSeconds: number;
  wordsWritten: number;
  durationSeconds: number;
  wordsPerMinute: number;
  goalAchieved: boolean;
  completedAt: string;
};

type Result = {
  wordGoal: number;
  timeGoalSeconds: number;
  wordsWritten: number;
  durationSeconds: number;
  wordsPerMinute: number;
  goalAchieved: boolean;
  body: string;
  startedAt: string;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

function formatMmSs(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function dayBucket(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);
  const key = d.toDateString();
  if (key === today.toDateString()) return "Today";
  if (key === yday.toDateString()) return "Yesterday";
  return "Previous";
}

function loadActive(): ActiveSprint | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveSprint;
  } catch {
    return null;
  }
}

function persistActive(s: ActiveSprint | null) {
  if (!s) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function SprintTimerWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<View>("setup");
  const [wordGoal, setWordGoal] = useState(500);
  const [customWords, setCustomWords] = useState("");
  const [timeMinutes, setTimeMinutes] = useState(15);
  const [active, setActive] = useState<ActiveSprint | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const finishingRef = useRef(false);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get("/writer/sprint-timer/history");
      setHistory(res.data.sessions || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadHistory();
    const saved = loadActive();
    if (saved && (saved.status === "running" || saved.status === "paused")) {
      setActive(saved);
      setWordGoal(saved.wordGoal);
      setTimeMinutes(Math.round(saved.timeGoalSeconds / 60));
      setView("running");
    }
  }, [loadHistory]);

  // Tick clock while running
  useEffect(() => {
    if (view !== "running" || !active || active.status !== "running") return;
    const id = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [view, active?.status, active?.sessionLocalId]);

  // Persist active session
  useEffect(() => {
    if (active) persistActive(active);
  }, [active]);

  const remainingSeconds = useMemo(() => {
    if (!active) return timeMinutes * 60;
    if (active.status === "paused") return Math.ceil(active.remainingMs / 1000);
    if (!active.deadlineAt) return Math.ceil(active.remainingMs / 1000);
    return Math.max(0, Math.ceil((active.deadlineAt - nowTick) / 1000));
  }, [active, nowTick, timeMinutes]);

  const words = countWords(active?.body || "");
  const progress = Math.min(100, Math.round((words / Math.max(wordGoal, 1)) * 100));
  const goalHit = words >= (active?.wordGoal || wordGoal);

  const finishSprint = useCallback(
    async (opts?: { continueWriting?: boolean }) => {
      if (!active || finishingRef.current) return;
      finishingRef.current = true;
      const elapsed =
        active.timeGoalSeconds -
        (active.status === "paused"
          ? Math.ceil(active.remainingMs / 1000)
          : remainingSeconds);
      const durationSeconds = Math.max(1, Math.min(active.timeGoalSeconds, elapsed));
      const wordsWritten = countWords(active.body);
      const payload: Result = {
        wordGoal: active.wordGoal,
        timeGoalSeconds: active.timeGoalSeconds,
        wordsWritten,
        durationSeconds,
        wordsPerMinute:
          Math.round((wordsWritten / Math.max(durationSeconds / 60, 1 / 60)) * 10) / 10,
        goalAchieved: wordsWritten >= active.wordGoal,
        body: active.body,
        startedAt: active.startedAt,
      };
      setResult(payload);
      persistActive(null);
      setActive(null);

      setBusy(true);
      setError("");
      try {
        await api.post("/writer/sprint-timer/complete", {
          wordGoal: payload.wordGoal,
          timeGoalSeconds: payload.timeGoalSeconds,
          wordsWritten: payload.wordsWritten,
          durationSeconds: payload.durationSeconds,
          body: payload.body,
          startedAt: payload.startedAt,
          completedAt: new Date().toISOString(),
        });
        await loadHistory();
        showToast("Session saved");
      } catch (err: any) {
        setError(err.response?.data?.error || "Could not save session to cloud (local result kept).");
      } finally {
        setBusy(false);
        finishingRef.current = false;
        if (opts?.continueWriting) {
          // Keep body in result view; user can continue from result
        }
        setView("result");
      }
    },
    [active, remainingSeconds, loadHistory]
  );

  // Auto-complete when timer hits 0
  useEffect(() => {
    if (view !== "running" || !active || active.status !== "running") return;
    if (remainingSeconds <= 0) {
      void finishSprint();
    }
  }, [remainingSeconds, view, active, finishSprint]);

  const startSprint = () => {
    const goal = customWords.trim()
      ? Math.max(50, Number(customWords) || wordGoal)
      : wordGoal;
    const secs = timeMinutes * 60;
    const startedAt = new Date().toISOString();
    const next: ActiveSprint = {
      sessionLocalId: `local_${Date.now()}`,
      wordGoal: goal,
      timeGoalSeconds: secs,
      startedAt,
      deadlineAt: Date.now() + secs * 1000,
      remainingMs: secs * 1000,
      status: "running",
      body: "",
      goalCelebrated: false,
    };
    setWordGoal(goal);
    setActive(next);
    persistActive(next);
    setResult(null);
    setView("running");
    setError("");
  };

  const pause = () => {
    setActive((a) => {
      if (!a || a.status !== "running") return a;
      const rem = a.deadlineAt ? Math.max(0, a.deadlineAt - Date.now()) : a.remainingMs;
      return { ...a, status: "paused", remainingMs: rem, deadlineAt: null };
    });
  };

  const resume = () => {
    setActive((a) => {
      if (!a || a.status !== "paused") return a;
      return {
        ...a,
        status: "running",
        deadlineAt: Date.now() + a.remainingMs,
      };
    });
  };

  const updateBody = (body: string) => {
    setActive((a) => {
      if (!a) return a;
      const next = { ...a, body };
      const w = countWords(body);
      if (w >= a.wordGoal && !a.goalCelebrated) {
        next.goalCelebrated = true;
        showToast("Word goal reached ✓");
      }
      return next;
    });
  };

  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    for (const h of history) {
      const b = dayBucket(h.completedAt);
      (groups[b] ||= []).push(h);
    }
    return ["Today", "Yesterday", "Previous"]
      .filter((k) => groups[k]?.length)
      .map((k) => ({ label: k, items: groups[k] }));
  }, [history]);

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (view === "running") {
            // stay — confirm via pause; back goes to setup only if not running hard
            if (active?.status === "paused" || !active) {
              setView("setup");
              return;
            }
            pause();
            return;
          }
          if (view === "result" || view === "history" || view === "continue") {
            setView("setup");
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {view === "setup" ? "Short-Form Fiction" : "Sprint Timer"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
            <Clock size={20} />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold text-white">Sprint Timer</h2>
            <p className="mt-1 text-sm text-[#909090]">Timed writing sessions, word goals</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setView("history");
            void loadHistory();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#333] px-3 py-1.5 text-xs font-semibold text-[#c8c4bc]"
        >
          <FolderOpen size={12} />
          Sessions
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

      {view === "history" && (
        <div className="space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
            My Writing Sessions
          </h3>
          {groupedHistory.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No sessions yet. Complete a sprint to build history.
            </p>
          ) : (
            groupedHistory.map((g) => (
              <div key={g.label} className="space-y-2">
                <p className="text-xs font-semibold text-[#909090]">{g.label}</p>
                <div className="border-t border-[#242424]" />
                {g.items.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-3 text-sm"
                  >
                    <div className="flex justify-between gap-2 text-white">
                      <span>{h.wordsWritten} words</span>
                      <span className="text-[#909090]">
                        {Math.round(h.timeGoalSeconds / 60)} min
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-[#606060]">
                      Goal: {h.goalAchieved ? "Achieved ✓" : "Not reached"} · {h.wordsPerMinute}{" "}
                      wpm
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {view === "setup" && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm text-[#F0EBE0]">Word goal</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {WORD_PRESETS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setWordGoal(w);
                    setCustomWords("");
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    !customWords && wordGoal === w
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] bg-[#161616] text-[#c8c4bc]"
                  }`}
                >
                  {w.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              className={inputClass}
              value={customWords !== "" ? customWords : String(wordGoal)}
              onChange={(e) => {
                setCustomWords(e.target.value);
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) setWordGoal(Math.floor(n));
              }}
              inputMode="numeric"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-[#F0EBE0]">Time</p>
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((t) => (
                <button
                  key={t.minutes}
                  type="button"
                  onClick={() => setTimeMinutes(t.minutes)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    timeMinutes === t.minutes
                      ? "bg-[var(--gd)] text-zinc-950"
                      : "border border-[#333] bg-[#161616] text-[#c8c4bc]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-6 text-center">
            <div className="font-serif text-6xl font-bold tracking-tight text-white">
              {formatMmSs(timeMinutes * 60)}
            </div>
            <p className="mt-2 text-sm text-[#909090]">Ready when you are</p>
          </div>

          <Button className="w-full" onClick={startSprint}>
            Start sprint
          </Button>
        </div>
      )}

      {view === "running" && active && (
        <div className="space-y-4">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
            Sprint in progress
            {active.status === "paused" ? " — paused" : ""}
          </p>

          <div className="rounded-2xl border border-[#242424] bg-[#121212] px-5 py-6 text-center">
            <p className="text-xs text-[#606060]">Time remaining</p>
            <div className="mt-1 font-serif text-5xl font-bold text-white">
              {formatMmSs(remainingSeconds)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#606060]">Word goal</p>
                <p className="font-semibold text-[#F0EBE0]">{active.wordGoal} words</p>
              </div>
              <div>
                <p className="text-[#606060]">Current words</p>
                <p className="font-semibold text-[#F0EBE0]">
                  {words} / {active.wordGoal}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-1.5 text-left text-[11px] text-[#606060]">Progress</p>
              <div className="h-2 overflow-hidden rounded-full bg-[#242424]">
                <div
                  className="h-full rounded-full bg-[var(--gd)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            {goalHit && (
              <p className="mt-3 text-sm font-semibold text-[#52C07A]">
                Goal achieved ✓ — keep writing or finish
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[#909090]">Your Story</span>
            <textarea
              className={`${inputClass} min-h-[240px] resize-y font-serif text-base leading-relaxed`}
              value={active.body}
              onChange={(e) => updateBody(e.target.value)}
              placeholder="Start writing..."
              disabled={active.status === "paused"}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {active.status === "running" ? (
              <Button variant="secondary" onClick={pause}>
                <Pause size={14} className="mr-1.5" /> Pause
              </Button>
            ) : (
              <Button variant="secondary" onClick={resume}>
                <Play size={14} className="mr-1.5" /> Resume
              </Button>
            )}
            <Button onClick={() => void finishSprint()} disabled={busy}>
              {busy ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Square size={14} className="mr-1.5" />
              )}
              Finish
            </Button>
          </div>
        </div>
      )}

      {view === "result" && result && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 text-center">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
              Sprint Complete
            </h3>
            <p className="mt-3 text-sm text-[#909090]">
              Time: {Math.round(result.timeGoalSeconds / 60)} minutes
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#606060]">Words written</span>
                <span className="text-white">
                  {result.wordsWritten} / {result.wordGoal}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#242424] py-2">
                <span className="text-[#606060]">Goal progress</span>
                <span className="text-white">
                  {Math.min(
                    100,
                    Math.round((result.wordsWritten / Math.max(result.wordGoal, 1)) * 1000) / 10
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#606060]">Words / minute</span>
                <span className="text-white">{result.wordsPerMinute}</span>
              </div>
            </div>
            {result.goalAchieved && (
              <p className="mt-3 text-sm font-semibold text-[#52C07A]">Goal: Achieved ✓</p>
            )}
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              showToast("Already saved with session");
              void loadHistory();
            }}
          >
            <Save size={14} className="mr-1.5" /> Session saved
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setView("continue");
            }}
          >
            Continue writing
          </Button>
          <Button className="w-full" onClick={() => setView("setup")}>
            Start new sprint
          </Button>
        </div>
      )}

      {view === "continue" && result && (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--gd)]">
            Continue writing
          </p>
          <textarea
            className={`${inputClass} min-h-[320px] resize-y font-serif text-base leading-relaxed`}
            value={result.body}
            onChange={(e) => setResult({ ...result, body: e.target.value, wordsWritten: countWords(e.target.value) })}
            placeholder="Keep going..."
          />
          <p className="text-xs text-[#606060]">Words: {countWords(result.body)}</p>
          <Button className="w-full" onClick={() => setView("setup")}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}
