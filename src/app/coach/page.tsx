"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Play, Users } from "lucide-react";
import { useCoachPage } from "@/hooks/useCoachPage";
import { resolveUploadUrl } from "@/lib/resolveUploadUrl";

function resolveMediaUrl(url: string): string {
  return resolveUploadUrl(url);
}

function openExternal(url: string) {
  if (!url) return;
  const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  window.open(href, "_blank", "noopener,noreferrer");
}

export default function CoachPage() {
  const { page } = useCoachPage();
  const photoUrl = resolveMediaUrl(page.photoUrl || "");

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
          <div className="bg-gradient-to-br from-[#0a1428] to-[#040c1e] border border-[#5298E0]/25 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-2xl shadow-[#5298E0]/5">
            <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#5298E0] bg-gradient-to-br from-[#001428] to-[#002040] flex items-center justify-center text-[#5298E0] shrink-0 shadow-lg select-none overflow-hidden">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={page.name || "Coach"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-16 w-16" />
              )}
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-3xl md:text-4xl font-black text-white">
                {page.name}
              </h2>
              <p className="text-xs font-semibold text-[#5298E0] uppercase tracking-wider">
                {page.role}
              </p>
              <p className="text-sm md:text-base text-[#909090] leading-relaxed">
                {page.bio}
              </p>

              <div className="flex flex-wrap gap-8 pt-2">
                {(page.stats || []).map((stat, index) => (
                  <div key={`${stat.label}-${index}`}>
                    <div className="font-serif text-2xl font-black text-[var(--gd)]">
                      {stat.value}
                    </div>
                    <div className="text-[10px] text-[#606060] font-bold tracking-wider uppercase">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              role="link"
              tabIndex={0}
              onClick={() => openExternal(page.youtubeUrl)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openExternal(page.youtubeUrl);
                }
              }}
              className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-3xl p-8 flex gap-6 items-start cursor-pointer transition-all duration-200"
            >
              <Play className="h-12 w-12 text-red-600 shrink-0 fill-current" />
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-white leading-tight">
                  {page.youtubeHandle}
                </h3>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">
                  {page.youtubeLabel}
                </span>
                <p className="text-xs text-[#909090] leading-relaxed">
                  {page.youtubeDescription}
                </p>
                <button
                  type="button"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    openExternal(page.youtubeUrl);
                  }}
                >
                  {page.youtubeButtonLabel}
                </button>
              </div>
            </div>

            <div
              role="link"
              tabIndex={0}
              onClick={() => openExternal(page.communityUrl)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openExternal(page.communityUrl);
                }
              }}
              className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-3xl p-8 flex gap-6 items-start cursor-pointer transition-all duration-200"
            >
              <Users className="h-12 w-12 text-[var(--gd)] shrink-0" />
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-white leading-tight">
                  {page.communityTitle}
                </h3>
                <span className="text-[10px] font-bold text-[var(--gd)] uppercase tracking-widest block">
                  {page.communityBadge}
                </span>
                <p className="text-xs text-[#909090] leading-relaxed">
                  {page.communityDescription}
                </p>
                <button
                  type="button"
                  className="px-5 py-2.5 bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] hover:from-[var(--gl)]/90 hover:to-[var(--gm)]/90 text-zinc-950 font-bold rounded-xl text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    openExternal(page.communityUrl);
                  }}
                >
                  {page.communityButtonLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
