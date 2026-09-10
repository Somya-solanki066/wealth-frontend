"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import DatePicker from "@/components/ui/DatePicker";

const OTHER_OPTION = "__other__";

const ALL_SUBJECT_OPTIONS = [
  { id: "english", label: "Use of English" },
  { id: "biology", label: "Biology" },
  { id: "chemistry", label: "Chemistry" },
  { id: "physics", label: "Physics" },
  { id: "mathematics", label: "Mathematics" },
  { id: "economics", label: "Economics" },
  { id: "government", label: "Government" },
];

type OptionKey = "A" | "B" | "C" | "D";

type JambQuestion = {
  id: string;
  subject: string;
  questionNumber: number;
  questionText: string;
  options: Record<OptionKey, string>;
  topic: string;
  examYear: number;
};

type JambProfile = {
  targetCourseLabel: string;
  targetInstitutionLabel: string;
  targetInstitutionShort: string;
  examDate: string;
  subjects: string[];
  setupComplete: boolean;
};

type WeakArea = { subject: string; subjectLabel: string; topic: string; accuracy: number };

type SubjectScore = {
  subject: string;
  subjectLabel: string;
  correct: number;
  total: number;
  percentage: number;
};

type BreakdownItem = {
  questionId: string;
  questionNumber: number;
  questionText: string;
  subject: string;
  subjectLabel: string;
  topic: string;
  chosen: OptionKey | null;
  correctAnswer: OptionKey;
  isCorrect: boolean;
  explanation: string;
  options: Record<OptionKey, string>;
};

type Phase =
  | "loading"
  | "setup"
  | "home"
  | "instructions"
  | "subject-pick"
  | "topic-pick"
  | "count-pick"
  | "year-pick"
  | "year-subject-pick"
  | "post-utme"
  | "post-utme-years"
  | "exam"
  | "results"
  | "review";

type PracticeMode = "full_mock" | "subject" | "year" | "quick20" | "post_utme";

function formatTimer(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SUBJECT_LABELS: Record<string, string> = {
  english: "Use of English",
  biology: "Biology",
  chemistry: "Chemistry",
  physics: "Physics",
  mathematics: "Mathematics",
  economics: "Economics",
  government: "Government",
};

export default function JambPracticeWorkspace({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [profile, setProfile] = useState<JambProfile | null>(null);
  const [daysToExam, setDaysToExam] = useState<number | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [error, setError] = useState("");

  // Setup form
  const [targetCourse, setTargetCourse] = useState("");
  const [customCourseLabel, setCustomCourseLabel] = useState("");
  const [targetInstitution, setTargetInstitution] = useState("");
  const [customInstitutionLabel, setCustomInstitutionLabel] = useState("");
  const [examDate, setExamDate] = useState("");
  const [setupSubjects, setSetupSubjects] = useState<string[]>([]);
  const [savingSetup, setSavingSetup] = useState(false);

  // Practice selection state
  const [pendingMode, setPendingMode] = useState<PracticeMode>("subject");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [questionCount, setQuestionCount] = useState(20);
  const [topics, setTopics] = useState<string[]>([]);
  const [postUtmeUniversities, setPostUtmeUniversities] = useState<any[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null);
  const [uniSearch, setUniSearch] = useState("");

  // Session state
  const [sessionToken, setSessionToken] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [questions, setQuestions] = useState<JambQuestion[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(3600);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [timerWarning, setTimerWarning] = useState("");
  const submittedRef = useRef(false);
  const startTimeRef = useRef(0);

  // Results
  const [results, setResults] = useState<{
    jambScore: number;
    percentageScore: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalQuestions: number;
    subjectScores: SubjectScore[];
    weakestArea: WeakArea | null;
    breakdown: BreakdownItem[];
    label: string;
    mode: PracticeMode;
  } | null>(null);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [retryConfig, setRetryConfig] = useState<Record<string, unknown> | null>(null);

  const loadHome = useCallback(async () => {
    setError("");
    try {
      const [homeRes, catalogRes] = await Promise.all([
        api.get("/student/jamb/home"),
        api.get("/student/jamb/catalog"),
      ]);
      setCatalog(catalogRes.data);
      const home = homeRes.data;
      setProfile(home.profile);
      setDaysToExam(home.daysToExam);
      setWeakAreas(home.weakAreas || []);
      if (home.setupRequired) {
        setPhase("setup");
        if (catalogRes.data?.courses?.[0]) {
          setTargetCourse(catalogRes.data.courses[0].id);
          setSetupSubjects(catalogRes.data.courses[0].subjects || []);
        }
        if (catalogRes.data?.institutions?.[0]) {
          setTargetInstitution(catalogRes.data.institutions[0].id);
        }
      } else {
        setPhase("home");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load JAMB practice.");
      setPhase("home");
    }
  }, []);

  useEffect(() => {
    loadHome();
  }, [loadHome]);

  useEffect(() => {
    if (!targetCourse || targetCourse === OTHER_OPTION || !catalog?.courses) return;
    const course = catalog.courses.find((c: any) => c.id === targetCourse);
    if (course) setSetupSubjects(course.subjects || []);
  }, [targetCourse, catalog]);

  const toggleSetupSubject = (id: string) => {
    setSetupSubjects((prev) => {
      if (id === "english" && prev.includes(id)) return prev;
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const saveSetup = async () => {
    const courseOk =
      targetCourse &&
      (targetCourse !== OTHER_OPTION || customCourseLabel.trim().length > 0);
    const institutionOk =
      targetInstitution &&
      (targetInstitution !== OTHER_OPTION || customInstitutionLabel.trim().length > 0);
    if (!courseOk || !institutionOk || !examDate) {
      setError("Please fill in all setup fields.");
      return;
    }
    if (targetCourse === OTHER_OPTION) {
      if (setupSubjects.length < 3 || setupSubjects.length > 4) {
        setError("Select 3 or 4 UTME subjects for your custom course.");
        return;
      }
      if (!setupSubjects.includes("english")) {
        setError("Use of English is required.");
        return;
      }
    }
    setSavingSetup(true);
    setError("");
    try {
      const res = await api.post("/student/jamb/profile", {
        targetCourse,
        targetInstitution,
        examDate,
        subjects: setupSubjects,
        customCourseLabel:
          targetCourse === OTHER_OPTION ? customCourseLabel.trim() : undefined,
        customInstitutionLabel:
          targetInstitution === OTHER_OPTION ? customInstitutionLabel.trim() : undefined,
      });
      setProfile(res.data.profile);
      await loadHome();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save setup.");
    } finally {
      setSavingSetup(false);
    }
  };

  const startSession = async (body: Record<string, unknown>) => {
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/student/jamb/start", body);
      setSessionToken(res.data.sessionToken);
      setSessionLabel(res.data.label);
      setQuestions(res.data.questions || []);
      setDurationMinutes(res.data.durationMinutes || 60);
      setTimeLeft((res.data.durationMinutes || 60) * 60);
      startTimeRef.current = Date.now();
      submittedRef.current = false;
      setAnswers({});
      setMarked(new Set());
      setCurrentIndex(0);
      setResults(null);
      setRetryConfig(body);
      setPhase("exam");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start practice.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitExam = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setShowSubmitModal(false);
    try {
      const timeUsedSeconds = Math.max(0, durationMinutes * 60 - timeLeft);
      const res = await api.post("/student/jamb/submit", {
        sessionToken,
        answers,
        markedForReview: Array.from(marked),
        timeUsedSeconds,
      });
      setResults({
        jambScore: res.data.jambScore,
        percentageScore: res.data.percentageScore,
        correctCount: res.data.correctCount,
        incorrectCount: res.data.incorrectCount,
        skippedCount: res.data.skippedCount,
        totalQuestions: res.data.totalQuestions,
        subjectScores: res.data.subjectScores || [],
        weakestArea: res.data.weakestArea,
        breakdown: res.data.breakdown || [],
        label: res.data.label,
        mode: res.data.mode,
      });
      setPhase("results");
      await loadHome();
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Failed to submit exam.");
    } finally {
      setSubmitting(false);
    }
  }, [sessionToken, answers, marked, durationMinutes, timeLeft, loadHome]);

  useEffect(() => {
    if (phase !== "exam") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          submitExam();
          return 0;
        }
        if (prev === 600) setTimerWarning("⚠ 10 minutes remaining");
        else if (prev === 300) setTimerWarning("⚠ 5 minutes remaining");
        else if (prev > 300) setTimerWarning("");
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, submitExam]);

  const loadTopics = async (subject: string) => {
    try {
      const res = await api.get(`/student/jamb/topics/${subject}`);
      setTopics(res.data.topics || []);
    } catch {
      setTopics([]);
    }
  };

  const loadPostUtme = async () => {
    try {
      const res = await api.get("/student/jamb/post-utme/universities");
      setPostUtmeUniversities(res.data.universities || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load universities.");
    }
  };

  const activeSubjects = profile?.subjects || [];
  const current = questions[currentIndex];
  const answeredCount = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const markedCount = marked.size;
  const skippedCount = questions.length - answeredCount;

  const filteredUniversities = postUtmeUniversities.filter((u) =>
    !uniSearch.trim() ||
    u.label.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.shortName.toLowerCase().includes(uniSearch.toLowerCase())
  );

  const practiceWeakTopic = async (area: WeakArea) => {
    const subjectId = area.subject;
    setSelectedSubject(subjectId);
    setSelectedTopic(area.topic);
    setQuestionCount(20);
    await startSession({ mode: "subject", subject: subjectId, topic: area.topic, questionCount: 20 });
  };

  // ─── LOADING ───
  if (phase === "loading") {
    return <p className="text-xs text-[#909090]">Loading JAMB practice…</p>;
  }

  // ─── SETUP ───
  if (phase === "setup") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5298E0]">JAMB UTME Practice</p>
          <h3 className="font-serif text-2xl font-black text-white mt-2">Set Up Your JAMB Practice</h3>
        </div>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <label className="block text-xs text-[#909090]">
            Target Course
            <select
              value={targetCourse}
              onChange={(e) => {
                const v = e.target.value;
                setTargetCourse(v);
                if (v === OTHER_OPTION) {
                  setSetupSubjects((prev) =>
                    prev.includes("english") ? prev : ["english", ...prev].slice(0, 4)
                  );
                }
              }}
              className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-sm text-white"
            >
              {(catalog?.courses || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
              <option value={OTHER_OPTION}>Other — type my course</option>
            </select>
          </label>
          {targetCourse === OTHER_OPTION && (
            <label className="block text-xs text-[#909090]">
              Your course name
              <input
                type="text"
                value={customCourseLabel}
                onChange={(e) => setCustomCourseLabel(e.target.value)}
                placeholder="e.g. Architecture, Biochemistry…"
                className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
          )}

          <label className="block text-xs text-[#909090]">
            Target Institution
            <select
              value={targetInstitution}
              onChange={(e) => setTargetInstitution(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-sm text-white"
            >
              {(catalog?.institutions || []).map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
              <option value={OTHER_OPTION}>Other — type my university</option>
            </select>
          </label>
          {targetInstitution === OTHER_OPTION && (
            <label className="block text-xs text-[#909090]">
              Your university / institution
              <input
                type="text"
                value={customInstitutionLabel}
                onChange={(e) => setCustomInstitutionLabel(e.target.value)}
                placeholder="Type your university name"
                className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
          )}

          <div>
            <p className="mb-1.5 text-xs text-[#909090]">Exam Date</p>
            <DatePicker
              value={examDate}
              onChange={setExamDate}
              accent="blue"
              placeholder="dd-mm-yyyy"
            />
            <p className="mt-1 text-[10px] text-[#606060]">
              Tap anywhere on the field to open the calendar.
            </p>
          </div>

          <div>
            <p className="text-xs text-[#909090] mb-2">
              Your UTME Subjects
              {targetCourse === OTHER_OPTION ? " (pick 3–4, English required)" : ""}
            </p>
            {targetCourse === OTHER_OPTION ? (
              <div className="flex flex-wrap gap-2">
                {ALL_SUBJECT_OPTIONS.map((s) => {
                  const on = setupSubjects.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSetupSubject(s.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${
                        on
                          ? "border-[#5298E0] bg-[#5298E0]/15 text-[#5298E0]"
                          : "border-[#333] text-[#909090]"
                      }`}
                    >
                      {on ? "✓ " : ""}
                      {s.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {setupSubjects.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-sm text-[#52C07A]">
                    <span>✓</span> {SUBJECT_LABELS[s] || s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="button" onClick={saveSetup} isLoading={savingSetup} className="w-full">
            Start Practising
          </Button>
        </div>
      </div>
    );
  }

  // ─── HOME ───
  if (phase === "home") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          {onBack && (
            <button type="button" onClick={onBack} className="text-[#909090] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5298E0]">JAMB Practice</p>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="font-serif text-3xl font-black text-white flex items-center justify-center gap-2">
            {daysToExam !== null ? `${daysToExam} Days to Exam` : "JAMB Home"}
            <Calendar className="h-6 w-6 text-[#5298E0]" />
          </h2>
          {profile && (
            <p className="text-sm text-[#5298E0]">
              {profile.targetCourseLabel} · {profile.targetInstitutionShort} · {activeSubjects.length} Subjects Active
            </p>
          )}
        </div>

        {weakAreas.length > 0 && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-xs font-bold text-red-400 mb-2">⚠ WEAK AREAS — Practice These First</p>
            <div className="space-y-2">
              {weakAreas.map((area) => (
                <button
                  key={`${area.subject}-${area.topic}`}
                  type="button"
                  onClick={() => practiceWeakTopic(area)}
                  className="w-full flex justify-between items-center text-left text-sm text-white hover:text-[#5298E0] transition-colors"
                >
                  <span>{area.topic}</span>
                  <span className="text-red-400 text-xs">{area.accuracy}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="space-y-3">
          {[
            {
              icon: "📚",
              title: "Full Mock JAMB",
              desc: "100 Questions · 100 Mins · All 4 Subjects",
              action: () => { setPendingMode("full_mock"); setPhase("instructions"); },
            },
            {
              icon: "🎯",
              title: "Practice by Subject",
              desc: "Choose Biology, Chemistry, Physics or English",
              action: () => { setPendingMode("subject"); setPhase("subject-pick"); },
            },
            {
              icon: "📅",
              title: "Practice by Year",
              desc: "2000–2024 · 25 years of papers",
              action: () => { setPendingMode("year"); setPhase("year-pick"); },
            },
            {
              icon: "⚡",
              title: "Quick 20 Questions",
              desc: "Random mix · 20 mins · warm up",
              action: () => { setPendingMode("quick20"); setPhase("instructions"); },
            },
            {
              icon: "🎓",
              title: "Post-UTME Practice",
              desc: "University-specific past papers",
              action: async () => { setPendingMode("post_utme"); await loadPostUtme(); setPhase("post-utme"); },
            },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={item.action}
              className="w-full flex items-center gap-4 rounded-2xl border border-[#5298E0]/30 bg-[#0d1117] p-4 text-left hover:border-[#5298E0] transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{item.title}</p>
                <p className="text-[11px] text-[#606060] mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#5298E0]" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── INSTRUCTIONS ───
  if (phase === "instructions") {
    const isFullMock = pendingMode === "full_mock";
    const isQuick = pendingMode === "quick20";
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <button type="button" onClick={() => setPhase("home")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[#0d1117] p-6 space-y-4">
          <h3 className="font-serif text-xl font-black text-white text-center">
            {isFullMock ? "FULL MOCK JAMB" : "QUICK 20 QUESTIONS"}
          </h3>
          {isFullMock && (
            <>
              <p className="text-xs text-[#909090]">Subjects:</p>
              <ul className="text-sm text-white space-y-1">
                {activeSubjects.map((s) => (
                  <li key={s}>• {SUBJECT_LABELS[s] || s}</li>
                ))}
              </ul>
              <p className="text-sm text-[#909090]">Questions: <strong className="text-white">100</strong></p>
              <p className="text-sm text-[#909090]">Time: <strong className="text-white">100 minutes</strong></p>
            </>
          )}
          {isQuick && (
            <>
              <p className="text-sm text-[#909090]">Questions: <strong className="text-white">20</strong></p>
              <p className="text-sm text-[#909090]">Time: <strong className="text-white">20 minutes</strong></p>
              <p className="text-xs text-[#606060]">Random mix from your active subjects.</p>
            </>
          )}
          <p className="text-xs text-red-400/80 italic">Once the timer starts, it cannot be paused.</p>
          <Button
            type="button"
            onClick={() => startSession({ mode: pendingMode })}
            isLoading={submitting}
            className="w-full"
          >
            {isFullMock ? "Start Mock Exam" : "Start Practice"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── SUBJECT PICK ───
  if (phase === "subject-pick") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("home")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-black text-white text-center">Choose Subject</h3>
        <div className="grid grid-cols-2 gap-3">
          {activeSubjects.map((s) => (
            <button
              key={s}
              type="button"
              onClick={async () => {
                setSelectedSubject(s);
                await loadTopics(s);
                setPhase("topic-pick");
              }}
              className="rounded-2xl border border-[#5298E0]/30 bg-[#0d1117] p-5 text-center hover:border-[#5298E0] transition-all"
            >
              <p className="font-bold text-white text-sm">{SUBJECT_LABELS[s] || s}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── TOPIC PICK ───
  if (phase === "topic-pick") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("subject-pick")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-black text-white text-center">
          {SUBJECT_LABELS[selectedSubject] || selectedSubject} Practice
        </h3>
        <p className="text-xs text-[#909090] text-center">What do you want to practise?</p>
        <div className="space-y-2">
          {["all", ...topics].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setSelectedTopic(t); setPhase("count-pick"); }}
              className="w-full flex items-center gap-3 rounded-xl border border-[#242424] bg-[#0d1117] px-4 py-3 text-left text-sm text-white hover:border-[#5298E0]/50"
            >
              <span className="text-[#5298E0]">○</span>
              {t === "all" ? "All Topics" : t}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── COUNT PICK ───
  if (phase === "count-pick") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("topic-pick")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-black text-white text-center">Number of Questions</h3>
        <div className="flex justify-center gap-4">
          {[10, 20, 40].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setQuestionCount(n)}
              className={`w-16 h-16 rounded-2xl border text-lg font-bold transition-all ${
                questionCount === n
                  ? "border-[#5298E0] bg-[#5298E0]/20 text-white"
                  : "border-[#242424] text-[#909090]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <Button
          type="button"
          onClick={() => startSession({
            mode: "subject",
            subject: selectedSubject,
            topic: selectedTopic,
            questionCount,
          })}
          isLoading={submitting}
          className="w-full"
        >
          Start Practice
        </Button>
      </div>
    );
  }

  // ─── YEAR PICK ───
  if (phase === "year-pick") {
    const years = catalog?.years || [];
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("home")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-black text-white text-center">Select Year</h3>
        <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
          {years.map((y: number) => (
            <button
              key={y}
              type="button"
              onClick={() => { setSelectedYear(y); setPhase("year-subject-pick"); }}
              className="rounded-xl border border-[#242424] bg-[#0d1117] py-3 text-sm font-bold text-white hover:border-[#5298E0]"
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── YEAR SUBJECT PICK ───
  if (phase === "year-subject-pick") {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("year-pick")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-black text-white text-center">{selectedYear} — Choose Subject</h3>
        <div className="grid grid-cols-2 gap-3">
          {activeSubjects.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => startSession({ mode: "year", subject: s, year: selectedYear })}
              className="rounded-2xl border border-[#5298E0]/30 bg-[#0d1117] p-5 text-center hover:border-[#5298E0]"
            >
              <p className="font-bold text-white text-sm">{SUBJECT_LABELS[s] || s}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── POST-UTME ───
  if (phase === "post-utme") {
    const targets = filteredUniversities.filter((u) => u.isTarget);
    const others = filteredUniversities.filter((u) => !u.isTarget);
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("home")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5298E0]">Post-UTME Practice</p>
          <h3 className="font-serif text-xl font-black text-white mt-1">Choose Your University</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
          <input
            type="text"
            value={uniSearch}
            onChange={(e) => setUniSearch(e.target.value)}
            placeholder="Search university..."
            className="w-full rounded-xl border border-[#242424] bg-[#080808] pl-10 pr-4 py-2.5 text-sm text-white"
          />
        </div>
        {targets.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase text-[#5298E0] mb-2">Your Targets</p>
            {targets.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => { setSelectedUniversity(u); setPhase("post-utme-years"); }}
                className="w-full rounded-2xl border-2 border-[#5298E0] bg-[#0d1117] p-4 text-left mb-2"
              >
                <p className="font-bold text-white">✓ {u.shortName}</p>
                <p className="text-[11px] text-[#606060]">{u.yearFrom}–{u.yearTo} · {u.papersAvailable} papers available</p>
              </button>
            ))}
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase text-[#606060] mb-2">All Universities</p>
          {others.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => { setSelectedUniversity(u); setPhase("post-utme-years"); }}
              className="w-full flex items-center justify-between rounded-xl border border-[#242424] bg-[#0d1117] p-4 text-left mb-2 hover:border-[#5298E0]/40"
            >
              <div>
                <p className="font-bold text-white text-sm">{u.label}</p>
                <p className="text-[11px] text-[#606060]">{u.location} · {u.yearFrom}–{u.yearTo}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#606060]" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── POST-UTME YEARS ───
  if (phase === "post-utme-years" && selectedUniversity) {
    const years = selectedUniversity.years || [];
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("post-utme")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h3 className="font-serif text-xl font-black text-white text-center">{selectedUniversity.label}</h3>
        <p className="text-xs text-[#909090] text-center">Available Papers</p>
        <div className="grid grid-cols-3 gap-2">
          {years.map((y: number) => (
            <button
              key={y}
              type="button"
              onClick={() => startSession({ mode: "post_utme", universityId: selectedUniversity.id, year: y })}
              className="rounded-xl border border-[#242424] bg-[#0d1117] py-3 text-sm font-bold text-white hover:border-[#5298E0]"
            >
              {y}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── RESULTS ───
  if (phase === "results" && results) {
    const isMock = results.mode === "full_mock";
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[#0d1117] p-6 text-center space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5298E0]">
            {isMock ? "JAMB MOCK RESULT" : "PRACTICE RESULT"}
          </p>
          {isMock ? (
            <>
              <h2 className="font-serif text-5xl font-black text-[#5298E0]">{results.jambScore}</h2>
              <p className="text-sm text-[#909090]">out of 400 · {results.percentageScore >= 60 ? "Good progress!" : "Keep practising!"}</p>
            </>
          ) : (
            <>
              <h2 className="font-serif text-5xl font-black text-[#5298E0]">{results.percentageScore}%</h2>
              <p className="text-sm text-[#909090]">
                {results.correctCount} correct · {results.incorrectCount} wrong · {results.skippedCount} skipped
              </p>
            </>
          )}
        </div>

        {results.subjectScores.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {results.subjectScores.map((s) => (
              <div key={s.subject} className="rounded-xl border border-[#242424] bg-[#161616] p-4 text-center">
                <p className="font-serif text-2xl font-black text-[#5298E0]">{s.percentage}%</p>
                <p className="text-xs text-[#909090] mt-1">{s.subjectLabel}</p>
              </div>
            ))}
          </div>
        )}

        {results.weakestArea && (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4">
            <p className="text-xs font-bold text-red-400 mb-1">⚠ WEAKEST AREA</p>
            <p className="text-sm text-white">
              {results.weakestArea.subjectLabel} — {results.weakestArea.topic} ({results.weakestArea.accuracy}%)
            </p>
            <p className="text-[11px] text-[#606060] mt-1">Practise more questions in this topic.</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => { setReviewIndex(0); setPhase("review"); }} className="flex-1">
            <BarChart3 className="h-4 w-4 mr-1.5 inline" /> Full Review
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (retryConfig) startSession(retryConfig);
              else setPhase("home");
            }}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-1.5 inline" /> Try Again
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={() => setPhase("home")} className="w-full">
          Back to JAMB Home
        </Button>
      </div>
    );
  }

  // ─── REVIEW ───
  if (phase === "review" && results) {
    const item = results.breakdown[reviewIndex];
    if (!item) { setPhase("results"); return null; }
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <button type="button" onClick={() => setPhase("results")} className="text-[#909090] hover:text-white flex items-center gap-2 text-xs">
          <ArrowLeft className="h-4 w-4" /> Back to Results
        </button>
        <p className="text-[10px] font-bold uppercase text-[#5298E0]">
          Question {reviewIndex + 1} of {results.breakdown.length}
        </p>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <p className="text-sm text-white leading-relaxed">{item.questionText}</p>
          <div className="space-y-2 text-sm">
            <p className={item.isCorrect ? "text-[#52C07A]" : "text-red-400"}>
              Your answer: {item.chosen || "—"} {item.isCorrect ? "✓" : "✗"}
            </p>
            {!item.isCorrect && (
              <p className="text-[#52C07A]">Correct answer: {item.correctAnswer} ✓</p>
            )}
          </div>
          <div className="border-t border-[#242424] pt-3">
            <p className="text-xs text-[#909090] mb-1">Explanation</p>
            <p className="text-sm text-[#C0C0C0] leading-relaxed">{item.explanation}</p>
          </div>
          <p className="text-[11px] text-[#606060]">Topic: {item.topic} · {item.subjectLabel}</p>
          {!item.isCorrect && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => practiceWeakTopic({
                subject: item.subject,
                subjectLabel: item.subjectLabel,
                topic: item.topic,
                accuracy: 0,
              })}
            >
              Practice This Topic
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}>
            ← Previous
          </Button>
          <Button
            type="button"
            disabled={reviewIndex >= results.breakdown.length - 1}
            onClick={() => setReviewIndex((i) => i + 1)}
            className="flex-1"
          >
            Next →
          </Button>
        </div>
      </div>
    );
  }

  // ─── CBT EXAM ───
  const subjectLabel = current
    ? SUBJECT_LABELS[current.subject] || current.subject
    : "";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Leave this exam? Progress will be lost.")) setPhase("home");
          }}
          className="text-[#909090] hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-xs text-[#909090]">
          Q {currentIndex + 1} of {questions.length}
          {current && <> · <span className="text-[#5298E0]">{subjectLabel}</span></>}
        </p>
        <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-bold tabular-nums ${
          timeLeft < 300 ? "border-red-900/50 text-red-400" : "border-[#242424] text-[#5298E0]"
        }`}>
          <Clock className="h-3.5 w-3.5" />
          {formatTimer(timeLeft)}
        </div>
      </div>

      {timerWarning && (
        <p className="text-xs text-red-400 text-center font-bold animate-pulse">{timerWarning}</p>
      )}

      {/* Question Map */}
      <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#606060] mb-2">Question Map</p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((qn, idx) => {
            const answered = Boolean(answers[qn.id]);
            const isCurrent = idx === currentIndex;
            const isMarked = marked.has(qn.id);
            return (
              <button
                key={qn.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                  isCurrent
                    ? "bg-[#5298E0] text-white"
                    : isMarked
                      ? "bg-yellow-900/40 border border-yellow-600/60 text-yellow-400"
                      : answered
                        ? "bg-[#52C07A]/20 border border-[#52C07A]/40 text-[#52C07A]"
                        : "border border-[#242424] text-[#606060] bg-[#080808]"
                }`}
              >
                {qn.questionNumber}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-[#606060]">
          <span>🟩 Answered</span>
          <span>🟨 Marked</span>
          <span>🟦 Current</span>
          <span>⬜ Skipped</span>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {current && (
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <p className="text-sm leading-relaxed text-[#F0EBE0]">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => {
              const selected = answers[current.id] === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: key }))}
                  className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    selected
                      ? "border-[#5298E0] bg-[rgba(82,152,224,0.15)] text-white"
                      : "border-[#242424] bg-[#080808] text-[#F0EBE0] hover:border-[#5298E0]/40"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    selected ? "bg-[#5298E0] text-white" : "bg-[#161616] text-[#909090]"
                  }`}>
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
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="text-xs text-[#909090] hover:text-white disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              type="button"
              onClick={() => {
                setMarked((prev) => {
                  const next = new Set(prev);
                  if (next.has(current.id)) next.delete(current.id);
                  else next.add(current.id);
                  return next;
                });
              }}
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                marked.has(current.id) ? "text-yellow-400" : "text-[#909090]"
              }`}
            >
              <Star className="h-3.5 w-3.5" /> Mark
            </button>
            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="text-xs font-bold text-[#5298E0] hover:text-white"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="text-xs font-bold text-[#5298E0] hover:text-white"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowSubmitModal(true)}
          className="text-xs text-[#606060] hover:text-[#5298E0] underline"
        >
          Submit Exam Early
        </button>
      </div>

      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Exam?">
        <div className="space-y-4 text-sm">
          <div className="space-y-1 text-[#909090]">
            <p>Answered: <strong className="text-white">{answeredCount}</strong></p>
            <p>Unanswered: <strong className="text-white">{skippedCount}</strong></p>
            <p>Marked for Review: <strong className="text-white">{markedCount}</strong></p>
            {timeLeft > 0 && (
              <p className="text-[#5298E0]">You still have {formatTimer(timeLeft)} remaining.</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setShowSubmitModal(false)} className="flex-1">
              Continue Exam
            </Button>
            <Button type="button" onClick={submitExam} isLoading={submitting} className="flex-1">
              Submit Anyway
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
