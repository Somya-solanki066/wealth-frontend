"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock,
  GraduationCap,
  Pill,
  RefreshCw,
  Stethoscope,
  Syringe,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type OptionKey = "A" | "B" | "C" | "D";
type HubView = "home" | "setup" | "drug-calc" | "exams" | "exam-detail" | "clinical" | "practice" | "results" | "review";
type DrugCalcTab = "iv-rate" | "dosage" | "reconstitution" | "paediatric";

type CourseProgress = {
  courseId: string;
  courseName: string;
  topicId: string;
  subtopics: string[];
  attempted: number;
  correct: number;
  totalQuestions: number;
  accuracy: number;
  progress: number;
};

type ProfessionalExam = {
  id: string;
  name: string;
  description: string;
  access: "free" | "premium" | "premium_only";
  topicId: string;
};

type Question = {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Record<OptionKey, string>;
  scenario?: string;
};

function progressColor(p: number) {
  if (p >= 60) return "#52C07A";
  if (p >= 30) return "#E8B84B";
  return "#E85B5B";
}

function DrugCalculator({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<DrugCalcTab>("iv-rate");
  const [result, setResult] = useState<{ result: string; formula?: string; secondary?: string; disclaimer?: string } | null>(null);
  const [error, setError] = useState("");

  const [ivVolume, setIvVolume] = useState("500");
  const [ivHours, setIvHours] = useState("8");
  const [dropFactor, setDropFactor] = useState("20");

  const [orderedDose, setOrderedDose] = useState("");
  const [availableDose, setAvailableDose] = useState("");
  const [availableVolume, setAvailableVolume] = useState("");

  const [drugAmount, setDrugAmount] = useState("");
  const [diluentVolume, setDiluentVolume] = useState("");

  const [weight, setWeight] = useState("");
  const [dosePerKg, setDosePerKg] = useState("");
  const [frequency, setFrequency] = useState("1");
  const [maxDose, setMaxDose] = useState("");

  const calculate = async () => {
    setError("");
    setResult(null);
    const params: Record<string, number> = {};
    if (tab === "iv-rate") {
      params.volume = parseFloat(ivVolume);
      params.hours = parseFloat(ivHours);
      params.dropFactor = parseFloat(dropFactor);
    } else if (tab === "dosage") {
      params.orderedDose = parseFloat(orderedDose);
      params.availableDose = parseFloat(availableDose);
      params.availableVolume = parseFloat(availableVolume);
    } else if (tab === "reconstitution") {
      params.drugAmount = parseFloat(drugAmount);
      params.diluentVolume = parseFloat(diluentVolume);
    } else {
      params.weight = parseFloat(weight);
      params.dosePerKg = parseFloat(dosePerKg);
      params.frequency = parseFloat(frequency);
      if (maxDose) params.maxDose = parseFloat(maxDose);
    }
    try {
      const res = await api.post("/student/nursing/drug-calc", { type: tab, params });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Calculation failed.");
    }
  };

  const tabs: { id: DrugCalcTab; label: string }[] = [
    { id: "iv-rate", label: "IV Rate" },
    { id: "dosage", label: "Dosage" },
    { id: "reconstitution", label: "Reconstitution" },
    { id: "paediatric", label: "Paediatric" },
  ];

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <button type="button" onClick={onBack} className="text-xs text-[#909090] flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Nursing Hub
      </button>
      <div className="text-center">
        <Pill className="h-8 w-8 text-[#5298E0] mx-auto mb-2" />
        <h3 className="font-serif text-xl font-bold text-white">Drug Calculator</h3>
        <p className="text-[10px] text-[#606060] mt-1">Unique to Ink2Wealth — deterministic clinical calculations</p>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setResult(null); setError(""); }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${
              tab === t.id ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#909090]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
        {tab === "iv-rate" && (
          <>
            <label className="block text-xs text-[#909090]">Volume to Infuse (mL)<input type="number" value={ivVolume} onChange={(e) => setIvVolume(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Time (hours)<input type="number" value={ivHours} onChange={(e) => setIvHours(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Drop Factor (gtts/mL)<input type="number" value={dropFactor} onChange={(e) => setDropFactor(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
          </>
        )}
        {tab === "dosage" && (
          <>
            <label className="block text-xs text-[#909090]">Ordered Dose (mg)<input type="number" value={orderedDose} onChange={(e) => setOrderedDose(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Available Dose (mg)<input type="number" value={availableDose} onChange={(e) => setAvailableDose(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Available Volume (mL)<input type="number" value={availableVolume} onChange={(e) => setAvailableVolume(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
          </>
        )}
        {tab === "reconstitution" && (
          <>
            <label className="block text-xs text-[#909090]">Drug Amount (mg)<input type="number" value={drugAmount} onChange={(e) => setDrugAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Diluent Volume (mL)<input type="number" value={diluentVolume} onChange={(e) => setDiluentVolume(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
          </>
        )}
        {tab === "paediatric" && (
          <>
            <label className="block text-xs text-[#909090]">Weight (kg)<input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Prescribed Dose (mg/kg)<input type="number" value={dosePerKg} onChange={(e) => setDosePerKg(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Frequency<input type="number" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
            <label className="block text-xs text-[#909090]">Maximum Dose (mg) — optional<input type="number" value={maxDose} onChange={(e) => setMaxDose(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" /></label>
          </>
        )}
        <Button onClick={calculate} className="w-full">Calculate</Button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {result && (
        <div className="rounded-2xl border border-[#52C07A]/40 bg-[#52C07A]/10 p-5 text-center space-y-2">
          <p className="text-[10px] font-bold uppercase text-[#52C07A]">Result</p>
          <p className="font-serif text-4xl font-black text-white">{result.result}</p>
          {result.secondary && <p className="text-sm text-[#909090]">{result.secondary}</p>}
          {result.formula && <p className="text-[10px] text-[#606060] font-mono">{result.formula}</p>}
          {result.disclaimer && <p className="text-[9px] text-[#606060] italic mt-2">{result.disclaimer}</p>}
        </div>
      )}
    </div>
  );
}

export default function NursingHubWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<HubView>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [selectedYear, setSelectedYear] = useState(3);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [weakAreas, setWeakAreas] = useState<CourseProgress[]>([]);
  const [professionalExams, setProfessionalExams] = useState<ProfessionalExam[]>([]);
  const [clinicalTopics, setClinicalTopics] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [years, setYears] = useState<any[]>([]);

  const [setupUni, setSetupUni] = useState("");
  const [setupSchool, setSetupSchool] = useState("School of Nursing");
  const [setupYear, setSetupYear] = useState(3);
  const [savingSetup, setSavingSetup] = useState(false);

  const [activeExam, setActiveExam] = useState<ProfessionalExam | null>(null);
  const [activeCourse, setActiveCourse] = useState<CourseProgress | null>(null);
  const [clinicalTopic, setClinicalTopic] = useState("");

  const [sessionToken, setSessionToken] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [practiceType, setPracticeType] = useState<"course" | "clinical" | "exam">("course");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({});
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; rationale: string; topic: string } | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const submittedRef = useRef(false);

  const [results, setResults] = useState<any>(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/student/nursing/home");
      const data = res.data;
      setProfile(data.profile);
      setSetupRequired(data.setupRequired);
      setSelectedYear(data.year || 3);
      setCourses(data.courses || []);
      setOverallProgress(data.overallProgress || 0);
      setWeakAreas(data.weakAreas || []);
      setProfessionalExams(data.professionalExams || []);
      setClinicalTopics(data.clinicalTopics || []);
      setUniversities(data.universities || []);
      setSchools(data.schools || []);
      setYears(data.years || []);
      if (data.setupRequired) setView("setup");
      else setView("home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load Nursing Hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHome(); }, [loadHome]);

  const saveSetup = async () => {
    setSavingSetup(true);
    try {
      await api.post("/student/nursing/profile", { university: setupUni, school: setupSchool, year: setupYear });
      await loadHome();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setSavingSetup(false);
    }
  };

  const startPractice = async (opts: Record<string, unknown>) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/student/nursing/start", opts);
      setSessionToken(res.data.sessionToken);
      setQuestions(res.data.questions || []);
      setAnswers({});
      setAnswered(new Set());
      setFeedback(null);
      setCurrentIndex(0);
      submittedRef.current = false;
      setTimeLeft((res.data.durationMinutes || 30) * 60);
      setPracticeType((opts.questionType as string) === "clinical" ? "clinical" : opts.examId ? "exam" : "course");
      setView("practice");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      else setError(err.response?.data?.error || "Failed to start practice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClinicalAnswer = async (key: OptionKey) => {
    const q = questions[currentIndex];
    if (!q || answered.has(q.id)) return;
    setAnswers((p) => ({ ...p, [q.id]: key }));
    try {
      const res = await api.post("/student/nursing/check-answer", { questionId: q.id, chosen: key });
      setFeedback(res.data);
      setAnswered((p) => new Set(p).add(q.id));
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to check answer.");
    }
  };

  const submitPractice = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post("/student/nursing/submit", { sessionToken, answers });
      setResults(res.data);
      setView("results");
      await loadHome();
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [sessionToken, answers, loadHome]);

  useEffect(() => {
    if (view !== "practice" || practiceType === "clinical") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { window.clearInterval(timer); submitPractice(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view, practiceType, submitPractice]);

  const current = questions[currentIndex];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (loading && view === "home") return <p className="text-xs text-[#909090]">Loading Nursing Hub…</p>;

  if (view === "setup") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <Building2 className="h-10 w-10 text-[#5298E0] mx-auto mb-2" />
          <h3 className="font-serif text-xl font-bold text-white">Nursing Profile Setup</h3>
        </div>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <label className="block text-xs text-[#909090]">University
            <select value={setupUni} onChange={(e) => setSetupUni(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              <option value="">Select university...</option>
              {universities.map((u: any) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#909090]">School / Faculty
            <select value={setupSchool} onChange={(e) => setSetupSchool(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              {schools.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#909090]">Current Year
            <select value={setupYear} onChange={(e) => setSetupYear(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </label>
          <Button onClick={saveSetup} isLoading={savingSetup} className="w-full">Continue</Button>
        </div>
      </div>
    );
  }

  if (view === "drug-calc") return <DrugCalculator onBack={() => setView("home")} />;

  if (view === "results" && results) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[#0d1117] p-6 text-center">
          <p className="text-[10px] font-bold uppercase text-[#5298E0]">Practice Complete</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">{results.percentageScore}%</h3>
          <p className="text-xs text-[#909090] mt-2">{results.correctCount}/{results.totalQuestions} correct</p>
        </div>
        {results.breakdown?.length > 0 && (
          <Button variant="outline" onClick={() => { setReviewIndex(0); setView("review"); }} className="w-full">
            Full Review
          </Button>
        )}
        <Button onClick={() => setView("home")} className="w-full">Back to Nursing Hub</Button>
      </div>
    );
  }

  if (view === "review" && results?.breakdown) {
    const item = results.breakdown[reviewIndex];
    if (!item) { setView("results"); return null; }
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("results")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <p className="text-[10px] text-[#5298E0]">Q{reviewIndex + 1} of {results.breakdown.length}</p>
        {item.scenario && <p className="text-xs text-[#909090] whitespace-pre-wrap bg-[#161616] p-3 rounded-xl">{item.scenario}</p>}
        <p className="text-sm text-white">{item.questionText}</p>
        <p className={item.isCorrect ? "text-[#52C07A] text-sm" : "text-red-400 text-sm"}>Your answer: {item.chosen || "—"} {item.isCorrect ? "✓" : "✗"}</p>
        {!item.isCorrect && <p className="text-[#52C07A] text-sm">Correct: {item.correctAnswer}</p>}
        <p className="text-xs text-[#C0C0C0] leading-relaxed">{item.rationale}</p>
        <div className="flex gap-3">
          <Button variant="outline" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}>← Prev</Button>
          <Button disabled={reviewIndex >= results.breakdown.length - 1} onClick={() => setReviewIndex((i) => i + 1)} className="flex-1">Next →</Button>
        </div>
      </div>
    );
  }

  if (view === "practice" && current) {
    const isClinical = practiceType === "clinical";
    const isLast = currentIndex >= questions.length - 1;
    const hasAnswered = answered.has(current.id);

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setView("home")} className="text-[#909090]"><ArrowLeft className="h-5 w-5" /></button>
          <p className="text-xs text-[#909090]">
            {isClinical ? "Clinical Scenario" : "Practice"} · Q{currentIndex + 1}/{questions.length}
          </p>
          {!isClinical && (
            <div className="flex items-center gap-1 text-sm font-bold text-[#5298E0] tabular-nums">
              <Clock className="h-3.5 w-3.5" /> {formatTime(timeLeft)}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          {current.scenario && (
            <div className="rounded-xl bg-[#161616] border border-[#242424] p-4 text-xs text-[#C0C0C0] whitespace-pre-wrap leading-relaxed">
              {current.scenario}
            </div>
          )}
          <p className="text-sm text-[#F0EBE0] leading-relaxed">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
              <button
                key={key}
                type="button"
                disabled={isClinical && hasAnswered}
                onClick={() => isClinical ? handleClinicalAnswer(key) : setAnswers((p) => ({ ...p, [current.id]: key }))}
                className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm ${
                  answers[current.id] === key
                    ? feedback?.isCorrect ? "border-[#52C07A] bg-[#52C07A]/10" : feedback && !feedback.isCorrect ? "border-red-500 bg-red-950/20" : "border-[#5298E0] bg-[#5298E0]/10"
                    : "border-[#242424] bg-[#080808] hover:border-[#5298E0]/40"
                }`}
              >
                <span className="font-bold text-[#5298E0] shrink-0">{key}.</span>
                <span>{current.options[key]}</span>
              </button>
            ))}
          </div>

          {isClinical && feedback && hasAnswered && (
            <div className={`rounded-xl p-4 text-sm ${feedback.isCorrect ? "bg-[#52C07A]/10 border border-[#52C07A]/30" : "bg-red-950/20 border border-red-900/30"}`}>
              <p className="font-bold text-white mb-1">{feedback.isCorrect ? `✓ Correct — ${feedback.correctAnswer}` : `✗ Correct — ${feedback.correctAnswer}`}</p>
              <p className="text-[#C0C0C0] leading-relaxed">{feedback.rationale}</p>
              <p className="text-[10px] text-[#606060] mt-2">Topic: {feedback.topic}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {isClinical ? (
              hasAnswered && (
                <Button onClick={() => { if (isLast) submitPractice(); else { setCurrentIndex((i) => i + 1); setFeedback(null); } }} isLoading={submitting && isLast}>
                  {isLast ? "Complete" : "Next →"}
                </Button>
              )
            ) : (
              <>
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>Previous</Button>
                {isLast ? (
                  <Button onClick={submitPractice} isLoading={submitting}>Submit</Button>
                ) : (
                  <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next →</Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "exams") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("home")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[#5298E0]" /> Professional Exams</h3>
        <div className="space-y-3">
          {professionalExams.map((exam) => (
            <button
              key={exam.id}
              type="button"
              onClick={() => { setActiveExam(exam); setView("exam-detail"); }}
              className={`w-full text-left rounded-2xl border p-4 ${
                exam.access === "free" ? "border-[#52C07A]/40 bg-[#52C07A]/5"
                  : exam.access === "premium_only" ? "border-yellow-600/40 bg-yellow-950/10"
                  : "border-[#5298E0]/30 bg-[#0d1117]"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-white text-sm">{exam.name}</p>
                <span className={`text-[9px] font-bold shrink-0 ${exam.access === "free" ? "text-[#52C07A]" : "text-yellow-500"}`}>
                  {exam.access === "free" ? "FREE" : exam.access === "premium_only" ? "PREMIUM ONLY" : "PREMIUM"}
                </span>
              </div>
              <p className="text-[11px] text-[#606060] mt-1">{exam.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === "exam-detail" && activeExam) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("exams")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white">{activeExam.name}</h3>
        <p className="text-xs text-[#909090]">{activeExam.description}</p>
        <div className="space-y-2">
          <Button onClick={() => startPractice({ examId: activeExam.id, topicId: activeExam.topicId, year: selectedYear, limit: 20 })} isLoading={submitting} className="w-full">Start Practice</Button>
          <Button variant="outline" onClick={() => startPractice({ examId: activeExam.id, topicId: activeExam.topicId, year: selectedYear, limit: 40 })} className="w-full">Mock Exam (40 Q)</Button>
        </div>
      </div>
    );
  }

  if (view === "clinical") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("home")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2"><Stethoscope className="h-5 w-5 text-[#5298E0]" /> Clinical Scenarios</h3>
        <p className="text-xs text-[#909090]">Practice clinical reasoning with real patient scenarios</p>
        <div className="space-y-2">
          {clinicalTopics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => startPractice({ topicId: "medsurg-ii", year: selectedYear, questionType: "clinical", clinicalTopic: t.id, limit: 10 })}
              className="w-full flex justify-between items-center rounded-xl border border-[#242424] bg-[#0d1117] px-4 py-3 text-left hover:border-[#5298E0]/40"
            >
              <span className="text-sm font-bold text-white">{t.name}</span>
              <ChevronRight className="h-4 w-4 text-[#606060]" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#5298E0]" /> Nursing Hub
          </h3>
          {profile && (
            <p className="text-xs text-[#5298E0] mt-0.5">
              Year {profile.year} · {profile.universityLabel} · {profile.school}
            </p>
          )}
        </div>
        {onBack && <Button variant="outline" size="sm" onClick={onBack}>All Tools</Button>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 1: My Progress */}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4 lg:col-span-1">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#909090]">Your Progress</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="font-serif text-3xl font-black text-white">{overallProgress}%</p>
              <div className="flex-1 h-2 bg-[#242424] rounded-full overflow-hidden">
                <div className="h-full bg-[#5298E0] rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {years.map((y: any) => (
              <button
                key={y.year}
                type="button"
                onClick={async () => {
                  setSelectedYear(y.year);
                  const res = await api.get(`/student/nursing/home?year=${y.year}`);
                  setCourses(res.data.courses || []);
                  setOverallProgress(res.data.overallProgress || 0);
                  setWeakAreas(res.data.weakAreas || []);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  selectedYear === y.year ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#606060]"
                }`}
              >
                {y.label}{selectedYear === y.year ? " ✓" : ""}
              </button>
            ))}
          </div>

          {weakAreas.length > 0 && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
              <p className="text-[10px] font-bold text-red-400 mb-2">⚠ NEEDS ATTENTION</p>
              {weakAreas.map((c) => (
                <button
                  key={c.courseId}
                  type="button"
                  onClick={() => { setActiveCourse(c); startPractice({ topicId: c.topicId, year: selectedYear, courseId: c.courseId, limit: 20 }); }}
                  className="w-full flex justify-between text-xs text-white hover:text-[#5298E0] py-1"
                >
                  <span>{c.courseName}</span>
                  <span className="text-red-400">{c.progress}%</span>
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] font-bold uppercase text-[#606060]">Year {selectedYear} Courses</p>
          <div className="space-y-3">
            {courses.map((c) => (
              <button
                key={c.courseId}
                type="button"
                onClick={() => { setActiveCourse(c); startPractice({ topicId: c.topicId, year: selectedYear, courseId: c.courseId, limit: 20 }); }}
                className="w-full text-left rounded-xl border border-[#242424] bg-[#080808] p-3 hover:border-[#5298E0]/40 transition-all"
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-white">{c.courseName}</p>
                  <span className="text-xs font-bold" style={{ color: progressColor(c.progress) }}>{c.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#242424] rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${c.progress}%`, background: progressColor(c.progress) }} />
                </div>
                <p className="text-[10px] text-[#606060]">{c.subtopics.join(" · ")}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Panel 2: Drug Calculator */}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-[#5298E0]" />
            <p className="font-bold text-white text-sm">Drug Calculator</p>
          </div>
          <p className="text-[10px] text-[#606060]">IV Rate · Dosage · Reconstitution · Paediatric</p>
          <p className="text-[10px] text-[#5298E0] italic">Unique to Ink2Wealth — no other app has this</p>
          <Button onClick={() => setView("drug-calc")} className="w-full">Open Drug Calculator</Button>
        </div>

        {/* Panel 3: Professional Exams */}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[#5298E0]" />
            <p className="font-bold text-white text-sm">Professional Exam Prep</p>
          </div>
          <div className="space-y-2">
            {professionalExams.slice(0, 4).map((exam) => (
              <div key={exam.id} className="flex justify-between items-center text-xs">
                <span className="text-[#C0C0C0] truncate">{exam.name}</span>
                <span className={`font-bold shrink-0 ml-2 ${exam.access === "free" ? "text-[#52C07A]" : "text-yellow-500"}`}>
                  {exam.access === "free" ? "FREE" : "PREMIUM"}
                </span>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setView("exams")} className="w-full">View All Exams</Button>
        </div>

        {/* Panel 4: Clinical Scenarios */}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-[#5298E0]" />
            <p className="font-bold text-white text-sm">Clinical Scenario Q</p>
          </div>
          <p className="text-[10px] text-[#606060]">MedSurg · Cardiovascular · Respiratory · Emergency</p>
          <div className="rounded-xl bg-[#161616] border border-[#242424] p-3 text-[10px] text-[#909090] leading-relaxed">
            A 52-year-old male with crushing chest pain... ECG shows ST elevation. Practice your clinical reasoning.
          </div>
          <Button variant="outline" onClick={() => setView("clinical")} className="w-full">Practice Clinical Scenarios</Button>
        </div>
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} featureName="Nursing Hub Premium" />
    </div>
  );
}
