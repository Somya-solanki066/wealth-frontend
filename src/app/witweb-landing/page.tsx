"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseEnrollButton from "@/components/CourseEnrollButton";
import { useContent } from "@/hooks/useContent";

export default function WitWebLanding() {
  const { content } = useContent("witweb-landing");
  const [openModules, setOpenModules] = useState<Record<number, boolean>>({
    1: true, // Module 1 open by default
  });

  const toggleModule = (id: number) => {
    setOpenModules((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

      <main className="flex-grow pb-24">
        {/* HERO */}
        <div className="lp-hero">
          <div className="lp-badge">
            {content.heroBadge || "Witweb Certification"}
          </div>
          <h1 className="lp-h1">
            {content.heroTitle || "Write It. Publish It. Earn From It."}
          </h1>
          <p className="lp-sub">
            {content.heroSubtitle || "The complete guide to writing, publishing, and earning from serialized fiction on PocketFM, Dreame, GoodNovel, WebNovel, and 5 more platforms."}
          </p>
          <div className="lp-btns">
            <CourseEnrollButton
              courseId="witweb"
              className="btn-g"
              style={{ fontSize: "15px", padding: "16px 40px", textDecoration: "none", display: "inline-block" }}
            >
              Enroll Now — ₦35,000
            </CourseEnrollButton>
            <Link href="/dashboard" className="btn-o" style={{ fontSize: "15px", padding: "15px 36px", textDecoration: "none", display: "inline-block" }}>
              Preview Free Lessons
            </Link>
          </div>
          <div className="lp-stats">
            <div><div className="ls-num">12</div><div className="ls-lbl">Modules</div></div>
            <div><div className="ls-num">48+</div><div className="ls-lbl">Lessons</div></div>
            <div><div className="ls-num">9</div><div className="ls-lbl">Platforms</div></div>
            <div><div className="ls-num">∞</div><div className="ls-lbl">Lifetime Access</div></div>
          </div>
        </div>

        {/* WHAT YOU LEARN */}
        <div className="wyl">
          <div className="wyl-inner">
            <span className="sec-label">What You Will Learn</span>
            <h2 className="sec-h2">Everything a Serialized<br />Fiction Writer Needs</h2>
            <div className="learn-grid">
              <div className="learn-item">
                <div className="li-icon">📖</div>
                <div>
                  <div className="li-title">How Each Platform Works</div>
                  <div className="li-desc">What PocketFM, Dreame, GoodNovel, WebNovel, MegaNovel, AlphaNovel, Letterlux, Stary, and NovelSnack specifically want from writers.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">🎯</div>
                <div>
                  <div className="li-title">Writing Chapters That Convert</div>
                  <div className="li-desc">How to write hooks, build emotional tension, and create cliffhangers that make readers pay to unlock the next chapter every time.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">📝</div>
                <div>
                  <div className="li-title">Platform Submission Process</div>
                  <div className="li-desc">The exact steps to submit your manuscript, what editors look for, and how to negotiate your contract terms.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">💰</div>
                <div>
                  <div className="li-title">Earning Consistently</div>
                  <div className="li-desc">How payment works on each platform, how to maximise your per-chapter earnings, and how to build a sustainable writing income.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">🔍</div>
                <div>
                  <div className="li-title">AI-Assisted Writing</div>
                  <div className="li-desc">How to use the Ink2Wealth Chapter Analyzer to get platform-specific feedback and the Smart Edit Suite to polish your prose.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">📣</div>
                <div>
                  <div className="li-title">Building Your Reader Base</div>
                  <div className="li-desc">TikTok BookTok strategy, Goodreads promotion, Reddit posting, Medium articles — turning readers into loyal fans who follow you everywhere.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CURRICULUM */}
        <div className="curriculum">
          <div className="curr-inner">
            <span className="sec-label">Full Curriculum</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 900, color: "var(--wh)", marginBottom: "32px" }}>
              12 Modules. 48 Lessons.<br />Everything Covered.
            </h2>

            <div className="space-y-3">
              {modules.map((m) => {
                const isOpen = !!openModules[m.id];
                return (
                  <div 
                    key={m.id}
                    className={`module ${isOpen ? "open" : ""}`}
                    onClick={() => toggleModule(m.id)}
                  >
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">{m.num}</div>
                        <div>
                          <div className="mod-title">{m.title}</div>
                          <div className="mod-meta">{m.meta}</div>
                        </div>
                      </div>
                      <span className="mod-arrow" style={{ transform: isOpen ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform .2s" }}>›</span>
                    </div>
                    {isOpen && (
                      <div className="module-body" onClick={(e) => e.stopPropagation()}>
                        {m.lessons.map((les, index) => (
                          <div key={index} className="lesson">
                            <span className="les-icon">▶️</span>
                            <span className="les-title">{les.title}</span>
                            {les.free ? (
                              <span className="les-free">FREE</span>
                            ) : (
                              <span className="les-lock">ENROLLED</span>
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
        </div>

        {/* INSTRUCTOR */}
        <div className="instructor">
          <div className="instr-inner">
            <div className="instr-avatar">👨‍🏫</div>
            <div>
              <div className="instr-name">Victor Daniels</div>
              <div className="instr-title">Writing Coach · Serialized Fiction Expert · Founder of Ink2Wealth</div>
              <div className="instr-desc">Victor Daniels is a serialized fiction writer, writing coach, and the founder of Ink2Wealth Media Limited. He publishes on PocketFM, Dreame, GoodNovel, WebNovel, and other major platforms, and has coached thousands of writers through his WIT-WEB community and courses. His teaching style is direct, practical, and rooted in real publishing experience — not theory.</div>
              <div className="instr-stats">
                <div><div className="is-num">2,400+</div><div className="is-lbl">Students</div></div>
                <div><div className="is-num">9</div><div className="is-lbl">Platforms</div></div>
                <div><div className="is-num">@CoachVictorDaniels</div><div className="is-lbl">YouTube</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* PRICING */}
        <div className="price-box">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="sec-label">Enroll Today</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 900, color: "var(--wh)" }}>Choose Your Access</h2>
          </div>
          <div className="pb-inner">
            <div className="pb-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div>
                <div className="pb-name">Standard Enrollment</div>
                <div className="pb-price">₦35,000</div>
                <div className="pb-period">One-time payment · Lifetime access</div>
                <div className="pb-items">
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>All 12 modules — 48 lessons</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Lifetime access — watch anytime</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Downloadable resources and templates</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Community access — WIT-WEB writers group</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Certificate of completion</div>
                </div>
                <CourseEnrollButton courseId="witweb" className="btn-g" style={{ width: "100%" }}>
                  Enroll — ₦35,000
                </CourseEnrollButton>
              </div>
            </div>
            <div className="pb-card feat" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, padding: "4px 16px", borderRadius: "20px", background: "linear-gradient(135deg,var(--gl),var(--gm))", color: "#080808", display: "inline-block", marginBottom: "12px" }}>BEST VALUE</div>
                <div className="pb-name">WIT-WEB + App Bundle</div>
                <div className="pb-price">₦55,000</div>
                <div className="pb-period">One-time payment · Lifetime course + 1 year app</div>
                <div className="pb-items">
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Everything in Standard</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>1 year Ink2Wealth Premium app access</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Priority support from Coach Victor</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>One private 30-min coaching session</div>
                  <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Early access to new modules</div>
                </div>
                <CourseEnrollButton courseId="witweb-bundle" className="btn-g" style={{ width: "100%" }}>
                  Get the Bundle — ₦55,000
                </CourseEnrollButton>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* STICKY ENROLL */}
      <div className="sticky-enroll">
        <div className="se-left">
          <div>
            <div className="se-name">WIT-WEB Academy</div>
            <div style={{ fontSize: "12px", color: "var(--m1)" }}>12 modules · Lifetime access · Certificate included</div>
          </div>
          <div className="se-price">₦35,000</div>
        </div>
        <CourseEnrollButton
          courseId="witweb"
          className="btn-g"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          Enroll Now →
        </CourseEnrollButton>
      </div>

      <Footer />
    </div>
  );
}
