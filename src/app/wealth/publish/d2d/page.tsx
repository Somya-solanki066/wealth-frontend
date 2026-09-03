"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const STEPS = [
  {
    title: "1. Why go wide",
    body: "Draft2Digital distributes to Apple Books, Kobo, Barnes & Noble, libraries, and more — great if you are not exclusive to Kindle Unlimited.",
  },
  {
    title: "2. Create your D2D account",
    body: "Sign up at draft2digital.com. Add payment details and tax info before uploading.",
  },
  {
    title: "3. Upload & convert",
    body: "Upload .docx — D2D converts to EPUB and formats chapter breaks. Review the online previewer on phone and tablet sizes.",
  },
  {
    title: "4. Metadata & categories",
    body: "Reuse your WEALTH blurb and keywords. Pick categories carefully — library discovery depends on clean metadata.",
  },
  {
    title: "5. Retailer mix",
    body: "Enable retailers you want. Skip Amazon inside D2D if you already publish there via KDP to avoid duplicate ASINs.",
  },
];

export default function D2dGuidePage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F0EBE0] flex flex-col">
      <Navbar />
      <main className="flex-grow px-[5%] pt-6 pb-16">
        <div className="mx-auto max-w-[720px]">
          <Link href="/wealth" className="text-xs text-[var(--gd)] mb-4 inline-block">
            ← WEALTH Hub
          </Link>
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--gd)]">Publishing</p>
          <h1 className="font-serif text-3xl font-black text-white mt-1 mb-2">Draft2Digital Guide</h1>
          <p className="text-xs text-[#909090] mb-8">
            Wide distribution checklist. Pair with Query Letter Builder and Social Media Kit for launch week.
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
              href="https://www.draft2digital.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] px-4 py-2.5 text-xs font-bold text-[#080808]"
            >
              Open Draft2Digital
            </a>
            <Link
              href="/wealth"
              className="rounded-xl border border-[#242424] px-4 py-2.5 text-xs font-bold text-[#909090]"
            >
              Back to WEALTH
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
