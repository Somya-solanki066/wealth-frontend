"use client";

import type { ReactNode } from "react";
import { AlignLeft, Calculator, FileText, Pencil, Send } from "lucide-react";

export type ContentFreelanceToolId =
  | "write-something"
  | "brief-builder"
  | "portfolio-builder"
  | "rate-calculator"
  | "pitch-templates";

const TOOLS: {
  id: ContentFreelanceToolId;
  title: string;
  desc: string;
  badge: string;
  icon: ReactNode;
  ready: boolean;
}[] = [
  {
    id: "write-something",
    title: "Write Something",
    desc: "Pick a format — blog, social, newsletter, memo, or UGC — then brief → structure → draft → polish.",
    badge: "NEW",
    icon: <Pencil className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "brief-builder",
    title: "Brief Builder",
    desc: "Turn a client ask into a working brief.",
    badge: "NEW",
    icon: <AlignLeft className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "portfolio-builder",
    title: "Portfolio Builder",
    desc: "Public writer profile — rate, specialties, social links, achievements, work samples, and hire inquiries.",
    badge: "NEW",
    icon: <FileText className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "rate-calculator",
    title: "Rate Calculator",
    desc: "Per-word, per-project, retainer pricing.",
    badge: "NEW",
    icon: <Calculator className="h-5 w-5" />,
    ready: true,
  },
  {
    id: "pitch-templates",
    title: "Pitch Templates",
    desc: "Cold outreach and gig applications.",
    badge: "NEW",
    icon: <Send className="h-5 w-5" />,
    ready: true,
  },
];

export default function ContentFreelanceHubWorkspace({
  onBack,
  onSelect,
}: {
  onBack?: () => void;
  onSelect: (id: ContentFreelanceToolId) => void;
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
        <h2 className="font-serif text-2xl font-bold text-white">Content & Freelance</h2>
        <p className="mt-1 text-xs text-[#909090]">
          Blog posts, copywriting, UGC scripts — write for money outside fiction.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            disabled={!tool.ready}
            onClick={() => tool.ready && onSelect(tool.id)}
            className={`text-left rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3 transition-all ${
              tool.ready
                ? "hover:border-[var(--gm)] cursor-pointer"
                : "opacity-55 cursor-not-allowed"
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
