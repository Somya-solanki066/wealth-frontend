"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "gray";
  className?: string;
}

export default function Badge({ children, variant = "gold", className = "" }: BadgeProps) {
  const styles = {
    gold: "bg-[#C9A84C]/10 border border-[#7A5E1E] text-[#C9A84C]",
    green: "bg-[#52C07A]/10 border border-[#52C07A]/30 text-[#52C07A]",
    red: "bg-red-500/10 border border-red-500/30 text-[#E05252]",
    gray: "bg-[#242424] border border-[#242424] text-[#909090]",
  };

  return (
    <span
      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
