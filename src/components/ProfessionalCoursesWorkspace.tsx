"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Globe,
  Lock,
  Search,
  Trophy,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type OptionKey = "A" | "B" | "C" | "D";
type HubView = "home" | "catalog" | "course-hub" | "setup" | "practice" | "results" | "review";

type CourseCard = {
  id: string;
  name: string;
  degree: string;
  icon: string;
  category: string;
  durationYears: number;
  highlights: string[];
  description: string;
  licensingPrep: string | null;
};

type SubjectProgress = {
  subjectId: string;
  subjectName: string;
  subtopics: string[];
  access: "free" | "premium";
  progress: number;
};

const CATEGORY_FILTERS = [
  { id: "all", label: "All" },
  { id: "health", label: "Health" },
  { id: "law-social", label: "Law & Social" },
  { id: "business", label: "Business" },
  { id: "science-engineering", label: "Science & Eng." },
  { id: "arts-education", label: "Arts & Education" },
];

function progressColor(p: number) {
  if (p >= 60) return "#52C07A";
  if (p >= 30) return "#E8B84B";
  return "#E85B5B";
}

export default function ProfessionalCoursesWorkspace({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<HubView>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallSubject, setPaywallSubject] = useState("");

  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any>(null);
  const [courseHub, setCourseHub] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);

  const [catalogCourses, setCatalogCourses] = useState<CourseCard[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [selectedYearOrLevel, setSelectedYearOrLevel] = useState(4);
  const [selectedLawCategory, setSelectedLawCategory] = useState("core-courses");
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [licensingPrep, setLicensingPrep] = useState<any>(null);
  const [lawCategories, setLawCategories] = useState<any[]>([]);

  const [setupCourseId, setSetupCourseId] = useState("");
  const [setupInstitution, setSetupInstitution] = useState("");
  const [setupYear, setSetupYear] = useState(4);
  const [setupLevel, setSetupLevel] = useState(500);
  const [savingSetup, setSavingSetup] = useState(false);

  const [sessionToken, setSessionToken] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<SubjectProgress | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const submittedRef = useRef(false);
  const [results, setResults] = useState<any>(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/student/professional/home");
      const data = res.data;
      setProfile(data.profile);
      setCategories(data.categories || []);
      setFeatured(data.featured);
      setCourseHub(data.courseHub);
      setInstitutions(data.institutions || []);
      setTotalCourses(data.totalCourses || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load Professional Hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalog = useCallback(async (q: string, cat: string) => {
    try {
      const res = await api.get(`/student/professional/catalog?q=${encodeURIComponent(q)}&category=${cat}`);
      setCatalogCourses(res.data.courses || []);
    } catch {
      setCatalogCourses([]);
    }
  }, []);

  const loadCourseHub = useCallback(async (courseId: string, yearOrLevel: number, category?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ yearOrLevel: String(yearOrLevel) });
      if (category) params.set("category", category);
      const res = await api.get(`/student/professional/courses/${courseId}/hub?${params}`);
      setActiveCourse(res.data.course);
      setSubjects(res.data.subjects || []);
      setOverallProgress(res.data.overallProgress || 0);
      setLicensingPrep(res.data.licensingPrep);
      setLawCategories(res.data.lawCategories || []);
      setView("course-hub");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load course hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHome(); }, [loadHome]);
  useEffect(() => { if (view === "catalog") loadCatalog(searchQuery, categoryFilter); }, [view, searchQuery, categoryFilter, loadCatalog]);

  const openCourse = async (course: CourseCard) => {
    setActiveCourse(course);
    setSetupCourseId(course.id);
    const isYear = ["pharmacy", "med-lab-science", "radiography", "physiotherapy", "dentistry", "optometry", "nutrition", "public-health", "environmental-health", "accounting", "finance", "computer-science"].includes(course.id);
    const defaultLevel = isYear ? 4 : 500;
    setSelectedYearOrLevel(defaultLevel);
    if (profile?.courseId === course.id) {
      await loadCourseHub(course.id, profile.currentYear || profile.currentLevel || defaultLevel);
    } else {
      setView("setup");
    }
  };

  const saveSetup = async () => {
    setSavingSetup(true);
    try {
      await api.post("/student/professional/profile", {
        courseId: setupCourseId,
        institution: setupInstitution,
        currentYear: setupYear,
        currentLevel: setupLevel,
      });
      await loadHome();
      await loadCourseHub(setupCourseId, activeCourse?.levelType === "year" ? setupYear : setupLevel);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setSavingSetup(false);
    }
  };

  const startPractice = async (subject: SubjectProgress) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/student/professional/start", { subjectId: subject.subjectId, courseId: activeCourse?.id, limit: 20 });
      setSessionToken(res.data.sessionToken);
      setQuestions(res.data.questions || []);
      setActiveSubject(subject);
      setAnswers({});
      setCurrentIndex(0);
      submittedRef.current = false;
      setTimeLeft((res.data.durationMinutes || 30) * 60);
      setView("practice");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) {
        setPaywallSubject(err.response?.data?.subjectName || subject.subjectName);
        setShowPaywall(true);
      } else setError(err.response?.data?.error || "Failed to start.");
    } finally {
      setSubmitting(false);
    }
  };

  const startLicensingPrep = async () => {
    setSubmitting(true);
    try {
      const res = await api.post("/student/professional/start", {
        licensingPrepId: licensingPrep.id,
        courseId: activeCourse?.id,
        subjectId: `${licensingPrep.id}-practice`,
        limit: 30,
      });
      setSessionToken(res.data.sessionToken);
      setQuestions(res.data.questions || []);
      setActiveSubject(null);
      setAnswers({});
      setCurrentIndex(0);
      submittedRef.current = false;
      setTimeLeft(45 * 60);
      setView("practice");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired) setShowPaywall(true);
      else setError(err.response?.data?.error || "Failed to start.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPractice = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const res = await api.post("/student/professional/submit", { sessionToken, answers });
      setResults(res.data);
      setView("results");
      if (activeCourse) await loadCourseHub(activeCourse.id, selectedYearOrLevel, activeCourse.lawCategories ? selectedLawCategory : undefined);
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [sessionToken, answers, activeCourse, selectedYearOrLevel, selectedLawCategory, loadCourseHub]);

  useEffect(() => {
    if (view !== "practice") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { window.clearInterval(timer); submitPractice(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [view, submitPractice]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const current = questions[currentIndex];
  const hubTitle = activeCourse ? `${activeCourse.name} Hub` : "Professional Hub";

  if (loading && view === "home") return <p className="text-xs text-[#909090]">Loading Professional Hub…</p>;

  if (view === "setup") {
    const course = catalogCourses.find((c) => c.id === setupCourseId) || activeCourse;
    const isYear = course?.id && !["law", "political-science", "international-relations", "mass-communication", "sociology", "psychology"].includes(course.id);
    return (
      <div className="max-w-md mx-auto space-y-6">
        <button type="button" onClick={() => setView("catalog")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div className="text-center">
          <span className="text-4xl">{course?.icon || "📚"}</span>
          <h3 className="font-serif text-xl font-bold text-white mt-2">{course?.name} Setup</h3>
        </div>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <label className="block text-xs text-[#909090]">Institution
            <select value={setupInstitution} onChange={(e) => setSetupInstitution(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              <option value="">Select institution...</option>
              {institutions.map((i: any) => <option key={i.id} value={i.id}>{i.label}</option>)}
            </select>
          </label>
          {isYear ? (
            <label className="block text-xs text-[#909090]">Current Year
              <select value={setupYear} onChange={(e) => setSetupYear(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
                {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </label>
          ) : (
            <label className="block text-xs text-[#909090]">Current Level
              <select value={setupLevel} onChange={(e) => setSetupLevel(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
                {[100, 200, 300, 400, 500].map((l) => <option key={l} value={l}>{l} Level</option>)}
              </select>
            </label>
          )}
          <Button onClick={saveSetup} isLoading={savingSetup} className="w-full">Continue</Button>
        </div>
      </div>
    );
  }

  if (view === "results" && results) {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[#0d1117] p-6 text-center">
          <p className="text-[10px] font-bold uppercase text-[#5298E0]">Practice Complete</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">{results.percentageScore}%</h3>
          <p className="text-xs text-[#909090] mt-2">{results.correctCount}/{results.totalQuestions} correct</p>
        </div>
        {results.breakdown?.length > 0 && (
          <Button variant="outline" onClick={() => { setReviewIndex(0); setView("review"); }} className="w-full">Full Review</Button>
        )}
        <Button onClick={() => setView("course-hub")} className="w-full">Back to {hubTitle}</Button>
      </div>
    );
  }

  if (view === "review" && results?.breakdown) {
    const item = results.breakdown[reviewIndex];
    if (!item) { setView("results"); return null; }
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("results")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <p className="text-sm text-white">{item.questionText}</p>
        <p className={item.isCorrect ? "text-[#52C07A] text-sm" : "text-red-400 text-sm"}>Your answer: {item.chosen || "—"} {item.isCorrect ? "✓" : "✗"}</p>
        {!item.isCorrect && <p className="text-[#52C07A] text-sm">Correct: {item.correctAnswer}</p>}
        <p className="text-xs text-[#C0C0C0]">{item.rationale}</p>
        <div className="flex gap-3">
          <Button variant="outline" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => i - 1)}>← Prev</Button>
          <Button disabled={reviewIndex >= results.breakdown.length - 1} onClick={() => setReviewIndex((i) => i + 1)} className="flex-1">Next →</Button>
        </div>
      </div>
    );
  }

  if (view === "practice" && current) {
    const isLast = currentIndex >= questions.length - 1;
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setView("course-hub")} className="text-[#909090]"><ArrowLeft className="h-5 w-5" /></button>
          <p className="text-xs text-[#909090]">{activeSubject?.subjectName || licensingPrep?.name} · Q{currentIndex + 1}/{questions.length}</p>
          <div className="flex items-center gap-1 text-sm font-bold text-[#5298E0] tabular-nums"><Clock className="h-3.5 w-3.5" /> {formatTime(timeLeft)}</div>
        </div>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <p className="text-sm text-[#F0EBE0] leading-relaxed">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
              <button key={key} type="button" onClick={() => setAnswers((p) => ({ ...p, [current.id]: key }))}
                className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm ${answers[current.id] === key ? "border-[#5298E0] bg-[#5298E0]/10" : "border-[#242424] bg-[#080808] hover:border-[#5298E0]/40"}`}>
                <span className="font-bold text-[#5298E0] shrink-0">{key}.</span><span>{current.options[key]}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>Previous</Button>
            {isLast ? <Button onClick={submitPractice} isLoading={submitting}>Submit</Button> : <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next →</Button>}
          </div>
        </div>
      </div>
    );
  }

  if (view === "course-hub" && activeCourse) {
    const isYear = activeCourse.levelType === "year";
    const levels = activeCourse.levels || (isYear ? [1, 2, 3, 4, 5] : [100, 200, 300, 400, 500]);
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setView("catalog")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> All Courses</button>
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <span>{activeCourse.icon}</span> {activeCourse.name} Hub
          </h3>
          <p className="text-xs text-[#5298E0] mt-0.5">
            {activeCourse.degree}{profile ? ` · ${isYear ? `Year ${selectedYearOrLevel}` : `${selectedYearOrLevel} Level`} · ${profile.institutionLabel}` : ""}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {levels.map((lvl: number) => (
            <button key={lvl} type="button"
              onClick={() => { setSelectedYearOrLevel(lvl); loadCourseHub(activeCourse.id, lvl, lawCategories.length ? selectedLawCategory : undefined); }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedYearOrLevel === lvl ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#606060]"}`}>
              {isYear ? `Yr ${lvl}` : `${lvl}`}{selectedYearOrLevel === lvl ? " ✓" : ""}
            </button>
          ))}
        </div>

        {lawCategories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {lawCategories.map((cat: any) => (
              <button key={cat.id} type="button"
                onClick={() => { setSelectedLawCategory(cat.id); loadCourseHub(activeCourse.id, selectedYearOrLevel, cat.id); }}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedLawCategory === cat.id ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#606060]"}`}>
                {cat.label}{selectedLawCategory === cat.id ? " ✓" : ""}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] font-bold uppercase text-[#606060]">Your Progress — {overallProgress}%</p>
        <div className="space-y-3">
          {subjects.map((s) => (
            <button key={s.subjectId} type="button" onClick={() => startPractice(s)}
              className="w-full text-left rounded-xl border border-[#242424] bg-[#080808] p-4 hover:border-[#5298E0]/40">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{s.subjectName}</p>
                  <p className="text-[10px] text-[#606060] mt-1">{s.subtopics.join(" · ")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold" style={{ color: progressColor(s.progress) }}>{s.progress}%</span>
                  {s.access === "premium" ? (
                    <span className="text-[9px] font-bold text-yellow-500">+PREM</span>
                  ) : (
                    <span className="text-[9px] font-bold text-[#52C07A]">FREE</span>
                  )}
                </div>
              </div>
              <div className="h-1 bg-[#242424] rounded-full overflow-hidden mt-2">
                <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: progressColor(s.progress) }} />
              </div>
            </button>
          ))}
          {!subjects.length && <p className="text-xs text-[#606060]">No subjects for this {isYear ? "year" : "level"} yet.</p>}
        </div>

        {licensingPrep && (
          <div className="rounded-2xl border border-yellow-600/30 bg-yellow-950/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <p className="font-bold text-white text-sm">{licensingPrep.name}</p>
            </div>
            <p className="text-[10px] text-[#909090]">{licensingPrep.description}</p>
            <Button onClick={startLicensingPrep} isLoading={submitting} className="w-full">Start Practice</Button>
          </div>
        )}
      </div>
    );
  }

  if (view === "catalog") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setView("home")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>All Tools</Button>}
        </div>
        <h3 className="font-serif text-xl font-bold text-white">All Courses Available</h3>
        <p className="text-[10px] text-[#606060]">Every course feels like a dedicated app · Year-by-year · Free + Premium</p>

        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses..." className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-white text-sm" />

        <div className="flex gap-2 flex-wrap">
          {CATEGORY_FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setCategoryFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${categoryFilter === f.id ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#606060]"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {catalogCourses.map((c) => (
            <button key={c.id} type="button" onClick={() => openCourse(c)}
              className="text-left rounded-2xl border border-[#242424] bg-[#0d1117] p-4 hover:border-[#5298E0]/40 transition-all">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{c.name}</p>
                  <p className="text-[10px] text-[#5298E0] mt-0.5">{c.degree}</p>
                  <p className="text-[10px] text-[#606060] mt-1">{c.durationYears} years</p>
                  <p className="text-[10px] text-[#909090] mt-1 truncate">{c.highlights.join(" · ")}</p>
                  {c.licensingPrep && <p className="text-[9px] text-yellow-500 mt-1">🏆 {c.licensingPrep}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-[#606060] shrink-0" />
              </div>
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
            <Globe className="h-5 w-5 text-[#5298E0]" /> Professional Courses
          </h3>
          <p className="text-xs text-[#909090] mt-0.5">{totalCourses} courses · Health · Law · Business · Sciences · Arts</p>
        </div>
        {onBack && <Button variant="outline" size="sm" onClick={onBack}>All Tools</Button>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {profile?.setupComplete && courseHub && (
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[#0d1117] p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase text-[#5298E0]">Welcome back</p>
          <p className="font-bold text-white">{courseHub.course?.icon} {courseHub.course?.name} · Year {courseHub.profile?.currentYear || courseHub.profile?.currentLevel}</p>
          <p className="text-xs text-[#909090]">Overall progress: {courseHub.overallProgress}%</p>
          <Button onClick={() => loadCourseHub(profile.courseId, profile.currentYear || profile.currentLevel)} className="w-full">Continue Learning</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const featuredKey = cat.id === "health" ? "health" : cat.id === "law-social" ? "lawSocial" : cat.id === "business" ? "business" : "";
          const courses = featuredKey ? (featured?.[featuredKey] || []) : [];
          if (!courses.length) return null;
          const list = courses;
          return (
            <div key={cat.id} className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase text-[#5298E0]">{cat.icon} {cat.label}</p>
              <div className="space-y-2">
                {list.slice(0, 5).map((c: any) => (
                  <button key={c.id} type="button" onClick={() => openCourse(c)}
                    className="w-full flex justify-between items-center rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-left hover:border-[#5298E0]/40">
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2"><span>{c.icon}</span>{c.name}</p>
                      <p className="text-[10px] text-[#606060] mt-0.5">{c.degree} · {c.durationYears} years</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#606060]" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Button onClick={() => { setView("catalog"); loadCatalog("", "all"); }} className="w-full">
        Browse All {totalCourses} Courses
      </Button>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} featureName={paywallSubject || "Premium Subject"} />
    </div>
  );
}
