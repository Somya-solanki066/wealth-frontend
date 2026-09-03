"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function WealthIndustryNav({ active }: { active?: string }) {
  const { user } = useAuth();

  const links = [
    { href: "/wealth/industry", id: "browse", label: "Open Calls" },
    { href: "/wealth/industry/post", id: "post", label: "Post a Listing" },
    { href: "/wealth/industry/mine", id: "mine", label: "My Listings" },
    { href: "/wealth/pitches", id: "pitches", label: "My Pitches" },
  ];

  if (!user) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {links.map((l) => (
        <Link
          key={l.id}
          href={l.href}
          className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold transition-colors ${
            active === l.id
              ? "border-[var(--gm)] bg-[var(--gf)] text-[var(--gd)]"
              : "border-[#242424] text-[#909090] hover:border-[var(--gm)] hover:text-[#F0EBE0]"
          }`}
        >
          {l.label}
        </Link>
      ))}
      <Link
        href="/wealth"
        className="rounded-xl border border-[#242424] px-3 py-1.5 text-[11px] font-bold text-[#606060] hover:text-[#F0EBE0]"
      >
        ← WEALTH Hub
      </Link>
    </div>
  );
}
