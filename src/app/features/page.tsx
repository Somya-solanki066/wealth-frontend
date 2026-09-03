"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
  Sparkles,
  Search,
  CheckCircle,
  PenTool,
  BookOpen,
  Clapperboard,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { useCatalog } from "@/hooks/useCatalog";

export default function FeaturesPage() {
  const { content } = useContent("features");
  const { platforms: catalogPlatforms } = useCatalog();
  const [activePlatform, setActivePlatform] = useState("PocketFM");

  const platforms = catalogPlatforms.map((item) => item.name);

  useEffect(() => {
    if (platforms.length && !platforms.includes(activePlatform)) {
      setActivePlatform(platforms[0]);
    }
  }, [platforms, activePlatform]);

  const features = [
    {
      icon: <Search className="h-9 w-9 text-[var(--gd)]" />,
      title: content.feat1Title || "Chapter Analyzer",
      desc: content.feat1Desc || "Paste your chapter. Select your platform. AI reads it and returns a score, metric breakdown, platform-specific tip, and detailed insight cards.",
      badge: "FREE — 3/month",
      badgeType: "free",
      link: "/dashboard?tab=tools",
    },
    {
      icon: <CheckCircle className="h-9 w-9 text-[var(--gd)]" />,
      title: content.feat2Title || "Smart Edit Suite",
      desc: content.feat2Desc || "8 AI-powered editing checks: Grammar, Passive Voice, Filler Words, Stronger Verbs, Repetition, Pacing & Flow, Dialogue Quality, Plagiarism.",
      badge: "3 checks FREE",
      badgeType: "free",
      link: "/dashboard?tab=tools",
    },
    {
      icon: <PenTool className="h-9 w-9 text-[var(--gd)]" />,
      title: content.feat3Title || "AI Ghost Writer",
      desc: content.feat3Desc || "Give us your characters, platform, genre, and what should happen. AI writes a complete, platform-ready chapter for you — 800 to 2,000 words.",
      badge: "PREMIUM",
      badgeType: "pro",
      link: "/dashboard?tab=ghost-writer",
    },
    {
      icon: <BookOpen className="h-9 w-9 text-[var(--gd)]" />,
      title: content.feat4Title || "Novel Editor",
      desc: content.feat4Desc || "A clean, distraction-free editor built for serialized fiction. Knows the rules of PocketFM, Dreame, GoodNovel, and 6 more platforms.",
      badge: "FREE",
      badgeType: "free",
    },
    {
      icon: <Clapperboard className="h-9 w-9 text-[var(--gd)]" />,
      title: content.feat5Title || "Script Editor",
      desc: content.feat5Desc || "Professional screenplay formatting in Courier Prime. Scene headings, action lines, character, dialogue, parenthetical — all at one tap.",
      badge: "FREE",
      badgeType: "free",
    },
    {
      icon: <GraduationCap className="h-9 w-9 text-[var(--gd)]" />,
      title: content.feat6Title || "Student Hub",
      desc: content.feat6Desc || "Study Planner, Flashcards, Citation Generator (APA/MLA/Harvard/Chicago/Vancouver), Essay Writer, Course Videos, Exam Techniques.",
      badge: "FREE tools included",
      badgeType: "free",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-grow pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-16">
          
          {/* Page Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
              {content.heroPreTitle || "Everything You Need"}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white">
              {content.heroTitleBlack || "Built for"} <span className="text-[var(--gd)]">{content.heroTitleGold || "Serious Writers"}</span>
            </h1>
            <p className="text-[#909090] text-sm md:text-base leading-relaxed">
              {content.heroSubtitle || "Every tool you need to write, edit, publish, and earn — all in one place. No more switching between apps."}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const CardContent = (
                <div
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group shadow-lg h-full cursor-pointer"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--gd)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="mb-6">{feat.icon}</div>
                  <h3 className="font-serif text-lg font-bold text-white mb-2 group-hover:text-[var(--gd)] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-[#909090] leading-relaxed mb-6">
                    {feat.desc}
                  </p>

                  <span
                    className={`inline-block text-[9px] font-bold px-3 py-1 rounded-md ${
                      feat.badgeType === "free"
                        ? "bg-[#52C07A]/10 text-[#52C07A]"
                        : "bg-[var(--gd)]/10 text-[var(--gd)]"
                    }`}
                  >
                    {feat.badge}
                  </span>
                </div>
              );

              return feat.link ? (
                <Link href={feat.link} key={idx} className="block h-full">
                  {CardContent}
                </Link>
              ) : (
                <div key={idx} className="block h-full">
                  {CardContent}
                </div>
              );
            })}
          </div>

          {/* Platforms section */}
          <div className="border-t border-[#242424] pt-16 text-center space-y-6 max-w-4xl mx-auto">
            <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
              {content.platformsPreTitle || "Supported Platforms"}
            </span>
            <p className="text-xs text-[#909090]">
              {content.platformsSubtitle || "The Chapter Analyzer gives platform-specific feedback for all 9 platforms"}
            </p>
            
            <div className="flex flex-wrap gap-3 justify-center">
              {platforms.map((plat) => {
                const isActive = activePlatform === plat;
                return (
                  <button
                    key={plat}
                    onClick={() => setActivePlatform(plat)}
                    className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--gd)]/12 border-[var(--gm)] text-[var(--gd)]"
                        : "bg-[#161616] border-[#242424] text-[#909090] hover:text-[#F0EBE0]"
                    }`}
                  >
                    {plat}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
