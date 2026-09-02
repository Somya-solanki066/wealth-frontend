"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useContent } from "@/hooks/useContent";

export default function SsgLanding() {
  const { content } = useContent("ssg-landing");
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
      title: "Introduction to Screenwriting",
      meta: "4 lessons · 40 mins",
      lessons: [
        { title: "What is a screenplay and how is it different from prose", free: true },
        { title: "Industry-standard formatting rules", free: true },
        { title: "Feature film vs TV vs audio drama formats", free: false },
        { title: "Using the Ink2Wealth Script Editor", free: false },
      ]
    },
    {
      id: 2,
      num: "02",
      title: "Story Structure for Screenwriters",
      meta: "5 lessons · 55 mins",
      lessons: [
        { title: "The three-act structure explained", free: false },
        { title: "Plot points, midpoint, and all-is-lost moment", free: false },
        { title: "Character arc — how your protagonist must change", free: false },
        { title: "Subplots and how to weave them correctly", free: false },
        { title: "Writing the logline that sells your script", free: false },
      ]
    },
    {
      id: 3,
      num: "03",
      title: "Dialogue, Scene Writing, TV, Audio & Getting Produced",
      meta: "31 lessons · 5 hrs",
      lessons: [
        { title: "Module 3 — Writing dialogue that sounds real", free: false },
        { title: "Module 4 — Scene construction and scene economy", free: false },
        { title: "Module 5 — Writing a TV pilot and series bible", free: false },
        { title: "Module 6 — Audio drama for PocketFM and podcast", free: false },
        { title: "Module 7 — Nollywood and African film market", free: false },
        { title: "Module 8 — Writing your query letter and pitch deck", free: false },
        { title: "Module 9 — Script competitions and how to enter", free: false },
        { title: "Module 10 — Getting your script to the right people", free: false },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pb-24">
        {/* HERO */}
        <div className="lp-hero" style={{ background: "radial-gradient(ellipse at 30% 30%,#1a0008,#080808)" }}>
          <div className="lp-badge" style={{ background: "rgba(224,82,82,.1)", borderColor: "rgba(224,82,82,.25)", color: "#E05252" }}>
            {content.heroBadge || "SSG Blueprint"}
          </div>
          <h1 className="lp-h1" style={{ color: "var(--wh)" }}>
            {content.heroTitle || "Write Scripts That Get Produced."}
          </h1>
          <p className="lp-sub">
            {content.heroSubtitle || "Master screenplay and script writing from concept to final draft. Feature films, TV series, audio dramas — and how to get your script into the right hands."}
          </p>
          <div className="lp-btns">
            <Link 
              href="/register" 
              style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "15px", padding: "16px 40px", borderRadius: "12px", border: "none", cursor: "pointer", display: "inline-block", textDecoration: "none" }}
            >
              Enroll Now — ₦30,000
            </Link>
            <Link href="/dashboard" className="btn-o" style={{ fontSize: "15px", padding: "15px 36px", display: "inline-block", textDecoration: "none" }}>
              Preview Free Lessons
            </Link>
          </div>
          <div className="lp-stats">
            <div><div className="ls-num">10</div><div className="ls-lbl">Modules</div></div>
            <div><div className="ls-num">40+</div><div className="ls-lbl">Lessons</div></div>
            <div><div className="ls-num">3</div><div className="ls-lbl">Format Types</div></div>
            <div><div className="ls-num">∞</div><div className="ls-lbl">Lifetime Access</div></div>
          </div>
        </div>

        {/* WHAT YOU LEARN */}
        <div className="wyl">
          <div className="wyl-inner">
            <span className="sec-label">What You Will Learn</span>
            <h2 className="sec-h2">From Blank Page to<br />Final Draft</h2>
            <div className="learn-grid">
              <div className="learn-item">
                <div className="li-icon">📄</div>
                <div>
                  <div className="li-title">Industry-Standard Formatting</div>
                  <div className="li-desc">Courier Prime font, scene headings, action lines, character cues, dialogue, parentheticals, and transitions — done the Hollywood way.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">🎬</div>
                <div>
                  <div className="li-title">Feature Film Structure</div>
                  <div className="li-desc">Three-act structure, character arcs, plot points, midpoint, all-is-lost moment — everything that makes a feature film work.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">📺</div>
                <div>
                  <div className="li-title">TV Series Writing</div>
                  <div className="li-desc">Pilot structure, series bible, episodic vs serialized storytelling, writing for Nollywood and international TV markets.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">🎙️</div>
                <div>
                  <div className="li-title">Audio Drama Formatting</div>
                  <div className="li-desc">Writing scripts specifically for audio — PocketFM audio dramas, radio plays, and podcast fiction with no visual cues.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">🤝</div>
                <div>
                  <div className="li-title">Getting Your Script Noticed</div>
                  <div className="li-desc">Query letters for producers, pitch decks, script competitions, networking with directors, and using the Industry Connect feature.</div>
                </div>
              </div>
              <div className="learn-item">
                <div className="li-icon">✍️</div>
                <div>
                  <div className="li-title">Using the Script Editor</div>
                  <div className="li-desc">How to use the Ink2Wealth Script Editor to write and format your screenplay with one-tap element switching and Analyze Script integration.</div>
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
              10 Modules. 40 Lessons.
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

        {/* PRICING */}
        <div className="price-box">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="sec-label">Enroll Today</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "36px", fontWeight: 900, color: "var(--wh)" }}>Get Full Access</h2>
          </div>
          <div className="pb-inner">
            <Link href="/register" className="pb-card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div>
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
                <button style={{ width: "100%", background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "14px", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer" }}>Enroll — ₦30,000</button>
              </div>
            </Link>
            <Link href="/register" className="pb-card feat" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, padding: "4px 16px", borderRadius: "20px", background: "linear-gradient(135deg,var(--gl),var(--gm))", color: "#080808", display: "inline-block", marginBottom: "12px" }}>SAVE MORE</div>
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
                <button className="btn-g" style={{ width: "100%" }}>Get Both — ₦55,000</button>
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* STICKY ENROLL */}
      <div className="sticky-enroll">
        <div className="se-left">
          <div>
            <div className="se-name">SSG Blueprint</div>
            <div style={{ fontSize: "12px", color: "var(--m1)" }}>10 modules · Lifetime access · Certificate included</div>
          </div>
          <div className="se-price">₦30,000</div>
        </div>
        <Link href="/register" style={{ background: "linear-gradient(135deg,#c0392b,#8B0000)", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: "13px", padding: "12px 28px", borderRadius: "10px", border: "none", cursor: "pointer", textDecoration: "none", display: "inline-block" }}>
          Enroll Now →
        </Link>
      </div>

      <Footer />
    </div>
  );
}
