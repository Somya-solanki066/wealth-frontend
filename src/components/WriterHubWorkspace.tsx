"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  Ghost,
  Image,
  Lightbulb,
  PenTool,
  Sparkles,
  Coins,
  Briefcase,
  Zap,
  Smile,
} from "lucide-react";

export type WriterHubToolId =
  | "novels-list"
  | "content-freelance"
  | "analyzer-workspace"
  | "smart-edit"
  | "ghost-writer"
  | "writing-vault"
  | "book-cover-generator"
  | "wealth"
  | "short-fiction"
  | "nonfiction-ghost"
  | "web3";

const TOOLS: {
  id: WriterHubToolId;
  title: string;
  desc: string;
  badge: "FREE" | "PREMIUM" | string;
  icon: ReactNode;
}[] = [
  {
    id: "novels-list",
    title: "My Novels",
    desc: "Create and manage serialized web novels. Open the Novel Editor with autosave and chapter tools.",
    badge: "FREE",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: "content-freelance",
    title: "Content & Freelance",
    desc: "Write Something — blogs, social, newsletters, memos, UGC scripts. Brief → structure → draft.",
    badge: "NEW",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "short-fiction",
    title: "Short-Form Fiction",
    desc: "Flash prompts, one-shots, and sprint tools — write a complete story in minutes.",
    badge: "NEW",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    id: "nonfiction-ghost",
    title: "Nonfiction & Ghostwriting",
    desc: "Memoirs, self-help, business books — write your own or ghostwrite for a client.",
    badge: "NEW",
    icon: <Smile className="h-5 w-5" />,
  },
  {
    id: "web3",
    title: "Web3 Writing",
    desc: "Explainers for Web3 projects, plus on-chain fiction tools.",
    badge: "NEW",
    icon: <Coins className="h-5 w-5" />,
  },
  {
    id: "analyzer-workspace",
    title: "Chapter Analyzer",
    desc: "Paste a chapter, pick your platform. AI scores hooks, pacing, and emotion the way PocketFM or Dreame editors would.",
    badge: "FREE — 3/month",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    id: "smart-edit",
    title: "Smart Edit Suite",
    desc: "10 professional checks — grammar, passive voice, filler, show don't tell, dialogue tags, and more.",
    badge: "3 checks FREE",
    icon: <PenTool className="h-5 w-5" />,
  },
  {
    id: "ghost-writer",
    title: "AI Ghost Writer",
    desc: "Characters, platform, and plot beats → a full chapter with cliffhanger. Save into Novel Editor.",
    badge: "PREMIUM",
    icon: <Ghost className="h-5 w-5" />,
  },
  {
    id: "writing-vault",
    title: "Writing Vault",
    desc: "250+ prompts by genre and trope — Fire Starters, Scene Builders, Character Voice.",
    badge: "FREE",
    icon: <Lightbulb className="h-5 w-5" />,
  },
  {
    id: "book-cover-generator",
    title: "Book Cover Generator",
    desc: "Platform-calibrated covers for PocketFM, Dreame, GoodNovel, and WebNovel with your title typography.",
    badge: "PREMIUM",
    icon: <Image className="h-5 w-5" />,
  },
  {
    id: "wealth",
    title: "WEALTH Engine",
    desc: "Jobs board, branding suite, and publishing tools — turn writing into income.",
    badge: "PREMIUM",
    icon: <Coins className="h-5 w-5" />,
  },
];

export default function WriterHubWorkspace({
  onSelect,
}: {
  onSelect: (id: WriterHubToolId) => void;
}) {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="font-serif text-2xl font-bold text-white">Writer Hub</h2>
        <p className="text-xs text-[#909090] mt-1">
          Novel tools — editor, analysis, AI drafting, covers, and monetization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelect(tool.id)}
            className="text-left bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-5 space-y-3 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--gd)]/10 border border-[var(--gm)]/40 flex items-center justify-center text-[var(--gd)]">
                {tool.icon}
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  tool.badge.includes("PREMIUM")
                    ? "bg-[var(--gd)]/15 text-[var(--gd)] border border-[var(--gm)]/40"
                    : "bg-[#52C07A]/10 text-[#52C07A] border border-[#52C07A]/30"
                }`}
              >
                {tool.badge}
              </span>
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-white">{tool.title}</h3>
              <p className="text-[11px] text-[#909090] leading-relaxed mt-1.5">{tool.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tabs that belong under the Writer sidebar section */
export const WRITER_SECTION_TABS = new Set([
  "writer",
  "novels-list",
  "view-novel",
  "novel",
  "content-freelance",
  "write-something",
  "brief-builder",
  "rate-calculator",
  "pitch-templates",
  "portfolio-builder",
  "short-fiction",
  "flash-prompts",
  "one-shot-formatter",
  "sprint-timer",
  "micro-serial",
  "nonfiction-ghost",
  "self-interview-builder",
  "outline-builder",
  "pacing-guide",
  "publishing-checklist",
  "client-handoff",
  "web3",
  "explainer-article-builder",
  "whitepaper-docs",
  "social-thread",
  "community-templates",
  "nft-minting",
  "token-gated",
  "dao-vote",
  "wallet-royalties",
  "analyzer-workspace",
  "smart-edit",
  "ghost-writer",
  "writing-vault",
  "book-cover-generator",
]);
