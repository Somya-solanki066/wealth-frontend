"use client";

import type { ReactNode } from "react";
import { AlignLeft, FileText, Send, Smile, Square } from "lucide-react";

export type Web3Mode = "project" | "fiction";

export type Web3ToolId =
  | "explainer-article-builder"
  | "whitepaper-docs"
  | "social-thread"
  | "community-templates"
  | "nft-minting"
  | "token-gated"
  | "dao-vote"
  | "wallet-royalties";

const PROJECT_TOOLS: {
  id: Web3ToolId;
  title: string;
  desc: string;
  badge: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    id: "explainer-article-builder",
    title: "Explainer Article Builder",
    desc: "Turn a technical concept into a plain-English post.",
    badge: "NEW",
    icon: <Smile className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "whitepaper-docs",
    title: "Whitepaper & Docs Assistant",
    desc: "Structure documentation and user guides.",
    badge: "NEW",
    icon: <FileText className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "social-thread",
    title: "Social Thread Generator",
    desc: "Turn one idea into a Twitter/X thread.",
    badge: "NEW",
    icon: <AlignLeft className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "community-templates",
    title: "Community Post Templates",
    desc: "Announcements, AMA recaps, updates.",
    badge: "NEW",
    icon: <Send className="h-5 w-5" />,
    ready: true,
  },
];

const FICTION_TOOLS: {
  id: Web3ToolId;
  title: string;
  desc: string;
  badge: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    id: "nft-minting",
    title: "NFT Chapter Minting",
    desc: "Mint a chapter or cover as a collectible.",
    badge: "NEW",
    icon: <Square className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "token-gated",
    title: "Token-Gated Release",
    desc: "Unlock chapters by token ownership.",
    badge: "NEW",
    icon: <Square className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "dao-vote",
    title: "DAO Vote Tracker",
    desc: "Readers vote on plot direction.",
    badge: "NEW",
    icon: <AlignLeft className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "wallet-royalties",
    title: "Wallet Royalties",
    desc: "Track earnings paid to a linked wallet.",
    badge: "NEW",
    icon: <FileText className="h-5 w-5" />,
    ready: true,
  },
];

export default function Web3HubWorkspace({
  onBack,
  onSelect,
  mode,
  onModeChange,
}: {
  onBack?: () => void;
  onSelect: (id: Web3ToolId, mode: Web3Mode) => void;
  mode: Web3Mode;
  onModeChange: (mode: Web3Mode) => void;
}) {
  const tools = mode === "project" ? PROJECT_TOOLS : FICTION_TOOLS;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-2 text-xs font-bold text-[var(--gd)] hover:underline"
          >
            ← Writer Hub
          </button>
        )}
        <h2 className="mt-1 font-serif text-2xl font-bold text-white">Web3 Writing</h2>
        <p className="mt-1 text-xs text-[#909090]">
          Blockchain-native writing — real paid work explaining Web3 projects, and on-chain fiction
          for readers who want to own what they read.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm text-[#F0EBE0]">What kind of Web3 writing?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onModeChange("project")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "project"
                ? "bg-[var(--gd)] text-zinc-950"
                : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
            }`}
          >
            Write for a Web3 project
          </button>
          <button
            type="button"
            onClick={() => onModeChange("fiction")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "fiction"
                ? "bg-[var(--gd)] text-zinc-950"
                : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
            }`}
          >
            Publish fiction on-chain
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm text-[#F0EBE0]">Tools for this path</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              disabled={!tool.ready}
              onClick={() => tool.ready && onSelect(tool.id, mode)}
              className={`rounded-2xl border border-[#242424] bg-[#161616] p-4 text-left transition ${
                tool.ready ? "hover:border-[#333]" : "cursor-not-allowed opacity-60"
              }`}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--gm)]/30 text-[var(--gd)]">
                  {tool.icon}
                </div>
                <span className="rounded-full border border-[#333] px-2 py-0.5 text-[10px] font-bold text-[#909090]">
                  {tool.badge}
                </span>
              </div>
              <div className="text-sm font-semibold text-white">{tool.title}</div>
              <p className="mt-1 text-xs text-[#909090]">{tool.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
