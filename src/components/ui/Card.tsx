"use client";

import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export default function Card({ children, hoverable = true, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-[#161616] border border-[#242424] rounded-2xl p-6 ${
        hoverable ? "hover:border-[#7A5E1E] transition-all duration-200" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
