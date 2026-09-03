"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import WealthToolModals from "@/components/wealth/WealthToolModals";

type TabId = "jobs" | "industry" | "brand" | "promo" | "publish";
type ModalId =
  | "blurb"
  | "bio"
  | "press"
  | "pitch"
  | "booktok"
  | "goodreads"
  | "reddit"
  | "medium"
  | "query"
  | "social";

type WealthItem = {
  icon: string;
  title: string;
  desc: string;
  toast?: string;
  modal?: ModalId;
  href?: string;
};

const TABS: { id: TabId; label: string }[] = [
  { id: "jobs", label: "💼 Writing Jobs" },
  { id: "industry", label: "🎬 Industry" },
  { id: "brand", label: "📣 Branding" },
  { id: "promo", label: "📱 Promotion" },
  { id: "publish", label: "📦 Publishing" },
];

const CONTENT: Record<TabId, WealthItem[]> = {
  jobs: [
    {
      icon: "📖",
      title: "Novel Writing Jobs",
      desc: "Browse serialized fiction writing gigs from publishers and platform managers worldwide.",
      href: "/wealth/jobs?category=novel",
    },
    {
      icon: "🎬",
      title: "Screenwriting Jobs",
      desc: "Find film, TV, and audio drama writing opportunities from verified production companies.",
      href: "/wealth/jobs?category=screenwriting",
    },
    {
      icon: "👻",
      title: "Ghostwriting Jobs",
      desc: "Write under someone else's name for premium rates. The most lucrative writing category.",
      href: "/wealth/jobs?category=ghostwriting",
    },
    {
      icon: "✍️",
      title: "Editing Jobs",
      desc: "Manuscript editing, proofreading, and developmental editing opportunities.",
      href: "/wealth/jobs?category=editing",
    },
  ],
  industry: [
    {
      icon: "🎯",
      title: "Open Calls",
      desc: "Directors and producers post open calls for scripts, stories, and creative collaborations.",
      href: "/wealth/industry",
    },
    {
      icon: "📋",
      title: "Post a Listing",
      desc: "Are you a director or producer? Post your open call and find writers who match your vision.",
      href: "/wealth/industry/post",
    },
  ],
  brand: [
    {
      icon: "📖",
      title: "Book Blurb Writer",
      desc: "AI writes your back cover description and Amazon listing that actually sells.",
      modal: "blurb",
    },
    {
      icon: "🖊️",
      title: "Author Bio Generator",
      desc: "Short, medium, and long professional bios for all platforms and press kits.",
      modal: "bio",
    },
    {
      icon: "📰",
      title: "Press Release Writer",
      desc: "Professional press releases for book launches, milestones, and publishing deals.",
      modal: "press",
    },
    {
      icon: "📊",
      title: "Pitch Deck Builder",
      desc: "Build a professional pitch deck for publishers, producers, and streaming platforms.",
      modal: "pitch",
    },
  ],
  promo: [
    {
      icon: "🎵",
      title: "TikTok #BookTok Strategy",
      desc: "Hook scripts, posting schedule, content ideas, and trending hashtags to grow your readership.",
      modal: "booktok",
    },
    {
      icon: "📚",
      title: "Goodreads Promotion",
      desc: "4-step strategy — author page, giveaways, reading lists, and groups to reach 150 million readers.",
      modal: "goodreads",
    },
    {
      icon: "🔴",
      title: "Reddit Book Promotion",
      desc: "Best subreddits, how to post correctly, and a high-converting post format template.",
      modal: "reddit",
    },
    {
      icon: "✍️",
      title: "Medium Strategy",
      desc: "Drive readers from articles to your novels with a proven content-to-fiction traffic loop.",
      modal: "medium",
    },
  ],
  publish: [
    {
      icon: "📦",
      title: "Amazon KDP",
      desc: "Format and publish your manuscript directly to Kindle from within the platform.",
      href: "/wealth/publish/kdp",
    },
    {
      icon: "🌍",
      title: "Draft2Digital",
      desc: "Wide distribution to Apple Books, Kobo, Barnes & Noble, and library systems worldwide.",
      href: "/wealth/publish/d2d",
    },
    {
      icon: "📝",
      title: "Query Letter Builder",
      desc: "AI builds your complete query letter, synopsis, and submission package for literary agents.",
      modal: "query",
    },
    {
      icon: "📱",
      title: "Social Media Kit",
      desc: "Ready-to-post content for TikTok, Instagram, Twitter, and Facebook. All platforms covered.",
      modal: "social",
    },
  ],
};

export default function WealthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("jobs");
  const [toastMessage, setToastMessage] = useState("");
  const [activeModal, setActiveModal] = useState<ModalId | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  useEffect(() => {
    if (!activeModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeModal]);

  const handleItem = (item: WealthItem) => {
    if (item.href) {
      if (!user && (item.href.startsWith("/wealth/industry") || item.href.startsWith("/wealth/jobs"))) {
        router.push(`/login?redirectTo=${encodeURIComponent(item.href)}`);
        return;
      }
      router.push(item.href);
      return;
    }
    if (item.modal) {
      if (!user) {
        router.push(`/login?redirectTo=${encodeURIComponent("/wealth")}`);
        return;
      }
      setActiveModal(item.modal);
      return;
    }
    if (item.toast) triggerToast(item.toast);
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#080808] font-sans text-[#F0EBE0]">
      <Navbar />

      {toastMessage ? (
        <div className="pointer-events-none fixed bottom-8 left-1/2 z-[999] -translate-x-1/2 whitespace-nowrap rounded-[14px] border border-[var(--gm)] bg-[#1a1200] px-6 py-3 text-[13px] font-semibold text-[var(--gd)] shadow-2xl">
          {toastMessage}
        </div>
      ) : null}

      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="px-0 pb-8 pt-10 text-center md:pb-[60px]">
            <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[3px] text-[var(--gd)]">
              Turn Writing Into Income
            </p>
            <h1 className="mb-4 font-serif text-4xl font-black text-white md:text-[48px] md:leading-tight">
              The <span className="text-[var(--gd)]">WEALTH Engine</span>
            </h1>
            <p className="mx-auto max-w-[600px] text-base leading-relaxed text-[#909090] md:text-[17px]">
              Jobs. Industry connections. Author branding. Book promotion. Publishing. Everything a
              writer needs to earn from their craft.
            </p>
          </div>

          <div className="mb-8 flex gap-0 overflow-x-auto rounded-[14px] border border-[#242424] bg-[#161616] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-w-[120px] flex-1 rounded-[10px] px-2 py-2.5 text-center text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] text-[#080808]"
                    : "text-[#606060] hover:text-[#F0EBE0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "jobs" && user ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <Link
                href="/wealth/jobs"
                className="rounded-xl border border-[var(--gm)] bg-[var(--gf)] px-3 py-1.5 text-[11px] font-bold text-[var(--gd)]"
              >
                Browse All Jobs
              </Link>
              <Link
                href="/wealth/jobs/post"
                className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)]"
              >
                Post a Job
              </Link>
              <Link
                href="/wealth/jobs/mine"
                className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)]"
              >
                My Jobs
              </Link>
              <Link
                href="/wealth/applications"
                className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)]"
              >
                My Applications
              </Link>
            </div>
          ) : null}

          {activeTab === "industry" && user ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <Link
                href="/wealth/industry"
                className="rounded-xl border border-[var(--gm)] bg-[var(--gf)] px-3 py-1.5 text-[11px] font-bold text-[var(--gd)]"
              >
                Browse Open Calls
              </Link>
              <Link
                href="/wealth/industry/post"
                className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)]"
              >
                Post a Listing
              </Link>
              <Link
                href="/wealth/industry/mine"
                className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)]"
              >
                My Listings
              </Link>
              <Link
                href="/wealth/pitches"
                className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#909090] hover:border-[var(--gm)] hover:text-[var(--gd)]"
              >
                My Pitches
              </Link>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CONTENT[activeTab].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => handleItem(item)}
                className="flex items-start gap-3.5 rounded-2xl border border-[#242424] bg-[#1c1c1c] p-5 text-left transition-all duration-200 hover:border-[var(--gm)]"
              >
                <span className="shrink-0 text-[28px] leading-none">{item.icon}</span>
                <span>
                  <span className="mb-1 block text-[15px] font-bold text-white">{item.title}</span>
                  <span className="block text-xs leading-relaxed text-[#606060]">{item.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {activeModal ? (
        <WealthToolModals
          activeModal={activeModal}
          onClose={() => setActiveModal(null)}
          onToast={triggerToast}
        />
      ) : null}

      <Footer />
    </div>
  );
}
