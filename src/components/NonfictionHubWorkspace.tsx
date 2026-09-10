"use client";

import type { ReactNode } from "react";
import { AlignLeft, BarChart3, Smile, Square } from "lucide-react";

export type NonfictionMode = "own" | "client";

export type NonfictionToolId =
  | "self-interview-builder"
  | "outline-builder"
  | "pacing-guide"
  | "publishing-checklist"
  | "client-handoff";

const OWN_TOOLS: {
  id: NonfictionToolId;
  title: string;
  desc: string;
  badge: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    id: "self-interview-builder",
    title: "Self-Interview Builder",
    desc: "Turn your own memories into chapter material.",
    badge: "NEW",
    icon: <Smile className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "outline-builder",
    title: "Outline Builder",
    desc: "Structure a full-length nonfiction book.",
    badge: "NEW",
    icon: <AlignLeft className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "pacing-guide",
    title: "Pacing Guide",
    desc: "Chapter length and structure for nonfiction.",
    badge: "NEW",
    icon: <BarChart3 className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "publishing-checklist",
    title: "Publishing Checklist",
    desc: "Steps to get KDP-ready and self-publish.",
    badge: "NEW",
    icon: <Square className="h-5 w-5" />,
    ready: true,
  },
];

const CLIENT_TOOLS: {
  id: NonfictionToolId;
  title: string;
  desc: string;
  badge: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    id: "self-interview-builder",
    title: "Interview → Manuscript",
    desc: "Turn recorded interviews into chapters.",
    badge: "NEW",
    icon: <Smile className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "outline-builder",
    title: "Outline Builder",
    desc: "Structure the client’s full-length book.",
    badge: "NEW",
    icon: <AlignLeft className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "pacing-guide",
    title: "Pacing Guide",
    desc: "Chapter length and structure for nonfiction.",
    badge: "NEW",
    icon: <BarChart3 className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "publishing-checklist",
    title: "Publishing Checklist",
    desc: "Steps to get KDP-ready and self-publish.",
    badge: "NEW",
    icon: <Square className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "client-handoff",
    title: "Client Handoff",
    desc: "NDAs, briefs, delivery checklists.",
    badge: "NEW",
    icon: <Square className="h-5 w-5" />,
    ready: true,
  },
];

export default function NonfictionHubWorkspace({
  onBack,
  onSelect,
  mode,
  onModeChange,
}: {
  onBack?: () => void;
  onSelect: (id: NonfictionToolId, mode: NonfictionMode) => void;
  mode: NonfictionMode;
  onModeChange: (mode: NonfictionMode) => void;
}) {
  const tools = mode === "client" ? CLIENT_TOOLS : OWN_TOOLS;

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
        <h2 className="mt-1 font-serif text-2xl font-bold text-white">Nonfiction & Ghostwriting</h2>
        <p className="mt-1 text-xs text-[#909090]">
          Memoirs, self-help and business books — write your own, or someone else&apos;s.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm text-[#F0EBE0]">What are you working on?</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onModeChange("own")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "own"
                ? "bg-[var(--gd)] text-zinc-950"
                : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
            }`}
          >
            Writing your own book
          </button>
          <button
            type="button"
            onClick={() => onModeChange("client")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              mode === "client"
                ? "bg-[var(--gd)] text-zinc-950"
                : "border border-[#333] bg-[#161616] text-[#F0EBE0]"
            }`}
          >
            Ghostwriting for a client
          </button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold text-[#909090]">Tools for this path</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              disabled={!tool.ready}
              onClick={() => tool.ready && onSelect(tool.id, mode)}
              className={`space-y-3 rounded-2xl border border-[#242424] bg-[#161616] p-5 text-left transition-all ${
                tool.ready
                  ? "cursor-pointer hover:border-[var(--gm)]"
                  : "cursor-not-allowed opacity-55"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[var(--gd)]/10 text-[var(--gd)]">
                  {tool.icon}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    tool.badge === "NEW"
                      ? "border border-[var(--gm)]/40 bg-[var(--gd)]/15 text-[var(--gd)]"
                      : "border border-[#333] bg-[#0c0c0c] text-[#606060]"
                  }`}
                >
                  {tool.badge}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-sm font-bold text-white">{tool.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#909090]">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
