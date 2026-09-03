"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  Sparkles,
  Bookmark,
  Video,
  PenTool,
  BrainCircuit,
} from "lucide-react";

export default function StudentPage() {
  const studentTools = [
    {
      icon: <Calendar className="h-9 w-9 text-[var(--gd)]" />,
      title: "Study Planner",
      desc: "AI generates a personalized day-by-day study schedule based on your subject and exam date.",
      badge: "FREE",
      premium: false,
      href: "/dashboard?tab=student&tool=study-planner",
    },
    {
      icon: <Sparkles className="h-9 w-9 text-[var(--gd)]" />,
      title: "Active Recall Flashcards",
      desc: "Paste your notes and AI generates smart question-and-answer flashcards for active recall.",
      badge: "FREE",
      premium: false,
      href: "/dashboard?tab=student&tool=flashcards",
    },
    {
      icon: <Bookmark className="h-9 w-9 text-[var(--gd)]" />,
      title: "Citation Generator",
      desc: "APA, MLA, Harvard, Chicago, Vancouver. Books, articles, websites, YouTube videos — all covered.",
      badge: "FREE",
      premium: false,
      href: "/dashboard?tab=student&tool=citation",
    },
    {
      icon: <Video className="h-9 w-9 text-[var(--gd)]" />,
      title: "Course Video Finder",
      desc: "Enter any topic and AI finds the best YouTube tutorials to help you master it fast.",
      badge: "FREE",
      premium: false,
      href: "/dashboard?tab=student&tool=video-finder",
    },
    {
      icon: <PenTool className="h-9 w-9 text-[var(--gd)]" />,
      title: "Essay & Project Writer",
      desc: "AI writes essays, research papers, dissertations, lab reports, and case studies to your word count.",
      badge: "PREMIUM",
      premium: true,
      href: "/dashboard?tab=student&tool=essay-writer",
    },
    {
      icon: <BrainCircuit className="h-9 w-9 text-[var(--gd)]" />,
      title: "Exam Techniques Hub",
      desc: "Active Recall, Spaced Repetition, Pomodoro, Mind Mapping, Memory Palace, Feynman Technique.",
      badge: "FREE",
      premium: false,
      href: "/dashboard?tab=student&tool=exam-techniques",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
              For Students
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white">
              Study Smarter. <span className="text-[var(--gd)]">Write Better.</span>
            </h1>
            <p className="text-[#909090] text-sm md:text-base leading-relaxed">
              Six powerful tools to help students plan, learn, cite, and write — all powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentTools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 text-center space-y-4 transition-all duration-200 hover:-translate-y-1 shadow-lg block"
              >
                <div className="mx-auto w-max">{tool.icon}</div>
                <h3 className="text-sm font-bold text-white">{tool.title}</h3>
                <p className="text-xs text-[#909090] leading-relaxed">{tool.desc}</p>
                <span
                  className={`inline-block text-[9px] font-bold px-3 py-1 rounded ${
                    tool.premium
                      ? "bg-[var(--gd)]/10 text-[var(--gd)]"
                      : "bg-[#52C07A]/10 text-[#52C07A]"
                  }`}
                >
                  {tool.badge}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
