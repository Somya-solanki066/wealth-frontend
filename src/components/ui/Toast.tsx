"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  if (!message) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#161616] border border-[#7A5E1E] text-[#C9A84C] font-semibold text-xs px-6 py-3 rounded-xl shadow-2xl transition-all duration-300 animate-slideUp">
      {message}
    </div>
  );
}
