"use client";

import React, { useState } from "react";
import Link from "next/link";

type CourseVariant = "witweb" | "ssg";

const WITWEB_LEARN = [
  {
    icon: "📖",
    title: "How Each Platform Works",
    desc: "What PocketFM, Dreame, GoodNovel, WebNovel and 5 more platforms specifically want.",
  },
  {
    icon: "🎯",
    title: "Chapters That Convert",
    desc: "Hooks, tension, and cliffhangers that make readers pay to unlock every time.",
  },
  {
    icon: "📝",
    title: "Platform Submission and Contracts",
    desc: "Exact steps to submit, what editors want, and how to negotiate your contract.",
  },
  {
    icon: "💰",
    title: "Earning Consistently",
    desc: "How payment works on each platform and how to build a sustainable writing income.",
  },
];

const SSG_LEARN = [
  {
    icon: "📄",
    title: "Industry-Standard Formatting",
    desc: "Scene headings, action lines, dialogue, parentheticals — the Hollywood standard done correctly.",
  },
  {
    icon: "🎬",
    title: "Feature Film Structure",
    desc: "Three-act structure, character arcs, plot points, and the all-is-lost moment.",
  },
  {
    icon: "📺",
    title: "TV Series and Audio Drama",
    desc: "Pilot structure, series bible, and writing specifically for Nollywood and audio platforms.",
  },
  {
    icon: "🤝",
    title: "Getting Your Script Noticed",
    desc: "Query letters, pitch decks, competitions, networking with producers and directors.",
  },
];

function AlsoFromDivider({ subtitle }: { subtitle: string }) {
  return (
    <div className="also-from-divider">
      <div className="also-from-line" />
      <div className="also-from-center">
        <div className="also-from-kicker">Also from Ink2Wealth</div>
        <div className="also-from-title">Learn Directly from Coach Victor</div>
        <div className="also-from-sub">{subtitle}</div>
      </div>
      <div className="also-from-line also-from-line-right" />
    </div>
  );
}

function FlagshipCourseBlock({ variant }: { variant: CourseVariant }) {
  const isWitweb = variant === "witweb";

  return (
    <section className="flagship-course-section">
      <span className="sec-label">Flagship Course</span>
      <h2 className="sec-h2">{isWitweb ? "WIT-WEB Academy" : "SSG Blueprint"}</h2>
      <div className="flagship-course-grid">
        <div className="flagship-course-card">
          <div
            className="flagship-course-banner"
            style={{
              background: isWitweb
                ? "linear-gradient(135deg,#1a1200,#2e2000)"
                : "linear-gradient(135deg,#1a0006,#2e0010)",
            }}
          >
            {isWitweb ? "📖" : "🎬"}
          </div>
          <div className="flagship-course-body">
            <div className="flagship-course-kicker">
              {isWitweb ? "WIT-WEB Academy" : "SSG Blueprint"}
            </div>
            <div className="flagship-course-name">
              {isWitweb
                ? "Webnoveling Ink to Wealth Blueprint"
                : "Scriptwriting and Screenwriting Guide"}
            </div>
            <div className="flagship-course-desc">
              {isWitweb
                ? "The complete guide to writing, publishing, and earning from serialized fiction on all 9 major platforms. Real editor standards. Real income strategies."
                : "Master screenplay and script writing from concept to final draft. Feature films, TV series, audio drama — and how to get your script into the right hands."}
            </div>
            <div className="flagship-course-tags">
              {isWitweb ? (
                <>
                  <span className="flagship-tag">12 Modules</span>
                  <span className="flagship-tag">48 Lessons</span>
                  <span className="flagship-tag">9 Platforms</span>
                  <span className="flagship-tag flagship-tag-green">Lifetime Access</span>
                </>
              ) : (
                <>
                  <span className="flagship-tag">10 Modules</span>
                  <span className="flagship-tag">40 Lessons</span>
                  <span className="flagship-tag">Film + TV + Audio</span>
                  <span className="flagship-tag flagship-tag-green">Lifetime Access</span>
                </>
              )}
            </div>
            <Link
              href={isWitweb ? "/witweb-landing" : "/ssg-landing"}
              className="btn-world-primary flagship-enroll-btn"
            >
              {isWitweb ? "Enroll Now — ₦35,000" : "Enroll Now — ₦30,000"}
            </Link>
            <Link
              href={isWitweb ? "/witweb-landing" : "/ssg-landing"}
              className="btn-world-secondary flagship-enroll-btn"
            >
              {isWitweb ? "Get Bundle with App — ₦55,000" : "Get Both Courses — ₦55,000"}
            </Link>
          </div>
        </div>

        <div className="flagship-learn-col">
          <div className="flagship-learn-title">What You Will Learn</div>
          <div className="flagship-learn-list">
            {(isWitweb ? WITWEB_LEARN : SSG_LEARN).map((item) => (
              <div key={item.title} className="flagship-learn-item">
                <div className="flagship-learn-icon">{item.icon}</div>
                <div>
                  <div className="flagship-learn-item-title">{item.title}</div>
                  <div className="flagship-learn-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flagship-creator-card">
            <div className="flagship-creator-avatar">👨‍🏫</div>
            <div>
              <div className="flagship-creator-name">Victor Daniels — Course Creator</div>
              <div className="flagship-creator-desc">
                {isWitweb
                  ? "Teaching from live publishing experience on PocketFM, Dreame, GoodNovel and more. Real contracts. Real editors. Real income."
                  : "Teaching screenwriting from professional experience. Nollywood, Hollywood and audio drama industry knowledge built into every lesson."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoachVictorBlock({
  variant,
  onYouTube,
}: {
  variant: CourseVariant;
  onYouTube: () => void;
}) {
  const isWitweb = variant === "witweb";

  return (
    <section className="coach-victor-section">
      <span className="sec-label">Your Coach</span>
      <h2 className="sec-h2">Meet Coach Victor Daniels</h2>
      <div className="coach-victor-card">
        <div
          className="coach-victor-avatar"
          style={{
            background: isWitweb
              ? "linear-gradient(135deg,#1e1500,#2a1e00)"
              : "linear-gradient(135deg,#1a0006,#2a0010)",
          }}
        >
          👨‍🏫
        </div>
        <div className="coach-victor-content">
          <div className="coach-victor-name">Victor Daniels</div>
          <div className="coach-victor-role">
            {isWitweb
              ? "Serialized Fiction Expert · Writing Coach · Founder, Ink2Wealth Media Limited"
              : "Screenwriter · Coach · Founder, Ink2Wealth Media Limited"}
          </div>
          <div className="coach-victor-bio">
            {isWitweb
              ? "Contracted author on PocketFM, Dreame, and GoodNovel. Founder of WIT-WEB Academy and coach to 2,400+ writers worldwide. Everything he teaches comes from live publishing experience — real contracts, real editors, real income."
              : "Screenwriter, writing coach and founder of SSG Blueprint. Teaches from professional experience across Nollywood, Hollywood format standards, and audio drama for platforms like PocketFM. Everything in the course is industry-tested."}
          </div>
          <div className="coach-victor-stats">
            <div>
              <div className="coach-victor-stat-num">2,400+</div>
              <div className="coach-victor-stat-lbl">Writers Coached</div>
            </div>
            <div>
              <div className="coach-victor-stat-num">
                {isWitweb ? "9" : "3"}
              </div>
              <div className="coach-victor-stat-lbl">
                {isWitweb ? "Platforms Mastered" : "Script Formats Taught"}
              </div>
            </div>
            <div>
              <div className="coach-victor-stat-num">YouTube</div>
              <div className="coach-victor-stat-lbl">@CoachVictorDaniels</div>
            </div>
          </div>
          <div className="coach-victor-actions">
            <Link
              href={isWitweb ? "/witweb-landing" : "/ssg-landing"}
              className="btn-world-primary"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              {isWitweb ? "Enroll in WIT-WEB →" : "Enroll in SSG Blueprint →"}
            </Link>
            <button type="button" className="btn-world-secondary" onClick={onYouTube}>
              ▶️ YouTube Channel
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FlagshipCourseStack({
  variant,
}: {
  variant: CourseVariant | "both";
}) {
  const [toast, setToast] = useState("");

  const showYouTube = () => {
    setToast("Opening YouTube — @CoachVictorDaniels!");
    setTimeout(() => setToast(""), 2200);
  };

  const stacks: CourseVariant[] =
    variant === "both" ? ["witweb", "ssg"] : [variant];

  return (
    <div className="flagship-stack">
      {stacks.map((v, idx) => (
        <div key={v} className="flagship-stack-block">
          <AlsoFromDivider
            subtitle={
              v === "witweb"
                ? "Go deeper with our flagship courses. Use the app to practise. Take the course to master it."
                : "Go deeper with the SSG Blueprint course. Use the Script Editor to write. Take the course to master the craft."
            }
          />
          <div className="flagship-stack-inner">
            <FlagshipCourseBlock variant={v} />
            <CoachVictorBlock variant={v} onYouTube={showYouTube} />
          </div>
        </div>
      ))}

      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg1, #161000)",
            border: "1px solid var(--ac3, #2a1e00)",
            borderRadius: 14,
            padding: "12px 24px",
            fontSize: 13,
            color: "var(--ac, var(--gd))",
            fontWeight: 600,
            zIndex: 999,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
