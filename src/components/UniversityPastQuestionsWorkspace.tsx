"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  Star,
  Timer,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import PaywallModal from "@/components/ui/PaywallModal";

type OptionKey = "A" | "B" | "C" | "D";
type PracticeMode = "study" | "exam";

type UniversityItem = {
  id: string;
  name: string;
  shortName: string;
  location?: string;
  region: string;
};

type FacultyItem = { id: string; name: string; courseCount: number };
type CourseItem = {
  id: string;
  code: string;
  title: string;
  level: string;
  premiumCourse?: boolean;
  availableYears?: number[];
  freeYearsCount?: number;
  totalYears?: number;
};
type YearItem = { year: number; locked: boolean; free: boolean; premium: boolean };

type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Record<OptionKey, string>;
  topic?: string;
};

type StudyFeedback = {
  isCorrect: boolean;
  correctAnswer: OptionKey;
  correctText: string;
  explanation: string;
  topic: string;
};

type BreakdownItem = {
  questionId: string;
  questionNumber: number;
  questionText: string;
  topic: string;
  chosen: OptionKey | null;
  correctAnswer: OptionKey;
  isCorrect: boolean;
  explanation: string;
  options: Record<OptionKey, string>;
};

type Phase = "wizard" | "study" | "exam" | "results" | "review" | "history";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function UniversityPastQuestionsWorkspace({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<Phase>("wizard");
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  // Catalog
  const [regions, setRegions] = useState<Array<{ region: string; universities: UniversityItem[] }>>([]);
  const [uniSearch, setUniSearch] = useState("");
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [courseSearch, setCourseSearch] = useState("");
  const [coursesByLevel, setCoursesByLevel] = useState<Record<string, CourseItem[]>>({});
  const [years, setYears] = useState<YearItem[]>([]);
  const [coursePremiumLocked, setCoursePremiumLocked] = useState(false);

  // Selection
  const [uni, setUni] = useState<UniversityItem | null>(null);
  const [faculty, setFaculty] = useState<FacultyItem | null>(null);
  const [course, setCourse] = useState<CourseItem | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [mode, setMode] = useState<PracticeMode | null>(null);

  // Session
  const [sessionToken, setSessionToken] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(3600);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [studyFeedback, setStudyFeedback] = useState<StudyFeedback | null>(null);
  const [studyAnswered, setStudyAnswered] = useState<Set<string>>(new Set());
  const submittedRef = useRef(false);

  // Results
  const [results, setResults] = useState<{
    label: string;
    courseCode: string;
    year: number;
    percentageScore: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalQuestions: number;
    timeUsedSeconds: number;
    topicScores: Array<{ topic: string; percentage: number; correct: number; total: number }>;
    weakestArea: { topic: string; accuracy: number } | null;
    breakdown: BreakdownItem[];
    mode: PracticeMode;
  } | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct" | "skipped">("all");
  const [history, setHistory] = useState<any[]>([]);
  const [retryPayload, setRetryPayload] = useState<Record<string, unknown> | null>(null);

  const loadUniversities = useCallback(async (search = "") => {
    setLoading(true);
    try {
      const res = await api.get("/student/university-past/universities", { params: { search } });
      setRegions(res.data.regions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load universities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [loadUniversities]);

  const selectUniversity = async (u: UniversityItem) => {
    setUni(u);
    setFaculty(null);
    setCourse(null);
    setSelectedYear(null);
    setMode(null);
    setWizardStep(2);
    setLoading(true);
    try {
      const res = await api.get(`/student/university-past/universities/${u.id}/faculties`);
      setFaculties(res.data.faculties || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load faculties.");
    } finally {
      setLoading(false);
    }
  };

  const selectFaculty = async (f: FacultyItem) => {
    if (!uni) return;
    setFaculty(f);
    setCourse(null);
    setSelectedYear(null);
    setMode(null);
    setWizardStep(3);
    setLoading(true);
    try {
      const res = await api.get(
        `/student/university-past/universities/${uni.id}/faculties/${f.id}/courses`,
        { params: { search: courseSearch } }
      );
      setCoursesByLevel(res.data.byLevel || {});
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const selectCourse = async (c: CourseItem) => {
    setCourse(c);
    setSelectedYear(null);
    setMode(null);
    setWizardStep(4);
    setLoading(true);
    try {
      const res = await api.get(`/student/university-past/courses/${c.id}/years`);
      setYears(res.data.years || []);
      setCoursePremiumLocked(Boolean(res.data.coursePremiumLocked));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load years.");
    } finally {
      setLoading(false);
    }
  };

  const selectYear = (year: number, locked: boolean) => {
    if (locked) {
      setShowPaywall(true);
      return;
    }
    if (coursePremiumLocked) {
      setShowPaywall(true);
      return;
    }
    setSelectedYear(year);
    setMode(null);
  };

  const startSession = async (selectedMode: PracticeMode) => {
    if (!course || !selectedYear) return;
    setMode(selectedMode);
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/student/university-past/start", {
        courseId: course.id,
        year: selectedYear,
        mode: selectedMode,
      });
      setSessionToken(res.data.sessionToken);
      setQuestions(res.data.questions || []);
      setDurationMinutes(res.data.durationMinutes || 60);
      setTimeLeft((res.data.durationMinutes || 60) * 60);
      setAnswers({});
      setMarked(new Set());
      setStudyAnswered(new Set());
      setStudyFeedback(null);
      setCurrentIndex(0);
      submittedRef.current = false;
      setRetryPayload({ courseId: course.id, year: selectedYear, mode: selectedMode });
      setPhase(selectedMode);
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      else setError(err.response?.data?.error || "Failed to start.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudyAnswer = async (key: OptionKey) => {
    const q = questions[currentIndex];
    if (!q || studyAnswered.has(q.id)) return;
    setAnswers((p) => ({ ...p, [q.id]: key }));
    try {
      const res = await api.post("/student/university-past/check-answer", {
        sessionToken,
        questionId: q.id,
        chosen: key,
      });
      setStudyFeedback(res.data);
      setStudyAnswered((p) => new Set(p).add(q.id));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to check answer.");
    }
  };

  const submitSession = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const timeUsedSeconds = Math.max(0, durationMinutes * 60 - timeLeft);
      const res = await api.post("/student/university-past/submit", {
        sessionToken,
        answers,
        markedForReview: Array.from(marked),
        timeUsedSeconds,
      });
      setResults({
        label: res.data.label,
        courseCode: res.data.courseCode,
        year: res.data.year,
        percentageScore: res.data.percentageScore,
        correctCount: res.data.correctCount,
        incorrectCount: res.data.incorrectCount,
        skippedCount: res.data.skippedCount,
        totalQuestions: res.data.totalQuestions,
        timeUsedSeconds: res.data.timeUsedSeconds,
        topicScores: res.data.topicScores || [],
        weakestArea: res.data.weakestArea,
        breakdown: res.data.breakdown || [],
        mode: res.data.mode,
      });
      setPhase("results");
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [sessionToken, answers, marked, durationMinutes, timeLeft]);

  useEffect(() => {
    if (phase !== "exam") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          submitSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submitSession]);

  const loadHistory = async () => {
    try {
      const res = await api.get("/student/university-past/sessions");
      setHistory(res.data.sessions || []);
      setPhase("history");
    } catch {
      setError("Failed to load history.");
    }
  };

  const current = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(Boolean).length;

  const filteredReview = useMemo(() => {
    if (!results) return [];
    if (reviewFilter === "all") return results.breakdown;
    if (reviewFilter === "wrong") return results.breakdown.filter((b) => b.chosen && !b.isCorrect);
    if (reviewFilter === "correct") return results.breakdown.filter((b) => b.isCorrect);
    return results.breakdown.filter((b) => !b.chosen);
  }, [results, reviewFilter]);

  const resetWizard = () => {
    setPhase("wizard");
    setWizardStep(1);
    setUni(null);
    setFaculty(null);
    setCourse(null);
    setSelectedYear(null);
    setMode(null);
    setResults(null);
    setError("");
  };

  const goBackStep = () => {
    if (wizardStep === 4) {
      if (selectedYear) {
        setSelectedYear(null);
        setMode(null);
        return;
      }
      setWizardStep(3);
      setCourse(null);
      setSelectedYear(null);
      setMode(null);
      return;
    }
    if (wizardStep === 3) {
      setWizardStep(2);
      setCourse(null);
      setSelectedYear(null);
      setMode(null);
      return;
    }
    if (wizardStep === 2) {
      setWizardStep(1);
      setFaculty(null);
      setCourse(null);
      setSelectedYear(null);
      setMode(null);
      return;
    }
  };

  // ─── HISTORY ───
  if (phase === "history") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setPhase("wizard")} className="text-xs text-[#909090] flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-bold text-white">My University Practice</h3>
        {history.length === 0 ? (
          <p className="text-xs text-[#606060]">No practice sessions yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((s) => (
              <div key={s.id} className="rounded-xl border border-[#242424] bg-[#161616] p-4">
                <p className="text-sm font-bold text-white">{s.universityName} — {s.courseCode} — {s.year}</p>
                <p className="text-xs text-[#5298E0] mt-1">Score: {s.percentageScore}% · {s.mode === "study" ? "Study" : "Exam"}</p>
                <p className="text-[10px] text-[#606060]">{new Date(s.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── RESULTS ───
  if (phase === "results" && results) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[#0d1117] p-6 text-center">
          <p className="text-[10px] font-bold uppercase text-[#5298E0]">{results.courseCode} — {results.year}</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">
            {results.correctCount} / {results.totalQuestions}
          </h3>
          <p className="text-lg text-[#5298E0] font-bold">{results.percentageScore}%</p>
          {results.timeUsedSeconds > 0 && (
            <p className="text-xs text-[#606060] mt-2">Time used: {formatTime(results.timeUsedSeconds)}</p>
          )}
          <p className="text-xs text-[#909090] mt-1">
            Correct: {results.correctCount} · Wrong: {results.incorrectCount} · Skipped: {results.skippedCount}
          </p>
        </div>

        {results.topicScores.length > 0 && (
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase text-[#909090]">Topic Performance</p>
            {results.topicScores.map((t) => (
              <div key={t.topic} className="flex justify-between text-sm">
                <span className="text-[#C0C0C0]">{t.topic}</span>
                <span className="font-bold text-[#5298E0]">{t.percentage}%</span>
              </div>
            ))}
          </div>
        )}

        {results.weakestArea && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-xs font-bold text-red-400">⚠ Weak Area</p>
            <p className="text-sm text-white mt-1">{results.weakestArea.topic}</p>
            <p className="text-xs text-red-400">Accuracy: {results.weakestArea.accuracy}%</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setReviewIndex(0); setPhase("review"); }} className="flex-1">
            <BarChart3 className="h-4 w-4 mr-1 inline" /> Full Review
          </Button>
          <Button onClick={() => retryPayload && startSession(retryPayload.mode as PracticeMode)} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-1 inline" /> Try Again
          </Button>
        </div>
        <Button variant="outline" onClick={resetWizard} className="w-full">Browse Another Course</Button>
      </div>
    );
  }

  // ─── REVIEW ───
  if (phase === "review" && results) {
    const item = filteredReview[reviewIndex];
    if (!item) { setPhase("results"); return null; }
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button type="button" onClick={() => setPhase("results")} className="text-xs text-[#909090] flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2 flex-wrap">
          {(["all", "wrong", "correct", "skipped"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setReviewFilter(f); setReviewIndex(0); }}
              className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                reviewFilter === f ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#606060]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-[#5298E0]">Question {reviewIndex + 1} of {filteredReview.length}</p>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <p className="text-sm text-white">{item.questionText}</p>
          <p className={item.isCorrect ? "text-[#52C07A] text-sm" : "text-red-400 text-sm"}>
            Your answer: {item.chosen || "—"} {item.isCorrect ? "✓" : "✗"}
          </p>
          {!item.isCorrect && <p className="text-[#52C07A] text-sm">Correct: {item.correctAnswer} ✓</p>}
          <p className="text-xs text-[#909090] leading-relaxed">{item.explanation}</p>
          <p className="text-[10px] text-[#606060]">Topic: {item.topic}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}>← Prev</Button>
          <Button disabled={reviewIndex >= filteredReview.length - 1} onClick={() => setReviewIndex((i) => i + 1)} className="flex-1">Next →</Button>
        </div>
      </div>
    );
  }

  // ─── STUDY MODE ───
  if (phase === "study" && current) {
    const isLast = currentIndex >= questions.length - 1;
    const answered = studyAnswered.has(current.id);
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button type="button" onClick={resetWizard} className="text-[#909090]"><ArrowLeft className="h-5 w-5" /></button>
          <p className="text-xs text-[#909090]">Question {currentIndex + 1} of {questions.length} · Study Mode</p>
          <span className="text-[10px] text-[#52C07A] font-bold">📖 Study</span>
        </div>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <p className="text-sm text-[#F0EBE0]">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                disabled={answered}
                onClick={() => handleStudyAnswer(key)}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                  answers[current.id] === key
                    ? studyFeedback?.isCorrect
                      ? "border-[#52C07A] bg-[#52C07A]/10"
                      : "border-red-500 bg-red-950/20"
                    : "border-[#242424] bg-[#080808] hover:border-[#5298E0]/40"
                } ${answered ? "cursor-default" : ""}`}
              >
                <span className="font-bold text-[#5298E0]">{key}.</span>
                <span>{current.options[key]}</span>
              </button>
            ))}
          </div>
          {studyFeedback && answered && (
            <div className={`rounded-xl p-4 text-sm ${studyFeedback.isCorrect ? "bg-[#52C07A]/10 border border-[#52C07A]/30" : "bg-red-950/20 border border-red-900/30"}`}>
              <p className="font-bold text-white mb-1">
                {studyFeedback.isCorrect ? "✓ Correct!" : `✗ Correct Answer: ${studyFeedback.correctAnswer}`}
              </p>
              <p className="text-[#C0C0C0] leading-relaxed">{studyFeedback.explanation}</p>
              <p className="text-[10px] text-[#606060] mt-2">Topic: {studyFeedback.topic}</p>
            </div>
          )}
          {answered && (
            <Button
              onClick={() => {
                if (isLast) submitSession();
                else { setCurrentIndex((i) => i + 1); setStudyFeedback(null); }
              }}
              isLoading={submitting && isLast}
              className="w-full"
            >
              {isLast ? "Complete Study Session" : "Next Question →"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── EXAM MODE ───
  if (phase === "exam" && current) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => { if (confirm("Leave exam?")) resetWizard(); }} className="text-[#909090]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="text-xs text-[#909090]">Q {currentIndex + 1} of {questions.length}</p>
          <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-[#5298E0]"}`}>
            <Clock className="h-3.5 w-3.5" /> {formatTime(timeLeft)}
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-3">
          <p className="text-[10px] font-bold uppercase text-[#606060] mb-2">Question Map</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((qn, idx) => (
              <button
                key={qn.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-[10px] font-bold ${
                  idx === currentIndex ? "bg-[#5298E0] text-white"
                    : marked.has(qn.id) ? "bg-yellow-900/40 border border-yellow-600/60 text-yellow-400"
                    : answers[qn.id] ? "bg-[#52C07A]/20 border border-[#52C07A]/40 text-[#52C07A]"
                    : "border border-[#242424] text-[#606060]"
                }`}
              >
                {qn.questionNumber}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <p className="text-sm text-[#F0EBE0]">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setAnswers((p) => ({ ...p, [current.id]: key }))}
                className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                  answers[current.id] === key ? "border-[#5298E0] bg-[rgba(82,152,224,0.15)]" : "border-[#242424] bg-[#080808]"
                }`}
              >
                <span className="font-bold">{key}</span>
                <span>{current.options[key]}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="text-xs text-[#909090]">← Previous</button>
            <button
              type="button"
              onClick={() => setMarked((p) => { const n = new Set(p); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; })}
              className={`flex items-center gap-1 text-xs ${marked.has(current.id) ? "text-yellow-400" : "text-[#909090]"}`}
            >
              <Star className="h-3.5 w-3.5" /> Mark
            </button>
            {currentIndex < questions.length - 1 ? (
              <button type="button" onClick={() => setCurrentIndex((i) => i + 1)} className="text-xs font-bold text-[#5298E0]">Next →</button>
            ) : (
              <button type="button" onClick={() => setShowSubmitModal(true)} className="text-xs font-bold text-[#5298E0]">Submit Exam</button>
            )}
          </div>
        </div>

        <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Exam?">
          <div className="space-y-3 text-sm text-[#909090]">
            <p>Answered: <strong className="text-white">{answeredCount}</strong></p>
            <p>Unanswered: <strong className="text-white">{questions.length - answeredCount}</strong></p>
            <p>Marked: <strong className="text-white">{marked.size}</strong></p>
            {timeLeft > 0 && <p className="text-[#5298E0]">You still have {formatTime(timeLeft)} remaining.</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowSubmitModal(false)} className="flex-1">Continue Exam</Button>
              <Button onClick={submitSession} isLoading={submitting} className="flex-1">Submit Anyway</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ─── WIZARD (sequential steps) ───
  const WIZARD_STEPS = [
    { step: 1, label: "University" },
    { step: 2, label: "Faculty" },
    { step: 3, label: "Course" },
    { step: 4, label: "Year & Mode" },
  ];

  const wizardTitle =
    wizardStep === 1 ? "Select Your University"
      : wizardStep === 2 ? "Select Faculty"
        : wizardStep === 3 ? "Select Course"
          : "Choose Year & Mode";

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {wizardStep > 1 && (
            <button type="button" onClick={goBackStep} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#242424] bg-[#161616] text-[#909090]">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5298E0]">University Past Questions</p>
            <h3 className="font-serif text-xl font-bold text-white mt-1">{wizardTitle}</h3>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadHistory}>History</Button>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>All Tools</Button>}
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2">
        {WIZARD_STEPS.map((s, idx) => (
          <div key={s.step} className="flex items-center gap-2 flex-1">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
              wizardStep === s.step ? "bg-[#5298E0] text-white"
                : wizardStep > s.step ? "bg-[#52C07A]/20 text-[#52C07A] border border-[#52C07A]/40"
                : "border border-[#242424] text-[#606060]"
            }`}>
              {wizardStep > s.step ? "✓" : s.step}
            </div>
            <span className={`text-[10px] font-bold hidden sm:block ${wizardStep >= s.step ? "text-white" : "text-[#606060]"}`}>
              {s.label}
            </span>
            {idx < WIZARD_STEPS.length - 1 && (
              <div className={`h-px flex-1 ${wizardStep > s.step ? "bg-[#52C07A]/40" : "bg-[#242424]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      {(uni || faculty || course) && (
        <div className="flex flex-wrap gap-1 text-[10px] text-[#606060]">
          {uni && <span className="text-[#5298E0]">{uni.shortName}</span>}
          {faculty && <><span>›</span><span className="text-[#5298E0]">{faculty.name}</span></>}
          {course && <><span>›</span><span className="text-[#5298E0]">{course.code}</span></>}
          {selectedYear && <><span>›</span><span className="text-[#5298E0]">{selectedYear}</span></>}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* STEP 1: University */}
      {wizardStep === 1 && (
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#606060]" />
            <input
              type="text"
              value={uniSearch}
              onChange={(e) => { setUniSearch(e.target.value); loadUniversities(e.target.value); }}
              placeholder="Search university name..."
              className="w-full rounded-xl border border-[#242424] bg-[#080808] pl-9 pr-3 py-2.5 text-sm text-white"
            />
          </div>
          {loading && !regions.length ? (
            <p className="text-xs text-[#606060]">Loading universities…</p>
          ) : (
            regions.map((group) => (
              <div key={group.region}>
                <p className="text-[10px] font-bold text-[#606060] uppercase mb-2">{group.region}</p>
                {group.universities.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUniversity(u)}
                    className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 mb-2 text-left hover:border-[#5298E0]/40 transition-all"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{u.name}</p>
                      <p className="text-[10px] text-[#606060]">{u.shortName} · {u.location}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#606060] shrink-0" />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* STEP 2: Faculty */}
      {wizardStep === 2 && (
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-3">
          {uni && <p className="text-xs text-[#909090]">{uni.name}</p>}
          {loading ? (
            <p className="text-xs text-[#606060]">Loading faculties…</p>
          ) : faculties.length ? (
            faculties.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFaculty(f)}
                className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-left hover:border-[#5298E0]/40 transition-all"
              >
                <span className="text-sm font-bold text-white">{f.name}</span>
                <ChevronRight className="h-4 w-4 text-[#606060]" />
              </button>
            ))
          ) : (
            <p className="text-xs text-[#606060]">No faculties found.</p>
          )}
        </div>
      )}

      {/* STEP 3: Course */}
      {wizardStep === 3 && (
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#606060]" />
            <input
              type="text"
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              placeholder="Course code or name..."
              className="w-full rounded-xl border border-[#242424] bg-[#080808] pl-9 pr-3 py-2.5 text-sm text-white"
            />
          </div>
          {loading ? (
            <p className="text-xs text-[#606060]">Loading courses…</p>
          ) : Object.keys(coursesByLevel).length ? (
            Object.entries(coursesByLevel).map(([level, courses]) => (
              <div key={level}>
                <p className="text-[10px] font-bold text-[#606060] uppercase mb-2">{level}</p>
                {courses
                  .filter((c) => !courseSearch || c.code.toLowerCase().includes(courseSearch.toLowerCase()) || c.title.toLowerCase().includes(courseSearch.toLowerCase()))
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCourse(c)}
                      className="w-full text-left rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 mb-2 hover:border-[#5298E0]/40 transition-all"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold text-white">{c.code} — {c.title}</p>
                        {c.premiumCourse ? (
                          <span className="text-[9px] font-bold text-yellow-500 shrink-0">🔒 PREMIUM</span>
                        ) : (
                          <span className="text-[9px] font-bold text-[#52C07A] shrink-0">FREE</span>
                        )}
                      </div>
                      {c.availableYears && (
                        <p className="text-[10px] text-[#606060] mt-0.5">
                          {c.availableYears.slice(-3).join(", ")}
                          {c.premiumCourse && c.totalYears ? ` · ${c.totalYears} years · ${c.freeYearsCount} free` : ""}
                        </p>
                      )}
                    </button>
                  ))}
              </div>
            ))
          ) : (
            <p className="text-xs text-[#606060]">No courses found.</p>
          )}
        </div>
      )}

      {/* STEP 4: Year & Mode */}
      {wizardStep >= 4 && (
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-4">
          {course && <p className="text-sm font-bold text-white">{course.code} — {course.title}</p>}

          {coursePremiumLocked && (
            <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-3 text-xs text-yellow-400">
              🔒 Premium course. <Link href="/pricing" className="underline">Upgrade</Link> to access.
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-[#606060] uppercase mb-2">Choose Year</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {years.map((y) => (
                <button
                  key={y.year}
                  type="button"
                  onClick={() => selectYear(y.year, y.locked)}
                  className={`rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-1 ${
                    selectedYear === y.year ? "border-2 border-[#5298E0] bg-[#5298E0]/10 text-white"
                      : y.locked ? "border border-[#242424] text-[#606060]"
                      : "border border-[#242424] text-white hover:border-[#5298E0]/40"
                  }`}
                >
                  {y.year}
                  {y.locked && <span className="text-yellow-500 text-xs">⭐</span>}
                  {selectedYear === y.year && !y.locked && <span>✓</span>}
                </button>
              ))}
            </div>
            {years.some((y) => y.locked) && (
              <p className="text-[10px] text-[#606060] mt-2">⭐ Premium required for older years</p>
            )}
          </div>

          {selectedYear && !coursePremiumLocked && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#606060] uppercase">Choose Mode</p>
              <button
                type="button"
                onClick={() => startSession("study")}
                disabled={submitting}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  mode === "study" ? "border-[#52C07A] bg-[#52C07A]/10" : "border-[#242424] bg-[#080808] hover:border-[#52C07A]/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-[#52C07A]" />
                  <span className="text-sm font-bold text-white">Study Mode</span>
                </div>
                <p className="text-[10px] text-[#909090] leading-relaxed">
                  See correct answer immediately after each question. Explanation included.
                </p>
              </button>
              <button
                type="button"
                onClick={() => startSession("exam")}
                disabled={submitting}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  mode === "exam" ? "border-[#5298E0] bg-[#5298E0]/10" : "border-[#242424] bg-[#080808] hover:border-[#5298E0]/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Timer className="h-4 w-4 text-[#5298E0]" />
                  <span className="text-sm font-bold text-white">Exam Mode</span>
                </div>
                <p className="text-[10px] text-[#909090] leading-relaxed">
                  Timed. No answers shown until submission. Simulates real exam conditions.
                </p>
              </button>
            </div>
          )}
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="University Past Questions"
      />
    </div>
  );
}
