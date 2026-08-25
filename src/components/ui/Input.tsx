"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  leftIcon,
  className = "",
  id,
  ...props
}: InputProps) {
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
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={`block w-full py-2.5 bg-[#161616] border rounded-lg text-[#F0EBE0] placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/10 focus:border-[#7A5E1E] transition-all duration-200 text-xs ${
            leftIcon ? "pl-10" : "pl-3.5"
          } ${error ? "border-red-500/50" : "border-[#242424]"} ${className}`}
          {...props}
        />
      </div>
      
      {error && <p className="text-[10px] text-red-400 mt-1 select-none">{error}</p>}
    </div>
  );
}
