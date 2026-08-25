"use client";

import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  className = "",
  id,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-[10px] font-bold uppercase tracking-wider text-[#909090] select-none"
        >
          {label}
        </label>
      )}

      <textarea
        id={id}
        rows={rows}
        className={`block w-full px-3.5 py-3 bg-[#161616] border rounded-lg text-[#F0EBE0] placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 focus:border-[#7A5E1E] transition-all duration-200 text-xs leading-relaxed ${
          error ? "border-red-500/50" : "border-[#242424]"
        } ${className}`}
        {...props}
      />

      {error && <p className="text-[10px] text-red-400 mt-1 select-none">{error}</p>}
    </div>
  );
}
