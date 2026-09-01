"use client";

import React from "react";
import { X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Sidebar({ isOpen, onClose, title, children }: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="w-80 bg-[#0f0f0f] border-l border-[#242424] h-full p-6 shadow-2xl relative z-10 animate-slideLeft overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-5">
          {title && (
            <h3 className="font-serif text-sm font-bold text-[var(--gd)]">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#242424] text-[#909090] hover:text-[#F0EBE0]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-[#909090] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
