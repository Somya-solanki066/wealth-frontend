"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Brain,
  Flame,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type AnalyticsData = {
  greeting: string;
  userName: string;
  scores: {
    knowledgePerformance: number | null;
    learningConsistency: number | null;
    academicProductivity: number | null;
  };
  thisWeek: {
    questionsAttempted: number;
    questionsCorrect: number;
    studyTimeFormatted: string;
    studyStreak: number;
  };
  todayPriorities: Array<{
    priority: number;
    level: string;
    subject: string;
    topic: string;
    accuracy: number | null;
    status: string;
    recommendedAction: string;
    recommendedCount: number;
    toolRoute: string;
    estimatedMinutes: number;
  }>;
  weakAreas: Array<{
    subject: string;
    topic: string;
    accuracy: number | null;
    level: string;
    toolRoute: string;
  }>;
  needsAttention: Array<{ subject: string; topic: string; accuracy: number | null; toolRoute: string }>;
  subjectPerformance: Array<{ subject: string; accuracy: number | null; attempted: number; status: string }>;
  toolPerformance: Array<{ id: string; label: string; route: string; average: number | null; sessions: number; status: string }>;
  performanceTrend: Array<{ sessionIndex: number; score: number; date: string }>;
  recentImprovements: Array<{ subject: string; previous: number; current: number; delta: number }>;
  weekActivity: boolean[];
  toolActivity: Array<{ tool: string; route: string; sessions: number; type: string }>;
  examAnalytics: {
    jamb: any;
    university: any;
    nursing: any;
    mbbs: any;
    professional: any;
  };
  learningActivity: any;
  productivity: any;
  hasData: boolean;
  totalAttempts: number;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function levelColor(level: string) {
  if (level === "critical") return "#E85B5B";
  if (level === "warning") return "#E8B84B";
  if (level === "moderate") return "#5298E0";
  return "#52C07A";
}

function levelEmoji(level: string) {
  if (level === "critical") return "🔴";
  if (level === "warning") return "🟠";
  if (level === "moderate") return "🟡";
  return "🟢";
}

function progressColor(p: number | null) {
  if (p === null) return "#606060";
  if (p >= 65) return "#52C07A";
  if (p >= 45) return "#E8B84B";
  return "#E85B5B";
}

function ScoreCard({ label, value, icon }: { label: string; value: number | null; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#242424] bg-[#080808] p-4 text-center">
      <div className="flex justify-center mb-2 text-[#5298E0]">{icon}</div>
      <p className="font-serif text-2xl font-black text-white">{value !== null ? `${value}%` : "—"}</p>
      <p className="text-[10px] text-[#606060] mt-1">{label}</p>
    </div>
  );
}

export default function SmartPerformanceAnalyticsWorkspace({ onBack }: { onBack?: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
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

  if (loading) return <p className="text-xs text-[#909090]">Loading Smart Performance Analytics…</p>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#5298E0]" /> Smart Performance Analytics
          </h3>
          {data && (
            <p className="text-xs text-[#5298E0] mt-0.5">
              {data.greeting}, {data.userName} 👋
            </p>
          )}
        </div>
        {onBack && <Button variant="outline" size="sm" onClick={onBack}>All Tools</Button>}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!data?.hasData && (
        <div className="rounded-2xl border border-[#5298E0]/30 bg-[#5298E0]/5 p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Start building your analytics profile</p>
          <p className="text-xs text-[#909090] leading-relaxed">
            Complete practice sessions in JAMB, University, Nursing, MBBS, or Professional Courses to unlock personalised insights, weak area detection, and daily study recommendations.
          </p>
          <Link href="/dashboard?tab=student&tool=jamb-practice">
            <Button size="sm">Start JAMB Practice</Button>
          </Link>
        </div>
      )}

      {data && (
        <>
          {/* Three Scores */}
          <div className="grid grid-cols-3 gap-3">
            <ScoreCard label="Knowledge Performance" value={data.scores.knowledgePerformance} icon={<Brain className="h-5 w-5" />} />
            <ScoreCard label="Learning Consistency" value={data.scores.learningConsistency} icon={<Flame className="h-5 w-5" />} />
            <ScoreCard label="Academic Productivity" value={data.scores.academicProductivity} icon={<Zap className="h-5 w-5" />} />
          </div>

          {/* This Week */}
          <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5">
            <p className="text-[10px] font-bold uppercase text-[#909090] mb-3">This Week</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><p className="text-lg font-bold text-white">{data.thisWeek.questionsAttempted}</p><p className="text-[10px] text-[#606060]">Questions</p></div>
              <div><p className="text-lg font-bold text-[#52C07A]">{data.thisWeek.questionsCorrect}</p><p className="text-[10px] text-[#606060]">Correct</p></div>
              <div><p className="text-lg font-bold text-white">{data.thisWeek.studyTimeFormatted}</p><p className="text-[10px] text-[#606060]">Study Time</p></div>
              <div><p className="text-lg font-bold text-[#5298E0]">🔥 {data.thisWeek.studyStreak}</p><p className="text-[10px] text-[#606060]">Day Streak</p></div>
            </div>
            <div className="flex gap-1.5 mt-4">
              {data.weekActivity.map((active, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className={`h-2 rounded-full ${active ? "bg-[#5298E0]" : "bg-[#242424]"}`} />
                  <p className="text-[8px] text-[#606060] mt-1">{DAY_LABELS[idx]}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What to Study Today */}
          {data.todayPriorities.length > 0 && (
            <div className="rounded-2xl border border-[#5298E0]/30 bg-[#5298E0]/5 p-5 space-y-4">
              <p className="text-sm font-bold text-white flex items-center gap-2"><Target className="h-4 w-4 text-[#5298E0]" /> What to Study Today</p>
              {data.todayPriorities.map((p) => (
                <div key={`${p.subject}-${p.topic}`} className="rounded-xl border border-[#242424] bg-[#0d1117] p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{levelEmoji(p.level)} {p.priority}. {p.subject} — {p.topic}</p>
                      <p className="text-[10px] text-[#909090] mt-1">
                        {p.accuracy !== null ? `Accuracy: ${p.accuracy}%` : "Not started"}
                        {p.status === "insufficient_data" ? " · Need more data" : ""}
                      </p>
                      <p className="text-xs text-[#C0C0C0] mt-1">{p.recommendedAction} · ~{p.estimatedMinutes} min</p>
                    </div>
                    <Link href={`/dashboard?tab=student&tool=${p.toolRoute}`}>
                      <Button size="sm">Practice</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Needs Attention */}
          {data.needsAttention.length > 0 && (
            <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-5 space-y-3">
              <p className="text-sm font-bold text-red-400">⚠ Needs Attention</p>
              {data.needsAttention.map((w) => (
                <div key={`${w.subject}-${w.topic}`} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-white">{w.subject} — {w.topic}</p>
                    <p className="text-xs text-red-400">{w.accuracy !== null ? `${w.accuracy}%` : "Not started"}</p>
                  </div>
                  <Link href={`/dashboard?tab=student&tool=${w.toolRoute}`}>
                    <Button size="sm" variant="outline">Practice</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Subject Performance */}
          {data.subjectPerformance.length > 0 && (
            <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
              <p className="text-[10px] font-bold uppercase text-[#909090] flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" /> Subject Performance</p>
              {data.subjectPerformance.map((s) => (
                <div key={s.subject}>
                  <button type="button" onClick={() => setExpandedSubject(expandedSubject === s.subject ? null : s.subject)} className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white font-medium">{s.subject}</span>
                      <span style={{ color: progressColor(s.accuracy) }}>{s.accuracy !== null ? `${s.accuracy}%` : "—"}</span>
                    </div>
                    <div className="h-1.5 bg-[#242424] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.accuracy || 0}%`, background: progressColor(s.accuracy) }} />
                    </div>
                  </button>
                  {expandedSubject === s.subject && (
                    <div className="mt-2 pl-3 text-[10px] text-[#909090] space-y-1">
                      <p>Attempted: {s.attempted}</p>
                      <p>Status: {s.status.replace(/_/g, " ")}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Performance by Tool */}
          <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase text-[#909090]">Performance by Tool</p>
            {data.toolPerformance.map((t) => (
              <div key={t.id} className="flex justify-between items-center text-sm">
                <span className="text-[#C0C0C0]">{t.label}</span>
                {t.status === "no_data" ? (
                  <span className="text-[10px] text-[#606060]">No data yet</span>
                ) : (
                  <span className="font-bold" style={{ color: progressColor(t.average) }}>{t.average}% · {t.sessions} sessions</span>
                )}
              </div>
            ))}
          </div>

          {/* Performance Trend */}
          {data.performanceTrend.length > 1 && (
            <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5">
              <p className="text-[10px] font-bold uppercase text-[#909090] mb-4 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Performance Trend — Last {data.performanceTrend.length} Sessions</p>
              <div className="flex items-end justify-between gap-1 h-28">
                {data.performanceTrend.map((p) => (
                  <div key={p.sessionIndex} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[8px] text-[#606060]">{p.score}%</span>
                    <div className="w-full bg-[#5298E0] rounded-t" style={{ height: `${Math.max(8, p.score)}%` }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Improvements */}
          {data.recentImprovements.length > 0 && (
            <div className="rounded-2xl border border-[#52C07A]/30 bg-[#52C07A]/5 p-5 space-y-2">
              <p className="text-sm font-bold text-[#52C07A]">📈 Recent Improvements</p>
              {data.recentImprovements.map((imp) => (
                <div key={imp.subject} className="flex justify-between text-xs">
                  <span className="text-white">{imp.subject}</span>
                  <span className="text-[#52C07A]">{imp.previous}% → {imp.current}% (+{imp.delta})</span>
                </div>
              ))}
            </div>
          )}

          {/* JAMB Analytics */}
          {data.examAnalytics.jamb && (
            <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
              <p className="text-sm font-bold text-white">JAMB Performance</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {data.examAnalytics.jamb.averageScore && <div><p className="text-[#606060]">Avg Score</p><p className="text-white font-bold">{data.examAnalytics.jamb.averageScore} / 400</p></div>}
                <div><p className="text-[#606060]">Accuracy</p><p className="text-white font-bold">{data.examAnalytics.jamb.averageAccuracy}%</p></div>
                <div><p className="text-[#606060]">Mocks</p><p className="text-white font-bold">{data.examAnalytics.jamb.mocksCompleted}</p></div>
                {data.examAnalytics.jamb.trend && (
                  <div><p className="text-[#606060]">Improvement</p><p className="text-[#52C07A] font-bold">+{data.examAnalytics.jamb.trend.improvement}</p></div>
                )}
              </div>
              {data.examAnalytics.jamb.subjectPerformance?.map((s: any) => (
                <div key={s.subject} className="flex justify-between text-xs">
                  <span className="text-[#C0C0C0]">{s.subject}</span>
                  <span style={{ color: progressColor(s.accuracy) }}>{s.accuracy}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Hub-specific: Nursing, MBBS, Professional */}
          {(["nursing", "mbbs", "professional"] as const).map((hub) => {
            const items = data.examAnalytics[hub];
            if (!items?.length) return null;
            const labels = { nursing: "Nursing", mbbs: "MBBS", professional: "Professional Courses" };
            return (
              <div key={hub} className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-2">
                <p className="text-sm font-bold text-white">{labels[hub]} Performance</p>
                {items.map((s: any) => (
                  <div key={s.name} className="flex justify-between text-xs">
                    <span className="text-[#C0C0C0]">{s.name}</span>
                    <span style={{ color: progressColor(s.accuracy) }}>{s.displayAccuracy}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Learning Activity (not scores) */}
          <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase text-[#909090]">Learning Activity</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#080808] p-3">
                <p className="text-[#606060]">Flashcard Sessions</p>
                <p className="text-white font-bold">{data.learningActivity.flashcards.sessions}</p>
              </div>
              <div className="rounded-xl bg-[#080808] p-3">
                <p className="text-[#606060]">Study Planner</p>
                <p className="text-white font-bold">{data.learningActivity.studyPlanner.adherence !== null ? `${data.learningActivity.studyPlanner.adherence}% adherence` : "—"}</p>
              </div>
              <div className="rounded-xl bg-[#080808] p-3">
                <p className="text-[#606060]">Videos Opened</p>
                <p className="text-white font-bold">{data.learningActivity.videos.videosOpened}</p>
              </div>
              <div className="rounded-xl bg-[#080808] p-3">
                <p className="text-[#606060]">Topics Searched</p>
                <p className="text-white font-bold">{data.learningActivity.videos.topicsSearched}</p>
              </div>
            </div>
          </div>

          {/* Productivity (not academic scores) */}
          <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-3">
            <p className="text-[10px] font-bold uppercase text-[#909090]">Academic Productivity</p>
            <p className="text-[9px] text-[#606060] italic">Activity metrics only — not academic performance scores</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#080808] p-3">
                <p className="text-[#606060]">Citations Generated</p>
                <p className="text-white font-bold">{data.productivity.citations.generated}</p>
              </div>
              <div className="rounded-xl bg-[#080808] p-3">
                <p className="text-[#606060]">Documents Created</p>
                <p className="text-white font-bold">{data.productivity.essays.documentsCreated}</p>
              </div>
            </div>
          </div>

          {/* Tool Activity */}
          {data.toolActivity.length > 0 && (
            <div className="rounded-2xl border border-[#242424] bg-[#0d1117] p-5 space-y-2">
              <p className="text-[10px] font-bold uppercase text-[#909090]">Tool Activity</p>
              {data.toolActivity.map((t) => (
                <div key={t.tool} className="flex justify-between text-xs">
                  <span className="text-[#C0C0C0]">{t.tool}</span>
                  <span className="text-[#909090]">{t.sessions} session{t.sessions !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
