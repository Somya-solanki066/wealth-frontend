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
  PlusCircle,
  Send,
  Square,
  User,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
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
  return (
    <div className="writer-lanes-section writer-lane-detail">
      <button type="button" className="writer-lane-back" onClick={onBack}>
        <ArrowLeft size={16} />
        All lanes
      </button>

      <span className="writer-lane-label">New lane</span>
      <h3 className="writer-lane-title">{lane.title}</h3>
      <p className="writer-lane-desc">{lane.description}</p>

      <p className="writer-lane-tools-label">Tools in this lane</p>
      <div className="writer-lane-tools-grid">
        {lane.tools.map((tool) => (
          <div key={tool.id} className="writer-lane-tool-card">
            <span className="writer-lane-tool-icon">
              <LaneIcon name={tool.icon} size={16} />
            </span>
            <div className="writer-lane-tool-title">{tool.title}</div>
            <div className="writer-lane-tool-desc">{tool.desc}</div>
          </div>
        ))}
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
