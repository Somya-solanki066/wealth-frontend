"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWorld, WORLD_CONFIG, type WorldId } from "@/context/WorldContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorldMarketingSections from "@/components/home/WorldMarketingSections";
import { FlagshipCourseStack } from "@/components/home/FlagshipCourseSections";
import "@/app/home-worlds.css";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

type ActiveWorld = Exclude<WorldId, "neutral">;

const WORLD_BADGES: Record<ActiveWorld, string> = {
  writer: "✍️ Fiction Writer's World",
  screenwriter: "🎬 Screenwriter's World",
  student: "🎓 Student's World",
};

type HomeHeroData = {
  secondaryCta: string;
  stats: { num: string; lbl: string }[];
};

const HOME_HERO: Record<ActiveWorld, HomeHeroData> = {
  writer: {
    secondaryCta: "See All Features",
    stats: [
      { num: "9", lbl: "Platforms Covered" },
      { num: "250+", lbl: "Writing Prompts" },
      { num: "10", lbl: "Edit Checks" },
      { num: "∞", lbl: "Chapters to Write" },
    ],
  },
  screenwriter: {
    secondaryCta: "See All Features",
    stats: [
      { num: "2×", lbl: "Daily Job Refreshes" },
      { num: "3", lbl: "Script Formats" },
      { num: "🌍", lbl: "Global + Nollywood" },
      { num: "∞", lbl: "Scripts to Write" },
    ],
  },
  student: {
    secondaryCta: "See All Courses",
    stats: [
      { num: "20", lbl: "Universities" },
      { num: "25", lbl: "Years of JAMB" },
      { num: "40k+", lbl: "Questions" },
      { num: "Free", lbl: "To Start" },
    ],
  },
};


const DOORS: {
  id: ActiveWorld;
  className: string;
  icon: string;
  type: string;
  title: React.ReactNode;
  desc: string;
  tagline: string;
  btn: string;
}[] = [
  {
    id: "writer",
    className: "door-w",
    icon: "✍️",
    type: "Fiction Writer",
    title: (
      <>
        Write It.
        <br />
        Publish It.
        <br />
        Earn From It.
      </>
    ),
    desc: "Serialized fiction writers who publish on PocketFM, Dreame, GoodNovel and 6 more platforms. Chapter Analyzer, Smart Edit, AI Ghost Writer, WEALTH Engine.",
    tagline: '"This app is for me."',
    btn: "Enter Writer's World →",
  },
  {
    id: "screenwriter",
    className: "door-s",
    icon: "🎬",
    type: "Screenwriter",
    title: (
      <>
        Script It.
        <br />
        Pitch It.
        <br />
        Get Produced.
      </>
    ),
    desc: "Screenwriters and scriptwriters targeting Nollywood, Hollywood, BBC, Netflix Africa and audio drama platforms. Script editor, Industry Hub, Open Calls.",
    tagline: '"This is the best screenwriter app."',
    btn: "Enter Screenwriter's World →",
  },
  {
    id: "student",
    className: "door-st",
    icon: "🎓",
    type: "Student",
    title: (
      <>
        Study It.
        <br />
        Pass It.
        <br />
        Own Your Future.
      </>
    ),
    desc: "Nigerian students preparing for JAMB UTME, Post-UTME, university past questions across 20 universities, Nursing, MBBS, Law and all professional courses.",
    tagline: '"Wow — this is my app."',
    btn: "Enter Student's World →",
  },
];

function WorldHeroTitle({ world }: { world: ActiveWorld }) {
  if (world === "writer") {
    return (
      <>
        Write Chapters
        <br />
        That <em>Earn Unlocks.</em>
      </>
    );
  }
  if (world === "screenwriter") {
    return (
      <>
        Script It.
        <br />
        <em>Pitch It.</em>
        <br />
        Get Produced.
      </>
    );
  }
  return (
    <>
      Study Smarter.
      <br />
      <em>Pass Faster.</em>
      <br />
      Own Your Future.
    </>
  );
}

function PhoneMockup({ world, displayName }: { world: ActiveWorld; displayName: string }) {
  type PhoneNavItem = [icon: string, label: string, active?: boolean];

  const renderPhoneNav = (items: PhoneNavItem[]) =>
    items.map((item) => {
      const [icon, label, active] = item;
      return (
        <div key={label} className="pm-ni">
          <span className="pm-ni-icon">{icon}</span>
          <span className={`pm-ni-lbl${active ? " on" : ""}`}>{label}</span>
        </div>
      );
    });

  const nameWithIcon =
    world === "writer"
      ? `${displayName} ✍️`
      : world === "screenwriter"
        ? `${displayName} 🎬`
        : `${displayName} 🎓`;

  if (world === "writer") {
    return (
      <div className="phone-mockup">
        <div className="pm-inner">
          <div className="pm-greet">Good evening</div>
          <div className="pm-name">{nameWithIcon}</div>
          <div className="pm-streak">🔥 1,240 words today · 5 day streak · PocketFM</div>
          <div className="pm-stat-row">
            <div className="pm-stat"><div className="pm-stat-n">3</div><div className="pm-stat-l">Active Projects</div></div>
            <div className="pm-stat"><div className="pm-stat-n">87k</div><div className="pm-stat-l">Total Words</div></div>
            <div className="pm-stat"><div className="pm-stat-n">2</div><div className="pm-stat-l">Contracts</div></div>
            <div className="pm-stat"><div className="pm-stat-n">74</div><div className="pm-stat-l">Avg Score</div></div>
          </div>
          <div className="pm-sec">Continue Writing</div>
          <div className="pm-card"><div className="pm-card-icon">📖</div><div><div className="pm-card-title">Dragon Rider — Ch. 74</div><div className="pm-card-meta">PocketFM · 1,240 words · 2hrs ago</div></div></div>
          <div className="pm-card"><div className="pm-card-icon">🩸</div><div><div className="pm-card-title">Vampire Slave Omega</div><div className="pm-card-meta">Dreame · Ch. 12 · 8,400 words</div></div></div>
          <div className="pm-sec">Quick Tools</div>
          <div className="pm-tools">
            {["🔍 Analyze", "✅ Smart Edit", "👻 Ghost", "💡 Vault"].map((t) => (
              <div key={t} className="pm-tool"><div className="pm-tool-icon">{t.split(" ")[0]}</div><div className="pm-tool-lbl">{t.split(" ").slice(1).join(" ")}</div></div>
            ))}
          </div>
          <div className="pm-nav">
            {renderPhoneNav([
              ["🏠", "Home", true],
              ["✍️", "Write"],
              ["🔍", "Analyze"],
              ["💰", "WEALTH"],
              ["👤", "Profile"],
            ])}
          </div>
        </div>
      </div>
    );
  }

  if (world === "screenwriter") {
    return (
      <div className="phone-mockup">
        <div className="pm-inner">
          <div className="pm-greet">Welcome back</div>
          <div className="pm-name">{nameWithIcon}</div>
          <div className="pm-streak">Drama · Nollywood · Feature Film · 2 active scripts</div>
          <div style={{ background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: "var(--ac)", marginBottom: 3 }}>🔴 NEW OPEN CALL</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#f0ebe0" }}>Drama Feature · Netflix Africa</div>
            <div style={{ fontSize: 6, color: "var(--ac3)" }}>Budget $60k · 12 days left</div>
          </div>
          <div className="pm-sec">My Scripts</div>
          <div className="pm-card"><div className="pm-card-icon">📄</div><div><div className="pm-card-title">The Last Council — Feature</div><div className="pm-card-meta">Act 2 · 67 pages · Nollywood Drama</div></div></div>
          <div className="pm-card"><div className="pm-card-icon">📺</div><div><div className="pm-card-title">Blood & Honour — TV Pilot</div><div className="pm-card-meta">Draft 2 · 48 pages · Complete</div></div></div>
          <div className="pm-sec">Quick Tools</div>
          <div className="pm-tools">
            {["📝 Script", "🏭 Industry", "👤 Profile", "📊 Pitch Deck"].map((t) => (
              <div key={t} className="pm-tool"><div className="pm-tool-icon">{t.split(" ")[0]}</div><div className="pm-tool-lbl">{t.split(" ").slice(1).join(" ")}</div></div>
            ))}
          </div>
          <div className="pm-nav">
            {renderPhoneNav([
              ["🏠", "Home", true],
              ["📝", "Script"],
              ["🏭", "Industry"],
              ["🤝", "Community"],
              ["👤", "Profile"],
            ])}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-mockup">
      <div className="pm-inner">
        <div className="pm-greet">Good morning</div>
        <div className="pm-name">{nameWithIcon}</div>
        <div className="pm-streak">Jambite · MBBS · Target: UNEC · 47 days to exam</div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: "var(--ac2)", marginBottom: 4 }}>📅 JAMB Countdown</div>
          <div style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: 22, fontWeight: 900, color: "var(--ac)" }}>
            47 <span style={{ fontSize: 9, fontWeight: 400, color: "var(--ac3)" }}>days left</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,.1)", borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
            <div style={{ width: "38%", height: "100%", background: "linear-gradient(90deg,var(--ac3),var(--ac))", borderRadius: 2 }} />
          </div>
          <div style={{ fontSize: 6, color: "var(--ac3)", marginTop: 3 }}>Biology: 38% covered — focus here today</div>
        </div>
        <div className="pm-stat-row">
          <div className="pm-stat"><div className="pm-stat-n">247</div><div className="pm-stat-l">Questions Done</div></div>
          <div className="pm-stat"><div className="pm-stat-n">68%</div><div className="pm-stat-l">Avg Score</div></div>
        </div>
        <div className="pm-sec">Quick Access</div>
        <div className="pm-tools">
          {["📚 JAMB", "🏫 UNEC", "⚠️ Weak Areas", "🧪 Drug Calc"].map((t) => (
            <div key={t} className="pm-tool"><div className="pm-tool-icon">{t.split(" ")[0]}</div><div className="pm-tool-lbl">{t.split(" ").slice(1).join(" ")}</div></div>
          ))}
        </div>
        <div className="pm-card" style={{ marginTop: 4 }}><div className="pm-card-icon">🏆</div><div><div className="pm-card-title">Today&apos;s Challenge</div><div className="pm-card-meta">Organic Chemistry — 1 question · 2 minutes</div></div></div>
        <div className="pm-nav">
          {renderPhoneNav([
            ["🏠", "Home", true],
            ["📚", "Practice"],
            ["🏫", "Uni"],
            ["📊", "Progress"],
            ["👤", "Profile"],
          ])}
        </div>
      </div>
    </div>
  );
}

export default function WorldsHome() {
  const { world, setWorld } = useWorld();
  const { user, profile } = useAuth();
  const router = useRouter();

  const authPath = user ? "/dashboard" : "/register";
  const phoneDisplayName =
    profile?.displayName?.trim() ||
    user?.displayName?.trim() ||
    "Your Name";

  const renderWorldPage = (worldId: ActiveWorld) => {
    const cfg = WORLD_CONFIG[worldId];
    const page = HOME_HERO[worldId];

    return (
      <div className="world-page">
        <div className="wp-inner">
          <div className="world-hero">
            <div className="wh-left">
              <div className="wh-badge">{WORLD_BADGES[worldId]}</div>
              <h1 className="wh-h1"><WorldHeroTitle world={worldId} /></h1>
              <p className="wh-sub">
                {worldId === "writer" && "The only platform built for serialized fiction writers on PocketFM, Dreame, GoodNovel, WebNovel and 5 more. Your Chapter Analyzer knows exactly what each editor wants."}
                {worldId === "screenwriter" && "The only platform built specifically for Nigerian and African screenwriters. Script editor, Industry Hub, Open Calls board, Short Film Showcase — everything you need to go from script to screen."}
                {worldId === "student" && "JAMB UTME practice, university past questions across 20 Nigerian universities, Nursing, MBBS, Law, Pharmacy and all professional courses. Built for Nigerian students. Finally."}
              </p>
              <div className="wh-btns">
                <button type="button" className="btn-world-primary" onClick={() => router.push(authPath)}>
                  {cfg.cta}
                </button>
                <button
                  type="button"
                  className="btn-world-secondary"
                  onClick={() =>
                    scrollToId(
                      worldId === "student" ? "world-courses" : "world-features"
                    )
                  }
                >
                  {page.secondaryCta}
                </button>
              </div>
              <div className="wh-stats">
                {page.stats.map((s) => (
                  <div key={s.lbl}>
                    <div className="ws-num">{s.num}</div>
                    <div className="ws-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="wh-right">
              <PhoneMockup world={worldId} displayName={phoneDisplayName} />
            </div>
          </div>

          <WorldMarketingSections world={worldId} />
        </div>
      </div>
    );
  };

  return (
    <div className="worlds-home">
      <Navbar />

      {world === "neutral" ? (
        <div className="neutral-landing">
          <div className="neutral-hero">
            <div className="nh-inner">
              <div className="nh-badge">✦ Launching 2027 — Join the Waitlist</div>
              <h1 className="nh-h1">
                One App.
                <br />
                <em>Three Worlds.</em>
                <br />
                All Yours.
              </h1>
              <p className="nh-sub">
                Ink2Wealth is built for three kinds of people. Choose your world and the entire platform shifts to serve you — and only you.
              </p>

              <div className="three-doors">
                {DOORS.map((door) => (
                  <div
                    key={door.id}
                    className={`door ${door.className}`}
                    onClick={() => setWorld(door.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setWorld(door.id)}
                  >
                    <div className="door-icon">{door.icon}</div>
                    <div className="door-type">{door.type}</div>
                    <div className="door-title">{door.title}</div>
                    <div className="door-desc">{door.desc}</div>
                    <div className="door-tagline">{door.tagline}</div>
                    <button type="button" className="door-btn" onClick={(e) => { e.stopPropagation(); setWorld(door.id); }}>
                      {door.btn}
                    </button>
                  </div>
                ))}
              </div>

              <p className="nh-note">You can switch worlds anytime from your profile. One subscription. Three complete platforms.</p>
            </div>
          </div>
          <FlagshipCourseStack variant="both" />
        </div>
      ) : (
        renderWorldPage(world)
      )}

      {world !== "neutral" && <Footer />}
    </div>
  );
}
