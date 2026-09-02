"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Briefcase,
  Clapperboard,
  Feather,
  Edit,
  Award,
  Users,
  Search,
  CheckCircle,
  FileText,
  Volume2,
  Tv,
  PenTool,
  BookOpen,
  DollarSign,
  TrendingUp,
  Globe,
  Share2,
  ListPlus
} from "lucide-react";

export default function WealthPage() {
  const [activeTab, setActiveTab] = useState("jobs");
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  };

  const tabs = [
    { id: "jobs", label: "💼 Writing Jobs" },
    { id: "industry", label: "🎬 Industry" },
    { id: "brand", label: "📣 Branding" },
    { id: "promo", label: "📱 Promotion" },
    { id: "publish", label: "📦 Publishing" },
  ];

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] font-sans flex flex-col justify-between">
      <Navbar />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#161616] border border-[var(--gm)] text-[var(--gd)] font-semibold text-xs px-6 py-3 rounded-xl shadow-2xl transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 space-y-12">
          
          {/* Page Hero */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[10px] font-bold tracking-widest text-[var(--gd)] uppercase">
              Turn Writing Into Income
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-black text-white">
              The <span className="text-[var(--gd)]">WEALTH Engine</span>
            </h1>
            <p className="text-[#909090] text-sm md:text-base leading-relaxed">
              Jobs. Industry connections. Author branding. Book promotion. Publishing. Everything a writer needs to earn from their craft.
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="bg-[#161616] border border-[#242424] rounded-2xl p-1 max-w-2xl mx-auto flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] py-3 text-center text-xs font-bold rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[var(--gl)] to-[var(--gm)] text-zinc-950 shadow"
                    : "text-[#606060] hover:text-[#F0EBE0]"
                }`}
              >
                {tab.label.split(" ").slice(1).join(" ")}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="max-w-4xl mx-auto">
            
            {/* JOBS CONTENT */}
            {activeTab === "jobs" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div
                  onClick={() => triggerToast("Opening Novel Writing jobs...")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <BookOpen className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Novel Writing Gigs</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Browse serialized fiction writing gigs from publishers and platform managers worldwide.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Opening Screenwriting jobs...")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Clapperboard className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Screenwriting Jobs</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Find film, TV, and audio drama writing opportunities from verified production companies.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Opening Ghostwriting jobs...")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <PenTool className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Ghostwriting Contracts</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Write under someone else&apos;s name for premium rates. The most lucrative writing category.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Opening Editing jobs...")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Edit className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Proofreading & Editing</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Manuscript editing, proofreading, and developmental editing opportunities.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* INDUSTRY CONTENT */}
            {activeTab === "industry" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div
                  onClick={() => triggerToast("Opening Industry Open Calls...")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Award className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Open Calls</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Directors and producers post open calls for scripts, stories, and creative collaborations.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Opening Post a Listing form...")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <ListPlus className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Post a Listing</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Are you a director or producer? Post your open call and find writers who match your vision.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* BRANDING CONTENT */}
            {activeTab === "brand" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div
                  onClick={() => triggerToast("Book Blurb Writer is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <BookOpen className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Book Blurb Writer</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      AI writes your back cover description and Amazon listing that actually sells.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Author Bio Generator is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <PenTool className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Author Bio Generator</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Short, medium, and long professional bios for all platforms and press kits.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Press Release Writer is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <FileText className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Press Release Writer</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Professional press releases for book launches, milestones, and publishing deals.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Pitch Deck Builder is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <TrendingUp className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Pitch Deck Builder</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Build a professional pitch deck for publishers, producers, and streaming platforms.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PROMOTION CONTENT */}
            {activeTab === "promo" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div
                  onClick={() => triggerToast("TikTok Strategy is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Volume2 className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">TikTok #BookTok Strategy</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Hook scripts, posting schedule, content ideas, and trending hashtags to grow your readership.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Goodreads Strategy is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <BookOpen className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Goodreads Promotion</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      4-step strategy — author page, giveaways, reading lists, and groups to reach readers.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Reddit Strategy is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Share2 className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Reddit Book Promotion</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Best subreddits, how to post correctly, and a high-converting post format template.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Medium Strategy is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Feather className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Medium Traffic Loop</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Drive readers from articles to your novels with a proven content-to-fiction traffic loop.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PUBLISHING CONTENT */}
            {activeTab === "publish" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                <div
                  onClick={() => triggerToast("Amazon KDP integration is coming soon!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Globe className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Amazon KDP</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Format and publish your manuscript directly to Kindle from within the platform.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Draft2Digital integration is coming soon!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Globe className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Draft2Digital</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Wide distribution to Apple Books, Kobo, Barnes & Noble, and library systems worldwide.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Query Letter Builder is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <FileText className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Query Letter Builder</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      AI builds your complete query letter, synopsis, and submission package for literary agents.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => triggerToast("Social Media Kit is available in the Dashboard!")}
                  className="bg-[#161616] border border-[#242424] hover:border-[var(--gm)] rounded-2xl p-6 flex gap-4 items-start cursor-pointer transition-all duration-200"
                >
                  <Share2 className="h-7 w-7 text-[var(--gd)] shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Social Media Kit</h4>
                    <p className="text-xs text-[#909090] leading-relaxed">
                      Ready-to-post content for TikTok, Instagram, Twitter, and Facebook. All platforms covered.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
