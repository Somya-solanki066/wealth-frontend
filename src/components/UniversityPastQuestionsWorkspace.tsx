"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Flag, Lock } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type OptionKey = "A" | "B" | "C" | "D";

type Course = { id: string; code: string; title: string; level: string };
type Department = { id: string; name: string; courses: Course[] };
type Faculty = { id: string; name: string; departments: Department[] };
type University = { id: string; name: string; shortName: string; faculties: Faculty[] };

type YearItem = { year: number; locked: boolean; free: boolean };

type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Record<OptionKey, string>;
};

type Step = "university" | "faculty" | "department" | "course" | "year" | "exam" | "results";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function UniversityPastQuestionsWorkspace({ onBack }: { onBack?: () => void }) {
  const [step, setStep] = useState<Step>("university");
  const [catalog, setCatalog] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uni, setUni] = useState<University | null>(null);
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [years, setYears] = useState<YearItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    percentageScore: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalQuestions: number;
    breakdown: Array<{
      questionNumber: number;
      chosen: OptionKey | null;
      correctAnswer: OptionKey;
      isCorrect: boolean;
    }>;
  } | null>(null);

  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/student/university-past/catalog");
        setCatalog(res.data.universities || []);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load universities.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const breadcrumbs = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [];
    if (uni) items.push({ label: uni.name, onClick: () => { setStep("faculty"); setFaculty(null); setDepartment(null); setCourse(null); } });
    if (faculty) items.push({ label: faculty.name, onClick: () => { setStep("department"); setDepartment(null); setCourse(null); } });
    if (department) items.push({ label: department.name, onClick: () => { setStep("course"); setCourse(null); } });
    if (course) items.push({ label: course.code, onClick: () => setStep("year") });
    if (selectedYear) items.push({ label: String(selectedYear) });
    return items;
  }, [uni, faculty, department, course, selectedYear]);

  const loadYears = async (c: Course) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/university-past/years/${c.id}`);
      setYears(res.data.years || []);
      setCourse(c);
      setExpandedCourseId(c.id);
      setStep("year");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load years.");
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (year: number) => {
    if (!course) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/university-past/questions/${course.id}/${year}`);
      setQuestions(res.data.questions || []);
      setSelectedYear(year);
      setAnswers({});
      setMarked(new Set());
      setCurrentIndex(0);
      setTimeLeft((res.data.durationMinutes || 45) * 60);
      submittedRef.current = false;
      setResults(null);
      setStep("exam");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setError("Older years require a premium plan. 2024, 2023, and 2022 are free.");
      } else {
        setError(err.response?.data?.error || "Failed to load questions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitExam = useCallback(async () => {
    if (!course || !selectedYear || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post("/student/university-past/submit", {
        courseId: course.id,
        year: selectedYear,
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
      setStep("results");
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [course, selectedYear, answers]);

  useEffect(() => {
    if (step !== "exam") return;
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
  }, [step, submitExam]);

  const current = questions[currentIndex];
  const levelLabel = course?.level || "300 Level";

  const resetAll = () => {
    setStep("university");
    setUni(null);
    setFaculty(null);
    setDepartment(null);
    setCourse(null);
    setYears([]);
    setSelectedYear(null);
    setExpandedCourseId(null);
    setResults(null);
    setError("");
  };

  if (loading && !catalog.length) {
    return <p className="text-xs text-[#909090]">Loading university catalog…</p>;
  }

  if (step === "results" && results) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">Practice Complete</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">{results.percentageScore}%</h3>
          <p className="text-xs text-[#909090] mt-2">
            {course?.code} · {selectedYear} · {results.correctCount} correct
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={resetAll}>Browse Another Course</Button>
          {onBack ? <Button type="button" variant="outline" onClick={onBack}>All tools</Button> : null}
        </div>
      </div>
    );
  }

  if (step === "exam" && current) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep("year")} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#242424] bg-[#161616]">
            <ArrowLeft className="h-4 w-4 text-[#909090]" />
          </button>
          <div>
            <p className="text-[10px] text-[#5298E0]">{course?.code} · {selectedYear}</p>
            <h3 className="font-serif text-lg font-bold text-white">{course?.title}</h3>
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-5">
          <div className="flex justify-between">
            <p className="text-xs text-[#909090]">Question {currentIndex + 1} of {questions.length}</p>
            <p className={`text-sm font-bold tabular-nums ${timeLeft < 300 ? "text-red-400" : "text-[#5298E0]"}`}>{formatTime(timeLeft)}</p>
          </div>
          <p className="text-sm text-[#F0EBE0]">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => {
              const selected = answers[current.id] === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAnswers((p) => ({ ...p, [current.id]: key }))}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                    selected ? "border-[#5298E0] bg-[rgba(82,152,224,0.15)]" : "border-[#242424] bg-[#080808]"
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${selected ? "bg-[#5298E0] text-white" : "bg-[#161616] text-[#909090]"}`}>{key}</span>
                  <span>{current.options[key]}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setMarked((p) => { const n = new Set(p); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; })} className="flex items-center gap-2 text-xs text-[#909090]">
              <Flag className="h-3.5 w-3.5" /> Mark for review
            </button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>Previous</Button>
              {currentIndex < questions.length - 1 ? (
                <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>Next →</Button>
              ) : (
                <Button size="sm" onClick={submitExam} disabled={submitting}>{submitting ? "Submitting…" : "Submit"}</Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
          <p className="text-[10px] font-bold uppercase text-[#909090] mb-3">Question map</p>
          <div className="grid grid-cols-8 gap-2">
            {questions.map((qn, idx) => (
              <button
                key={qn.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`aspect-square rounded-lg text-[11px] font-bold ${
                  idx === currentIndex ? "bg-[#5298E0] text-white" : answers[qn.id] ? "border border-[#5298E0] text-[#5298E0]" : "border border-[#242424] text-[#606060]"
                }`}
              >
                {qn.questionNumber}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!onBack ? (
        <div>
          <h3 className="font-serif text-xl font-bold text-white">University Past Questions</h3>
          <p className="text-xs text-[#909090] mt-1">
            20 universities · All faculties — navigate University → Faculty → Department → Course → Year.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {breadcrumbs.length > 0 ? (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] px-4 py-3">
          <div className="flex flex-wrap items-center gap-1 text-xs">
            {breadcrumbs.map((crumb, i) => (
              <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="h-3 w-3 text-[#606060]" /> : null}
                {crumb.onClick && i < breadcrumbs.length - 1 ? (
                  <button type="button" onClick={crumb.onClick} className="font-semibold text-[#5298E0] hover:underline">
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-[#909090]">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {step === "university" && (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase text-[#5298E0] mb-2">Choose university</p>
          {catalog.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => { setUni(u); setStep("faculty"); }}
              className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-left hover:border-[#5298E0]/40"
            >
              <div>
                <p className="text-sm font-bold text-white">{u.name}</p>
                <p className="text-[10px] text-[#606060]">{u.shortName} · {u.faculties.length} faculties</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#606060]" />
            </button>
          ))}
        </div>
      )}

      {step === "faculty" && uni && (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase text-[#5298E0] mb-2">Choose faculty</p>
          {uni.faculties.map((f) => (
            <button key={f.id} type="button" onClick={() => { setFaculty(f); setStep("department"); }} className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-left hover:border-[#5298E0]/40">
              <span className="text-sm font-bold text-white">{f.name}</span>
              <ChevronRight className="h-4 w-4 text-[#606060]" />
            </button>
          ))}
        </div>
      )}

      {step === "department" && faculty && (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-2">
          <p className="text-[10px] font-bold uppercase text-[#5298E0] mb-2">Choose department</p>
          {faculty.departments.map((d) => (
            <button key={d.id} type="button" onClick={() => { setDepartment(d); setStep("course"); }} className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-left hover:border-[#5298E0]/40">
              <span className="text-sm font-bold text-white">{d.name}</span>
              <ChevronRight className="h-4 w-4 text-[#606060]" />
            </button>
          ))}
        </div>
      )}

      {(step === "course" || step === "year") && department && (
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-3">
          <p className="text-sm font-bold text-white">Courses — {levelLabel}</p>
          {department.courses
            .filter((c) => c.level.includes("300") || c.level.includes("400"))
            .map((c) => (
              <div key={c.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => loadYears(c)}
                  className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-left hover:border-[#5298E0]/40"
                >
                  <span className="text-sm text-[#F0EBE0]">
                    <span className="font-bold text-white">{c.code}</span> — {c.title}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#606060]" />
                </button>
                {expandedCourseId === c.id && years.length > 0 ? (
                  <div className="ml-2 rounded-xl border border-[#242424] bg-[#080808] p-3">
                    <p className="text-[10px] text-[#909090] mb-2">Years available for {c.code}</p>
                    <div className="flex flex-wrap gap-2">
                      {years.map((y) => (
                        <button
                          key={y.year}
                          type="button"
                          disabled={y.locked}
                          onClick={() => startExam(y.year)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                            y.locked
                              ? "border border-[#242424] text-[#606060] cursor-not-allowed"
                              : "bg-[#5298E0] text-white hover:opacity-90"
                          }`}
                        >
                          {y.year}
                          {y.locked ? <Lock className="h-3 w-3 text-yellow-500" /> : null}
                        </button>
                      ))}
                    </div>
                    {years.some((y) => y.locked) ? (
                      <p className="text-[10px] text-[#606060] mt-2">
                        3 years free (2024–2022).{" "}
                        <Link href="/pricing" className="text-[#5298E0] underline">Upgrade</Link> for full archive.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      )}

    </div>
  );
}
