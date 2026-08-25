"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="bg-[#0f0f0f] border border-[#242424] rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative z-10 animate-scaleUp overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#242424] pb-4 mb-5">
          {title && (
            <h3 className="font-serif text-lg font-bold text-[#C9A84C] tracking-wide">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[#242424] text-[#909090] hover:text-[#F0EBE0] hover:bg-[#161616] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="text-xs text-[#909090] leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
