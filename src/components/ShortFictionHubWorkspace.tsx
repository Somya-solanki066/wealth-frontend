"use client";

import type { ReactNode } from "react";
import { AlignLeft, Clock, Square, Zap } from "lucide-react";

export type ShortFictionToolId =
  | "flash-prompts"
  | "one-shot-formatter"
  | "sprint-timer"
  | "micro-serial";

const TOOLS: {
  id: ShortFictionToolId;
  title: string;
  desc: string;
  badge: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    id: "flash-prompts",
    title: "Flash Prompts",
    desc: "Pick a genre, get a daily prompt — shuffle or start writing.",
    badge: "NEW",
    icon: <Zap className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "one-shot-formatter",
    title: "One-Shot Formatter",
    desc: "Format and post a single-chapter story.",
    badge: "NEW",
    icon: <Square className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "sprint-timer",
    title: "Sprint Timer",
    desc: "Timed writing sessions with word goals.",
    badge: "NEW",
    icon: <Clock className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "micro-serial",
    title: "Micro-Serial Mode",
    desc: "5–7 part flash serials, not full-length.",
    badge: "NEW",
    icon: <AlignLeft className="h-5 w-5" />,
    ready: true,
  },
];

export default function ShortFictionHubWorkspace({
  onBack,
  onSelect,
}: {
  onBack?: () => void;
  onSelect: (id: ShortFictionToolId) => void;
}) {
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
        <h2 className="font-serif text-2xl font-bold text-white">Short-Form Fiction</h2>
        <p className="mt-1 text-xs text-[#909090]">
          Flash fiction and one-shot stories — the lightest entry into Writer&apos;s World.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            disabled={!tool.ready}
            onClick={() => tool.ready && onSelect(tool.id)}
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
  );
}
