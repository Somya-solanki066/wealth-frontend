"use client";

import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  const triggerToast = (msg: string) => {
    // Basic browser confirmation or console message for mock pages
    console.log(`Action: ${msg}`);
  };

  return (
    <footer className="bg-[#0f0f0f] border-t border-[#242424] py-16 px-6 lg:px-12 relative z-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          
          {/* Brand Info (takes 2 columns worth of space on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] bg-gradient-to-br from-[#1e1500] to-[#2e2000] border border-[#7A5E1E] rounded-lg flex items-center justify-center text-sm text-[#C9A84C]">
                <BookOpen className="h-4 w-4 text-[#C9A84C]" />
              </div>
              <span className="font-serif font-black text-lg text-[#C9A84C] tracking-wide">
                Ink2Wealth
              </span>
            </div>
            
            <p className="text-xs text-[#909090] leading-relaxed max-w-sm">
              The all-in-one platform for writers, screenwriters, and students who are serious about turning their words into wealth.
            </p>
            <p className="text-[10px] text-[#606060] font-medium tracking-wide">
              A product of Ink2Wealth Media Limited
            </p>
          </div>

          {/* Column 1: PLATFORM */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase">
              Platform
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#909090]">
              <Link href="/features" className="hover:text-[#F0EBE0] transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-[#F0EBE0] transition-colors">
                Pricing
              </Link>
              <Link href="/wealth" className="hover:text-[#F0EBE0] transition-colors">
                WEALTH Engine
              </Link>
              <Link href="/student" className="hover:text-[#F0EBE0] transition-colors">
                Student Hub
              </Link>
            </div>
          </div>

          {/* Column 2: LEARN */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase">
              Learn
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#909090]">
              <Link href="/courses" className="hover:text-[#F0EBE0] transition-colors">
                WIT-WEB Academy
              </Link>
              <Link href="/courses" className="hover:text-[#F0EBE0] transition-colors">
                SSG Blueprint
              </Link>
              <Link href="/coach" className="hover:text-[#F0EBE0] transition-colors">
                Coach Victor
              </Link>
              <Link href="/coach" className="hover:text-[#F0EBE0] transition-colors">
                YouTube Channel
              </Link>
              <Link href="/coach" className="hover:text-[#F0EBE0] transition-colors">
                Community
              </Link>
            </div>
          </div>

          {/* Column 3: LEGAL */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-[#C9A84C] uppercase">
              Legal
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-[#909090]">
              <Link href="/privacy-policy" className="hover:text-[#F0EBE0] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-[#F0EBE0] transition-colors">
                Terms of Service
              </Link>
              <Link href="/refund-policy" className="hover:text-[#F0EBE0] transition-colors">
                Refund Policy
              </Link>
              <Link href="/cookie-policy" className="hover:text-[#F0EBE0] transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>

        </div>

        {/* Footer Bottom row */}
        <div className="border-t border-[#242424] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#606060]">
          <p>&copy; {new Date().getFullYear()} Ink2Wealth Media Limited. All rights reserved.</p>
          <p className="font-medium tracking-wide">Write It. Script It. Earn From It.</p>
        </div>
      </div>
    </footer>
  );
}
