"use client";

import type { ReactNode } from "react";
import {
  Clapperboard,
  Ghost,
  Film,
  Store,
  Users,
  LayoutTemplate,
  Briefcase,
  ScrollText,
} from "lucide-react";

export type ScriptHubToolId =
  | "scripts-list"
  | "ghost-writer-script"
  | "script-analyzer-workspace"
  | "industry-hub"
  | "short-film-showcase"
  | "script-marketplace"
  | "screenwriter-community"
  | "pitch-query-builder";

const TOOLS: {
  id: ScriptHubToolId;
  title: string;
  desc: string;
  badge: "FREE" | "PREMIUM" | string;
  icon: ReactNode;
}[] = [
  {
    id: "scripts-list",
    title: "My Scripts",
    desc: "Professional Script Editor — scene headings, action, dialogue. Hollywood-standard formatting.",
    badge: "FREE",
    icon: <Clapperboard className="h-5 w-5" />,
  },
  {
    id: "ghost-writer-script",
    title: "AI Script Writer",
    desc: "Generate a full screenplay scene from characters, format, and plot beats — save into Script Editor.",
    badge: "PREMIUM",
    icon: <Ghost className="h-5 w-5" />,
  },
  {
    id: "script-analyzer-workspace",
    title: "Script Analyzer",
    desc: "Pitch-readiness scoring for Hollywood, Nollywood, BBC/UK, Netflix Africa, and Audio Drama.",
    badge: "PREMIUM",
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    id: "industry-hub",
    title: "Industry Hub & Open Calls",
    desc: "Open calls from directors and producers. Filter by genre and budget. Apply on platform.",
    badge: "FREE — 3/day",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "short-film-showcase",
    title: "Short Film Showcase",
    desc: "Upload shorts for review, browse cinema-style, like and save — reach producers.",
    badge: "PREMIUM",
    icon: <Film className="h-5 w-5" />,
  },
  {
    id: "script-marketplace",
    title: "Script Marketplace",
    desc: "Sell or option screenplays. Buyers preview 10 pages, then purchase. Configurable commission.",
    badge: "PREMIUM",
    icon: <Store className="h-5 w-5" />,
  },
  {
    id: "screenwriter-community",
    title: "Screenwriter Community",
    desc: "Public rooms, genre rooms, weekly feedback threads, and mentorship matching.",
    badge: "FREE",
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: "pitch-query-builder",
    title: "Pitch Deck & Query Builder",
    desc: "4-step submission package — project, story, synopsis, query letter, and pitch deck.",
    badge: "PREMIUM",
    icon: <LayoutTemplate className="h-5 w-5" />,
  },
];

export default function ScriptHubWorkspace({
  onSelect,
}: {
  onSelect: (id: ScriptHubToolId) => void;
}) {
  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="font-serif text-2xl font-bold text-white">Script Hub</h2>
        <p className="text-xs text-[#909090] mt-1">
          Screenwriting tools — editor, AI scenes, industry, marketplace, and pitching.
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

export const SCRIPT_SECTION_TABS = new Set([
  "script-hub",
  "scripts-list",
  "view-script",
  "script",
  "script-analyzer-workspace",
  "industry-hub",
  "short-film-showcase",
  "script-marketplace",
  "screenwriter-community",
  "pitch-query-builder",
]);
