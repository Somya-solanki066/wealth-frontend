"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Flag } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type JambOptionKey = "A" | "B" | "C" | "D";

type JambQuestion = {
  id: string;
  subject: string;
  questionNumber: number;
  questionText: string;
  options: Record<JambOptionKey, string>;
  topic: string;
  examYear: number;
};

type JambSubject = {
  id: string;
  label: string;
  durationMinutes: number;
  questionCount: number;
};

type Phase = "pick" | "exam" | "results";

type BreakdownItem = {
  questionId: string;
  questionNumber: number;
  chosen: JambOptionKey | null;
  correctAnswer: JambOptionKey;
  isCorrect: boolean;
  topic: string;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function JambPracticeWorkspace({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [subjects, setSubjects] = useState<JambSubject[]>([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [questions, setQuestions] = useState<JambQuestion[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, JambOptionKey | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(3600);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{
    percentageScore: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalQuestions: number;
    breakdown: BreakdownItem[];
  } | null>(null);

  const startTimeRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/student/jamb/subjects");
        const list: JambSubject[] = res.data.subjects || [];
        setSubjects(list);
        if (list[0]) setActiveSubject(list[0].id);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load JAMB subjects.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadSubject = useCallback(async (subjectId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/jamb/questions/${subjectId}`);
      setQuestions(res.data.questions || []);
      setDurationMinutes(res.data.durationMinutes || 60);
      setActiveSubject(subjectId);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }, []);

  const startExam = async () => {
    if (!activeSubject) return;
    await loadSubject(activeSubject);
    const secs = durationMinutes * 60;
    setTimeLeft(secs);
    startTimeRef.current = Date.now();
    submittedRef.current = false;
    setAnswers({});
    setMarked(new Set());
    setCurrentIndex(0);
    setResults(null);
    setPhase("exam");
  };

  const submitExam = useCallback(async () => {
    if (submittedRef.current || !activeSubject) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const timeUsedSeconds = Math.max(
        0,
        durationMinutes * 60 - timeLeft
      );
      const res = await api.post("/student/jamb/submit", {
        subject: activeSubject,
        answers,
        markedForReview: Array.from(marked),
        timeUsedSeconds,
      });
      setResults({
        percentageScore: res.data.percentageScore,
        correctCount: res.data.correctCount,
        incorrectCount: res.data.incorrectCount,
        skippedCount: res.data.skippedCount,
        totalQuestions: res.data.totalQuestions,
        breakdown: res.data.breakdown || [],
      });
      setPhase("results");
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Failed to submit exam.");
    } finally {
      setSubmitting(false);
    }
  }, [activeSubject, answers, marked, durationMinutes, timeLeft]);

  useEffect(() => {
    if (phase !== "exam") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submitExam]);

  const current = questions[currentIndex];
  const subjectLabel = subjects.find((s) => s.id === activeSubject)?.label || "JAMB";

  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const selectAnswer = (key: JambOptionKey) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: key }));
  };

  const toggleMark = () => {
    if (!current) return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  };

  if (loading && phase === "pick" && !subjects.length) {
    return <p className="text-xs text-[#909090]">Loading JAMB practice…</p>;
  }

  if (phase === "pick") {
    return (
      <div className="space-y-6">
        {!onBack ? (
          <div>
            <h3 className="font-serif text-xl font-bold text-white">JAMB UTME Practice</h3>
            <p className="text-xs text-[#909090] mt-1">
              CBT-style practice with fixed past-exam questions. Timer, mark for review, and question map — just like the real exam.
            </p>
          </div>
        ) : null}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0] mb-3">
            Choose subject
          </p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSubject(s.id)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  activeSubject === s.id
                    ? "bg-[#5298E0] text-white"
                    : "border border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#606060] mt-3">
            {subjects.find((s) => s.id === activeSubject)?.questionCount || 40} questions · 60 minutes · Auto-submit when time ends
          </p>
        </div>

        <Button type="button" onClick={startExam} disabled={!activeSubject || loading}>
          {loading ? "Loading…" : "Start Practice Exam"}
        </Button>
      </div>
    );
  }

  if (phase === "results" && results) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">
            Exam Complete
          </p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">
            {results.percentageScore}%
          </h3>
          <p className="text-xs text-[#909090] mt-2">
            {results.correctCount} correct · {results.incorrectCount} wrong · {results.skippedCount} skipped
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto">
          {results.breakdown.map((item) => (
            <div
              key={item.questionId}
              className={`rounded-xl border p-3 text-xs ${
                item.isCorrect
                  ? "border-[#52C07A]/40 bg-[#52C07A]/10"
                  : item.chosen
                    ? "border-red-900/40 bg-red-950/20"
                    : "border-[#242424] bg-[#161616]"
              }`}
            >
              <p className="font-bold text-white mb-1">Q{item.questionNumber}</p>
              <p className="text-[#909090]">
                Your answer: {item.chosen || "—"} · Correct: {item.correctAnswer}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setPhase("pick")}>
            Practice Another Subject
          </Button>
          {onBack ? (
            <Button type="button" variant="outline" onClick={onBack}>
              All tools
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Leave this practice session? Progress will be lost.")) {
              setPhase("pick");
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#242424] bg-[#161616] text-[#909090]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="font-serif text-lg font-bold text-white">JAMB UTME Practice</h3>
      </div>

      <div className="rounded-2xl border border-[#242424] bg-[#161616] p-3">
        <div className="flex flex-wrap gap-2">
          {subjects.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                s.id === activeSubject
                  ? "bg-[#5298E0] text-white"
                  : "border border-[#242424] text-[#606060]"
              }`}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {current ? (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#909090]">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <p className={`text-sm font-bold tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-[#5298E0]"}`}>
              {formatTime(timeLeft)}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#F0EBE0]">{current.questionText}</p>

          <div className="space-y-2">
            {(["A", "B", "C", "D"] as JambOptionKey[]).map((key) => {
              const selected = answers[current.id] === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectAnswer(key)}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    selected
                      ? "border-[#5298E0] bg-[rgba(82,152,224,0.15)] text-white"
                      : "border-[#242424] bg-[#080808] text-[#F0EBE0] hover:border-[#5298E0]/40"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      selected ? "bg-[#5298E0] text-white" : "bg-[#161616] text-[#909090]"
                    }`}
                  >
                    {key}
                  </span>
                  <span>{current.options[key]}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={toggleMark}
              className={`flex items-center gap-2 text-xs font-semibold ${
                marked.has(current.id) ? "text-red-400" : "text-[#909090]"
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              Mark for review
            </button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                Previous
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button type="button" size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
                  Next →
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={submitExam} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Exam"}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-3">
          Question map · {answeredCount}/{questions.length} answered
        </p>
        <div className="grid grid-cols-8 gap-2">
          {questions.map((qn, idx) => {
            const answered = Boolean(answers[qn.id]);
            const isCurrent = idx === currentIndex;
            const isMarked = marked.has(qn.id);
            return (
              <button
                key={qn.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`aspect-square rounded-lg text-[11px] font-bold transition-all ${
                  isCurrent
                    ? "bg-[#5298E0] text-white"
                    : answered
                      ? "border border-[#5298E0] text-[#5298E0] bg-[rgba(82,152,224,0.1)]"
                      : "border border-[#242424] text-[#606060] bg-[#080808]"
                } ${isMarked ? "ring-1 ring-red-400/60" : ""}`}
              >
                {qn.questionNumber}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
