"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Clock,
  GraduationCap,
  Search,
  Stethoscope,
  Video,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import PaywallModal from "@/components/ui/PaywallModal";

type OptionKey = "A" | "B" | "C" | "D";
type HubView =
  | "home"
  | "setup"
  | "topic-finder"
  | "topic-detail"
  | "clinical"
  | "practice"
  | "results"
  | "review"
  | "reference"
  | "lab-values"
  | "scoring-tools"
  | "scoring-calc"
  | "drug-reference"
  | "mdcn";

type SubjectProgress = {
  subjectId: string;
  subjectName: string;
  icon: string;
  subtopics: string[];
  attempted: number;
  correct: number;
  totalQuestions: number;
  accuracy: number;
  progress: number;
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

export default function MbbsHubWorkspace({
  onBack,
  onOpenStudyPlanner,
}: {
  onBack?: () => void;
  onOpenStudyPlanner?: () => void;
}) {
  const [view, setView] = useState<HubView>("home");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [selectedPhase, setSelectedPhase] = useState("pre-clinical");
  const [phaseLabel, setPhaseLabel] = useState("Pre-Clinical");
  const [yearLabel, setYearLabel] = useState("Year 1 & 2");
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [weakAreas, setWeakAreas] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [clinicalSpecialties, setClinicalSpecialties] = useState<any[]>([]);
  const [mdcnExams, setMdcnExams] = useState<any[]>([]);
  const [referenceTools, setReferenceTools] = useState<any[]>([]);

  const [setupUni, setSetupUni] = useState("");
  const [setupCollege, setSetupCollege] = useState("College of Medicine");
  const [setupYear, setSetupYear] = useState(2);
  const [setupPhase, setSetupPhase] = useState("pre-clinical");
  const [savingSetup, setSavingSetup] = useState(false);

  const [topicSearch, setTopicSearch] = useState("");
  const [topicResults, setTopicResults] = useState<any[]>([]);
  const [activeTopic, setActiveTopic] = useState<any>(null);
  const [topicDetail, setTopicDetail] = useState<any>(null);
  const [activeSubject, setActiveSubject] = useState<SubjectProgress | null>(null);
  const [clinicalTopic, setClinicalTopic] = useState("");

  const [sessionToken, setSessionToken] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [practiceType, setPracticeType] = useState<"topic" | "clinical" | "subject">("topic");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionKey | null>>({});
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctAnswer: string; rationale: string; topic: string } | null>(null);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);
  const submittedRef = useRef(false);
  const [results, setResults] = useState<any>(null);
  const [reviewIndex, setReviewIndex] = useState(0);

  const [labValues, setLabValues] = useState<any[]>([]);
  const [scoringTools, setScoringTools] = useState<any[]>([]);
  const [activeScoringTool, setActiveScoringTool] = useState<any>(null);
  const [scoringParams, setScoringParams] = useState<Record<string, number>>({});
  const [scoringResult, setScoringResult] = useState<any>(null);
  const [drugQuery, setDrugQuery] = useState("");
  const [drugs, setDrugs] = useState<any[]>([]);

  const loadHome = useCallback(async (phase?: string) => {
    setLoading(true);
    try {
      const url = phase ? `/student/mbbs/home?phase=${phase}` : "/student/mbbs/home";
      const res = await api.get(url);
      const data = res.data;
      setProfile(data.profile);
      setSelectedPhase(data.phaseId || "pre-clinical");
      setPhaseLabel(data.phaseLabel || "Pre-Clinical");
      setYearLabel(data.yearLabel || "");
      setSubjects(data.subjects || []);
      setOverallProgress(data.overallProgress || 0);
      setWeakAreas(data.weakAreas || []);
      setPhases(data.phases || []);
      setUniversities(data.universities || []);
      setColleges(data.colleges || []);
      setClinicalSpecialties(data.clinicalSpecialties || []);
      setMdcnExams(data.mdcnExams || []);
      setReferenceTools(data.referenceTools || []);
      if (data.setupRequired) setView("setup");
      else if (view === "setup") setView("home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load MBBS Hub.");
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => { loadHome(); }, []);

  const saveSetup = async () => {
    setSavingSetup(true);
    try {
      await api.post("/student/mbbs/profile", {
        university: setupUni,
        college: setupCollege,
        year: setupYear,
        phase: setupPhase,
      });
      await loadHome(setupPhase);
      setView("home");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setSavingSetup(false);
    }
  };

  const searchTopics = async (q: string) => {
    setTopicSearch(q);
    try {
      const res = await api.get(`/student/mbbs/topics/search?q=${encodeURIComponent(q)}`);
      setTopicResults(res.data.results || []);
    } catch {
      setTopicResults([]);
    }
  };

  const openTopic = async (topicId: string) => {
    try {
      const res = await api.get(`/student/mbbs/topics/${topicId}`);
      setTopicDetail(res.data);
      setActiveTopic(res.data.topic);
      setView("topic-detail");
    } catch (err: any) {
      setError(err.response?.data?.error || "Topic not found.");
    }
  };

  const startPractice = async (opts: Record<string, unknown>) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/student/mbbs/start", { phaseId: selectedPhase, ...opts });
      setSessionToken(res.data.sessionToken);
      setQuestions(res.data.questions || []);
      setAnswers({});
      setAnswered(new Set());
      setFeedback(null);
      setCurrentIndex(0);
      submittedRef.current = false;
      setTimeLeft((res.data.durationMinutes || 30) * 60);
      setPracticeType(
        opts.questionType === "clinical" ? "clinical" : opts.topicId ? "topic" : "subject"
      );
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
      const res = await api.post("/student/mbbs/check-answer", { questionId: q.id, chosen: key });
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
      const res = await api.post("/student/mbbs/submit", { sessionToken, answers });
      setResults(res.data);
      setView("results");
      await loadHome(selectedPhase);
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [sessionToken, answers, loadHome, selectedPhase]);

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

  const loadLabValues = async () => {
    const res = await api.get("/student/mbbs/reference/lab-values");
    setLabValues(res.data.categories || []);
    setView("lab-values");
  };

  const loadScoringTools = async () => {
    const res = await api.get("/student/mbbs/reference/scoring-tools");
    setScoringTools(res.data.tools || []);
    setView("scoring-tools");
  };

  const calculateScore = async () => {
    try {
      const res = await api.post("/student/mbbs/reference/scoring-tools/calculate", {
        toolId: activeScoringTool?.id,
        params: scoringParams,
      });
      setScoringResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Calculation failed.");
    }
  };

  const searchDrugs = async (q: string) => {
    setDrugQuery(q);
    const res = await api.get(`/student/mbbs/reference/drugs?q=${encodeURIComponent(q)}`);
    setDrugs(res.data.drugs || []);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const current = questions[currentIndex];

  if (loading && view === "home") return <p className="text-xs text-[#909090]">Loading MBBS Hub…</p>;

  if (view === "setup") {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <GraduationCap className="h-10 w-10 text-[#5298E0] mx-auto mb-2" />
          <h3 className="font-serif text-xl font-bold text-white">MBBS Profile Setup</h3>
        </div>
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          <label className="block text-xs text-[#909090]">University
            <select value={setupUni} onChange={(e) => setSetupUni(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              <option value="">Select university...</option>
              {universities.map((u: any) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#909090]">Medical School / College
            <select value={setupCollege} onChange={(e) => setSetupCollege(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              {colleges.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#909090]">Current Year
            <select value={setupYear} onChange={(e) => setSetupYear(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </label>
          <label className="block text-xs text-[#909090]">Current Phase
            <select value={setupPhase} onChange={(e) => setSetupPhase(e.target.value)} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2.5 text-white">
              <option value="pre-clinical">Pre-Clinical</option>
              <option value="para-clinical">Para-Clinical</option>
              <option value="clinical">Clinical</option>
            </select>
          </label>
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
        <Button onClick={() => setView("home")} className="w-full">Back to MBBS Hub</Button>
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
          <p className="text-xs text-[#909090]">{isClinical ? "Clinical Scenario" : "MCQ Practice"} · Q{currentIndex + 1}/{questions.length}</p>
          {!isClinical && <div className="flex items-center gap-1 text-sm font-bold text-[#5298E0] tabular-nums"><Clock className="h-3.5 w-3.5" /> {formatTime(timeLeft)}</div>}
        </div>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
          {current.scenario && <div className="rounded-xl bg-[#161616] border border-[#242424] p-4 text-xs text-[#C0C0C0] whitespace-pre-wrap leading-relaxed">{current.scenario}</div>}
          <p className="text-sm text-[#F0EBE0] leading-relaxed">{current.questionText}</p>
          <div className="space-y-2">
            {(["A", "B", "C", "D"] as OptionKey[]).map((key) => (
              <button key={key} type="button" disabled={isClinical && hasAnswered}
                onClick={() => isClinical ? handleClinicalAnswer(key) : setAnswers((p) => ({ ...p, [current.id]: key }))}
                className={`w-full flex items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm ${answers[current.id] === key ? (feedback?.isCorrect ? "border-[#52C07A] bg-[#52C07A]/10" : feedback && !feedback.isCorrect ? "border-red-500 bg-red-950/20" : "border-[#5298E0] bg-[#5298E0]/10") : "border-[#242424] bg-[#080808] hover:border-[#5298E0]/40"}`}>
                <span className="font-bold text-[#5298E0] shrink-0">{key}.</span><span>{current.options[key]}</span>
              </button>
            ))}
          </div>
          {isClinical && feedback && hasAnswered && (
            <div className={`rounded-xl p-4 text-sm ${feedback.isCorrect ? "bg-[#52C07A]/10 border border-[#52C07A]/30" : "bg-red-950/20 border border-red-900/30"}`}>
              <p className="font-bold text-white mb-1">{feedback.isCorrect ? `✓ Correct — ${feedback.correctAnswer}` : `✗ Correct — ${feedback.correctAnswer}`}</p>
              <p className="text-[#C0C0C0] leading-relaxed">{feedback.rationale}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            {isClinical ? hasAnswered && (
              <Button onClick={() => { if (isLast) submitPractice(); else { setCurrentIndex((i) => i + 1); setFeedback(null); } }} isLoading={submitting && isLast}>
                {isLast ? "Complete" : "Next →"}
              </Button>
            ) : (
              <>
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>Previous</Button>
                {isLast ? <Button onClick={submitPractice} isLoading={submitting}>Submit</Button> : <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next →</Button>}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === "topic-finder") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("home")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2"><Search className="h-5 w-5 text-[#5298E0]" /> Topic + Video Finder</h3>
        <input type="text" value={topicSearch} onChange={(e) => searchTopics(e.target.value)} placeholder="Search topic..." className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-white text-sm" />
        <div className="space-y-2">
          {topicResults.map((t) => (
            <button key={t.id} type="button" onClick={() => openTopic(t.id)} className="w-full text-left rounded-xl border border-[#242424] bg-[#0d1117] px-4 py-3 hover:border-[#5298E0]/40">
              <p className="text-[10px] text-[#5298E0] uppercase">{t.subjectName}{t.parentName ? ` · ${t.parentName}` : ""}</p>
              <p className="text-sm font-bold text-white">{t.name}</p>
              <p className="text-[10px] text-[#606060] mt-1">{t.mcqCount} MCQs · {t.videoCount} videos</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === "topic-detail" && topicDetail) {
    const t = topicDetail.topic;
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("topic-finder")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <div>
          <p className="text-[10px] text-[#5298E0]">{topicDetail.subject?.name}{topicDetail.parent ? ` · ${topicDetail.parent.name}` : ""}</p>
          <h3 className="font-serif text-xl font-bold text-white">{t.name}</h3>
        </div>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase text-[#909090]">MCQ Questions ({topicDetail.mcqCount} available)</p>
          {topicDetail.mcqPreviews?.map((q: any) => (
            <p key={q.id} className="text-xs text-[#C0C0C0] border-b border-[#242424] pb-2">{q.preview}</p>
          ))}
          <Button onClick={() => startPractice({ topicId: t.id, questionType: "mcq", limit: 20 })} isLoading={submitting} className="w-full">Practice MCQs</Button>
        </div>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase text-[#909090] flex items-center gap-2"><Video className="h-3.5 w-3.5" /> Recommended Videos</p>
          {(topicDetail.videos || []).map((v: any, i: number) => (
            <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-[#242424] bg-[#080808] p-3 hover:border-[#5298E0]/40">
              <p className="text-sm font-bold text-white">▶ {v.title}</p>
              <p className="text-[10px] text-[#606060]">{v.channel} · {v.duration} · {v.helpful} helpful</p>
            </a>
          ))}
          {!topicDetail.videos?.length && <p className="text-xs text-[#606060]">Search YouTube for tutorials on this topic.</p>}
        </div>
      </div>
    );
  }

  if (view === "clinical") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("home")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2"><Stethoscope className="h-5 w-5 text-[#5298E0]" /> Clinical Scenarios</h3>
        {clinicalSpecialties.map((spec) => (
          <div key={spec.id} className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4">
            <p className="text-sm font-bold text-white mb-2">{spec.name}</p>
            <div className="space-y-1">
              {spec.topics.map((t: any) => (
                <button key={t.id} type="button" onClick={() => startPractice({ questionType: "clinical", clinicalTopic: t.id, subjectId: spec.id === "medicine" ? "internal-medicine" : spec.id, limit: 10 })}
                  className="w-full flex justify-between items-center rounded-lg px-3 py-2 text-left text-xs text-[#C0C0C0] hover:bg-[#161616]">
                  <span>{t.name}</span><ChevronRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === "lab-values") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("reference")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white">Normal Lab Values</h3>
        {labValues.map((cat) => (
          <div key={cat.id} className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4">
            <p className="text-sm font-bold text-white">{cat.name}</p>
            <p className="text-[9px] text-[#606060] italic mb-3">{cat.source}</p>
            <div className="space-y-1">
              {cat.values.map((v: any) => (
                <div key={v.test} className="flex justify-between text-xs py-1 border-b border-[#242424]">
                  <span className="text-[#C0C0C0]">{v.test}</span>
                  <span className="text-white font-mono">{v.range}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (view === "scoring-tools") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("reference")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white">Clinical Scoring Tools</h3>
        {scoringTools.map((tool) => (
          <button key={tool.id} type="button" onClick={() => { setActiveScoringTool(tool); setScoringParams({}); setScoringResult(null); setView("scoring-calc"); }}
            className="w-full text-left rounded-xl border border-[#242424] bg-[#0d1117] px-4 py-3 hover:border-[#5298E0]/40">
            <p className="text-sm font-bold text-white">{tool.name}</p>
            <p className="text-[10px] text-[#606060]">{tool.description}</p>
          </button>
        ))}
      </div>
    );
  }

  if (view === "scoring-calc" && activeScoringTool) {
    const fields = activeScoringTool.id === "apgar"
      ? [{ key: "appearance", label: "Appearance (0-2)" }, { key: "pulse", label: "Pulse (0-2)" }, { key: "grimace", label: "Grimace (0-2)" }, { key: "activity", label: "Activity (0-2)" }, { key: "respiration", label: "Respiration (0-2)" }]
      : activeScoringTool.id === "gcs"
        ? [{ key: "eye", label: "Eye opening (1-4)" }, { key: "verbal", label: "Verbal (1-5)" }, { key: "motor", label: "Motor (1-6)" }]
        : [{ key: "score", label: "Total criteria met (0-5)" }];
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("scoring-tools")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white">{activeScoringTool.name}</h3>
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          {fields.map((f) => (
            <label key={f.key} className="block text-xs text-[#909090]">{f.label}
              <input type="number" min={0} value={scoringParams[f.key] ?? ""} onChange={(e) => setScoringParams((p) => ({ ...p, [f.key]: Number(e.target.value) }))} className="mt-1 w-full rounded-xl border border-[#242424] bg-[#080808] px-3 py-2 text-white" />
            </label>
          ))}
          <Button onClick={calculateScore} className="w-full">Calculate</Button>
        </div>
        {scoringResult && (
          <div className="rounded-2xl border border-[#52C07A]/40 bg-[#52C07A]/10 p-5 text-center">
            <p className="text-[10px] font-bold uppercase text-[#52C07A]">Result</p>
            <p className="font-serif text-3xl font-black text-white mt-1">{scoringResult.result}</p>
            <p className="text-sm text-[#C0C0C0] mt-2">{scoringResult.interpretation}</p>
            <p className="text-[9px] text-[#606060] italic mt-2">{scoringResult.disclaimer}</p>
          </div>
        )}
      </div>
    );
  }

  if (view === "drug-reference") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("reference")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white">Drug Reference</h3>
        <input type="text" value={drugQuery} onChange={(e) => searchDrugs(e.target.value)} placeholder="Search drug..." className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-white text-sm" />
        {drugs.map((d) => (
          <div key={d.id} className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-2">
            <p className="text-sm font-bold text-white">{d.name}</p>
            <p className="text-[10px] text-[#5298E0]">{d.class}</p>
            <p className="text-xs text-[#C0C0C0]"><strong>Uses:</strong> {d.uses}</p>
            <p className="text-xs text-[#909090]"><strong>Adverse effects:</strong> {d.adverseEffects}</p>
            <p className="text-xs text-[#909090]"><strong>Contraindications:</strong> {d.contraindications}</p>
          </div>
        ))}
      </div>
    );
  }

  if (view === "mdcn") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("reference")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white">MDCN Exam Prep</h3>
        <p className="text-xs text-[#909090]">Medical and Dental Council of Nigeria — Primary and Final MBBS</p>
        {mdcnExams.map((exam) => (
          <div key={exam.id} className="rounded-2xl border border-[#242424] bg-[#0d1117] p-4 space-y-3">
            <div className="flex justify-between items-start">
              <p className="text-sm font-bold text-white">{exam.name}</p>
              <span className={`text-[9px] font-bold ${exam.access === "free" ? "text-[#52C07A]" : "text-yellow-500"}`}>{exam.access === "free" ? "FREE" : "PREMIUM"}</span>
            </div>
            <p className="text-[10px] text-[#606060]">{exam.description}</p>
            <p className="text-[10px] text-[#909090]">{exam.subjects.join(" · ")}</p>
            <Button onClick={() => startPractice({ mdcnExamId: exam.id, questionType: "mcq", limit: 30 })} isLoading={submitting} className="w-full">Start Practice</Button>
          </div>
        ))}
      </div>
    );
  }

  if (view === "reference") {
    return (
      <div className="space-y-5 max-w-lg mx-auto">
        <button type="button" onClick={() => setView("home")} className="text-xs text-[#909090] flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Back</button>
        <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#5298E0]" /> Quick Reference</h3>
        <div className="space-y-2">
          {referenceTools.map((tool) => (
            <button key={tool.id} type="button"
              onClick={() => {
                if (tool.id === "lab-values") loadLabValues();
                else if (tool.id === "scoring-tools") loadScoringTools();
                else if (tool.id === "drug-reference") { searchDrugs(""); setView("drug-reference"); }
                else if (tool.id === "mdcn-prep") setView("mdcn");
                else if (tool.id === "study-planner" && onOpenStudyPlanner) onOpenStudyPlanner();
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-[#242424] bg-[#0d1117] px-4 py-4 text-left hover:border-[#5298E0]/40">
              <span className="text-xl">{tool.icon}</span>
              <span className="text-sm font-bold text-white">{tool.name}</span>
              <ChevronRight className="h-4 w-4 text-[#606060] ml-auto" />
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
            <GraduationCap className="h-5 w-5 text-[#5298E0]" /> MBBS Hub
          </h3>
          {profile && (
            <p className="text-xs text-[#5298E0] mt-0.5">
              Year {profile.year} · {phaseLabel} · {profile.universityLabel} · {profile.college}
            </p>
          )}
        </div>
        {onBack && <Button variant="outline" size="sm" onClick={onBack}>All Tools</Button>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 flex-wrap">
        {phases.map((p: any) => (
          <button key={p.id} type="button"
            onClick={async () => {
              setSelectedPhase(p.id);
              const res = await api.get(`/student/mbbs/home?phase=${p.id}`);
              setSubjects(res.data.subjects || []);
              setOverallProgress(res.data.overallProgress || 0);
              setWeakAreas(res.data.weakAreas || []);
              setPhaseLabel(res.data.phaseLabel);
              setYearLabel(res.data.yearLabel);
            }}
            className={`rounded-full px-4 py-2 text-xs font-bold ${selectedPhase === p.id ? "bg-[#5298E0] text-white" : "border border-[#242424] text-[#606060]"}`}>
            {p.label}{selectedPhase === p.id ? " ✓" : ""}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4 lg:col-span-1">
          <div>
            <p className="text-[10px] font-bold uppercase text-[#909090]">Your Progress — {overallProgress}%</p>
            <div className="h-2 bg-[#242424] rounded-full overflow-hidden mt-2">
              <div className="h-full bg-[#5298E0] rounded-full" style={{ width: `${overallProgress}%` }} />
            </div>
          </div>

          {weakAreas.length > 0 && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-3">
              <p className="text-[10px] font-bold text-red-400 mb-2">⚠ WEAK AREAS</p>
              {weakAreas.map((w) => (
                <button key={`${w.subjectId}-${w.topicId}`} type="button"
                  onClick={() => openTopic(w.topicId)}
                  className="w-full flex justify-between text-xs text-white hover:text-[#5298E0] py-1">
                  <span>{w.subjectName} — {w.topicName}</span>
                  <span className="text-red-400">{w.progress}%</span>
                </button>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => weakAreas[0] && openTopic(weakAreas[0].topicId)}>Practice Weak Topics</Button>
            </div>
          )}

          <p className="text-[10px] font-bold uppercase text-[#606060]">{phaseLabel} — {yearLabel}</p>
          <div className="space-y-3">
            {subjects.map((s) => (
              <button key={s.subjectId} type="button"
                onClick={() => { setActiveSubject(s); startPractice({ subjectId: s.subjectId, questionType: "mcq", limit: 20 }); }}
                className="w-full text-left rounded-xl border border-[#242424] bg-[#080808] p-3 hover:border-[#5298E0]/40">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-white flex items-center gap-2"><span>{s.icon}</span>{s.subjectName}</p>
                  <span className="text-xs font-bold" style={{ color: progressColor(s.progress) }}>{s.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#242424] rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full" style={{ width: `${s.progress}%`, background: progressColor(s.progress) }} />
                </div>
                <p className="text-[10px] text-[#606060]">{s.subtopics.join(" · ")}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <div className="flex items-center gap-2"><Search className="h-5 w-5 text-[#5298E0]" /><p className="font-bold text-white text-sm">Topic + Video Finder</p></div>
          <p className="text-[10px] text-[#606060]">Search topics · Practice MCQs · Watch recommended videos</p>
          <div className="rounded-xl bg-[#161616] border border-[#242424] p-3 text-[10px] text-[#909090]">
            <p className="font-bold text-white text-xs mb-1">Carotid Triangle</p>
            <p>Which structure is NOT found in the carotid triangle? — 42 MCQs available</p>
          </div>
          <Button variant="outline" onClick={() => { searchTopics(""); setView("topic-finder"); }} className="w-full">Open Topic Finder</Button>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <div className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-[#5298E0]" /><p className="font-bold text-white text-sm">Clinical Scenario</p></div>
          <p className="text-[10px] text-[#606060]">Surgery · Medicine · Paediatrics · O&G</p>
          <div className="rounded-xl bg-[#161616] border border-[#242424] p-3 text-[10px] text-[#909090] leading-relaxed">
            A 6-hour-old neonate with bile-stained vomiting... double-bubble sign on X-ray.
          </div>
          <Button variant="outline" onClick={() => setView("clinical")} className="w-full">Practice Clinical Scenarios</Button>
        </div>

        <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
          <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#5298E0]" /><p className="font-bold text-white text-sm">Quick Reference</p></div>
          <div className="space-y-1 text-xs text-[#C0C0C0]">
            <p>📊 Normal Lab Values</p>
            <p>⚖️ Clinical Scoring Tools</p>
            <p>💊 Drug Reference</p>
            <p>🏆 MDCN Exam Prep</p>
            <p>📅 Study Planner</p>
          </div>
          <Button variant="outline" onClick={() => setView("reference")} className="w-full">Open Quick Reference</Button>
        </div>
      </div>

      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} featureName="MBBS Hub Premium" />
    </div>
  );
}
