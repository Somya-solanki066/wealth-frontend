"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bookmark,
  BrainCircuit,
  Calendar,
  ChevronDown,
  ChevronUp,
  PenTool,
  Sparkles,
  Video,
  BookOpen,
  School,
  Pill,
  Stethoscope,
  Scale,
  BarChart3,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import StudyPlannerWizard from "@/components/StudyPlannerWizard";
import FlashcardsWorkspace from "@/components/FlashcardsWorkspace";
import CitationWorkspace from "@/components/CitationWorkspace";
import VideoFinderWorkspace from "@/components/VideoFinderWorkspace";
import EssayWriterWorkspace from "@/components/EssayWriterWorkspace";
import JambPracticeWorkspace from "@/components/JambPracticeWorkspace";
import UniversityPastQuestionsWorkspace from "@/components/UniversityPastQuestionsWorkspace";
import NursingHubWorkspace from "@/components/NursingHubWorkspace";
import MbbsHubWorkspace from "@/components/MbbsHubWorkspace";
import ProfessionalCoursesWorkspace from "@/components/ProfessionalCoursesWorkspace";
import SmartPerformanceAnalyticsWorkspace from "@/components/SmartPerformanceAnalyticsWorkspace";

type StudentToolId =
  | "jamb-practice"
  | "university-past"
  | "nursing-hub"
  | "mbbs-hub"
  | "professional-courses"
  | "performance-analytics"
  | "study-planner"
  | "flashcards"
  | "citation"
  | "video-finder"
  | "essay-writer"
  | "exam-techniques";

const TOOLS: {
  id: StudentToolId;
  title: string;
  desc: string;
  badge: "FREE" | "PREMIUM";
  icon: ReactNode;
}[] = [
  {
    id: "jamb-practice",
    title: "JAMB UTME Practice",
    desc: "CBT-style past questions — timer, mark for review, question map, and instant scoring.",
    badge: "FREE",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: "university-past",
    title: "University Past Questions",
    desc: "20 universities. Navigate University → Faculty → Department → Course → Year. 3 years free.",
    badge: "FREE",
    icon: <School className="h-5 w-5" />,
  },
  {
    id: "nursing-hub",
    title: "Nursing Hub",
    desc: "Year 1–5. MedSurg, MCH, Community Health, Mental Health, ICU, Emergency. Drug Calculation Tool built in.",
    badge: "FREE",
    icon: <Pill className="h-5 w-5" />,
  },
  {
    id: "mbbs-hub",
    title: "MBBS Hub",
    desc: "6-year programme. Pre-clinical, Para-clinical, Clinical. Clinical scenario questions — not just MCQs.",
    badge: "FREE",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    id: "professional-courses",
    title: "All Professional Courses",
    desc: "Law, Pharmacy, Med Lab Science, Radiography, Physiotherapy, Dentistry, Optometry, Nutrition, Public Health, Environmental Health.",
    badge: "FREE",
    icon: <Scale className="h-5 w-5" />,
  },
  {
    id: "performance-analytics",
    title: "Smart Performance Analytics",
    desc: "Score history, subject breakdown, weak area detector, study streak — know exactly what to study today.",
    badge: "FREE",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    id: "study-planner",
    title: "Study Planner",
    desc: "5-step Nigeria exam planner — WAEC, NECO, JAMB, school & uni. Save and reopen plans anytime.",
    badge: "FREE",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: "flashcards",
    title: "Active Recall Flashcards",
    desc: "Notes or topic → 10/15/20 cards → flip, Got It / Review Again, session results.",
    badge: "FREE",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: "citation",
    title: "Citation Generator",
    desc: "APA, MLA, Harvard, Chicago, Vancouver — dynamic fields by source type, copy-ready.",
    badge: "FREE",
    icon: <Bookmark className="h-5 w-5" />,
  },
  {
    id: "video-finder",
    title: "Course Video Finder",
    desc: "Topic + level + exam → top 5 YouTube tutorials ranked for your study goal.",
    badge: "FREE",
    icon: <Video className="h-5 w-5" />,
  },
  {
    id: "essay-writer",
    title: "Essay & Project Writer",
    desc: "Premium AI drafts for SS/JSS/University — purpose, style, copy & download.",
    badge: "PREMIUM",
    icon: <PenTool className="h-5 w-5" />,
  },
  {
    id: "exam-techniques",
    title: "Exam Techniques",
    desc: "Six proven techniques with practical instructions — no AI needed.",
    badge: "FREE",
    icon: <BrainCircuit className="h-5 w-5" />,
  },
];

const EXAM_TECHNIQUES = [
  {
    title: "Active Recall",
    summary: "Close your notes and retrieve from memory.",
    body: "Study a topic, then put materials away and write or speak everything you remember. Check gaps and repeat. Stronger than re-reading because retrieval builds durable memory.",
    steps: [
      "Read or watch once carefully.",
      "Close notes and write a blank-page summary.",
      "Compare, correct mistakes, then retest tomorrow.",
    ],
  },
  {
    title: "Spaced Repetition",
    summary: "Review at expanding intervals.",
    body: "Review material just before you would forget it: same day, next day, 3 days, 1 week, 2 weeks. Flashcards and calendars make this easy.",
    steps: [
      "Create cards or a review list after first study.",
      "Schedule reviews: 1d → 3d → 7d → 14d.",
      "Move hard items back; easy items further out.",
    ],
  },
  {
    title: "Pomodoro",
    summary: "Focus in short, timed sprints.",
    body: "Work 25 minutes with zero distractions, then rest 5 minutes. After 4 rounds take a longer break. Protects focus and reduces burnout.",
    steps: [
      "Pick one task only.",
      "Set 25 minutes and work until the timer ends.",
      "Break 5 minutes; after 4 cycles take 15–30 minutes.",
    ],
  },
  {
    title: "Mind Mapping",
    summary: "See the whole topic as a connected map.",
    body: "Put the main concept in the center, branch into themes, then details. Great for revision and essay structure.",
    steps: [
      "Write the topic in the center.",
      "Add 4–7 main branches.",
      "Add keywords only — redraw from memory later.",
    ],
  },
  {
    title: "Memory Palace",
    summary: "Place facts along a familiar path.",
    body: "Link each fact to a room or spot you know well. Walk the route mentally during exams to recall the sequence.",
    steps: [
      "Choose a familiar route (home, school).",
      "Assign one fact to each landmark.",
      "Practice walking the path out loud.",
    ],
  },
  {
    title: "Feynman Technique",
    summary: "Teach it simply to find gaps.",
    body: "Explain the topic in plain language as if teaching a friend. Wherever you get stuck, restudy that part.",
    steps: [
      "Pick one concept.",
      "Explain it out loud in simple words.",
      "Note confusing parts, restudy, then re-explain cleanly.",
    ],
  },
];

export default function StudentHubWorkspace({
  initialTool,
  onToolChange,
}: {
  initialTool?: StudentToolId;
  onToolChange?: (tool: StudentToolId | null) => void;
}) {
  const searchParams = useSearchParams();
  const [activeTool, setActiveTool] = useState<StudentToolId | null>(
    initialTool || null
  );
  const [error, setError] = useState("");
  const [openTechnique, setOpenTechnique] = useState<number | null>(0);

  useEffect(() => {
    const toolParam = searchParams.get("tool") as StudentToolId | null;
    if (toolParam && TOOLS.some((t) => t.id === toolParam)) {
      setActiveTool(toolParam);
    } else if (initialTool) {
      setActiveTool(initialTool);
    }
  }, [searchParams, initialTool]);

  const selectTool = (id: StudentToolId | null) => {
    setActiveTool(id);
    setError("");
    onToolChange?.(id);
  };

  const activeMeta = useMemo(
    () => TOOLS.find((t) => t.id === activeTool) || null,
    [activeTool]
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="font-serif text-2xl font-bold text-white">Student Hub</h2>
        <p className="text-xs text-[#909090] mt-1">
          Nine study tools — JAMB, university past questions, nursing & MBBS hubs, planning, and exam prep.
        </p>
      </div>

      {!activeTool ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => selectTool(tool.id)}
              className="text-left bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-5 space-y-3 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gd)]/10 border border-[var(--gm)]/40 flex items-center justify-center text-[var(--gd)]">
                  {tool.icon}
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    tool.badge === "PREMIUM"
                      ? "bg-[var(--gd)]/15 text-[var(--gd)] border border-[var(--gm)]/40"
                      : "bg-[#52C07A]/10 text-[#52C07A] border border-[#52C07A]/30"
                  }`}
                >
                  {tool.badge}
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold text-white">{tool.title}</h3>
              <p className="text-[11px] text-[#909090] leading-relaxed">{tool.desc}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#242424] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gd)]">
                Student Hub
              </p>
              <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2 mt-1">
                {activeMeta?.icon}
                {activeMeta?.title}
              </h3>
              {activeMeta?.desc ? (
                <p className="text-xs text-[#909090] mt-1 max-w-2xl leading-relaxed">{activeMeta.desc}</p>
              ) : null}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => selectTool(null)}>
              All tools
            </Button>
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          {activeTool === "jamb-practice" && (
            <JambPracticeWorkspace onBack={() => selectTool(null)} />
          )}
          {activeTool === "university-past" && (
            <UniversityPastQuestionsWorkspace onBack={() => selectTool(null)} />
          )}
          {activeTool === "nursing-hub" && (
            <NursingHubWorkspace onBack={() => selectTool(null)} />
          )}
          {activeTool === "mbbs-hub" && (
            <MbbsHubWorkspace onBack={() => selectTool(null)} />
          )}
          {activeTool === "professional-courses" && (
            <ProfessionalCoursesWorkspace onBack={() => selectTool(null)} />
          )}
          {activeTool === "performance-analytics" && (
            <SmartPerformanceAnalyticsWorkspace onBack={() => selectTool(null)} />
          )}
          {activeTool === "study-planner" && <StudyPlannerWizard />}
          {activeTool === "flashcards" && <FlashcardsWorkspace />}
          {activeTool === "citation" && <CitationWorkspace />}
          {activeTool === "video-finder" && <VideoFinderWorkspace />}
          {activeTool === "essay-writer" && <EssayWriterWorkspace />}

          {activeTool === "exam-techniques" && (
            <div className="space-y-3">
              {EXAM_TECHNIQUES.map((tech, idx) => {
                const open = openTechnique === idx;
                return (
                  <div key={tech.title} className="bg-[#161616] border border-[#242424] rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 p-4 text-left"
                      onClick={() => setOpenTechnique(open ? null : idx)}
                    >
                      <div>
                        <h4 className="font-serif text-sm font-bold text-white">{tech.title}</h4>
                        <p className="text-[11px] text-[#909090] mt-0.5">{tech.summary}</p>
                      </div>
                      {open ? (
                        <ChevronUp className="h-4 w-4 text-[#909090] shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[#909090] shrink-0" />
                      )}
                    </button>
                    {open ? (
                      <div className="px-4 pb-4 space-y-3 border-t border-[#242424] pt-3">
                        <p className="text-xs text-[#F0EBE0] leading-relaxed">{tech.body}</p>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gd)] mb-2">
                            Practical instructions
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-xs text-[#909090]">
                            {tech.steps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
