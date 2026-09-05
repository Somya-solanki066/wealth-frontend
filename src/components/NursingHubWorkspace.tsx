"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, Syringe } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type NursingOptionKey = "A" | "B" | "C" | "D";

type NursingTopic = {
  id: string;
  name: string;
  shortName: string;
  description: string;
};

type NursingYear = {
  year: number;
  label: string;
  topics: NursingTopic[];
};

type NursingQuestion = {
  id: string;
  topicId: string;
  questionNumber: number;
  questionText: string;
  options: Record<NursingOptionKey, string>;
};

type Phase = "hub" | "drug-calc" | "practice" | "results";

type BreakdownItem = {
  questionId: string;
  questionNumber: number;
  chosen: NursingOptionKey | null;
  correctAnswer: NursingOptionKey;
  isCorrect: boolean;
  rationale: string;
};

type DrugCalcMode = "liquid" | "iv-rate" | "tablets";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function DrugCalculationTool({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<DrugCalcMode>("liquid");
  const [prescribedDose, setPrescribedDose] = useState("");
  const [concentration, setConcentration] = useState("");
  const [volumeOnHand, setVolumeOnHand] = useState("");
  const [ivVolume, setIvVolume] = useState("");
  const [ivMinutes, setIvMinutes] = useState("");
  const [doseOrdered, setDoseOrdered] = useState("");
  const [dosePerTablet, setDosePerTablet] = useState("");

  const working = useMemo(() => {
    if (mode === "liquid") {
      const dose = parseFloat(prescribedDose);
      const conc = parseFloat(concentration);
      if (!dose || !conc) return null;
      const actualMl = dose / conc;
      return {
        result: `${actualMl.toFixed(2)} mL`,
        steps: [
          `Prescribed dose = ${dose} mg`,
          `Concentration on label = ${conc} mg/mL`,
          `Formula: Volume (mL) = Prescribed dose ÷ Concentration`,
          `Volume = ${dose} ÷ ${conc} = ${actualMl.toFixed(2)} mL`,
          `Draw up ${actualMl.toFixed(2)} mL and administer as ordered.`,
        ],
      };
    }
    if (mode === "iv-rate") {
      const volume = parseFloat(ivVolume);
      const minutes = parseFloat(ivMinutes);
      if (!volume || !minutes) return null;
      const mlPerHr = (volume / minutes) * 60;
      const dropsPerMin = (volume * 20) / minutes;
      return {
        result: `${mlPerHr.toFixed(1)} mL/hr`,
        steps: [
          `Volume to infuse = ${volume} mL`,
          `Time ordered = ${minutes} minutes`,
          `Formula: mL/hr = (Volume ÷ Time in minutes) × 60`,
          `mL/hr = (${volume} ÷ ${minutes}) × 60 = ${mlPerHr.toFixed(1)} mL/hr`,
          `Using macro-drip (20 drops/mL): ≈ ${dropsPerMin.toFixed(0)} drops/min`,
        ],
      };
    }
    const ordered = parseFloat(doseOrdered);
    const perTab = parseFloat(dosePerTablet);
    if (!ordered || !perTab) return null;
    const tablets = ordered / perTab;
    return {
      result: `${tablets % 1 === 0 ? tablets : tablets.toFixed(2)} tablet(s)`,
      steps: [
        `Dose ordered = ${ordered} mg`,
        `Dose per tablet = ${perTab} mg`,
        `Formula: Number of tablets = Dose ordered ÷ Dose per tablet`,
        `Tablets = ${ordered} ÷ ${perTab} = ${tablets % 1 === 0 ? tablets : tablets.toFixed(2)}`,
        `Administer ${tablets % 1 === 0 ? tablets : tablets.toFixed(2)} tablet(s) as ordered.`,
      ],
    };
  }, [mode, prescribedDose, concentration, volumeOnHand, ivVolume, ivMinutes, doseOrdered, dosePerTablet]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#242424] bg-[#161616] text-[#909090]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h3 className="font-serif text-xl font-bold text-white">Drug Calculation Tool</h3>
      </div>

      <p className="text-xs text-[#909090]">
        Enter dose, concentration, and volume on hand — the tool works out mL/hr or tablet count for you, with the working shown step by step.
      </p>

      <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0] mb-3">Calculation type</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["liquid", "Liquid dose (mL)"],
              ["iv-rate", "IV drip rate"],
              ["tablets", "Tablet count"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                mode === id
                  ? "bg-[#5298E0] text-white"
                  : "border border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4">
        {mode === "liquid" && (
          <>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Prescribed dose (mg)</span>
              <input
                type="number"
                value={prescribedDose}
                onChange={(e) => setPrescribedDose(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Concentration (mg/mL)</span>
              <input
                type="number"
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                placeholder="e.g. 250"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Volume on hand (mL) — optional reference</span>
              <input
                type="number"
                value={volumeOnHand}
                onChange={(e) => setVolumeOnHand(e.target.value)}
                placeholder="e.g. 2"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
          </>
        )}
        {mode === "iv-rate" && (
          <>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Volume to infuse (mL)</span>
              <input
                type="number"
                value={ivVolume}
                onChange={(e) => setIvVolume(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Time (minutes)</span>
              <input
                type="number"
                value={ivMinutes}
                onChange={(e) => setIvMinutes(e.target.value)}
                placeholder="e.g. 480"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
          </>
        )}
        {mode === "tablets" && (
          <>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Dose ordered (mg)</span>
              <input
                type="number"
                value={doseOrdered}
                onChange={(e) => setDoseOrdered(e.target.value)}
                placeholder="e.g. 1000"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-bold text-[#909090]">Dose per tablet (mg)</span>
              <input
                type="number"
                value={dosePerTablet}
                onChange={(e) => setDosePerTablet(e.target.value)}
                placeholder="e.g. 500"
                className="w-full rounded-xl border border-[#242424] bg-[#080808] px-4 py-2.5 text-sm text-white outline-none focus:border-[#5298E0]"
              />
            </label>
          </>
        )}
      </div>

      {working ? (
        <div className="rounded-2xl border border-[#5298E0]/40 bg-[rgba(82,152,224,0.08)] p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">Answer</p>
            <p className="font-serif text-3xl font-black text-white mt-1">{working.result}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-2">Step-by-step working</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#F0EBE0] leading-relaxed">
              {working.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#606060]">Fill in the fields above to see your answer and working.</p>
      )}
    </div>
  );
}

export default function NursingHubWorkspace({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<Phase>("hub");
  const [years, setYears] = useState<NursingYear[]>([]);
  const [selectedYear, setSelectedYear] = useState(3);
  const [activeTopic, setActiveTopic] = useState<NursingTopic | null>(null);
  const [questions, setQuestions] = useState<NursingQuestion[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, NursingOptionKey | null>>({});
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/student/nursing/catalog");
        const list: NursingYear[] = res.data.years || [];
        setYears(list);
        if (list.length) setSelectedYear(list.find((y) => y.year === 3)?.year || list[0].year);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load nursing catalog.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const yearData = useMemo(
    () => years.find((y) => y.year === selectedYear),
    [years, selectedYear]
  );

  const startTopicPractice = async (topic: NursingTopic) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/student/nursing/questions/${topic.id}/${selectedYear}`);
      setQuestions(res.data.questions || []);
      setDurationMinutes(res.data.durationMinutes || 30);
      setActiveTopic(topic);
      setAnswers({});
      setCurrentIndex(0);
      setResults(null);
      submittedRef.current = false;
      const secs = (res.data.durationMinutes || 30) * 60;
      setTimeLeft(secs);
      setPhase("practice");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  const submitExam = useCallback(async () => {
    if (submittedRef.current || !activeTopic) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/student/nursing/submit", {
        topicId: activeTopic.id,
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
      setPhase("results");
    } catch (err: any) {
      submittedRef.current = false;
      setError(err.response?.data?.error || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  }, [activeTopic, selectedYear, answers]);

  useEffect(() => {
    if (phase !== "practice") return;
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
  const answeredCount = useMemo(
    () => Object.values(answers).filter(Boolean).length,
    [answers]
  );

  const selectAnswer = (key: NursingOptionKey) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: key }));
  };

  if (phase === "drug-calc") {
    return <DrugCalculationTool onBack={() => setPhase("hub")} />;
  }

  if (phase === "results" && results) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">Practice Complete</p>
          <h3 className="font-serif text-4xl font-black text-white mt-2">{results.percentageScore}%</h3>
          <p className="text-xs text-[#909090] mt-2">
            {activeTopic?.name} · Year {selectedYear}
          </p>
          <p className="text-xs text-[#909090] mt-1">
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
              {item.rationale ? (
                <p className="text-[#606060] mt-1 leading-relaxed">{item.rationale}</p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setPhase("hub")}>
            Back to Nursing Hub
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "practice" && current) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Leave this practice session? Progress will be lost.")) {
                setPhase("hub");
              }
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#242424] bg-[#161616] text-[#909090]"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="font-serif text-lg font-bold text-white">{activeTopic?.name}</h3>
            <p className="text-[11px] text-[#909090]">Year {selectedYear} · {questions.length} questions</p>
          </div>
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

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
            {(["A", "B", "C", "D"] as NursingOptionKey[]).map((key) => {
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
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">Nursing Hub</h3>
            <p className="text-xs text-[#909090] mt-1">
              Year 1 through Year 5. MedSurg, MCH, Community Health, Mental Health, ICU, Emergency Nursing.
            </p>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {loading && !years.length ? (
        <p className="text-xs text-[#909090]">Loading Nursing Hub…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090] mb-3">Select year</p>
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <button
                  key={y.year}
                  type="button"
                  onClick={() => setSelectedYear(y.year)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                    selectedYear === y.year
                      ? "bg-[#5298E0] text-white"
                      : "border border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090]">
              Year {selectedYear} topics
            </p>
            {yearData?.topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => startTopicPractice(topic)}
                disabled={loading}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-[#242424] bg-[#080808] px-4 py-4 text-left transition-all hover:border-[#5298E0]/40 disabled:opacity-50"
              >
                <span className="text-sm font-semibold text-white">{topic.name}</span>
                <ChevronRight className="h-4 w-4 text-[#606060] shrink-0" />
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Syringe className="h-4 w-4 text-[#5298E0]" />
                <h4 className="font-serif text-sm font-bold text-white">Drug Calculation Tool</h4>
              </div>
              <Button type="button" size="sm" onClick={() => setPhase("drug-calc")}>
                Open
              </Button>
            </div>
            <p className="text-[11px] text-[#909090] leading-relaxed">
              Enter dose, concentration, and volume on hand — the tool works the mL/hr or tablet count for you, with the working shown step by step.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
