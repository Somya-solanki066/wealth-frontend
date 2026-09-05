"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type ScorePoint = {
  id: string;
  label: string;
  source: string;
  percentageScore: number;
  createdAt: string;
};

type SubjectStat = {
  subject: string;
  averageScore: number;
  attempts: number;
  totalIncorrect: number;
};

type AnalyticsOverview = {
  totalAttempts: number;
  overallAverage: number;
  scoreHistory: ScorePoint[];
  subjectBreakdown: SubjectStat[];
  weakArea: {
    subject: string;
    averageScore: number;
    focusToday: string;
    focusTopics: string[];
    questionsQueued: number;
    recommendation: string;
  } | null;
  studyStreak: number;
  weekActivity: boolean[];
  studyToday: {
    headline: string;
    detail: string;
    toolHint: string;
  };
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function SmartPerformanceAnalyticsWorkspace({ onBack }: { onBack?: () => void }) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/student/analytics/overview");
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxScore = 100;

  return (
    <div className="space-y-6">
      {!onBack ? (
        <div>
          <h3 className="font-serif text-xl font-bold text-white">Smart Performance Analytics</h3>
          <p className="text-xs text-[#909090] mt-1">
            Score history, subject breakdown, weak area detector, and study streak — know exactly what to study today.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      {loading ? (
        <p className="text-xs text-[#909090]">Loading your performance data…</p>
      ) : data ? (
        <>
          {data.totalAttempts === 0 ? (
            <div className="rounded-2xl border border-[#5298E0]/30 bg-[rgba(82,152,224,0.08)] p-5 space-y-3">
              <p className="text-sm font-semibold text-white">No practice data yet</p>
              <p className="text-xs text-[#909090] leading-relaxed">
                Complete a JAMB, university, nursing, MBBS, or professional course practice session to unlock personalised analytics.
              </p>
              <Link href="/dashboard?tab=student&tool=jamb-practice">
                <Button type="button" size="sm">Start JAMB Practice</Button>
              </Link>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090]">
              Score history — last {Math.min(6, data.scoreHistory.length)} attempt{data.scoreHistory.length === 1 ? "" : "s"}
            </p>
            {data.scoreHistory.length ? (
              <div className="flex items-end justify-between gap-2 h-36">
                {data.scoreHistory.map((point, idx) => {
                  const height = Math.max(12, (point.percentageScore / maxScore) * 100);
                  const recent = idx >= data.scoreHistory.length - 2;
                  return (
                    <div key={point.id} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-[#909090]">{point.percentageScore}%</span>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          recent ? "bg-[#5298E0]" : "bg-[#5298E0]/35"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[#606060]">Complete practice sessions to see your score trend.</p>
            )}
          </div>

          {data.weakArea ? (
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">Weakest subject</p>
                <span className="rounded-full border border-[#242424] bg-[#080808] px-3 py-1 text-[11px] font-bold text-[#909090]">
                  {data.weakArea.subject} — {data.weakArea.averageScore}%
                </span>
              </div>
              <p className="text-xs text-[#909090]">{data.weakArea.recommendation}</p>
              <p className="text-[11px] text-[#606060]">{data.weakArea.questionsQueued} questions queued</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-white">Study streak</p>
              <span className="rounded-full bg-[#5298E0] px-3 py-1 text-[11px] font-bold text-white">
                {data.studyStreak} day{data.studyStreak === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex gap-2">
              {data.weekActivity.map((active, idx) => (
                <div
                  key={`${idx}-${active}`}
                  className={`h-3 flex-1 rounded-full ${
                    active ? "bg-[#5298E0]" : "bg-[#242424]"
                  }`}
                  title={DAY_LABELS[idx]}
                />
              ))}
            </div>
          </div>

          {data.subjectBreakdown.length ? (
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#909090]">
                Subject breakdown
              </p>
              <div className="space-y-3">
                {data.subjectBreakdown.map((sub) => (
                  <div key={sub.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[#F0EBE0] font-medium">{sub.subject}</span>
                      <span className="text-[#909090]">{sub.averageScore}% · {sub.attempts} attempt{sub.attempts === 1 ? "" : "s"}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#080808] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sub.averageScore < 55 ? "bg-red-500/70" : sub.averageScore < 70 ? "bg-[#5298E0]/60" : "bg-[#52C07A]"
                        }`}
                        style={{ width: `${sub.averageScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#5298E0]/30 bg-[rgba(82,152,224,0.08)] p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">Study today</p>
            <p className="text-sm font-bold text-white">{data.studyToday.headline}</p>
            <p className="text-xs text-[#909090] leading-relaxed">{data.studyToday.detail}</p>
            {data.totalAttempts > 0 ? (
              <Link href={`/dashboard?tab=student&tool=${data.studyToday.toolHint}`}>
                <Button type="button" size="sm" className="mt-2">
                  Practice now →
                </Button>
              </Link>
            ) : null}
          </div>

          {data.totalAttempts > 0 ? (
            <p className="text-[11px] text-[#606060] text-center">
              Overall average: {data.overallAverage}% across {data.totalAttempts} practice session{data.totalAttempts === 1 ? "" : "s"}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
