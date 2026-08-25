"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Loader({ fullScreen = false, size = "md" }: LoaderProps) {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const content = (
    <Loader2 className={`animate-spin text-[#C9A84C] ${sizeMap[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#080808]/85 backdrop-blur-sm z-[100] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{content}</div>;
}
