"use client";

import React from "react";

interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export default function Tabs({ items, activeKey, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex border-b border-[#242424] text-[11px] font-semibold text-[#606060] ${className}`}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex-1 py-3 text-center border-b transition-all duration-150 outline-none ${
              isActive
                ? "text-[var(--gd)] border-[var(--gd)]"
                : "border-transparent hover:text-[#F0EBE0]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
