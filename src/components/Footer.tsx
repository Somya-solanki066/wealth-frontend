"use client";

import React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useWorld } from "@/context/WorldContext";

export default function Footer() {
  const { config } = useWorld();
  const tagline = config?.footerTagline || "Write It. Script It. Earn From It.";

  return (
    <footer className="bg-[var(--dp)] border-t border-[var(--bd)] py-16 px-6 lg:px-12 relative z-20">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-12">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] bg-gradient-to-br from-[var(--bg1)] to-[var(--bg2)] border border-[var(--gm)] rounded-lg flex items-center justify-center text-sm text-[var(--gd)]">
                {config?.icon ? (
                  <span className="text-sm leading-none">{config.icon}</span>
                ) : (
                  <BookOpen className="h-4 w-4 text-[var(--gd)]" />
                )}
              </div>
              <span className="font-serif font-black text-lg text-[var(--gd)] tracking-wide">
                Ink2Wealth
              </span>
            </div>

            <p className="text-xs text-[#909090] leading-relaxed max-w-sm">
              {config
                ? config.footerTagline
                : "The all-in-one platform for writers, screenwriters, and students who are serious about turning their words into wealth."}
            </p>
            <p className="text-[10px] text-[#606060] font-medium tracking-wide">
              A product of Ink2Wealth Media Limited
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
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

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
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

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
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

        <div className="border-t border-[var(--bd)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#606060]">
          <p>&copy; {new Date().getFullYear()} Ink2Wealth Media Limited. All rights reserved.</p>
          <p className="font-medium tracking-wide">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
