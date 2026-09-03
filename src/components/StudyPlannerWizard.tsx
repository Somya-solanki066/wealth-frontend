"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Plus, Trash2 } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  CLASS_BY_LEVEL,
  COMMITMENTS,
  CONFIDENCE_LEVELS,
  DAILY_HOURS,
  DAYS,
  EDUCATION_LEVELS,
  EXAM_SESSIONS,
  LEARNING_METHODS,
  POPULAR_COURSES,
  PREP_OPTIONS,
  SUBJECT_GROUPS,
  STUDY_TIMES,
  UNIVERSITIES,
  WAEC_TARGETS,
  WIZARD_STEPS,
  defaultStudyPlannerProfile,
  suggestUtmeSubjects,
  topicsForSubject,
  type Confidence,
  type EducationLevel,
  type PrepType,
  type SavedStudyPlan,
  type StudyPlannerProfile,
} from "@/lib/studyPlannerData";

const ACCENT = "#5298E0";
const ACCENT_SOFT = "rgba(82,152,224,0.12)";
const ACCENT_BORDER = "rgba(82,152,224,0.35)";

type ViewMode = "hub" | "wizard" | "result" | "saved";

type PlanDay = {
  day: string;
  date?: string;
  topics?: string;
  timeBlocks?: string;
  focus?: string;
};

function RadioCard({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`text-left rounded-xl border px-3.5 py-3 text-xs transition-all ${
        checked
          ? "border-[#5298E0] bg-[rgba(82,152,224,0.12)] text-white"
          : "border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
      }`}
    >
      <span className="mr-2 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-current text-[8px]">
        {checked ? "●" : ""}
      </span>
      {label}
    </button>
  );
}

function CheckChip({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition-all ${
        checked
          ? "border-[#5298E0] bg-[rgba(82,152,224,0.15)] text-[#5298E0]"
          : "border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
      }`}
    >
      {checked ? "☑ " : "☐ "}
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">{children}</p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4 ${className}`}>
      {children}
    </div>
  );
}

export default function StudyPlannerWizard() {
  const [view, setView] = useState<ViewMode>("hub");
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<StudyPlannerProfile>(defaultStudyPlannerProfile);
  const [syllabusSubject, setSyllabusSubject] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SavedStudyPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<
    {
      id: string;
      title: string;
      summary: string;
      dayCount: number;
      subjects: string[];
      preparingFor: string;
      examDate: string;
      createdAt?: string;
    }[]
  >([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const classOptions = CLASS_BY_LEVEL[profile.educationLevel] || [];

  const patch = useCallback((partial: Partial<StudyPlannerProfile>) => {
    setProfile((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleList = (key: keyof StudyPlannerProfile, value: string, exclusiveNone = false) => {
    setProfile((prev) => {
      const current = Array.isArray(prev[key]) ? ([...(prev[key] as string[])] as string[]) : [];
      let next: string[];
      if (exclusiveNone && value === "None") {
        next = current.includes("None") ? [] : ["None"];
      } else if (exclusiveNone) {
        next = current.includes(value)
          ? current.filter((v) => v !== value && v !== "None")
          : [...current.filter((v) => v !== "None"), value];
      } else {
        next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      }
      return { ...prev, [key]: next };
    });
  };

  const toggleSubject = (subject: string) => {
    setProfile((prev) => {
      const has = prev.subjects.includes(subject);
      const subjects = has ? prev.subjects.filter((s) => s !== subject) : [...prev.subjects, subject];
      const subjectTopics = { ...prev.subjectTopics };
      const confidence = { ...prev.confidence };
      const subjectExamDates = { ...prev.subjectExamDates };
      if (!has) {
        subjectTopics[subject] = topicsForSubject(subject).slice(0, 4);
        confidence[subject] = confidence[subject] || "Average";
      } else {
        delete subjectTopics[subject];
        delete confidence[subject];
        delete subjectExamDates[subject];
      }
      return { ...prev, subjects, subjectTopics, confidence, subjectExamDates };
    });
  };

  const addCustomSubject = () => {
    const name = profile.customSubject.trim();
    if (!name) return;
    if (!profile.subjects.includes(name)) toggleSubject(name);
    patch({ customSubject: "" });
  };

  const toggleTopic = (subject: string, topic: string) => {
    setProfile((prev) => {
      const current = prev.subjectTopics[subject] || [];
      const next = current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic];
      return { ...prev, subjectTopics: { ...prev.subjectTopics, [subject]: next } };
    });
  };

  const addCustomTopic = () => {
    const topic = customTopic.trim();
    if (!topic || !syllabusSubject) return;
    toggleTopic(syllabusSubject, topic);
    setCustomTopic("");
  };

  const toggleWeakTopic = (topic: string) => {
    setProfile((prev) => ({
      ...prev,
      weakTopics: prev.weakTopics.includes(topic)
        ? prev.weakTopics.filter((t) => t !== topic)
        : [...prev.weakTopics, topic],
    }));
  };

  const allSelectedTopics = useMemo(() => {
    const set = new Set<string>();
    profile.subjects.forEach((s) => {
      (profile.subjectTopics[s] || topicsForSubject(s)).forEach((t) => set.add(`${s}: ${t}`));
    });
    return Array.from(set);
  }, [profile.subjects, profile.subjectTopics]);

  useEffect(() => {
    if (!syllabusSubject && profile.subjects[0]) setSyllabusSubject(profile.subjects[0]);
    if (syllabusSubject && !profile.subjects.includes(syllabusSubject)) {
      setSyllabusSubject(profile.subjects[0] || "");
    }
  }, [profile.subjects, syllabusSubject]);

  useEffect(() => {
    if (profile.preparingFor !== "JAMB") return;
    const utme = suggestUtmeSubjects(profile.targetCourse || "Other");
    setProfile((prev) => ({
      ...prev,
      utmeSubjects: utme,
    }));
  }, [profile.preparingFor, profile.targetCourse]);

  const loadSaved = async () => {
    setLoadingSaved(true);
    setError("");
    try {
      const res = await api.get("/student/study-plans");
      setSavedPlans(res.data.plans || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load saved plans.");
    } finally {
      setLoadingSaved(false);
    }
  };

  const openSaved = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/study-plans/${id}`);
      setResult(res.data);
      if (res.data.profile) setProfile({ ...defaultStudyPlannerProfile(), ...res.data.profile });
      setView("result");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to open plan.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSaved = async (id: string) => {
    if (!confirm("Delete this study plan?")) return;
    try {
      await api.delete(`/student/study-plans/${id}`);
      setSavedPlans((prev) => prev.filter((p) => p.id !== id));
      if (result?.id === id) {
        setResult(null);
        setView("saved");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete plan.");
    }
  };

  const validateStep = (s: number): string | null => {
    if (s === 1) {
      if (!profile.preparingFor) return "Select what you are preparing for.";
      if (!profile.educationLevel) return "Select education level.";
      if (!profile.classYear) return "Select class / year.";
      if (!profile.examDate) return "Select a primary exam date.";
      if (profile.preparingFor === "JAMB" && !profile.targetCourse) return "Select target course.";
    }
    if (s === 2) {
      if (!profile.subjects.length) return "Select at least one subject.";
    }
    if (s === 4) {
      if (!profile.availableDays.length) return "Select at least one study day.";
      if (!profile.preferredTimes.length) return "Select preferred study time.";
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(5, s + 1));
  };

  const prevStep = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const createPlan = async () => {
    const err = validateStep(1) || validateStep(2) || validateStep(4);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: StudyPlannerProfile = {
        ...profile,
        examBoard:
          profile.preparingFor === "WAEC"
            ? "WAEC"
            : profile.preparingFor === "NECO"
              ? "NECO"
              : profile.examBoard,
      };
      const res = await api.post("/student/study-planner", { profile: payload });
      setResult(res.data);
      setView("result");
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to create study plan.");
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setProfile(defaultStudyPlannerProfile());
    setStep(1);
    setResult(null);
    setError("");
    setView("wizard");
  };

  /* ——— HUB ——— */
  if (view === "hub") {
    return (
      <div className="space-y-5">
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={startNew}
            className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-left hover:border-[#5298E0] transition-all"
          >
            <p className="text-2xl mb-2">📅</p>
            <h4 className="font-serif text-base font-bold text-white">Create new study plan</h4>
            <p className="text-[11px] text-[#909090] mt-2 leading-relaxed">
              5-step wizard — goal, subjects, syllabus, habits, performance. AI builds a personalized
              schedule and saves it to your account.
            </p>
          </button>
          <button
            type="button"
            onClick={async () => {
              setView("saved");
              await loadSaved();
            }}
            className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-left hover:border-[#5298E0] transition-all"
          >
            <p className="text-2xl mb-2">📂</p>
            <h4 className="font-serif text-base font-bold text-white">My saved plans</h4>
            <p className="text-[11px] text-[#909090] mt-2 leading-relaxed">
              Open any previously generated plan, review day-by-day blocks, or delete old ones.
            </p>
          </button>
        </div>
      </div>
    );
  }

  /* ——— SAVED LIST ——— */
  if (view === "saved") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionLabel>Saved study plans</SectionLabel>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setView("hub")} className="!border-[#5298E0]/50 !text-[#5298E0]">
              Back
            </Button>
            <Button type="button" size="sm" onClick={startNew} className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white">
              New plan
            </Button>
          </div>
        </div>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        {loadingSaved ? (
          <p className="text-xs text-[#909090]">Loading plans…</p>
        ) : savedPlans.length === 0 ? (
          <Card>
            <p className="text-xs text-[#606060]">No saved plans yet. Create your first study plan.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-[#242424] bg-[#161616] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{plan.title}</h4>
                  <p className="text-[11px] text-[#909090] mt-1">
                    {plan.preparingFor || "Study"}
                    {plan.examDate ? ` · Exam ${plan.examDate}` : ""}
                    {plan.dayCount ? ` · ${plan.dayCount} days` : ""}
                  </p>
                  {plan.subjects?.length ? (
                    <p className="text-[10px] text-[#606060] mt-1">{plan.subjects.slice(0, 6).join(" · ")}</p>
                  ) : null}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => openSaved(plan.id)}
                    className="!border-[#5298E0]/50 !text-[#5298E0]"
                  >
                    View
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => deleteSaved(plan.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ——— RESULT ——— */
  if (view === "result" && result) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <SectionLabel>Personalized schedule</SectionLabel>
            <h4 className="font-serif text-lg font-bold text-white mt-1">{result.title}</h4>
            {result.summary ? <p className="text-xs text-[#909090] mt-1 max-w-2xl">{result.summary}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setView("hub")} className="!border-[#5298E0]/50 !text-[#5298E0]">
              Hub
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                setView("saved");
                await loadSaved();
              }}
              className="!border-[#5298E0]/50 !text-[#5298E0]"
            >
              Saved plans
            </Button>
            <Button type="button" size="sm" onClick={startNew} className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white">
              New plan
            </Button>
          </div>
        </div>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <SectionLabel>Plan snapshot</SectionLabel>
            <div className="text-[11px] text-[#909090] space-y-1.5">
              <p>
                <span className="text-white font-semibold">Preparing for:</span>{" "}
                {result.profile?.preparingFor}
              </p>
              <p>
                <span className="text-white font-semibold">Level:</span> {result.profile?.educationLevel}{" "}
                {result.profile?.classYear}
              </p>
              <p>
                <span className="text-white font-semibold">Exam date:</span> {result.profile?.examDate}
              </p>
              <p>
                <span className="text-white font-semibold">Hours/day:</span> {result.profile?.dailyHours}
              </p>
              <p>
                <span className="text-white font-semibold">Subjects:</span>{" "}
                {(result.profile?.subjects || []).join(", ")}
              </p>
              {(result.profile?.weakTopics || []).length ? (
                <p>
                  <span className="text-white font-semibold">Weak topics:</span>{" "}
                  {result.profile.weakTopics.join(", ")}
                </p>
              ) : null}
            </div>
          </Card>
          <div className="lg:col-span-2 space-y-2 max-h-[560px] overflow-y-auto custom-scrollbar">
            {(result.days || []).length ? (
              (result.days as PlanDay[]).map((day, idx) => (
                <div key={idx} className="rounded-xl border border-[#242424] bg-[#161616] p-3.5 text-xs">
                  <p className="font-bold text-white">
                    {day.day}
                    {day.date ? ` · ${day.date}` : ""}
                  </p>
                  {day.topics ? <p className="text-[#F0EBE0] mt-1">{day.topics}</p> : null}
                  {day.timeBlocks ? (
                    <p className="text-[10px] text-[#5298E0] mt-1">{day.timeBlocks}</p>
                  ) : null}
                  {day.focus ? <p className="text-[10px] text-[#909090] mt-1">Focus: {day.focus}</p> : null}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#606060]">No day blocks in this plan.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ——— WIZARD ——— */
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <SectionLabel>
            Step {step} of 5 — {WIZARD_STEPS[step - 1].title}
          </SectionLabel>
          <p className="text-[11px] text-[#909090] mt-1">Fill each page, then create your saved AI study plan.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setView("hub")} className="!border-[#5298E0]/50 !text-[#5298E0]">
          Cancel
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {WIZARD_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (s.id < step) setStep(s.id);
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
              s.id === step
                ? "bg-[#5298E0] text-white"
                : s.id < step
                  ? "bg-[rgba(82,152,224,0.2)] text-[#5298E0]"
                  : "bg-[#161616] text-[#606060] border border-[#242424]"
            }`}
          >
            {s.id}. {s.short}
          </button>
        ))}
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>What are you preparing for?</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {PREP_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  checked={profile.preparingFor === opt.value}
                  label={opt.label}
                  onChange={() => {
                    const level: EducationLevel =
                      opt.value === "UNIVERSITY"
                        ? "UNIVERSITY"
                        : opt.value === "JAMB" || opt.value === "WAEC" || opt.value === "NECO"
                          ? "SSS"
                          : profile.educationLevel;
                    const classYear = CLASS_BY_LEVEL[level][0];
                    patch({
                      preparingFor: opt.value as PrepType,
                      educationLevel: level,
                      classYear,
                      examBoard: opt.value === "NECO" ? "NECO" : opt.value === "WAEC" ? "WAEC" : profile.examBoard,
                    });
                  }}
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Education Level</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {EDUCATION_LEVELS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  checked={profile.educationLevel === opt.value}
                  label={opt.label}
                  onChange={() =>
                    patch({
                      educationLevel: opt.value,
                      classYear: CLASS_BY_LEVEL[opt.value][0],
                    })
                  }
                />
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>
              {profile.educationLevel === "UNIVERSITY" ||
              profile.educationLevel === "POLYTECHNIC" ||
              profile.educationLevel === "COE"
                ? "Year"
                : "Class"}
            </SectionLabel>
            <div className="flex flex-wrap gap-2">
              {classOptions.map((c) => (
                <RadioCard
                  key={c}
                  checked={profile.classYear === c}
                  label={c}
                  onChange={() => patch({ classYear: c })}
                />
              ))}
            </div>
          </Card>

          {(profile.preparingFor === "WAEC" || profile.preparingFor === "NECO") && (
            <Card>
              <SectionLabel>Exam & Session</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Exam"
                  value={profile.examBoard}
                  onChange={(e) => patch({ examBoard: e.target.value })}
                  options={[
                    { label: "WAEC", value: "WAEC" },
                    { label: "NECO", value: "NECO" },
                  ]}
                />
                <Select
                  label="Exam Session"
                  value={profile.examSession}
                  onChange={(e) => patch({ examSession: e.target.value })}
                  options={EXAM_SESSIONS.map((y) => ({ label: y, value: y }))}
                />
              </div>
              <Select
                label="Target Performance"
                value={profile.targetGrade}
                onChange={(e) => patch({ targetGrade: e.target.value })}
                options={WAEC_TARGETS.map((t) => ({ label: t, value: t }))}
              />
            </Card>
          )}

          {profile.preparingFor === "JAMB" && (
            <Card>
              <SectionLabel>JAMB / UTME targets</SectionLabel>
              <Select
                label="Target University"
                value={profile.targetUniversity}
                onChange={(e) => patch({ targetUniversity: e.target.value })}
                options={[
                  { label: "Select University", value: "" },
                  ...UNIVERSITIES.map((u) => ({ label: u, value: u })),
                ]}
              />
              <Select
                label="Target Course"
                value={profile.targetCourse}
                onChange={(e) => {
                  const course = e.target.value;
                  patch({
                    targetCourse: course,
                    utmeSubjects: suggestUtmeSubjects(course),
                  });
                }}
                options={POPULAR_COURSES.map((c) => ({ label: c, value: c }))}
              />
              <div>
                <SectionLabel>Suggested UTME Subjects</SectionLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.utmeSubjects.map((s) => (
                    <span
                      key={s}
                      className="rounded-lg border px-2.5 py-1 text-[10px] font-semibold"
                      style={{ borderColor: ACCENT_BORDER, background: ACCENT_SOFT, color: ACCENT }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-[#606060] mt-2">
                  Combinations are suggested for planning. Always verify with JAMB IBASS for your course.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="!border-[#5298E0]/50 !text-[#5298E0]"
                  onClick={() => {
                    profile.utmeSubjects.forEach((s) => {
                      const exact = s.split(" / ")[0].trim();
                      const match =
                        SUBJECT_GROUPS.flatMap((g) => g.subjects).find(
                          (sub) => sub === exact || sub.startsWith(exact) || exact.includes(sub)
                        ) || exact;
                      if (!profile.subjects.includes(match)) toggleSubject(match);
                    });
                  }}
                >
                  Add suggested subjects to my list
                </Button>
              </div>
              <Input
                label="Target UTME Score"
                type="number"
                min={0}
                max={400}
                value={profile.targetUtmeScore}
                onChange={(e) => patch({ targetUtmeScore: e.target.value })}
                placeholder="e.g. 300"
              />
            </Card>
          )}

          <Card>
            <SectionLabel>Primary Exam Date</SectionLabel>
            <DatePicker
              label="Exam Date"
              value={profile.examDate}
              onChange={(v) => patch({ examDate: v })}
              accent="blue"
            />
            <p className="text-[10px] text-[#606060]">
              You can add per-subject dates on the Subjects page for multi-paper exams.
            </p>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {SUBJECT_GROUPS.map((group) => (
            <Card key={group.name}>
              <SectionLabel>{group.name}</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {group.subjects.map((subject) => (
                  <CheckChip
                    key={subject}
                    checked={profile.subjects.includes(subject)}
                    label={subject}
                    onChange={() => toggleSubject(subject)}
                  />
                ))}
              </div>
            </Card>
          ))}
          <Card>
            <SectionLabel>Add custom subject</SectionLabel>
            <div className="flex gap-2">
              <Input
                value={profile.customSubject}
                onChange={(e) => patch({ customSubject: e.target.value })}
                placeholder="e.g. Diploma in Banking, Nursing Pharmacology…"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addCustomSubject}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white shrink-0"
              >
                Add
              </Button>
            </div>
            {profile.subjects.length ? (
              <div className="pt-2 border-t border-[#242424] space-y-3">
                <SectionLabel>Subject exam dates (optional)</SectionLabel>
                {profile.subjects.map((s) => (
                  <DatePicker
                    key={s}
                    label={s}
                    value={profile.subjectExamDates[s] || ""}
                    onChange={(v) =>
                      setProfile((prev) => ({
                        ...prev,
                        subjectExamDates: { ...prev.subjectExamDates, [s]: v },
                      }))
                    }
                    accent="blue"
                  />
                ))}
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          {!profile.subjects.length ? (
            <Card>
              <p className="text-xs text-[#606060]">Select subjects first (Step 2).</p>
            </Card>
          ) : (
            <>
              <Card>
                <Select
                  label="Select Subject"
                  value={syllabusSubject}
                  onChange={(e) => setSyllabusSubject(e.target.value)}
                  options={profile.subjects.map((s) => ({ label: s, value: s }))}
                />
                {syllabusSubject ? (
                  <>
                    <SectionLabel>Topics — {syllabusSubject}</SectionLabel>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(
                        new Set([
                          ...topicsForSubject(syllabusSubject),
                          ...(profile.subjectTopics[syllabusSubject] || []),
                        ])
                      ).map((topic) => (
                        <CheckChip
                          key={topic}
                          checked={(profile.subjectTopics[syllabusSubject] || []).includes(topic)}
                          label={topic}
                          onChange={() => toggleTopic(syllabusSubject, topic)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-44 sm:w-52">
                        <Input
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          placeholder="Add topic…"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={addCustomTopic}
                        className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white shrink-0 whitespace-nowrap"
                      >
                        Add topic
                      </Button>
                    </div>
                  </>
                ) : null}
              </Card>
              <Card>
                <SectionLabel>Or paste your syllabus</SectionLabel>
                <Textarea
                  rows={6}
                  value={profile.syllabusPaste}
                  onChange={(e) => patch({ syllabusPaste: e.target.value })}
                  placeholder="Paste WAEC/NECO/JAMB/school syllabus topics here…"
                />
              </Card>
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>How much time can you study each day?</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DAILY_HOURS.map((h) => (
                <RadioCard
                  key={h.value}
                  checked={profile.dailyHours === h.value}
                  label={h.label}
                  onChange={() => patch({ dailyHours: h.value })}
                />
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>Which days can you study?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <CheckChip
                  key={d}
                  checked={profile.availableDays.includes(d)}
                  label={d}
                  onChange={() => toggleList("availableDays", d)}
                />
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel>When do you prefer studying?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {STUDY_TIMES.map((t) => (
                <CheckChip
                  key={t}
                  checked={profile.preferredTimes.includes(t)}
                  label={t}
                  onChange={() => toggleList("preferredTimes", t)}
                />
              ))}
            </div>
            <Textarea
              label="Available time notes (advanced)"
              rows={3}
              value={profile.availableTimeNotes}
              onChange={(e) => patch({ availableTimeNotes: e.target.value })}
              placeholder={"Morning: 6:00 AM – 7:00 AM\nEvening: 5:00 PM – 8:00 PM"}
            />
          </Card>
          <Card>
            <SectionLabel>Do you have other commitments?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {COMMITMENTS.map((c) => (
                <CheckChip
                  key={c}
                  checked={profile.commitments.includes(c)}
                  label={c}
                  onChange={() => toggleList("commitments", c, true)}
                />
              ))}
            </div>
            <Input
              label="Available study time after school (hours)"
              value={profile.studyAfterSchoolHours}
              onChange={(e) => patch({ studyAfterSchoolHours: e.target.value })}
              placeholder="e.g. 3"
            />
          </Card>
          <Card>
            <SectionLabel>How do you learn best?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {LEARNING_METHODS.map((m) => (
                <CheckChip
                  key={m}
                  checked={profile.learningMethods.includes(m)}
                  label={m}
                  onChange={() => toggleList("learningMethods", m)}
                />
              ))}
            </div>
          </Card>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <Card>
            <SectionLabel>How confident are you in each subject?</SectionLabel>
            <div className="space-y-4">
              {profile.subjects.map((subject) => (
                <div key={subject} className="space-y-2">
                  <p className="text-xs font-bold text-white">{subject}</p>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_LEVELS.map((level) => (
                      <RadioCard
                        key={level}
                        checked={(profile.confidence[subject] || "Average") === level}
                        label={level}
                        onChange={() =>
                          setProfile((prev) => ({
                            ...prev,
                            confidence: { ...prev.confidence, [subject]: level as Confidence },
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
              {!profile.subjects.length ? (
                <p className="text-xs text-[#606060]">No subjects selected.</p>
              ) : null}
            </div>
          </Card>
          <Card>
            <SectionLabel>Which topics are difficult for you?</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {allSelectedTopics.map((topic) => (
                <CheckChip
                  key={topic}
                  checked={profile.weakTopics.includes(topic)}
                  label={topic}
                  onChange={() => toggleWeakTopic(topic)}
                />
              ))}
            </div>
            <Textarea
              label="Or describe weak areas / ask AI to prioritize"
              rows={3}
              value={profile.weakTopicsNotes}
              onChange={(e) => patch({ weakTopicsNotes: e.target.value })}
              placeholder="e.g. Algebra, Trigonometry, Organic Chemistry… or: Help me identify my weak topics from my syllabus."
            />
          </Card>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#242424]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={step === 1}
          onClick={prevStep}
          leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
          className="!border-[#5298E0]/50 !text-[#5298E0]"
        >
          Back
        </Button>
        {step < 5 ? (
          <Button
            type="button"
            size="sm"
            onClick={nextStep}
            rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
            className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            isLoading={loading}
            onClick={createPlan}
            className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
          >
            Create my study plan
          </Button>
        )}
      </div>
    </div>
  );
}
