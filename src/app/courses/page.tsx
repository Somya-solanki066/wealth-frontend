"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, Clapperboard, Download, Play, ShieldAlert, Award, GraduationCap, ChevronDown, CheckCircle, HelpCircle } from "lucide-react";

export default function CoursesPage() {
  const [toastMessage, setToastMessage] = useState("");
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const handleEnrollClick = (courseName: string) => {
    setSelectedCourse(courseName);
    setIsEnrollModalOpen(true);
  };

  // Curriculum modules list
  const modules = [
    {
      id: 1,
      num: "01",
      title: "Introduction to Serialized Fiction",
      meta: "4 lessons · 45 mins",
      lessons: [
        { title: "What is serialized fiction and why it is the future", free: true },
        { title: "The difference between webnovels and traditional publishing", free: true },
        { title: "Overview of all 9 platforms", free: false },
        { title: "How to choose the right platform for your story", free: false },
      ]
    },
    {
      id: 2,
      num: "02",
      title: "Deep Dive: PocketFM",
      meta: "5 lessons · 52 mins",
      lessons: [
        { title: "PocketFM editorial standards explained", free: false },
        { title: "Character arc and emotional development for audio", free: false },
        { title: "The perfect PocketFM hook formula", free: false },
        { title: "How to submit to PocketFM — step by step", free: false },
        { title: "PocketFM payment rates and contract negotiation", free: false },
      ]
    },
    {
      id: 3,
      num: "03",
      title: "Deep Dive: Dreame & Stary",
      meta: "4 lessons · 48 mins",
      lessons: [
        { title: "What Dreame editors look for in a submission", free: false },
        { title: "Relationship dynamics and chemistry as a product", free: false },
        { title: "Hate-to-love, scorned bride, and alpha-luna execution", free: false },
        { title: "Dreame vs Stary — which is right for your story", free: false },
      ]
    },
    {
      id: 4,
      num: "04",
      title: "Deep Dive: GoodNovel & AlphaNovel",
      meta: "4 lessons · 44 mins",
      lessons: [
        { title: "Emotional, fast-paced writing that earns unlocks", free: false },
        { title: "The GoodNovel smooth writing standard", free: false },
        { title: "AlphaNovel platform requirements", free: false },
        { title: "How to write chapters that earn coin unlocks", free: false },
      ]
    },
    {
      id: 5,
      num: "05",
      title: "Deep Dive: WebNovel, MegaNovel & Letterlux",
      meta: "4 lessons · 50 mins",
      lessons: [
        { title: "WebNovel anti-AI policy and what it means for writers", free: false },
        { title: "MegaNovel urban fiction — son-in-law and hidden billionaire", free: false },
        { title: "Letterlux strict standards and exclusive contracts", free: false },
        { title: "NovelSnack — vampire, hockey, and rebirth tropes", free: false },
      ]
    },
    {
      id: 6,
      num: "06",
      title: "Writing the Perfect Chapter",
      meta: "5 lessons · 58 mins",
      lessons: [
        { title: "The anatomy of a winning opening hook", free: false },
        { title: "Building emotional tension chapter by chapter", free: false },
        { title: "Dialogue that reveals character and drives plot", free: false },
        { title: "The cliffhanger formula that drives unlocks", free: false },
        { title: "Pacing — how fast is too fast, how slow is too slow", free: false },
      ]
    },
    {
      id: 7,
      num: "07",
      title: "Using Ink2Wealth to Write Better",
      meta: "4 lessons · 42 mins",
      lessons: [
        { title: "Using the Chapter Analyzer to get platform feedback", free: false },
        { title: "Smart Edit Suite walkthrough — fixing your prose", free: false },
        { title: "AI Ghost Writer — when and how to use it ethically", free: false },
        { title: "Managing your projects in the Story Manager", free: false },
      ]
    },
    {
      id: 8,
      num: "08–12",
      title: "Submission, Contracts, Earnings & Marketing",
      meta: "22 lessons · 3.5 hrs",
      lessons: [
        { title: "Module 8 — The submission process explained", free: false },
        { title: "Module 9 — Reading and negotiating your contract", free: false },
        { title: "Module 10 — How earnings are calculated per platform", free: false },
        { title: "Module 11 — Building your reader base and social following", free: false },
        { title: "Module 12 — Scaling to multiple platforms simultaneously", free: false },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] bg-[#1a1200] border border-[var(--gm)] text-[var(--gd)] font-semibold text-xs px-6 py-3 rounded-xl shadow-2xl transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pb-24">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-radial-gradient-hero text-center py-20 px-6 border-b border-[#242424]">
          <div className="max-w-4xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full text-[10px] font-bold tracking-widest text-[var(--gd)] bg-[var(--gd)]/10 border border-[var(--gm)]/30 uppercase">
              Ink2Wealth Academy
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-black text-white leading-tight">
              Learn to Write.<br />
              <span className="text-[var(--gd)] italic">Learn to Earn.</span>
            </h1>
            <p className="text-[#909090] text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              Two flagship courses by Coach Victor Daniels. Master serialized fiction or screenwriting — then use the Ink2Wealth platform to put it all into practice.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button 
                onClick={() => handleEnrollClick("WIT-WEB Academy")}
                className="px-8 py-4 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 text-zinc-950 font-bold rounded-xl text-sm transition-all hover:scale-[1.02]"
              >
                Enroll Now — ₦35,000
              </button>
              <Link 
                href="/login"
                className="px-8 py-4 border border-[var(--gm)] hover:bg-[var(--gd)]/5 text-[var(--gd)] font-bold rounded-xl text-sm transition-all"
              >
                Preview Free Lessons
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#242424]/80 max-w-3xl mx-auto text-center">
              <div>
                <span className="font-serif text-2xl md:text-3xl font-black text-[var(--gd)] block">12</span>
                <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider">Modules</span>
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl font-black text-[var(--gd)] block">48+</span>
                <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider">Lessons</span>
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl font-black text-[var(--gd)] block">9</span>
                <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider">Platforms</span>
              </div>
              <div>
                <span className="font-serif text-2xl md:text-3xl font-black text-[var(--gd)] block">∞</span>
                <span className="text-[10px] text-[#606060] font-bold uppercase tracking-wider">Lifetime Access</span>
              </div>
            </div>
          </div>
        </section>

        {/* FLAGSHIP COURSES HUB CARDS */}
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* WIT-WEB Course */}
            <div 
              onClick={() => handleEnrollClick("WIT-WEB Academy")}
              className="bg-[#0f0f0f] border border-[#242424] hover:border-[var(--gm)] rounded-3xl p-8 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-gradient-to-br from-[var(--bg1)] to-[var(--bg2)] rounded-2xl border border-[var(--gm)] flex items-center justify-center text-3xl mb-6">
                  📖
                </div>
                <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase block mb-2">
                  WIT-WEB Academy
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-black text-white mb-3">
                  Webnoveling Ink to Wealth Blueprint
                </h3>
                <p className="text-xs text-[#909090] leading-relaxed mb-6">
                  Write, publish, and earn from serialized fiction on PocketFM, Dreame, GoodNovel, and 6 more platforms.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-[var(--gd)]/10 border border-[var(--gm)]/20 text-[var(--gd)]">9 Platforms</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">12 Modules</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">Lifetime Access</span>
                </div>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 text-zinc-950 font-bold rounded-xl text-xs transition-all">
                View Course →
              </button>
            </div>

            {/* SSG Blueprint Course */}
            <div 
              onClick={() => handleEnrollClick("SSG Blueprint")}
              className="bg-[#0f0f0f] border border-[#242424] hover:border-red-500/30 rounded-3xl p-8 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#2a0008] to-[#2e0014] rounded-2xl border border-red-500/30 flex items-center justify-center text-3xl mb-6">
                  🎬
                </div>
                <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase block mb-2">
                  SSG Blueprint
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-black text-white mb-3">
                  Scriptwriting & Screenwriting Guide
                </h3>
                <p className="text-xs text-[#909090] leading-relaxed mb-6">
                  Master screenplay and script writing from concept to final draft. Feature films, TV series, audio drama.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400">Film & TV</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">10 Modules</span>
                  <span className="text-[9px] font-bold px-2.5 py-1 rounded bg-sky-500/10 border border-sky-500/20 text-sky-400">Lifetime Access</span>
                </div>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-red-600 to-red-800 text-white font-bold rounded-xl text-xs transition-all">
                View Course →
              </button>
            </div>
          </div>
        </section>

        {/* CORE CURRICULUM ACCORDION */}
        <section className="bg-[#0f0f0f] border-y border-[#242424] py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase block mb-2">Full Curriculum</span>
              <h2 className="font-serif text-3xl md:text-4xl font-black text-white">
                12 Modules. 48 Lessons.<br />Everything Covered.
              </h2>
            </div>

            <div className="space-y-4">
              {modules.map((m, idx) => {
                const isOpen = openModuleIndex === idx;
                return (
                  <div 
                    key={m.id}
                    className="bg-[#161616] border border-[#242424] rounded-2xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => setOpenModuleIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-zinc-900/40"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[var(--bg1)] to-[var(--bg2)] border border-[var(--gm)] rounded-xl flex items-center justify-center text-xs font-bold text-[var(--gd)] shrink-0">
                          {m.num}
                        </div>
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-white leading-tight">{m.title}</h4>
                          <span className="text-[10px] text-[#606060] font-bold block mt-1">{m.meta}</span>
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-[#606060] transition-transform duration-200 ${isOpen ? "transform rotate-180 text-[var(--gd)]" : ""}`} />
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#242424] bg-zinc-950/20 px-5 py-3 divide-y divide-[#242424]">
                        {m.lessons.map((les, lIdx) => (
                          <div key={lIdx} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                              <Play className="h-3 w-3 text-[#606060] shrink-0 fill-current" />
                              <span className="text-xs text-[#909090] font-medium leading-relaxed">{les.title}</span>
                            </div>
                            {les.free ? (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Free Preview</span>
                            ) : (
                              <span className="text-[9px] font-bold text-[var(--gd)] bg-[var(--gd)]/5 border border-[var(--gm)]/30 px-2 py-0.5 rounded uppercase tracking-wider">Enrolled</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHAT YOU LEARN GRID */}
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase block mb-2">What You Will Learn</span>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-white mb-12">
            Everything a Serialized<br />Fiction Writer Needs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <div className="bg-[#0f0f0f] border border-[#242424] rounded-2xl p-6 space-y-3">
              <div className="text-2xl">📖</div>
              <h4 className="font-bold text-white text-sm">How Each Platform Works</h4>
              <p className="text-xs text-[#909090] leading-relaxed">
                What PocketFM, Dreame, GoodNovel, WebNovel, MegaNovel, AlphaNovel, and 3 more platforms specifically want from writers.
              </p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#242424] rounded-2xl p-6 space-y-3">
              <div className="text-2xl">🎯</div>
              <h4 className="font-bold text-white text-sm">Writing Chapters That Convert</h4>
              <p className="text-xs text-[#909090] leading-relaxed">
                How to write hooks, build emotional tension, and create cliffhangers that make readers pay to unlock the next chapter.
              </p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#242424] rounded-2xl p-6 space-y-3">
              <div className="text-2xl">📝</div>
              <h4 className="font-bold text-white text-sm">Platform Submission Process</h4>
              <p className="text-xs text-[#909090] leading-relaxed">
                The exact steps to submit your manuscript, what editors look for, and how to negotiate your contract terms.
              </p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#242424] rounded-2xl p-6 space-y-3">
              <div className="text-2xl">💰</div>
              <h4 className="font-bold text-white text-sm">Earning Consistently</h4>
              <p className="text-xs text-[#909090] leading-relaxed">
                How payment works, how to maximise your per-chapter earnings, and how to build a sustainable writing income.
              </p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#242424] rounded-2xl p-6 space-y-3">
              <div className="text-2xl">🔍</div>
              <h4 className="font-bold text-white text-sm">AI-Assisted Writing</h4>
              <p className="text-xs text-[#909090] leading-relaxed">
                How to use the Ink2Wealth Chapter Compliance Analyzer to scan against platform guidelines and compliance scores.
              </p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#242424] rounded-2xl p-6 space-y-3">
              <div className="text-2xl">📣</div>
              <h4 className="font-bold text-white text-sm">Building Your Reader Base</h4>
              <p className="text-xs text-[#909090] leading-relaxed">
                TikTok BookTok strategy, Medium articles, and community posting to turn casual readers into loyal fans.
              </p>
            </div>
          </div>
        </section>

        {/* INSTRUCTOR BIO BIO */}
        <section className="bg-[#0f0f0f] border-t border-[#242424] py-16 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 rounded-full border-4 border-[var(--gd)] bg-gradient-to-br from-[var(--bg1)] to-[#2a1e00] flex items-center justify-center text-6xl shadow-2xl shrink-0">
              👨‍🏫
            </div>
            <div className="space-y-4 text-left">
              <h3 className="font-serif text-3xl font-black text-white leading-tight">Victor Daniels</h3>
              <span className="text-xs font-bold text-[var(--gd)] uppercase tracking-wider block">
                Writing Coach · Serialized Fiction Expert · Founder of Ink2Wealth
              </span>
              <p className="text-xs md:text-sm text-[#909090] leading-relaxed">
                Victor Daniels is a serialized fiction writer, writing coach, and the founder of Ink2Wealth Media Limited. He publishes on PocketFM, Dreame, GoodNovel, WebNovel, and other major platforms, and has coached thousands of writers through his WIT-WEB community and courses. His teaching style is direct, practical, and rooted in real publishing experience — not theory.
              </p>
              <div className="flex gap-8 pt-2">
                <div>
                  <span className="font-serif text-2xl font-black text-[var(--gd)] block">2,400+</span>
                  <span className="text-[9px] text-[#606060] font-bold uppercase tracking-wider">Students</span>
                </div>
                <div>
                  <span className="font-serif text-2xl font-black text-[var(--gd)] block">9</span>
                  <span className="text-[9px] text-[#606060] font-bold uppercase tracking-wider">Platforms</span>
                </div>
                <div>
                  <span className="font-serif text-2xl font-black text-[var(--gd)] block">YouTube</span>
                  <span className="text-[9px] text-[#606060] font-bold uppercase tracking-wider">@CoachVictorDaniels</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING PLANS DETAILS */}
        <section id="pricing" className="max-w-4xl mx-auto px-6 py-16 text-center">
          <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase block mb-2">Enroll Today</span>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-white mb-12">Choose Your Access</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Standard Enrollment */}
            <div 
              onClick={() => handleEnrollClick("Standard Enrollment")}
              className="bg-[#0f0f0f] border border-[#242424] hover:border-[var(--gm)] rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-[#606060] uppercase tracking-widest block mb-2">Standard Enrollment</span>
                <span className="font-serif text-4xl md:text-5xl font-black text-[var(--gd)] block mb-2">₦35,000</span>
                <span className="text-[10px] text-[#606060] font-bold uppercase block mb-6">One-time payment · Lifetime access</span>
                
                <div className="space-y-3.5 text-left border-t border-[#242424] pt-6 mb-8 text-xs text-[#909090]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>All 12 modules — 48 lessons</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Lifetime access — watch anytime</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Downloadable resources and templates</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Community access — WIT-WEB writers group</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </div>
              <button className="w-full py-3 bg-[#161616] border border-[var(--gm)] hover:bg-[var(--gd)]/5 text-[var(--gd)] font-bold rounded-xl text-xs transition-all">
                Enroll — ₦35,000
              </button>
            </div>

            {/* Bundle Premium Enrollment */}
            <div 
              onClick={() => handleEnrollClick("WIT-WEB + App Bundle")}
              className="bg-gradient-to-br from-[#1a1200] to-[#0f0f0f] border border-[var(--gm)] rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-1 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 font-bold text-[9px] rounded-full uppercase tracking-wider mb-4">Best Value</span>
                <span className="text-[10px] font-bold text-[var(--gd)] uppercase tracking-widest block mb-2">WIT-WEB + App Bundle</span>
                <span className="font-serif text-4xl md:text-5xl font-black text-[var(--gd)] block mb-2">₦55,000</span>
                <span className="text-[10px] text-[#606060] font-bold uppercase block mb-6">One-time payment · Course + 1 Year App</span>
                
                <div className="space-y-3.5 text-left border-t border-[var(--gm)]/30 pt-6 mb-8 text-xs text-[#909090]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--gd)] font-bold">✓</span>
                    <span className="text-white">Everything in Standard access</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--gd)] font-bold">✓</span>
                    <span className="text-white">1 Year Ink2Wealth Premium App Access</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--gd)] font-bold">✓</span>
                    <span>Priority support directly from Coach Victor</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--gd)] font-bold">✓</span>
                    <span>One private 30-min strategy session</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--gd)] font-bold">✓</span>
                    <span>Early access to newly released modules</span>
                  </div>
                </div>
              </div>
              <button className="w-full py-3 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 text-zinc-950 font-bold rounded-xl text-xs transition-all">
                Get the Bundle — ₦55,000
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* STICKY BOTTOM ENROLL BANNER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#080808]/95 backdrop-blur-lg border-t border-[#242424] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
        <div className="text-center sm:text-left space-y-0.5">
          <h4 className="font-serif text-sm font-bold text-white">WIT-WEB Academy — Blueprint</h4>
          <p className="text-[10px] text-[#606060] font-medium">12 modules · Lifetime access · Certificate included</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-serif text-lg font-black text-[var(--gd)]">₦35,000</span>
          <button 
            onClick={() => handleEnrollClick("WIT-WEB Academy")}
            className="px-6 py-2.5 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 text-zinc-950 font-bold rounded-xl text-xs transition-all"
          >
            Enroll Now →
          </button>
        </div>
      </div>

      {/* ENROLLMENT MODAL TRIGGER */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f0f0f] border border-[#242424] rounded-3xl p-8 max-w-md w-full relative space-y-6">
            <button 
              onClick={() => setIsEnrollModalOpen(false)}
              className="absolute top-4 right-4 text-[#909090] hover:text-white text-base focus:outline-none"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <span className="text-[9px] font-bold text-[var(--gd)] uppercase tracking-widest block">Complete Signup</span>
              <h3 className="font-serif text-xl font-bold text-white">Enroll in {selectedCourse}</h3>
              <p className="text-xs text-[#909090] leading-relaxed">
                Enter your details to create an account and unlock lifetime access keys to the training portal.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-[#606060] uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@email.com"
                  className="w-full bg-[#161616] border border-[#242424] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[var(--gm)]" 
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#606060] uppercase tracking-wider mb-2">Pen Name / Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Writer Pen"
                  className="w-full bg-[#161616] border border-[#242424] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-[var(--gm)]" 
                />
              </div>
              <button 
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  triggerToast("Enrollment successful! Check your email to set account password.");
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 font-bold rounded-xl text-xs transition-all"
              >
                Proceed to Payment
              </button>
              <p className="text-[9px] text-[#606060] text-center leading-relaxed">
                Payments processed securely via Paystack in Nigerian Naira (₦).
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
