import type { ReactNode } from "react";

export type ActiveWorld = "writer" | "screenwriter" | "student";

export const ACTIVE_WORLDS: ActiveWorld[] = ["writer", "screenwriter", "student"];

export function isActiveWorld(value: string): value is ActiveWorld {
  return ACTIVE_WORLDS.includes(value as ActiveWorld);
}

export type FeatureItem = {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  link?: string;
};

export type PlanFeature = { text: string; included: boolean };

export type PricingPlan = {
  id: "free" | "6-month" | "yearly";
  name: string;
  price: string;
  period: string;
  featured?: boolean;
  badge?: string;
  features: PlanFeature[];
  cta: string;
  variant: "primary" | "secondary";
};

export type CourseItem = {
  icon: string;
  title: string;
  desc: string;
  meta: string;
  href: string;
  /** Small uppercase line above title (e.g. WIT-WEB Academy) */
  subtitle?: string;
  tags?: string[];
  cta?: string;
  bannerGradient?: string;
  /** "gold" (default) | "ssg" red button */
  ctaVariant?: "gold" | "ssg";
};

export type FreeResourceItem = {
  label: string;
};

export type WorldPageData = {
  featuresLabel: string;
  featuresH2: string;
  featuresH2Lines?: string[];
  pricingLabel: string;
  pricingH2: string;
  coursesLabel: string;
  coursesH2: string;
  coursesIntro: string;
  features: FeatureItem[];
  pricing: PricingPlan[];
  courses: CourseItem[];
  freeResources?: {
    label: string;
    title: string;
    intro: string;
    items: FreeResourceItem[];
  };
};

export const WORLD_PAGES: Record<ActiveWorld, WorldPageData> = {
  writer: {
    featuresLabel: "Built For Serialized Fiction Writers",
    featuresH2: "Every Tool You Need to Win on Every Platform",
    pricingLabel: "Simple Pricing",
    pricingH2: "Start Free. Upgrade When Ready.",
    coursesLabel: "Learn from Coach Victor",
    coursesH2: "Two Flagship Courses",
    coursesIntro:
      "Whether you write novels or screenplays, we have a complete course to take you from beginner to professional.",
    features: [
      { icon: "🔍", title: "Chapter Analyzer", desc: "Paste your chapter, select your platform. AI evaluates it the way a real PocketFM, Dreame, or GoodNovel editor would. Specific feedback. Not generic.", tag: "FREE — 3/month", link: "/dashboard?tab=analyzer-workspace" },
      { icon: "✅", title: "Smart Edit Suite", desc: "10 professional editing checks. Grammar, Passive Voice, Filler Words, Show Don't Tell, Dialogue Tags, Sentence Length, Opening Line Score and more.", tag: "3 checks FREE", link: "/dashboard?tab=smart-edit" },
      { icon: "👻", title: "AI Ghost Writer", desc: "Tell us your characters, platform, and what should happen. AI writes a complete, platform-ready chapter — 800 to 2,000 words with a cliffhanger ending.", tag: "PREMIUM" },
      { icon: "💡", title: "Writing Vault", desc: "250+ writing prompts organized by genre and trope. Fire Starters, Scene Builders, Character Voice prompts. Tap and write.", tag: "FREE" },
      { icon: "🎨", title: "Book Cover Generator", desc: "AI generates covers calibrated for your platform aesthetic. PocketFM covers look different from Dreame covers. We know the difference.", tag: "PREMIUM" },
      { icon: "💰", title: "WEALTH Engine", desc: "Writing jobs board, author branding suite, book promotion tools, Amazon KDP and Draft2Digital publishing integration. Turn writing into income.", tag: "PREMIUM" },
    ],
    pricing: [
      {
        id: "free", name: "Free", price: "₦0", period: "Forever free", cta: "Start Free", variant: "secondary",
        features: [
          { text: "3 chapter analyses per month", included: true },
          { text: "Novel Editor — unlimited", included: true },
          { text: "3 Smart Edit checks free", included: true },
          { text: "Writing Vault — browse all prompts", included: true },
          { text: "AI Ghost Writer", included: false },
          { text: "Book Cover Generator", included: false },
        ],
      },
      {
        id: "6-month", name: "6-Month", price: "₦24,900", period: "every 6 months · Save 40%", featured: true, badge: "⭐ BEST VALUE", cta: "Get 6-Month Access", variant: "primary",
        features: [
          { text: "Unlimited chapter analysis — all 9 platforms", included: true },
          { text: "AI Ghost Writer — unlimited", included: true },
          { text: "All 10 Smart Edit checks", included: true },
          { text: "Book Cover Generator — unlimited", included: true },
          { text: "Full WEALTH Engine", included: true },
          { text: "Priority support", included: true },
        ],
      },
      {
        id: "yearly", name: "Yearly", price: "₦49,900", period: "per year · Save 60%", cta: "Get Yearly Access", variant: "primary",
        features: [
          { text: "Everything in 6-Month", included: true },
          { text: "Early access to new features", included: true },
          { text: "WIT-WEB Academy discount", included: true },
          { text: "Founding member badge", included: true },
          { text: "1 free coaching session", included: true },
        ],
      },
    ],
    courses: [
      {
        icon: "📖",
        subtitle: "WIT-WEB Academy",
        title: "Webnoveling Ink to Wealth Blueprint",
        desc: "The complete guide to writing, publishing, and earning from serialized fiction on all major platforms. Learn what each platform wants and how to get paid for it.",
        meta: "9 Platforms · Serialized Fiction",
        tags: ["9 Platforms", "Serialized Fiction", "Monetization", "Expert Level"],
        cta: "Enroll in WIT-WEB →",
        href: "/witweb-landing",
        bannerGradient: "linear-gradient(135deg,#1a1200,#2e2000)",
      },
      {
        icon: "🎬",
        subtitle: "SSG Blueprint",
        title: "Scriptwriting & Screenwriting Guide",
        desc: "Master screenplay and script writing from concept to final draft. Covers feature films, TV series, audio drama formatting, and getting your script to the right people.",
        meta: "Film · TV · Audio Drama",
        tags: ["Film", "TV Series", "Audio Drama", "Formatting"],
        cta: "Enroll in SSG →",
        href: "/ssg-landing",
        bannerGradient: "linear-gradient(135deg,#1a0008,#2e0014)",
        ctaVariant: "ssg",
      },
    ],
    freeResources: {
      label: "Free Resources",
      title: "Start Learning for Free",
      intro: "Download these free guides and start your writing journey today",
      items: [
        { label: "📥 Platform Monetization Blueprint" },
        { label: "📥 From Blank Page to Final Draft" },
      ],
    },
  },
  screenwriter: {
    featuresLabel: "Built For Screenwriters",
    featuresH2: "From First Draft to Final Production",
    pricingLabel: "Simple Pricing",
    pricingH2: "Start Free. Scale With Your Career.",
    coursesLabel: "Learn",
    coursesH2: "Master Script & Screenwriting",
    coursesIntro: "From concept to final draft — feature films, TV, and audio drama for Nollywood and beyond.",
    features: [
      { icon: "📝", title: "Professional Script Editor", desc: "Courier Prime font. One-tap element switching — scene heading, action, character, dialogue, parenthetical. Hollywood standard formatting built in.", tag: "FREE" },
      { icon: "🏭", title: "Industry Hub & Open Calls", desc: "Directors and producers post open calls. Board refreshes every midnight and 7am. Filter by genre, industry, budget. Apply directly through the platform.", tag: "FREE — 3/day" },
      { icon: "🎥", title: "Short Film Showcase", desc: "Upload your short film, logline, script, and budget. Directors and producers browse, watch, and reach out. Cinema-style browsing experience.", tag: "PREMIUM" },
      { icon: "📜", title: "Script Marketplace", desc: "Upload completed scripts for sale or option. Producers preview the first 10 pages free then purchase. You earn. Ink2Wealth takes 10-15% commission.", tag: "PREMIUM" },
      { icon: "🤝", title: "Screenwriter Community", desc: "Public script reading room, genre-based rooms, weekly feedback threads, collaboration board, mentorship matching. Your industry family.", tag: "FREE" },
      { icon: "📊", title: "Pitch Deck & Query Builder", desc: "AI builds your complete pitch deck for publishers and producers. Query letter, synopsis, logline — your full submission package ready to send.", tag: "PREMIUM" },
    ],
    pricing: [
      {
        id: "free", name: "Free", price: "₦0", period: "Forever free", cta: "Start Free", variant: "secondary",
        features: [
          { text: "Script Editor — unlimited", included: true },
          { text: "3 Open Calls per day", included: true },
          { text: "Community access", included: true },
          { text: "Public screenwriter profile", included: true },
          { text: "Script Marketplace", included: false },
          { text: "Short Film Showcase", included: false },
        ],
      },
      {
        id: "6-month", name: "6-Month", price: "₦24,900", period: "every 6 months", featured: true, badge: "⭐ BEST VALUE", cta: "Get 6-Month Access", variant: "primary",
        features: [
          { text: "Unlimited Open Calls access", included: true },
          { text: "Script Marketplace — sell scripts", included: true },
          { text: "Short Film Showcase — pitch films", included: true },
          { text: "Pitch Deck and Query Builder", included: true },
          { text: "Book a Call with producers", included: true },
          { text: "Verified Pro badge", included: true },
        ],
      },
      {
        id: "yearly", name: "Yearly", price: "₦49,900", period: "per year · Save 60%", cta: "Get Yearly Access", variant: "primary",
        features: [
          { text: "Everything in 6-Month", included: true },
          { text: "SSG Blueprint discount", included: true },
          { text: "Priority open calls — 24hr early access", included: true },
          { text: "1 free coaching session", included: true },
          { text: "Featured profile placement", included: true },
        ],
      },
    ],
    courses: [
      { icon: "🎬", title: "SSG Blueprint", desc: "Scriptwriting & Screenwriting Guide — from concept to final draft for film, TV, and audio drama.", meta: "10 Modules · Lifetime access", href: "/ssg-landing" },
      { icon: "🏭", title: "Industry & Pitching", desc: "Open calls, query letters, and pitching to Nollywood, Netflix Africa, and global buyers.", meta: "Included in SSG", href: "/courses" },
      { icon: "🎥", title: "Coach Victor", desc: "Direct coaching and community for serious screenwriters.", meta: "Mentorship", href: "/coach" },
    ],
  },
  student: {
    featuresLabel: "Built For Nigerian Students",
    featuresH2: "Pass JAMB. Ace Your Exams. Own Your Future.",
    featuresH2Lines: ["Pass JAMB. Ace Your Exams.", "Own Your Future."],
    pricingLabel: "Mostly Free",
    pricingH2: "Study Free. Upgrade for the Full Archive.",
    coursesLabel: "Study Paths",
    coursesH2: "Courses Built For Nigerian Students",
    coursesIntro: "JAMB, university past questions, Nursing, MBBS, Law and professional exam prep.",
    features: [
      { icon: "📚", title: "JAMB UTME Practice", desc: "25 years of past questions across all 14 JAMB subjects. CBT interface that mirrors the real JAMB exam exactly — timer, mark for review, auto-submit. Post-UTME per university.", tag: "MORE FREE THAN PAID" },
      { icon: "🏫", title: "University Past Questions", desc: "20 universities. All faculties — Sciences, Engineering, Law, Medicine, Arts, Commerce, Education. Navigate by University → Faculty → Department → Course → Year.", tag: "3 YEARS FREE" },
      { icon: "💊", title: "Nursing Hub", desc: "Year 1 through Year 5. MedSurg, MCH, Community Health, Mental Health, ICU, Emergency Nursing. Drug Calculation Tool built in — unique in Nigeria.", tag: "FREE + PREMIUM" },
      { icon: "🩺", title: "MBBS Hub", desc: "Complete 6-year programme. Pre-clinical, Para-clinical, Clinical years. Clinical scenario questions that mirror real professional exams. Not just MCQs.", tag: "FREE + PREMIUM" },
      { icon: "⚖️", title: "All Professional Courses", desc: "Law, Pharmacy, Medical Lab Science, Radiography, Physiotherapy, Dentistry, Optometry, Nutrition, Public Health, Environmental Health. All covered.", tag: "FREE + PREMIUM" },
      { icon: "📊", title: "Smart Performance Analytics", desc: "Score history. Subject breakdown. Weak area detector. Study streak. The app tells you exactly what to study today based on where you are weakest.", tag: "FREE" },
    ],
    pricing: [
      {
        id: "free", name: "Free", price: "₦0", period: "No account needed to start", cta: "Start Studying Free", variant: "secondary",
        features: [
          { text: "3 years of past questions per course", included: true },
          { text: "JAMB practice — 5 years free", included: true },
          { text: "Smart analytics and weak areas", included: true },
          { text: "Daily challenge question", included: true },
          { text: "Drug Calculator for nurses", included: true },
          { text: "Full 25-year JAMB archive", included: false },
        ],
      },
      {
        id: "6-month", name: "6-Month", price: "₦24,900", period: "every 6 months · Save 40%", featured: true, badge: "⭐ MOST POPULAR", cta: "Get Full Access", variant: "primary",
        features: [
          { text: "Full 25-year JAMB archive — all subjects", included: true },
          { text: "All university past questions — all years", included: true },
          { text: "All professional courses — full access", included: true },
          { text: "Unlimited CBT simulations", included: true },
          { text: "AI explanations for every answer", included: true },
          { text: "Offline practice mode", included: true },
        ],
      },
      {
        id: "yearly", name: "Yearly", price: "₦49,900", period: "per year · Maximum value", cta: "Get Yearly Access", variant: "primary",
        features: [
          { text: "Everything in 6-Month", included: true },
          { text: "NCLEX preparation (nurses going abroad)", included: true },
          { text: "New questions added weekly", included: true },
          { text: "Priority new university additions", included: true },
          { text: "WIT-WEB and SSG course discount", included: true },
        ],
      },
    ],
    courses: [
      { icon: "📚", title: "JAMB UTME Prep", desc: "25 years of past questions with CBT mode that mirrors the real exam.", meta: "14 subjects", href: "/student" },
      { icon: "🏫", title: "University Past Questions", desc: "20 universities across all faculties — Sciences, Law, Medicine, Engineering and more.", meta: "Faculty → Course → Year", href: "/student" },
      { icon: "💊", title: "Nursing & MBBS Tracks", desc: "Professional course hubs with clinical scenarios and drug calculation tools.", meta: "Free + Premium", href: "/student" },
    ],
  },
};

export function worldSectionPath(world: ActiveWorld, section: "features" | "pricing" | "courses") {
  return `/${world}/${section}`;
}
