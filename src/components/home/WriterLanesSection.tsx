"use client";

import { useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  BarChart3,
  Box,
  ChevronRight,
  Clock,
  FileText,
  Hexagon,
  MessageSquare,
  Pencil,
  PlusCircle,
  Send,
  Square,
  User,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { WRITER_LANES, type WriterLane } from "@/lib/writerLanes";

const ICON_MAP: Record<string, LucideIcon> = {
  "align-left": AlignLeft,
  zap: Zap,
  "message-square": MessageSquare,
  box: Box,
  "file-text": FileText,
  "plus-circle": PlusCircle,
  send: Send,
  square: Square,
  clock: Clock,
  user: User,
  "bar-chart-3": BarChart3,
  hexagon: Hexagon,
  wallet: Wallet,
  pencil: Pencil,
};

function LaneIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? AlignLeft;
  return <Icon size={size} strokeWidth={1.75} />;
}

function LaneList({ onSelect }: { onSelect: (lane: WriterLane) => void }) {
  return (
    <div className="writer-lanes-section">
      <h3 className="writer-lanes-heading">Other lanes to write in</h3>
      <div className="writer-lanes-list">
        {WRITER_LANES.map((lane) => (
          <button
            key={lane.id}
            type="button"
            className="writer-lane-row"
            onClick={() => onSelect(lane)}
          >
            <span className="writer-lane-row-icon">
              <LaneIcon name={lane.icon} />
            </span>
            <span className="writer-lane-row-text">
              <span className="writer-lane-row-title">{lane.listTitle}</span>
              <span className="writer-lane-row-sub">{lane.subtitle}</span>
            </span>
            <span className="writer-lane-new-badge">NEW</span>
            <ChevronRight size={16} className="writer-lane-row-chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}

function LaneDetail({
  lane,
  onBack,
}: {
  lane: WriterLane;
  onBack: () => void;
}) {
  const router = useRouter();

  const openTool = (toolId: string) => {
    if (toolId === "write-something") {
      router.push("/dashboard?tab=write-something");
      return;
    }
    if (toolId === "brief-builder") {
      router.push("/dashboard?tab=brief-builder");
      return;
    }
    if (toolId === "rate-calculator") {
      router.push("/dashboard?tab=rate-calculator");
      return;
    }
    if (toolId === "pitch-templates") {
      router.push("/dashboard?tab=pitch-templates");
      return;
    }
    if (toolId === "portfolio-builder") {
      router.push("/dashboard?tab=portfolio-builder");
      return;
    }
    if (toolId === "flash-prompts") {
      router.push("/dashboard?tab=flash-prompts");
      return;
    }
    if (toolId === "one-shot-formatter") {
      router.push("/dashboard?tab=one-shot-formatter");
      return;
    }
    if (toolId === "sprint-timer") {
      router.push("/dashboard?tab=sprint-timer");
      return;
    }
    if (toolId === "micro-serial") {
      router.push("/dashboard?tab=micro-serial");
      return;
    }
    if (toolId === "self-interview-builder" || toolId === "interview-manuscript") {
      router.push("/dashboard?tab=self-interview-builder");
      return;
    }
    if (toolId === "outline-builder") {
      router.push("/dashboard?tab=outline-builder");
      return;
    }
    if (toolId === "pacing-guide") {
      router.push("/dashboard?tab=pacing-guide");
      return;
    }
    if (toolId === "publishing-checklist") {
      router.push("/dashboard?tab=publishing-checklist");
      return;
    }
    if (toolId === "client-handoff") {
      router.push("/dashboard?tab=client-handoff");
      return;
    }
    if (toolId === "explainer-article-builder") {
      router.push("/dashboard?tab=explainer-article-builder");
      return;
    }
    if (toolId === "whitepaper-docs") {
      router.push("/dashboard?tab=whitepaper-docs");
      return;
    }
    if (toolId === "social-thread") {
      router.push("/dashboard?tab=social-thread");
      return;
    }
    if (toolId === "community-templates") {
      router.push("/dashboard?tab=community-templates");
      return;
    }
    if (toolId === "nft-minting") {
      router.push("/dashboard?tab=nft-minting");
      return;
    }
    if (toolId === "token-gated") {
      router.push("/dashboard?tab=token-gated");
      return;
    }
    if (toolId === "dao-vote") {
      router.push("/dashboard?tab=dao-vote");
      return;
    }
    if (toolId === "wallet-royalties") {
      router.push("/dashboard?tab=wallet-royalties");
      return;
    }
    if (lane.id === "content-freelance") {
      router.push("/dashboard?tab=content-freelance");
      return;
    }
    if (lane.id === "short-fiction") {
      router.push("/dashboard?tab=short-fiction");
      return;
    }
    if (lane.id === "nonfiction-ghost") {
      router.push("/dashboard?tab=nonfiction-ghost");
      return;
    }
    if (lane.id === "web3") {
      router.push("/dashboard?tab=web3");
    }
  };

  return (
    <div className="writer-lanes-section writer-lane-detail">
      <button type="button" className="writer-lane-back" onClick={onBack}>
        <ArrowLeft size={16} />
        All lanes
      </button>

      <h3 className="writer-lane-title">{lane.title}</h3>
      <p className="writer-lane-desc">{lane.description}</p>

      <p className="writer-lane-tools-label">Tools in this lane</p>
      <div className="writer-lane-tools-grid">
        {lane.tools.map((tool) => {
          const clickable =
            tool.id === "write-something" ||
            tool.id === "brief-builder" ||
            tool.id === "rate-calculator" ||
            tool.id === "pitch-templates" ||
            tool.id === "portfolio-builder" ||
            tool.id === "flash-prompts" ||
            tool.id === "one-shot-formatter" ||
            tool.id === "sprint-timer" ||
            tool.id === "micro-serial" ||
            tool.id === "self-interview-builder" ||
            tool.id === "interview-manuscript" ||
            tool.id === "outline-builder" ||
            tool.id === "pacing-guide" ||
            tool.id === "publishing-checklist" ||
            tool.id === "client-handoff" ||
            tool.id === "explainer-article-builder" ||
            tool.id === "whitepaper-docs" ||
            tool.id === "social-thread" ||
            tool.id === "community-templates" ||
            tool.id === "nft-minting" ||
            tool.id === "token-gated" ||
            tool.id === "dao-vote" ||
            tool.id === "wallet-royalties";
          return (
            <button
              key={tool.id}
              type="button"
              className="writer-lane-tool-card text-left"
              onClick={() => clickable && openTool(tool.id)}
              style={{ cursor: clickable ? "pointer" : "default" }}
            >
              <span className="writer-lane-tool-icon">
                <LaneIcon name={tool.icon} size={16} />
              </span>
              <div className="writer-lane-tool-title">{tool.title}</div>
              <div className="writer-lane-tool-desc">{tool.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function WriterLanesSection() {
  const [selectedLane, setSelectedLane] = useState<WriterLane | null>(null);

  if (selectedLane) {
    return <LaneDetail lane={selectedLane} onBack={() => setSelectedLane(null)} />;
  }

  return <LaneList onSelect={setSelectedLane} />;
}
