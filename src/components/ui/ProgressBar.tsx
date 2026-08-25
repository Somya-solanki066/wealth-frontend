"use client";

import React from "react";

interface ProgressBarProps {
  progress: number; // percentage (0 - 100)
  color?: "gold" | "red" | "green";
  height?: string;
  className?: string;
}

export default function ProgressBar({
  progress,
  color = "gold",
  height = "6px",
  className = "",
}: ProgressBarProps) {
  const colors = {
    gold: "bg-[#C9A84C]",
    red: "bg-red-600",
    green: "bg-[#52C07A]",
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div
      className={`w-full bg-[#242424] rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <div
        className={`h-full transition-all duration-300 ${colors[color]}`}
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
}
