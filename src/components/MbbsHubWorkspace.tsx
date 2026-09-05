"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type MbbsOptionKey = "A" | "B" | "C";

type MbbsSubject = {
  id: string;
  name: string;
  description: string;
};

type MbbsPhase = {
  id: string;
  label: string;
  years: number[];
  description: string;
  subjects: MbbsSubject[];
};

type MbbsScenario = {
  id: string;
  phaseId: string;
  subjectId: string;
  questionNumber: number;
  scenario: string;
  question: string;
  options: Record<MbbsOptionKey, string>;
};

type Phase = "hub" | "practice" | "results";

type BreakdownItem = {
  questionId: string;
  questionNumber: number;
  chosen: MbbsOptionKey | null;
  correctAnswer: MbbsOptionKey;
  isCorrect: boolean;
  rationale: string;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function MbbsHubWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<Phase>("hub");
  const [phases, setPhases] = useState<MbbsPhase[]>([]);
  const [programmeYears, setProgrammeYears] = useState(6);
  const [selectedPhase, setSelectedPhase] = useState("para-clinical");
  const [activeSubject, setActiveSubject] = useState<MbbsSubject | null>(null);
  const [scenarios, setScenarios] = useState<MbbsScenario[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, MbbsOptionKey | null>>({});
  const [timeLeft, setTimeLeft] = useState(2700);
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

  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/student/mbbs/catalog");
        const list: MbbsPhase[] = res.data.phases || [];
        setPhases(list);
        setProgrammeYears(res.data.programmeYears || 6);
        if (list.length) {
          setSelectedPhase(list.find((p) => p.id === "para-clinical")?.id || list[0].id);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load MBBS catalog.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const phaseData = useMemo(
    () => phases.find((p) => p.id === selectedPhase),
    [phases, selectedPhase]
  );

  const startSubjectPractice = async (subject: MbbsSubject) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/mbbs/scenarios/${selectedPhase}/${subject.id}`);
      setScenarios(res.data.scenarios || []);
      setDurationMinutes(res.data.durationMinutes || 45);
      setActiveSubject(subject);
      setAnswers({});
      setCurrentIndex(0);
      setResults(null);
      submittedRef.current = false;
      const secs = (res.data.durationMinutes || 45) * 60;
      setTimeLeft(secs);
      setView("practice");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load scenarios.");
    } finally {
      setLoading(false);
    }
  };

  const submitExam = useCallback(async () => {
    if (submittedRef.current || !activeSubject) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/student/mbbs/submit", {
        phaseId: selectedPhase,
        subjectId: activeSubject.id,
        answers,
      });
      setResults({
        percentageScore: res.data.percentageScore,
        correctCount: res.data.correctCount,
        incorrectCount: res.data.incorrectCount,
        skippedCount: res.data.skippedCount,
        totalQuestions: res.data.totalQuestions,
        breakdown: res.data.breakdown || [],
      });
      setView("results");
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }, [activeSubject, selectedPhase, answers]);

  useEffect(() => {
    if (view !== "practice") return;
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
  }, [view, submitExam]);

  const current = scenarios[currentIndex];
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const selectAnswer = (key: MbbsOptionKey) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: key }));
  };

  if (view === "results" && results) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">Scenarios Complete</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">{results.percentageScore}%</h3>
          <p className="text-xs text-[#909090] mt-2">
            {activeSubject?.name} · {phaseData?.label}
          </p>
          <p className="text-xs text-[#909090] mt-1">
            {results.correctCount} correct · {results.incorrectCount} wrong · {results.skippedCount} skipped
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto">
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
              <p className="font-bold text-white mb-1">Scenario {item.questionNumber}</p>
              <p className="text-[#909090]">
                Your answer: {item.chosen || "—"} · Correct: {item.correctAnswer}
              </p>
              {item.rationale ? (
                <p className="text-[#606060] mt-1 leading-relaxed">{item.rationale}</p>
              ) : null}
            </div>
          ))}
        </div>

        <Button type="button" onClick={() => setView("hub")}>
          Back to MBBS Hub
        </Button>
      </div>
    );
  }

  if (view === "practice" && current) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Leave this session? Progress will be lost.")) {
                setView("hub");
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#242424] bg-[#161616] text-[#909090]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">MBBS Hub</h3>
            <p className="text-[11px] text-[#909090]">
              {activeSubject?.name} · {phaseData?.label} · Scenario {currentIndex + 1}/{scenarios.length}
            </p>
          </div>
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
          <div className="flex flex-wrap gap-2">
            {phases.map((p) => (
              <span
                key={p.id}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  p.id === selectedPhase
                    ? "bg-[#5298E0] text-white"
                    : "border border-[#242424] text-[#606060]"
                }`}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090]">
              Clinical scenario question
            </p>
            <p className={`text-sm font-bold tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-[#5298E0]"}`}>
              {formatTime(timeLeft)}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#F0EBE0]">{current.scenario}</p>
          <p className="text-sm font-semibold leading-relaxed text-white">{current.question}</p>

          <div className="space-y-2">
            {(["A", "B", "C"] as MbbsOptionKey[]).map((key) => {
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

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              Previous
            </Button>
            {currentIndex < scenarios.length - 1 ? (
              <Button type="button" size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
                Next →
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={submitExam} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-3">
            Scenario map · {answeredCount}/{scenarios.length} answered
          </p>
          <div className="grid grid-cols-8 gap-2">
            {scenarios.map((sc, idx) => {
              const answered = Boolean(answers[sc.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`aspect-square rounded-lg text-[11px] font-bold transition-all ${
                    isCurrent
                      ? "bg-[#5298E0] text-white"
                      : answered
                        ? "border border-[#5298E0] text-[#5298E0] bg-[rgba(82,152,224,0.1)]"
                        : "border border-[#242424] text-[#606060] bg-[#080808]"
                  }`}
                >
                  {sc.questionNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!onBack ? (
        <div>
          <h3 className="font-serif text-xl font-bold text-white">MBBS Hub</h3>
          <p className="text-xs text-[#909090] mt-1">
            Complete {programmeYears}-year programme. Clinical scenario questions that mirror real professional exams.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {loading && !phases.length ? (
        <p className="text-xs text-[#909090]">Loading MBBS Hub…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-3">
              Programme phase
            </p>
            <div className="flex flex-wrap gap-2">
              {phases.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPhase(p.id)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    selectedPhase === p.id
                      ? "bg-[#5298E0] text-white"
                      : "border border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {phaseData ? (
              <p className="text-[11px] text-[#606060] mt-3">{phaseData.description}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090]">
              {phaseData?.label} subjects
            </p>
            {phaseData?.subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => startSubjectPractice(subject)}
                disabled={loading}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#242424] bg-[#080808] px-4 py-4 text-left transition-all hover:border-[#5298E0]/40 disabled:opacity-50"
              >
                <div>
                  <span className="text-sm font-semibold text-white block">{subject.name}</span>
                  <span className="text-[11px] text-[#606060] mt-0.5 block">{subject.description}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#606060] shrink-0" />
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">
              Clinical scenario questions
            </p>
            <p className="text-[11px] text-[#909090] leading-relaxed">
              Not just MCQs — each question presents a full clinical vignette with diagnosis and management decisions, mirroring MBBS professional exams in Nigeria.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
