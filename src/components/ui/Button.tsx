"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-sans font-bold transition-all duration-150 rounded-xl focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:opacity-90 text-zinc-950 shadow-lg active:scale-95",
    secondary: "bg-[#161616] border border-[#242424] hover:bg-[#242424] text-[#F0EBE0] active:scale-95",
    outline: "border border-[var(--gm)] text-[var(--gd)] hover:bg-[var(--gf)] active:scale-95",
    danger: "bg-red-600/10 border border-red-500/20 text-[#E05252] hover:bg-red-500/20 active:scale-95",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    md: "px-5 py-2.5 text-xs",
    lg: "px-8 py-3.5 text-sm",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin mr-2 shrink-0" />}
      {!isLoading && leftIcon && <span className="mr-2 shrink-0">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="ml-2 shrink-0">{rightIcon}</span>}
    </button>
  );
}
