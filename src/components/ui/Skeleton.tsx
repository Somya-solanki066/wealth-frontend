"use client";

import React from "react";

interface SkeletonProps {
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  variant = "rectangular",
  width = "100%",
  height = "20px",
  className = "",
}: SkeletonProps) {
  const styles = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`bg-zinc-800/40 animate-pulse ${styles[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}
