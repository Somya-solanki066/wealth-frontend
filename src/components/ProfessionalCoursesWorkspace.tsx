"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type ProfessionalOptionKey = "A" | "B" | "C" | "D";

type ProfessionalModule = {
  id: string;
  courseId: string;
  name: string;
  level: number;
};

type ProfessionalCourse = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  levels: number[];
  modules: ProfessionalModule[];
};

type ProfessionalQuestion = {
  id: string;
  moduleId: string;
  questionNumber: number;
  questionText: string;
  options: Record<ProfessionalOptionKey, string>;
};

type View = "hub" | "practice" | "results";

type BreakdownItem = {
  questionId: string;
  questionNumber: number;
  chosen: ProfessionalOptionKey | null;
  correctAnswer: ProfessionalOptionKey;
  isCorrect: boolean;
  rationale: string;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ProfessionalCoursesWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<View>("hub");
  const [courses, setCourses] = useState<ProfessionalCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("law");
  const [selectedLevel, setSelectedLevel] = useState(200);
  const [modules, setModules] = useState<ProfessionalModule[]>([]);
  const [activeModule, setActiveModule] = useState<ProfessionalModule | null>(null);
  const [questions, setQuestions] = useState<ProfessionalQuestion[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ProfessionalOptionKey | null>>({});
  const [timeLeft, setTimeLeft] = useState(1800);
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

  const courseData = useMemo(
    () => courses.find((c) => c.id === selectedCourse),
    [courses, selectedCourse]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/student/professional/catalog");
        const list: ProfessionalCourse[] = res.data.courses || [];
        setCourses(list);
        if (list.length) {
          const law = list.find((c) => c.id === "law") || list[0];
          setSelectedCourse(law.id);
          setSelectedLevel(law.levels.includes(200) ? 200 : law.levels[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load professional courses.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedCourse || !selectedLevel) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/student/professional/modules/${selectedCourse}/${selectedLevel}`);
        setModules(res.data.modules || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load modules.");
        setModules([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCourse, selectedLevel]);

  useEffect(() => {
    if (!courseData) return;
    if (!courseData.levels.includes(selectedLevel)) {
      setSelectedLevel(courseData.levels[0]);
    }
  }, [courseData, selectedLevel]);

  const startModulePractice = async (mod: ProfessionalModule) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/professional/questions/${mod.id}`);
      setQuestions(res.data.questions || []);
      setDurationMinutes(res.data.durationMinutes || 30);
      setActiveModule(mod);
      setAnswers({});
      setCurrentIndex(0);
      setResults(null);
      submittedRef.current = false;
      setTimeLeft((res.data.durationMinutes || 30) * 60);
      setView("practice");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const submitExam = useCallback(async () => {
    if (submittedRef.current || !activeModule) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/student/professional/submit", {
        moduleId: activeModule.id,
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
  }, [activeModule, answers]);

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

  const current = questions[currentIndex];
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const selectAnswer = (key: ProfessionalOptionKey) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: key }));
  };

  if (view === "results" && results) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">Practice Complete</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">{results.percentageScore}%</h3>
          <p className="text-xs text-[#909090] mt-2">{activeModule?.name}</p>
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
              <p className="font-bold text-white mb-1">Q{item.questionNumber}</p>
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
          Back to All Professional Courses
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
            <h3 className="font-serif text-lg font-bold text-white">{activeModule?.name}</h3>
            <p className="text-[11px] text-[#909090]">
              {courseData?.name} · {selectedLevel} Level · Q{currentIndex + 1}/{questions.length}
            </p>
          </div>
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[#909090]">Question {currentIndex + 1} of {questions.length}</p>
            <p className={`text-sm font-bold tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-[#5298E0]"}`}>
              {formatTime(timeLeft)}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#F0EBE0]">{current.questionText}</p>

          <div className="space-y-2">
            {(["A", "B", "C", "D"] as ProfessionalOptionKey[]).map((key) => {
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
            {currentIndex < questions.length - 1 ? (
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
            Question map · {answeredCount}/{questions.length} answered
          </p>
          <div className="grid grid-cols-8 gap-2">
            {questions.map((qn, idx) => {
              const answered = Boolean(answers[qn.id]);
              const isCurrent = idx === currentIndex;
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
                  }`}
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

  return (
    <div className="space-y-6">
      {!onBack ? (
        <div>
          <h3 className="font-serif text-xl font-bold text-white">All Professional Courses</h3>
          <p className="text-xs text-[#909090] mt-1">
            Law, Pharmacy, Med Lab Science, Radiography, Physiotherapy, Dentistry, Optometry, Nutrition, Public Health, Environmental Health.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {loading && !courses.length ? (
        <p className="text-xs text-[#909090]">Loading professional courses…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-3">
              Browse by course
            </p>
            <div className="flex flex-wrap gap-2">
              {courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCourse(c.id);
                    setSelectedLevel(c.levels.includes(200) ? 200 : c.levels[0]);
                  }}
                  className={`rounded-full px-3 py-2 text-[11px] font-bold transition-all ${
                    selectedCourse === c.id
                      ? "bg-[#5298E0] text-white"
                      : "border border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
                  }`}
                >
                  {c.shortName}
                </button>
              ))}
            </div>
          </div>

          {courseData ? (
            <>
              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-3">Level</p>
                <div className="flex flex-wrap gap-2">
                  {courseData.levels.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedLevel(lvl)}
                      className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                        selectedLevel === lvl
                          ? "bg-[#5298E0] text-white"
                          : "border border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
                      }`}
                    >
                      {lvl} Level
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090]">
                  {courseData.name} — {selectedLevel} Level
                </p>
                {loading && !modules.length ? (
                  <p className="text-xs text-[#606060]">Loading modules…</p>
                ) : modules.length ? (
                  modules.map((mod) => (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => startModulePractice(mod)}
                      disabled={loading}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#242424] bg-[#080808] px-4 py-4 text-left transition-all hover:border-[#5298E0]/40 disabled:opacity-50"
                    >
                      <span className="text-sm font-semibold text-white">{mod.name}</span>
                      <ChevronRight className="h-4 w-4 text-[#606060] shrink-0" />
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-[#606060]">No modules for this level yet.</p>
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
