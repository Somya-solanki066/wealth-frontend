"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
}

export default function Dropdown({ trigger, items, className = "" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0f0f0f] border border-[#242424] rounded-xl shadow-2xl overflow-hidden py-1.5 animate-fadeIn z-50">
          {items.map((item, idx) => {
            const content = (
              <span className="block px-4 py-2.5 text-xs font-semibold text-[#909090] hover:text-[#F0EBE0] hover:bg-[#161616] transition-colors">
                {item.label}
              </span>
            );

            return (
              <div
                key={idx}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  setIsOpen(false);
                }}
              >
                {item.href ? (
                  <a href={item.href}>{content}</a>
                ) : (
                  <button className="w-full text-left focus:outline-none">{content}</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
