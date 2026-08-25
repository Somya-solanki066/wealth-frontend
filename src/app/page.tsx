"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Common UI Component imports
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import Toast from "@/components/ui/Toast";

function LandingContent() {
  const { user, profile, loading, signOutUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // ── LOGGED OUT SCREEN STATE (CODE BLOCK A) ──
  const [activeScreen, setActiveScreen] = useState("home"); // home, witweb-landing, ssg-landing, dashboard
  const [activeDashView, setActiveDashView] = useState("dv-home"); // dv-home, dv-witweb, dv-ssg, dv-resources, dv-notes, dv-cert
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({ "01": true });

  const toggleMod = (id: string) => {
    setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Sync activeScreen with Next.js router query param client-side
  useEffect(() => {
    if (searchParams) {
      const screenParam = searchParams.get("screen");
      if (screenParam) {
        setActiveScreen(screenParam);
      } else {
        setActiveScreen("home");
      }
    }
  }, [searchParams]);

  // ── LOGGED IN SCREEN STATE (CODE BLOCK B) ──
  const [activeWealthTab, setActiveWealthTab] = useState("wc-jobs");
  const [selectedPlatform, setSelectedPlatform] = useState("PocketFM");

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const openModal = (id: string) => {
    setActiveModal(id);
  };
  const closeModal = () => {
    setActiveModal(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOutUser();
      showToast("Logged out successfully");
      setActiveScreen("home");
    } catch (err) {
      showToast("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // 1. PUBLIC VISITOR VIEW (LOGGED OUT - CODE BLOCK A)
  // ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
        
        {/* Toast */}
        {toastMessage && (
          <Toast message={toastMessage} onClose={() => setToastMessage("")} />
        )}

        {/* LOGGED OUT NAVBAR (using common Navbar component) */}
        <Navbar />

        {/* MAIN BODY SCENE SWITCHER */}
        <div className="flex-grow pt-[68px]">
          
          {/* SCREEN: HOME */}
          {activeScreen === "home" && (
            <div className="screen on">
              <div style={{ padding: "140px 5% 80px", textAlign: "center", background: "radial-gradient(ellipse at 50% 30%,#1a1000,#080808)" }}>
                <span className="lp-badge">Ink2Wealth Academy</span>
                <h1 className="lp-h1">Learn to Write.<br /><em>Learn to Earn.</em></h1>
                <p className="text-lg text-[#909090] max-w-[580px] mx-auto mb-10 leading-relaxed">
                  Two flagship courses by Coach Victor Daniels. Master serialized fiction or screenwriting — then use the Ink2Wealth platform to put it all into practice.
                </p>
                
                <div className="flex gap-6 justify-center flex-wrap">
                  {/* WIT-WEB Card */}
                  <div 
                    onClick={() => setActiveScreen("witweb-landing")} 
                    style={{ background: "linear-gradient(135deg,#1a1200,#2e2000)", border: "1px solid var(--gm)", borderRadius: "24px" }}
                    className="p-9 max-w-[420px] text-left cursor-pointer transition-transform duration-200 hover:-translate-y-1.5"
                  >
                    <div className="text-5xl mb-4">📖</div>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-[#C9A84C] mb-2">WIT-WEB Academy</p>
                    <p className="font-serif text-2xl font-bold text-white mb-2.5">Webnoveling Ink to Wealth Blueprint</p>
                    <p className="text-xs text-[#909090] leading-relaxed mb-5">Write, publish, and earn from serialized fiction on PocketFM, Dreame, GoodNovel, and 6 more platforms.</p>
                    <div className="flex gap-2 flex-wrap mb-5">
                      <Badge variant="gold">9 Platforms</Badge>
                      <Badge variant="green">12 Modules</Badge>
                      <Badge variant="gold">Lifetime Access</Badge>
                    </div>
                    <Button variant="primary" className="w-full" onClick={() => setActiveScreen("witweb-landing")}>
                      View Course →
                    </Button>
                  </div>

                  {/* SSG Card */}
                  <div 
                    onClick={() => setActiveScreen("ssg-landing")} 
                    style={{ background: "linear-gradient(135deg,#1a0008,#2e0014)", border: "1px solid rgba(224,82,82,.3)", borderRadius: "24px" }}
                    className="p-9 max-w-[420px] text-left cursor-pointer transition-transform duration-200 hover:-translate-y-1.5"
                  >
                    <div className="text-5xl mb-4">🎬</div>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-[#E05252] mb-2">SSG Blueprint</p>
                    <p className="font-serif text-2xl font-bold text-white mb-2.5">Scriptwriting & Screenwriting Guide</p>
                    <p className="text-xs text-[#909090] leading-relaxed mb-5">Master screenplay and script writing from concept to final draft. Feature films, TV series, audio drama.</p>
                    <div className="flex gap-2 flex-wrap mb-5">
                      <Badge variant="red">Film & TV</Badge>
                      <Badge variant="green">10 Modules</Badge>
                      <Badge variant="gold">Lifetime Access</Badge>
                    </div>
                    <Button 
                      variant="danger" 
                      className="w-full"
                      style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff" }}
                      onClick={() => setActiveScreen("ssg-landing")}
                    >
                      View Course →
                    </Button>
                  </div>
                </div>
              </div>

              <div style={{ padding: "60px 5%" }} className="bg-[#0f0f0f]">
                <div className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
                  <div>
                    <div className="font-serif text-4xl font-black text-[#C9A84C] mb-1.5">2,400+</div>
                    <div className="text-xs text-[#606060]">Community Writers</div>
                  </div>
                  <div>
                    <div className="font-serif text-4xl font-black text-[#C9A84C] mb-1.5">22</div>
                    <div className="text-xs text-[#606060]">Course Modules</div>
                  </div>
                  <div>
                    <div className="font-serif text-4xl font-black text-[#C9A84C] mb-1.5">9</div>
                    <div className="text-xs text-[#606060]">Platforms Covered</div>
                  </div>
                  <div>
                    <div className="font-serif text-4xl font-black text-[#C9A84C] mb-1.5">∞</div>
                    <div className="text-xs text-[#606060]">Lifetime Access</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN: WIT-WEB LANDING */}
          {activeScreen === "witweb-landing" && (
            <div className="screen on">
              {/* HERO */}
              <div className="lp-hero">
                <div className="lp-badge">WIT-WEB Academy</div>
                <h1 className="lp-h1">Write It. Publish It.<br /><em>Earn From It.</em></h1>
                <p className="lp-sub">The complete guide to writing, publishing, and earning from serialized fiction on PocketFM, Dreame, GoodNovel, WebNovel, and 5 more platforms.</p>
                <div className="lp-btns">
                  <Button variant="primary" size="lg" onClick={() => openModal("m-enroll-witweb")}>
                    Enroll Now — ₦35,000
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setActiveScreen("dashboard")}>
                    Preview Free Lessons
                  </Button>
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
                    <div className="learn-item"><div className="li-icon">📖</div><div><div className="li-title">How Each Platform Works</div><div className="li-desc">What PocketFM, Dreame, GoodNovel, WebNovel, MegaNovel, AlphaNovel, Letterlux, Stary, and NovelSnack specifically want.</div></div></div>
                    <div className="learn-item"><div className="li-icon">🎯</div><div><div className="li-title">Writing Chapters That Convert</div><div className="li-desc">How to write hooks, build emotional tension, and create cliffhangers that make readers pay to unlock chapters.</div></div></div>
                    <div className="learn-item"><div className="li-icon">📝</div><div><div className="li-title">Platform Submission Process</div><div className="li-desc">The exact steps to submit your manuscript, what editors look for, and how to negotiate contract terms.</div></div></div>
                    <div className="learn-item"><div className="li-icon">💰</div><div><div className="li-title">Earning Consistently</div><div className="li-desc">How payment works, how to maximise your per-chapter earnings, and how to build a sustainable writing income.</div></div></div>
                    <div className="learn-item"><div className="li-icon">🔍</div><div><div className="li-title">AI-Assisted Writing</div><div className="li-desc">How to use the Chapter Analyzer to get platform-specific feedback and the Smart Edit Suite to polish your prose.</div></div></div>
                    <div className="learn-item"><div className="li-icon">📣</div><div><div className="li-title">Building Your Reader Base</div><div className="li-desc">TikTok BookTok strategy, Goodreads promotion, Reddit posting, Medium articles — turning readers into loyal fans.</div></div></div>
                  </div>
                </div>
              </div>

              {/* CURRICULUM ACCORDION */}
              <div className="curriculum">
                <div className="curr-inner">
                  <span className="sec-label">Full Curriculum</span>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 900, color: "var(--wh)", marginBottom: "32px" }}>
                    12 Modules. 48 Lessons.<br />Everything Covered.
                  </h2>

                  {/* Module 1 */}
                  <div className={`module ${openModules["01"] ? "open" : ""}`} onClick={() => toggleMod("01")}>
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">01</div>
                        <div>
                          <div className="mod-title">Introduction to Serialized Fiction</div>
                          <div className="mod-meta">4 lessons · 45 mins</div>
                        </div>
                      </div>
                      <span className="mod-arrow">›</span>
                    </div>
                    <div className="module-body">
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">What is serialized fiction and why it is the future</span><Badge variant="green">FREE</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">The difference between webnovels and traditional publishing</span><Badge variant="green">FREE</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Overview of all 9 platforms</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">How to choose the right platform for your story</span><Badge variant="gold">ENROLLED</Badge></div>
                    </div>
                  </div>

                  {/* Module 2 */}
                  <div className={`module ${openModules["02"] ? "open" : ""}`} onClick={() => toggleMod("02")}>
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">02</div>
                        <div>
                          <div className="mod-title">Deep Dive: PocketFM</div>
                          <div className="mod-meta">5 lessons · 52 mins</div>
                        </div>
                      </div>
                      <span className="mod-arrow">›</span>
                    </div>
                    <div className="module-body">
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">PocketFM editorial standards explained</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Character arc and emotional development for audio</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">The perfect PocketFM hook formula</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">How to submit to PocketFM — step by step</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">PocketFM payment rates and contract negotiation</span><Badge variant="gold">ENROLLED</Badge></div>
                    </div>
                  </div>

                  {/* Module 3 */}
                  <div className={`module ${openModules["03"] ? "open" : ""}`} onClick={() => toggleMod("03")}>
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">03</div>
                        <div>
                          <div className="mod-title">Deep Dive: Dreame & Stary</div>
                          <div className="mod-meta">4 lessons · 48 mins</div>
                        </div>
                      </div>
                      <span className="mod-arrow">›</span>
                    </div>
                    <div className="module-body">
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">What Dreame editors look for in a submission</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Relationship dynamics and chemistry as a product</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Hate-to-love, scorned bride, and alpha-luna execution</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Dreame vs Stary — which is right for your story</span><Badge variant="gold">ENROLLED</Badge></div>
                    </div>
                  </div>

                  {/* Other Modules Preview */}
                  <div className={`module ${openModules["other"] ? "open" : ""}`} onClick={() => toggleMod("other")}>
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">04-12</div>
                        <div>
                          <div className="mod-title">GoodNovel, Webnovel, Submission, Contracts & Marketing</div>
                          <div className="mod-meta">35 lessons · 5.5 hrs</div>
                        </div>
                      </div>
                      <span className="mod-arrow">›</span>
                    </div>
                    <div className="module-body">
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Module 4 — GoodNovel & AlphaNovel standards</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Module 5 — WebNovel, MegaNovel & Letterlux deep dive</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Module 6 — The anatomy of a winning opening hook</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Module 7 — Formatting and polishing via Ink2Wealth</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Module 8 — Submission, Contract Negotiation & Scaling</span><Badge variant="gold">ENROLLED</Badge></div>
                    </div>
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
                    <div className="instr-desc">Victor Daniels is a serialized fiction writer, writing coach, and the founder of Ink2Wealth Media Limited. He publishes on PocketFM, Dreame, GoodNovel, WebNovel, and other major platforms, and has coached thousands of writers through his WIT-WEB community and courses.</div>
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
                  <div className="pb-card" onClick={() => openModal("m-enroll-witweb")}>
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
                    <Button variant="primary" className="w-full">Enroll — ₦35,000</Button>
                  </div>
                  <div className="pb-card feat" onClick={() => openModal("m-enroll-bundle")}>
                    <Badge variant="gold" className="mb-3">BEST VALUE</Badge>
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
                    <Button variant="primary" className="w-full">Get the Bundle — ₦55,000</Button>
                  </div>
                </div>
              </div>

              {/* STICKY ENROLL */}
              <div className="sticky-enroll">
                <div className="se-left">
                  <div>
                    <div className="se-name">WIT-WEB Academy</div>
                    <div className="text-[12px] text-[#606060]">12 modules · Lifetime access · Certificate</div>
                  </div>
                  <div className="se-price">₦35,000</div>
                </div>
                <Button variant="primary" onClick={() => openModal("m-enroll-witweb")}>Enroll Now →</Button>
              </div>

            </div>
          )}

          {/* SCREEN: SSG LANDING */}
          {activeScreen === "ssg-landing" && (
            <div className="screen on">
              <div className="lp-hero" style={{ background: "radial-gradient(ellipse at 30% 30%,#1a0008,#080808)" }}>
                <div className="lp-badge" style={{ background: "rgba(224,82,82,.1)", borderColor: "rgba(224,82,82,.25)", color: "#E05252" }}>SSG Blueprint</div>
                <h1 className="lp-h1">Write Scripts That<br /><em style={{ color: "#E05252" }}>Get Produced.</em></h1>
                <p className="lp-sub">Master screenplay and script writing from concept to final draft. Feature films, TV series, audio dramas — and how to get your script into the right hands.</p>
                <div className="lp-btns">
                  <Button 
                    variant="danger" 
                    size="lg" 
                    style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff" }} 
                    onClick={() => openModal("m-enroll-ssg")}
                  >
                    Enroll Now — ₦30,000
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setActiveScreen("dashboard")}>
                    Preview Free Lessons
                  </Button>
                </div>
                <div className="lp-stats">
                  <div><div className="ls-num">10</div><div className="ls-lbl">Modules</div></div>
                  <div><div className="ls-num">40+</div><div className="ls-lbl">Lessons</div></div>
                  <div><div className="ls-num">3</div><div className="ls-lbl">Format Types</div></div>
                  <div><div className="ls-num">∞</div><div className="ls-lbl">Lifetime Access</div></div>
                </div>
              </div>

              <div className="wyl">
                <div className="wyl-inner">
                  <span className="sec-label">What You Will Learn</span>
                  <h2 className="sec-h2">From Blank Page to<br />Final Draft</h2>
                  <div className="learn-grid">
                    <div className="learn-item"><div className="li-icon">📄</div><div><div className="li-title">Industry-Standard Formatting</div><div className="li-desc">Courier Prime font, scene headings, character cues, dialogue, parentheticals, and transitions done the Hollywood way.</div></div></div>
                    <div className="learn-item"><div className="li-icon">🎬</div><div><div className="li-title">Feature Film Structure</div><div className="li-desc">Three-act structure, character arcs, plot points, midpoint, all-is-lost moment — everything that makes a feature film work.</div></div></div>
                    <div className="learn-item"><div className="li-icon">📺</div><div><div className="li-title">TV Series Writing</div><div className="li-desc">Pilot structure, series bible, episodic vs serialized storytelling, writing for Nollywood and international TV markets.</div></div></div>
                    <div className="learn-item"><div className="li-icon">🎙️</div><div><div className="li-title">Audio Drama Formatting</div><div className="li-desc">Writing scripts specifically for audio — PocketFM audio dramas, radio plays, and podcast fiction with no visual cues.</div></div></div>
                    <div className="learn-item"><div className="li-icon">🤝</div><div><div className="li-title">Getting Your Script Noticed</div><div className="li-desc">Query letters for producers, pitch decks, script competitions, networking, and using the Industry Connect tool.</div></div></div>
                    <div className="learn-item"><div className="li-icon">✍️</div><div><div className="li-title">Using the Script Editor</div><div className="li-desc">How to use the Ink2Wealth Script Editor to write screenplays with one-tap element switching and compliance analytics.</div></div></div>
                  </div>
                </div>
              </div>

              {/* CURRICULUM MODULES */}
              <div className="curriculum">
                <div className="curr-inner">
                  <span className="sec-label">Full Curriculum</span>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 900, color: "var(--wh)", marginBottom: "32px" }}>10 Modules. 40 Lessons.</h2>
                  
                  <div className={`module ${openModules["ssg-01"] ? "open" : ""}`} onClick={() => toggleMod("ssg-01")}>
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">01</div>
                        <div>
                          <div className="mod-title">Introduction to Screenwriting</div>
                          <div className="mod-meta">4 lessons · 40 mins</div>
                        </div>
                      </div>
                      <span className="mod-arrow">›</span>
                    </div>
                    <div className="module-body">
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">What is a screenplay and how is it different from prose</span><Badge variant="green">FREE</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Industry-standard formatting rules</span><Badge variant="green">FREE</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Feature film vs TV vs audio drama formats</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Using the Ink2Wealth Script Editor</span><Badge variant="gold">ENROLLED</Badge></div>
                    </div>
                  </div>

                  <div className={`module ${openModules["ssg-02"] ? "open" : ""}`} onClick={() => toggleMod("ssg-02")}>
                    <div className="module-header">
                      <div className="mod-left">
                        <div className="mod-num">02</div>
                        <div>
                          <div className="mod-title">Story Structure for Screenwriters</div>
                          <div className="mod-meta">5 lessons · 55 mins</div>
                        </div>
                      </div>
                      <span className="mod-arrow">›</span>
                    </div>
                    <div className="module-body">
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">The three-act structure explained</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Plot points, midpoint, and all-is-lost moment</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Character arc — how your protagonist must change</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Subplots and how to weave them correctly</span><Badge variant="gold">ENROLLED</Badge></div>
                      <div className="lesson"><span className="les-icon">▶️</span><span className="les-title">Loglines and pitches that sell</span><Badge variant="gold">ENROLLED</Badge></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="price-box">
                <div style={{ textAlign: "center", marginBottom: "40px" }}><span className="sec-label">Enroll Today</span><h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 900, color: "var(--wh)" }}>Get Full Access</h2></div>
                <div className="pb-inner">
                  <div className="pb-card" onClick={() => openModal("m-enroll-ssg")}>
                    <div className="pb-name">Standard Enrollment</div>
                    <div className="pb-price">₦30,000</div>
                    <div className="pb-period">One-time payment · Lifetime access</div>
                    <div className="pb-items">
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>All 10 modules — 40 lessons</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Lifetime access</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Screenplay templates and resources</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Certificate of completion</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Script Editor access on Ink2Wealth</div>
                    </div>
                    <Button variant="danger" className="w-full" style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff" }} onClick={() => openModal("m-enroll-ssg")}>
                      Enroll — ₦30,000
                    </Button>
                  </div>
                  <div className="pb-card feat" onClick={() => openModal("m-enroll-bundle")}>
                    <Badge variant="gold" className="mb-3">SAVE MORE</Badge>
                    <div className="pb-name">Both Courses Bundle</div>
                    <div className="pb-price">₦55,000</div>
                    <div className="pb-period">WIT-WEB + SSG — both forever</div>
                    <div className="pb-items">
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>WIT-WEB Academy — full access</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>SSG Blueprint — full access</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Save ₦10,000 vs buying separately</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>Both certificates included</div>
                      <div className="pb-item"><span style={{ color: "var(--ok)" }}>✓</span>One private coaching session</div>
                    </div>
                    <Button variant="primary" className="w-full" onClick={() => openModal("m-enroll-bundle")}>Get Both — ₦55,000</Button>
                  </div>
                </div>
              </div>

              {/* STICKY ENROLL */}
              <div className="sticky-enroll">
                <div className="se-left">
                  <div>
                    <div className="se-name">SSG Blueprint</div>
                    <div className="text-[12px] text-[#606060]">10 modules · Lifetime access · Certificate</div>
                  </div>
                  <div className="se-price">₦30,000</div>
                </div>
                <Button variant="danger" style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff" }} onClick={() => openModal("m-enroll-ssg")}>
                  Enroll Now →
                </Button>
              </div>
            </div>
          )}

          {/* SCREEN: STUDENT DASHBOARD PREVIEW */}
          {activeScreen === "dashboard" && (
            <div className="screen dash">
              <div className="dash-sidebar">
                <div className="px-6 pb-5 border-b border-[#242424] mb-3 text-left">
                  <div className="text-[11px] text-[#606060] mb-1">Logged in as</div>
                  <div className="text-sm font-bold text-white">Victor Daniels</div>
                  <div className="text-[11px] text-[#C9A84C]">2 courses enrolled</div>
                </div>
                <div className="sidebar-section">
                  <span className="sidebar-label">Dashboard</span>
                  <div className={`sidebar-item ${activeDashView === "dv-home" ? "on" : ""}`} onClick={() => setActiveDashView("dv-home")}>
                    <span className="si-icon">🏠</span><span className="si-label">My Learning</span>
                  </div>
                </div>
                <div className="sidebar-section">
                  <span className="sidebar-label">My Courses</span>
                  <div className={`sidebar-item ${activeDashView === "dv-witweb" ? "on" : ""}`} onClick={() => setActiveDashView("dv-witweb")}>
                    <span className="si-icon">📖</span><span className="si-label">WIT-WEB Academy</span><span className="si-badge">68%</span>
                  </div>
                  <div className={`sidebar-item ${activeDashView === "dv-ssg" ? "on" : ""}`} onClick={() => setActiveDashView("dv-ssg")}>
                    <span className="si-icon">🎬</span><span className="si-label">SSG Blueprint</span><span className="si-new">NEW</span>
                  </div>
                </div>
                <div className="sidebar-section">
                  <span className="sidebar-label">Resources</span>
                  <div className={`sidebar-item ${activeDashView === "dv-resources" ? "on" : ""}`} onClick={() => setActiveDashView("dv-resources")}>
                    <span className="si-icon">📥</span><span className="si-label">Downloads</span>
                  </div>
                  <div className={`sidebar-item ${activeDashView === "dv-notes" ? "on" : ""}`} onClick={() => setActiveDashView("dv-notes")}>
                    <span className="si-icon">📝</span><span className="si-label">My Notes</span>
                  </div>
                  <div className={`sidebar-item ${activeDashView === "dv-cert" ? "on" : ""}`} onClick={() => setActiveDashView("dv-cert")}>
                    <span className="si-icon">🏆</span><span className="si-label">Certificates</span>
                  </div>
                </div>
                <div className="sidebar-section">
                  <span className="sidebar-label">Community</span>
                  <div className="sidebar-item" onClick={() => showToast("Opening WIT-WEB Community!")}><span className="si-icon">🤝</span><span className="si-label">Writers Community</span></div>
                  <div className="sidebar-item" onClick={() => showToast("Opening YouTube channel!")}><span className="si-icon">▶️</span><span className="si-label">YouTube Channel</span></div>
                </div>
                <div className="px-6 py-5 mt-auto border-t border-[#242424]">
                  <div className="bg-[#C9A84C]/5 border border-[#7A5E1E] rounded-xl p-3.5 cursor-pointer text-left" onClick={() => showToast("Opening app download!")}>
                    <div className="text-[11px] font-bold text-[#C9A84C] mb-1">📱 Get the App</div>
                    <div className="text-[11px] text-[#909090] leading-snug">iOS & Android — write and analyze on your phone</div>
                  </div>
                </div>
              </div>

              {/* DASH SIDEBAR MAIN CONTENT PANEL */}
              <div className="dash-main">
                
                {/* view: dv-home */}
                {activeDashView === "dv-home" && (
                  <div className="dash-view on">
                    <div className="welcome-card">
                      <div>
                        <div className="wc-title">Welcome back, Victor! 👋</div>
                        <div className="wc-sub">Continue where you left off — Module 5, Lesson 2 of WIT-WEB Academy.</div>
                        <Button variant="primary" className="mt-4" onClick={() => setActiveDashView("dv-witweb")}>
                          Continue Learning →
                        </Button>
                      </div>
                      <div className="wc-right">
                        <div className="wc-prog-label">Overall Progress</div>
                        <div className="wc-prog-num">68%</div>
                        <div className="text-[11px] text-[#606060]">across 2 courses</div>
                      </div>
                    </div>

                    <div className="stats-row">
                      <div className="stat-card"><div className="sc-num">32</div><div className="sc-lbl">Lessons Completed</div></div>
                      <div className="stat-card"><div className="sc-num">14</div><div className="sc-lbl">Hrs Watched</div></div>
                      <div className="stat-card"><div className="sc-num">1</div><div className="sc-lbl">Certificate Earned</div></div>
                      <div className="stat-card"><div className="sc-num">6</div><div className="sc-lbl">Notes Saved</div></div>
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-white mb-4">My Enrolled Courses</h3>
                    
                    <div className="mod-list-item" onClick={() => setActiveDashView("dv-witweb")}>
                      <div className="mli-num">📖</div>
                      <div className="mli-info">
                        <div className="mli-title">WIT-WEB Academy — Webnoveling Ink to Wealth Blueprint</div>
                        <div className="mli-meta">Module 5 of 12 · Lesson 2 of 4</div>
                        <ProgressBar progress={68} color="gold" className="mt-2 max-w-[300px]" />
                      </div>
                      <div className="mli-status mli-inprog text-[11px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1 rounded">68% Complete</div>
                    </div>

                    <div className="mod-list-item" onClick={() => setActiveDashView("dv-ssg")}>
                      <div className="mli-num">🎬</div>
                      <div className="mli-info">
                        <div className="mli-title">SSG Blueprint — Scriptwriting & Screenwriting Guide</div>
                        <div className="mli-meta">Module 1 of 10 · Not started</div>
                        <ProgressBar progress={0} color="red" className="mt-2 max-w-[300px]" />
                      </div>
                      <div className="mli-status mli-inprog text-[11px] font-bold text-[#52C07A] bg-[#52C07A]/10 px-3 py-1 rounded">Start Now</div>
                    </div>
                  </div>
                )}

                {/* view: dv-witweb */}
                {activeDashView === "dv-witweb" && (
                  <div className="dash-view on">
                    <h2 className="font-serif text-3xl font-bold text-white mb-1.5">WIT-WEB Academy</h2>
                    <p className="text-xs text-[#909090] mb-6">Module 5 — Deep Dive: WebNovel, MegaNovel & Letterlux</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <div className="video-area" onClick={() => showToast("▶️ Playing lesson...")}>
                          <div className="play-btn">▶</div>
                          <div className="absolute bottom-4 left-4 right-4 bg-black/75 rounded-lg p-3 text-left">
                            <div className="text-xs font-semibold text-white">Lesson 2 — MegaNovel Urban Fiction</div>
                            <div className="text-[10px] text-[#909090]">18 mins · HD Video</div>
                          </div>
                        </div>
                        <div className="video-title">MegaNovel Urban Fiction: Son-in-Law & Hidden Billionaire</div>
                        <div className="video-meta">Module 5 · Lesson 2 · 18 minutes</div>
                        
                        <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 mb-5 text-left">
                          <p className="text-xs font-bold text-white mb-2">Lesson Notes</p>
                          <p className="text-xs text-[#909090] leading-relaxed">
                            In this lesson you learn exactly what MegaNovel readers want: urban fiction with a powerful male protagonist who starts from nothing — humiliated, rejected, looked down upon — and rises to power.
                          </p>
                        </div>
                        
                        <p className="text-xs font-bold text-white mb-3">Your Notes</p>
                        <Textarea placeholder="Take notes on this lesson here — they will be saved to your account..." rows={5} />
                        <Button variant="primary" className="mt-2.5" onClick={() => showToast("📝 Notes saved!")}>
                          Save Notes
                        </Button>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white mb-3">Module 5 Lessons</p>
                        <div className="lesson-list">
                          <div className="lesson-item done"><div className="li-check done">✓</div><span className="li-title text-[#606060]">Lesson 1 — WebNovel anti-AI policy</span><span className="li-dur">14 min</span></div>
                          <div className="lesson-item playing"><div className="li-check play">▶</div><span className="li-title">Lesson 2 — MegaNovel urban fiction</span><span className="li-dur">18 min</span></div>
                          <div className="lesson-item" onClick={() => showToast("▶️ Loading lesson 3...")}><div className="li-check lock">3</div><span className="li-title">Lesson 3 — Letterlux strict standards</span><span className="li-dur">22 min</span></div>
                          <div className="lesson-item" onClick={() => showToast("▶️ Loading lesson 4...")}><div className="li-check lock">4</div><span className="li-title">Lesson 4 — NovelSnack tropes</span><span className="li-dur">16 min</span></div>
                        </div>

                        <div className="mt-5 bg-[#161616] border border-[#242424] rounded-xl p-4">
                          <p className="text-[12px] font-bold text-white mb-2">Your Progress</p>
                          <div className="flex justify-between text-[11px] text-[#606060] mb-1.5">
                            <span>WIT-WEB Academy</span><span className="text-[#C9A84C] font-semibold">68%</span>
                          </div>
                          <ProgressBar progress={68} color="gold" />
                          <div className="text-[11px] text-[#606060] mt-2">32 of 48 lessons completed</div>
                        </div>

                        <Button variant="primary" className="w-full mt-3" onClick={() => showToast("✓ Lesson marked complete!")}>
                          ✓ Mark Lesson Complete
                        </Button>
                        <Button variant="secondary" className="w-full mt-2" onClick={() => setActiveDashView("dv-home")}>
                          ← Back to Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* view: dv-ssg */}
                {activeDashView === "dv-ssg" && (
                  <div className="dash-view on">
                    <h2 className="font-serif text-3xl font-bold text-white mb-1.5">SSG Blueprint</h2>
                    <p className="text-xs text-[#909090] mb-6">Module 1 — Introduction to Screenwriting</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <div className="video-area" onClick={() => showToast("▶️ Playing lesson 1...")}>
                          <div className="play-btn">▶</div>
                          <div className="absolute bottom-4 left-4 right-4 bg-black/75 rounded-lg p-3 text-left">
                            <div className="text-xs font-semibold text-white">Lesson 1 — What is a Screenplay?</div>
                            <div className="text-[10px] text-[#909090]">20 mins · HD Video</div>
                          </div>
                        </div>
                        <div className="video-title">What is a Screenplay and How Does it Differ from Prose?</div>
                        <div className="video-meta">Module 1 · Lesson 1 · 20 minutes · Free Preview</div>
                        
                        <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 mb-5 text-left">
                          <p className="text-xs font-bold text-white mb-2">Lesson Notes</p>
                          <p className="text-xs text-[#909090] leading-relaxed">
                            A screenplay is a blueprint, not a finished product. Unlike prose, you never describe what a character thinks or feels — you only show what can be seen and heard on screen.
                          </p>
                        </div>
                        
                        <Textarea placeholder="Take notes on this lesson here..." rows={5} />
                        <Button variant="primary" className="mt-2.5" onClick={() => showToast("📝 Notes saved!")}>
                          Save Notes
                        </Button>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-white mb-3">Module 1 Lessons</p>
                        <div className="lesson-list">
                          <div className="lesson-item playing"><div className="li-check play">▶</div><span className="li-title">Lesson 1 — What is a screenplay</span><span className="li-dur">20 min</span></div>
                          <div className="lesson-item" onClick={() => showToast("▶️ Loading lesson 2...")}><div className="li-check lock">2</div><span className="li-title">Lesson 2 — Industry formatting rules</span><span className="li-dur">24 min</span></div>
                          <div className="lesson-item" onClick={() => showToast("▶️ Loading lesson 3...")}><div className="li-check lock">3</div><span className="li-title">Lesson 3 — Feature vs TV vs Audio</span><span className="li-dur">18 min</span></div>
                          <div className="lesson-item" onClick={() => showToast("▶️ Loading lesson 4...")}><div className="li-check lock">4</div><span className="li-title">Lesson 4 — Using the Script Editor</span><span className="li-dur">15 min</span></div>
                        </div>

                        <div className="mt-5 bg-[#161616] border border-[#242424] rounded-xl p-4">
                          <div className="flex justify-between text-[11px] text-[#606060] mb-1.5">
                            <span>SSG Blueprint</span><span className="text-[#C9A84C] font-semibold">0%</span>
                          </div>
                          <ProgressBar progress={0} color="red" />
                          <div className="text-[11px] text-[#606060] mt-2">0 of 40 lessons completed</div>
                        </div>

                        <Button variant="primary" className="w-full mt-3" onClick={() => showToast("✓ Lesson marked complete!")}>
                          ✓ Mark Lesson Complete
                        </Button>
                        <Button variant="secondary" className="w-full mt-2" onClick={() => setActiveDashView("dv-home")}>
                          ← Back to Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* view: dv-resources */}
                {activeDashView === "dv-resources" && (
                  <div className="dash-view on">
                    <h2 className="font-serif text-3xl font-bold text-white mb-1.5">Downloads & Resources</h2>
                    <p className="text-xs text-[#909090] mb-6">All downloadable resources from your enrolled courses.</p>
                    <div className="flex flex-col gap-3">
                      <div className="bg-[#161616] border border-[#242424] rounded-xl p-4.5 flex items-center gap-4 cursor-pointer" onClick={() => showToast("📥 Downloading Platform Submission Checklist...")}>
                        <span className="text-3xl">📋</span>
                        <div className="flex-grow text-left">
                          <p className="text-sm font-bold text-white mb-1">Platform Submission Checklist</p>
                          <p className="text-[11px] text-[#606060]">WIT-WEB Academy · PDF · 2 pages</p>
                        </div>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                      <div className="bg-[#161616] border border-[#242424] rounded-xl p-4.5 flex items-center gap-4 cursor-pointer" onClick={() => showToast("📥 Downloading Chapter Template...")}>
                        <span className="text-3xl">📄</span>
                        <div className="flex-grow text-left">
                          <p className="text-sm font-bold text-white mb-1">Chapter Writing Template</p>
                          <p className="text-[11px] text-[#606060]">WIT-WEB Academy · DOCX · Template</p>
                        </div>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                      <div className="bg-[#161616] border border-[#242424] rounded-xl p-4.5 flex items-center gap-4 cursor-pointer" onClick={() => showToast("📥 Downloading Screenplay Template...")}>
                        <span className="text-3xl">🎬</span>
                        <div className="flex-grow text-left">
                          <p className="text-sm font-bold text-white mb-1">Screenplay Format Template</p>
                          <p className="text-[11px] text-[#606060]">SSG Blueprint · FDX + DOCX · Standard</p>
                        </div>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* view: dv-notes */}
                {activeDashView === "dv-notes" && (
                  <div className="dash-view on">
                    <h2 className="font-serif text-3xl font-bold text-white mb-1.5">My Notes</h2>
                    <p className="text-xs text-[#909090] mb-6">Access all saved notes across your courses.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 text-left">
                        <Badge variant="gold" className="mb-2">WIT-WEB · Module 5 Lesson 2</Badge>
                        <p className="text-xs text-[#909090] leading-relaxed mb-4">
                          Son-in-Law tropes must focus on initial humiliation by the in-laws before the billionaire status reveal. The pacing needs to build this up for at least 10 chapters.
                        </p>
                        <span className="text-[10px] text-[#606060]">Saved August 2026</span>
                      </div>
                      <div className="bg-[#161616] border border-[#242424] rounded-xl p-5 text-left">
                        <Badge variant="gold" className="mb-2">SSG · Module 1 Lesson 1</Badge>
                        <p className="text-xs text-[#909090] leading-relaxed mb-4">
                          Never write action lines that describe feelings. "He feels angry" &rarr; "He slams the glass down on the table, obsidian shards flying." Show, don't tell!
                        </p>
                        <span className="text-[10px] text-[#606060]">Saved August 2026</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* view: dv-cert */}
                {activeDashView === "dv-cert" && (
                  <div className="dash-view on">
                    <h2 className="font-serif text-3xl font-bold text-white mb-1.5">Certificates</h2>
                    <p className="text-xs text-[#909090] mb-6">Your official course completion certificates.</p>
                    <div className="cert-card">
                      <div className="cert-icon">🏆</div>
                      <div className="cert-title">Certificate of Achievement</div>
                      <div className="text-xs text-[#606060] uppercase tracking-wider mb-6">Presented to</div>
                      <div className="cert-name">Victor Daniels</div>
                      <div className="text-xs text-[#606060] mb-2">For successfully completing the flagship curriculum</div>
                      <div className="cert-course">WIT-WEB Academy: Webnoveling Ink to Wealth Blueprint</div>
                      <div className="text-[11px] text-[#C9A84C] font-semibold">Verified by Ink2Wealth Media Limited · 2026</div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* DETAILED PUBLIC FOOTER */}
        <Footer />

        {/* MODAL: m-signup */}
        <Modal isOpen={activeModal === "m-signup"} onClose={closeModal} title="Join the Waitlist 🖊️">
          <div className="space-y-4 text-left">
            <p className="text-xs text-[#909090] mb-4">Be the first to know when Ink2Wealth launches in 2027. Get early access, founding member pricing, and exclusive updates.</p>
            <Input label="Your Full Name" placeholder="Victor Daniels" />
            <Input label="Email Address" type="email" placeholder="your@email.com" />
            <Select 
              label="I am a..." 
              options={[
                { label: "Fiction Writer / Webnovel Author", value: "writer" },
                { label: "Screenwriter / Scriptwriter", value: "screenwriter" },
                { label: "Student", value: "student" },
                { label: "All of the above", value: "all" }
              ]} 
            />
            <Input label="Which platforms do you write for?" placeholder="e.g. PocketFM, Dreame, GoodNovel..." />
            <Button variant="primary" className="w-full mt-2" onClick={() => { showToast("🎉 You are on the waitlist! Watch your email."); closeModal(); }}>
              Join the Waitlist →
            </Button>
          </div>
        </Modal>

        {/* Standard WIT-WEB Modal */}
        <Modal isOpen={activeModal === "m-enroll-witweb"} onClose={closeModal} title="Enroll in WIT-WEB Academy 📖">
          <div className="space-y-4 text-left">
            <p className="text-xs text-[#909090]">Complete guide to Webnovel monetization. Get lifetime access to all 48 lessons for ₦35,000.</p>
            <Link href="/register" className="block w-full">
              <Button variant="primary" className="w-full" onClick={closeModal}>
                Proceed to Checkout →
              </Button>
            </Link>
          </div>
        </Modal>

        {/* Standard SSG Modal */}
        <Modal isOpen={activeModal === "m-enroll-ssg"} onClose={closeModal} title="Enroll in SSG Blueprint 🎬">
          <div className="space-y-4 text-left">
            <p className="text-xs text-[#909090]">Master screenplay and TV writing pilots. Get lifetime access to all 40 lessons for ₦30,000.</p>
            <Link href="/register" className="block w-full">
              <Button variant="danger" className="w-full" style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff" }} onClick={closeModal}>
                Proceed to Checkout →
              </Button>
            </Link>
          </div>
        </Modal>

        {/* Bundle Modal */}
        <Modal isOpen={activeModal === "m-enroll-bundle"} onClose={closeModal} title="WIT-WEB + SSG Bundle Deal 📦">
          <div className="space-y-4 text-left">
            <p className="text-xs text-[#909090]">Enroll in both courses and save ₦10,000. Pay ₦55,000 one-time for lifetime access to both.</p>
            <Link href="/register" className="block w-full">
              <Button variant="primary" className="w-full" onClick={closeModal}>
                Get Both Courses Now →
              </Button>
            </Link>
          </div>
        </Modal>

      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // 2. LOGGED IN PLATFORM HUB VIEW (CODE BLOCK B)
  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      
      {/* LOGGED IN NAVBAR */}
      <Navbar />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage("")} />
      )}

      {/* MAIN LOGGED IN SECTION */}
      <main className="flex-grow pt-[70px]">
        
        {/* HERO */}
        <section id="hero" className="relative min-h-[90vh] flex items-center px-6">
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 py-16">
            
            <div className="hero-left">
              <div className="hero-badge">
                <span className="hero-badge-dot"></span>
                Launching 2027 — Join the Waitlist
              </div>
              <h1 className="hero-h1">
                Write It.<br />
                <span className="text-[#C9A84C] italic">Script It.</span><br />
                Earn From It.
              </h1>
              <p className="hero-sub">
                The all-in-one platform for fiction writers, screenwriters, and students who are serious about turning their words into wealth.
              </p>
              
              <div className="hero-btns">
                <Button variant="primary" size="lg" onClick={() => openModal("m-signup")}>
                  Join the Waitlist
                </Button>
                <Link href="#features">
                  <Button variant="outline" size="lg">
                    Explore Features
                  </Button>
                </Link>
              </div>

              <div className="hero-stats">
                <div>
                  <p className="stat-num">9</p>
                  <p className="stat-lbl">Writing Platforms</p>
                </div>
                <div>
                  <p className="stat-num">2,400+</p>
                  <p className="stat-lbl">Writers Community</p>
                </div>
                <div>
                  <p className="stat-num">5</p>
                  <p className="stat-lbl">AI-Powered Tools</p>
                </div>
                <div>
                  <p className="stat-num">3</p>
                  <p className="stat-lbl">User Types</p>
                </div>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-phone">
                <div className="phone-screen select-none">
                  <div className="ps-greet">Welcome back</div>
                  <div className="ps-name">{profile?.displayName || "Victor"}</div>
                  <div className="ps-streak">🔥 1,240 words today · 5 day streak</div>
                  
                  <div className="ps-tabs">
                    <div className="ps-tab on">📖 Novel</div>
                    <div className="ps-tab">🎬 Script</div>
                    <div className="ps-tab">⚡ Tools</div>
                  </div>

                  <div className="ps-card">
                    <div className="ps-icon">📖</div>
                    <div className="ps-info">
                      <p>Fractured Futures</p>
                      <p>Ch.4 · PocketFM · 3,200 words</p>
                    </div>
                  </div>

                  <div className="ps-card">
                    <div className="ps-icon">🩸</div>
                    <div className="ps-info">
                      <p>Vampire Slave Omega</p>
                      <p>Ch.12 · Dreame · 8,400 words</p>
                    </div>
                  </div>

                  <div className="ps-grid">
                    <div className="ps-tool">
                      <div className="ps-tool-icon">🔍</div>
                      <div className="ps-tool-name">Analyzer</div>
                    </div>
                    <div className="ps-tool">
                      <div className="ps-tool-icon">✅</div>
                      <div className="ps-tool-name">Smart Edit</div>
                    </div>
                    <div className="ps-tool">
                      <div className="ps-tool-icon">👻</div>
                      <div className="ps-tool-name">Ghost Writer</div>
                    </div>
                    <div className="ps-tool">
                      <div className="ps-tool-icon">💰</div>
                      <div className="ps-tool-name">WEALTH</div>
                    </div>
                  </div>

                  <div className="ps-nav">
                    <div className="ps-ni"><span className="ps-ni-icon">🏠</span><span className="ps-ni-label on">Home</span></div>
                    <div className="ps-ni"><span className="ps-ni-icon">✍️</span><span className="ps-ni-label">Write</span></div>
                    <div className="ps-ni"><span className="ps-ni-icon">📊</span><span className="ps-ni-label">Analyze</span></div>
                    <div className="ps-ni"><span className="ps-ni-icon">💰</span><span className="ps-ni-label">Wealth</span></div>
                    <div className="ps-ni"><span className="ps-ni-icon">👤</span><span className="ps-ni-label">Profile</span></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

     

      </main>

      {/* DETAILED PORTAL FOOTER */}
      <Footer />

      {/* MODALS SECTION (CODE BLOCK B LOGGED IN MODALS) */}
      
      {/* Waitlist Modal */}
      <Modal isOpen={activeModal === "m-signup"} onClose={closeModal} title="Join the Waitlist 🖊️">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#909090] mb-4">Be the first to know when Ink2Wealth launches in 2027.</p>
          <Input label="Your Full Name" placeholder="Victor Daniels" />
          <Input label="Email Address" type="email" placeholder="your@email.com" />
          <Button variant="primary" className="w-full mt-2" onClick={() => { showToast("🎉 You are on the waitlist!"); closeModal(); }}>
            Join the Waitlist →
          </Button>
        </div>
      </Modal>

      {/* Chapter Analyzer Modal */}
      <Modal isOpen={activeModal === "m-analyzer"} onClose={closeModal} title="🔍 Chapter Analyzer">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#909090] mb-4">Select platform, paste chapter, and get compliance score.</p>
          <Select 
            label="Target Platform" 
            options={[
              { label: "PocketFM", value: "PocketFM" },
              { label: "Dreame", value: "Dreame" },
              { label: "GoodNovel", value: "GoodNovel" }
            ]} 
          />
          <Textarea label="Paste Your Chapter" placeholder="Paste your chapter here..." />
          <Button variant="primary" className="w-full mt-2" onClick={() => { showToast("✦ Analyzing your chapter..."); closeModal(); }}>
            ✦ Analyze Chapter
          </Button>
        </div>
      </Modal>

      {/* Smart Edit Modal */}
      <Modal isOpen={activeModal === "m-smartedit"} onClose={closeModal} title="✅ Smart Edit Suite">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#909090] mb-4">AI checks your writing for Grammar, Passive Voice, and Filler Words.</p>
          <Textarea placeholder="Paste your chapter or manuscript here..." rows={6} />
          <Button variant="primary" className="w-full mt-2" onClick={() => { showToast("✦ Running Smart Edit Analysis..."); closeModal(); }}>
            ✦ Run Smart Edit Analysis
          </Button>
        </div>
      </Modal>

      {/* Ghost Writer Modal */}
      <Modal isOpen={activeModal === "m-ghost"} onClose={closeModal} title="👻 AI Ghost Writer">
        <div className="space-y-4 text-left">
          <Textarea label="Describe plot points" placeholder="Describe what should happen in this chapter..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("👻 Writing your chapter..."); closeModal(); }}>
            👻 Write My Chapter
          </Button>
        </div>
      </Modal>

      {/* Student study planner modal */}
      <Modal isOpen={activeModal === "m-study"} onClose={closeModal} title="📅 Study Planner">
        <div className="space-y-4 text-left">
          <Input label="Subject / Course" placeholder="e.g. Human Anatomy" />
          <Button variant="primary" className="w-full" onClick={() => { showToast("📅 Study plan generated!"); closeModal(); }}>
            📅 Generate Study Plan
          </Button>
        </div>
      </Modal>

      {/* Student active recall flashcard modal */}
      <Modal isOpen={activeModal === "m-flash"} onClose={closeModal} title="🃏 Flashcard Generator">
        <div className="space-y-4 text-left">
          <Textarea label="Notes content" placeholder="Paste textbook summary or topic..." />
          <Button variant="primary" className="w-full" onClick={() => { showToast("🃏 Flashcards generated!"); closeModal(); }}>
            🃏 Generate Flashcards
          </Button>
        </div>
      </Modal>

      {/* Student citation generator modal */}
      <Modal isOpen={activeModal === "m-cite"} onClose={closeModal} title="📑 Citation Generator">
        <div className="space-y-4 text-left">
          <Textarea label="Source details" placeholder="Paste source details or URL..." />
          <Button variant="primary" className="w-full" onClick={() => { showToast("📑 Citation generated!"); closeModal(); }}>
            📑 Generate Citation
          </Button>
        </div>
      </Modal>

      {/* Student video finder modal */}
      <Modal isOpen={activeModal === "m-videos"} onClose={closeModal} title="▶️ Course Video Finder">
        <div className="space-y-4 text-left">
          <Input label="Subject or Topic" placeholder="Subject or Topic" />
          <Button variant="primary" className="w-full" onClick={() => { showToast("▶️ Finding best videos!"); closeModal(); }}>
            ▶️ Find Best Videos
          </Button>
        </div>
      </Modal>

      {/* Student essay writer modal */}
      <Modal isOpen={activeModal === "m-essay"} onClose={closeModal} title="✍️ Essay Writer">
        <div className="space-y-4 text-left">
          <Textarea label="Essay prompt" placeholder="Paste your essay question here..." />
          <Button variant="primary" className="w-full" onClick={() => { showToast("✍️ Writing your essay!"); closeModal(); }}>
            ✍️ Write My Essay
          </Button>
        </div>
      </Modal>

      {/* Student exam techniques modal */}
      <Modal isOpen={activeModal === "m-exam"} onClose={closeModal} title="🧠 Exam Techniques Hub">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#909090]">Active Recall, Spaced Repetition, and Pomodoro techniques locked in.</p>
          <Button variant="primary" className="w-full mt-4" onClick={closeModal}>
            Got It — Start Studying
          </Button>
        </div>
      </Modal>

      {/* Book Blurb Modal */}
      <Modal isOpen={activeModal === "m-blurb"} onClose={closeModal} title="Book Blurb Writer">
        <div className="space-y-4 text-left">
          <Textarea label="Blurb details" placeholder="2-3 sentences about your story..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("📖 Blurb generated!"); closeModal(); }}>
            Generate Blurb
          </Button>
        </div>
      </Modal>

      {/* Author Bio Modal */}
      <Modal isOpen={activeModal === "m-bio"} onClose={closeModal} title="Author Bio Generator">
        <div className="space-y-4 text-left">
          <Input label="Genres" placeholder="Genres you write..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("🖊️ Bio generated!"); closeModal(); }}>
            Generate Bio
          </Button>
        </div>
      </Modal>

      {/* Press Release Modal */}
      <Modal isOpen={activeModal === "m-press"} onClose={closeModal} title="Press Release Writer">
        <div className="space-y-4 text-left">
          <Textarea label="Details" placeholder="Launch date, milestones, etc..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("📰 Press release generated!"); closeModal(); }}>
            Generate Press Release
          </Button>
        </div>
      </Modal>

      {/* Pitch Deck Modal */}
      <Modal isOpen={activeModal === "m-pitch"} onClose={closeModal} title="Pitch Deck Builder">
        <div className="space-y-4 text-left">
          <Input label="Logline" placeholder="Project logline..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("📊 Pitch deck generated!"); closeModal(); }}>
            Build Pitch Deck
          </Button>
        </div>
      </Modal>

      {/* TikTok BookTok Strategy Modal */}
      <Modal isOpen={activeModal === "m-booktok"} onClose={closeModal} title="TikTok #BookTok Strategy">
        <div className="space-y-4 text-left">
          <Input label="Dramatic line" placeholder="Paste your most dramatic line..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("🎵 Hook script generated!"); closeModal(); }}>
            Generate Script
          </Button>
        </div>
      </Modal>

      {/* Goodreads Promotion Strategy Modal */}
      <Modal isOpen={activeModal === "m-goodreads"} onClose={closeModal} title="Goodreads Promotion">
        <div className="space-y-4 text-left">
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("📚 Strategy saved!"); closeModal(); }}>
            Start Goodreads Page
          </Button>
        </div>
      </Modal>

      {/* Reddit Book Promotion Modal */}
      <Modal isOpen={activeModal === "m-reddit"} onClose={closeModal} title="Reddit Book Promotion">
        <div className="space-y-4 text-left">
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("🔴 Reddit strategy saved!"); closeModal(); }}>
            Got It — Post to Reddit
          </Button>
        </div>
      </Modal>

      {/* Medium Strategy Modal */}
      <Modal isOpen={activeModal === "m-medium"} onClose={closeModal} title="Medium Strategy">
        <div className="space-y-4 text-left">
          <Input label="Concept" placeholder="Why readers love rejection romance..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("✍️ Outline generated!"); closeModal(); }}>
            Generate Outline
          </Button>
        </div>
      </Modal>

      {/* Query Letter Builder Modal */}
      <Modal isOpen={activeModal === "m-query"} onClose={closeModal} title="Query Letter Builder">
        <div className="space-y-4 text-left">
          <Textarea label="Synopsis" placeholder="Logline and story details..." />
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("📝 Query letter generated!"); closeModal(); }}>
            Build Query Letter
          </Button>
        </div>
      </Modal>

      {/* Social Media Kit Modal */}
      <Modal isOpen={activeModal === "m-social"} onClose={closeModal} title="Social Media Kit">
        <div className="space-y-4 text-left">
          <Button variant="primary" className="w-full mt-4" onClick={() => { showToast("📱 Social media kit generated!"); closeModal(); }}>
            Generate Kit
          </Button>
        </div>
      </Modal>

      {/* Novel Editor Modal */}
      <Modal isOpen={activeModal === "m-novel"} onClose={closeModal} title="Novel Editor">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#909090]">Write, compile chapters, and analyze your novels.</p>
          <Button variant="primary" className="w-full mt-4" onClick={closeModal}>
            Got It
          </Button>
        </div>
      </Modal>

      {/* Script Editor Modal */}
      <Modal isOpen={activeModal === "m-script"} onClose={closeModal} title="Script Editor">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#909090]">Professional screenplay format templates included.</p>
          <Button variant="primary" className="w-full mt-4" onClick={closeModal}>
            Got It
          </Button>
        </div>
      </Modal>

      {/* Student Redirect Notification Modal */}
      <Modal isOpen={activeModal === "m-student-redirect"} onClose={closeModal} title="Student Hub Tools">
        <div className="text-center space-y-4">
          <div className="text-4xl">🎓</div>
          <p className="text-xs text-[#909090] leading-relaxed">
            Our Student Hub includes study planners, citation generators, flashcards and video tutorials. Please visit the Student Hub section below to launch each tool!
          </p>
          <Button variant="primary" className="w-full" onClick={() => { setActiveScreen("dashboard"); closeModal(); }}>
            Go to Student Hub
          </Button>
        </div>
      </Modal>

    </div>
  );
}

export default function PlatformLanding() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">Loading...</div>}>
      <LandingContent />
    </Suspense>
  );
}
