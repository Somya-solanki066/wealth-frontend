"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Box */}
      <div className="bg-[#0f0f0f] border-t border-[#242424] rounded-t-[32px] w-full max-w-2xl p-6 shadow-2xl relative z-10 animate-slideUp overflow-y-auto max-h-[85vh]">
        {/* Notch decoration */}
        <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-3 mb-4">
          {title && (
            <h3 className="font-serif text-base font-bold text-[var(--gd)]">
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

        {/* Content */}
        <div className="text-xs text-[#909090] leading-relaxed pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
