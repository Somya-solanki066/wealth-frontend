"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export default function Select({
  label,
  options,
  error,
  className = "",
  id,
  ...props
}: SelectProps) {
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

      <div className="relative">
        <select
          id={id}
          className={`block w-full pl-3.5 pr-10 py-2.5 bg-[#161616] border rounded-lg text-[#F0EBE0] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--gd)]/10 focus:border-[var(--gm)] transition-all duration-200 text-xs cursor-pointer ${
            error ? "border-red-500/50" : "border-[#242424]"
          } ${className}`}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value} className="bg-[#0f0f0f] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#606060]">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {error && <p className="text-[10px] text-red-400 mt-1 select-none">{error}</p>}
    </div>
  );
}
