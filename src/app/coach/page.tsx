"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Play, Users, BookOpen } from "lucide-react";

export default function CoachPage() {
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#161616] border border-[#7A5E1E] text-[#C9A84C] font-semibold text-xs px-6 py-3 rounded-xl shadow-2xl transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pt-[70px] pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
          
          {/* Coach Hero block */}
          <div className="bg-gradient-to-br from-[#0a1428] to-[#040c1e] border border-[#5298E0]/25 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 shadow-2xl shadow-[#5298E0]/5">
            <div className="w-[120px] h-[120px] rounded-full border-[3px] border-[#5298E0] bg-gradient-to-br from-[#001428] to-[#002040] flex items-center justify-center text-[#5298E0] shrink-0 shadow-lg select-none">
              <User className="h-16 w-16" />
            </div>
            
            <div className="space-y-4">
              <h2 className="font-serif text-3xl md:text-4xl font-black text-white">
                Victor Daniels
              </h2>
              <p className="text-xs font-semibold text-[#5298E0] uppercase tracking-wider">
                Writing Coach · Screenwriter · Author · Founder
              </p>
              <p className="text-sm md:text-base text-[#909090] leading-relaxed">
                WIT-WEB Academy founder. Serialized fiction expert. Helping writers across Nigeria, the UK, the US, and beyond turn their words into sustainable income through coaching, courses, and community.
              </p>
              
              {/* Stats row */}
              <div className="flex flex-wrap gap-8 pt-2">
                <div>
                  <div className="font-serif text-2xl font-black text-[#C9A84C]">2,400+</div>
                  <div className="text-[10px] text-[#606060] font-bold tracking-wider uppercase">Community Writers</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-black text-[#C9A84C]">9</div>
                  <div className="text-[10px] text-[#606060] font-bold tracking-wider uppercase">Platforms Mastered</div>
                </div>
                <div>
                  <div className="font-serif text-2xl font-black text-[#C9A84C]">2</div>
                  <div className="text-[10px] text-[#606060] font-bold tracking-wider uppercase">Flagship Courses</div>
                </div>
              </div>
            </div>
          </div>

          {/* Social / Community row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div
              onClick={() => triggerToast("Opening YouTube channel...")}
              className="bg-[#161616] border border-[#242424] hover:border-[#7A5E1E] rounded-3xl p-8 flex gap-6 items-start cursor-pointer transition-all duration-200"
            >
              <Play className="h-12 w-12 text-red-600 shrink-0 fill-current" />
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-white leading-tight">
                  @CoachVictorDaniels
                </h3>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">
                  YouTube Channel
                </span>
                <p className="text-xs text-[#909090] leading-relaxed">
                  Free writing tutorials, platform guides, and live coaching sessions every week. Subscribe and never miss an upload.
                </p>
                <button className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors">
                  ▶ Subscribe on YouTube
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => triggerToast("Joining WIT-WEB Community...")}
              className="bg-[#161616] border border-[#242424] hover:border-[#7A5E1E] rounded-3xl p-8 flex gap-6 items-start cursor-pointer transition-all duration-200"
            >
              <Users className="h-12 w-12 text-[#C9A84C] shrink-0" />
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-bold text-white leading-tight">
                  WIT-WEB Community
                </h3>
                <span className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest block">
                  2,400+ Active Writers
                </span>
                <p className="text-xs text-[#909090] leading-relaxed">
                  Connect with writers worldwide. Get feedback, find accountability partners, and access exclusive coaching sessions from Coach Victor.
                </p>
                <button className="px-5 py-2.5 bg-gradient-to-r from-[#E2C06A] to-[#7A5E1E] hover:from-[#E2C06A]/90 hover:to-[#7A5E1E]/90 text-zinc-950 font-bold rounded-xl text-xs">
                  Join the Community
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
