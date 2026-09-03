"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STEPS = [
  {
    title: "1. Prepare your manuscript",
    body: "Export a clean .docx or .epub. Remove editor comments, fix chapter breaks, and embed a clickable table of contents.",
  },
  {
    title: "2. Create your KDP account",
    body: "Sign up at kdp.amazon.com with tax and banking details ready. Choose Kindle eBook or Paperback (or both).",
  },
  {
    title: "3. Book details that sell",
    body: "Write a keyword-rich title/subtitle, pick 2 BISAC categories, and use 7 backend keywords. Paste your WEALTH blurb into the description.",
  },
  {
    title: "4. Cover & interior",
    body: "Upload a 1600×2560+ cover (or use Cover Creator). Preview the online reader carefully before publishing.",
  },
  {
    title: "5. Pricing & rights",
    body: "Select territories, choose 35% or 70% royalty (70% needs $2.99–$9.99 and eligible territories), then Publish.",
  },
];

export default function KdpGuidePage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[720px]">
          <Link href="/wealth" className="text-xs text-[var(--gd)] mb-4 inline-block">
            ← WEALTH Hub
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gd)]">Publishing</p>
          <h1 className="font-serif text-3xl font-black text-white mt-1 mb-2">Amazon KDP Checklist</h1>
          <p className="text-xs text-[#909090] mb-8">
            Direct Kindle publishing isn’t automated yet — use this guide plus WEALTH tools (blurb, query,
            social kit) to ship faster.
          </p>
          <div className="space-y-3 mb-8">
            {STEPS.map((s) => (
              <div key={s.title} className="rounded-2xl border border-[#242424] bg-[#1c1c1c] p-4">
                <h3 className="text-sm font-bold text-white mb-1">{s.title}</h3>
                <p className="text-xs leading-relaxed text-[#909090]">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://kdp.amazon.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] px-4 py-2.5 text-xs font-bold text-[#080808]"
            >
              Open Amazon KDP
            </a>
            <Link
              href="/wealth"
              className="rounded-xl border border-[#242424] px-4 py-2.5 text-xs font-bold text-[#909090]"
            >
              Use Blurb / Social Kit
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
