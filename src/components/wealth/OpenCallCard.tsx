"use client";

import Link from "next/link";
import type { OpenCall } from "@/lib/industry";
import { callTypeLabel } from "@/lib/industry";

export function OpenCallCard({ call }: { call: OpenCall }) {
  return (
    <Link
      href={`/wealth/industry/${call.id}`}
      className="block rounded-2xl border border-[#242424] bg-[#1c1c1c] p-5 transition-all hover:border-[var(--gm)]"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="rounded-md border border-[var(--gm)] bg-[var(--gf)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--gd)]">
          {callTypeLabel(call.callType)}
        </span>
        <span className="rounded-md border border-[#242424] px-2 py-0.5 text-[9px] font-bold uppercase text-[#909090]">
          {call.locationType}
        </span>
        {call.genre ? (
          <span className="text-[10px] text-[#606060]">{call.genre}</span>
        ) : null}
      </div>
      <h3 className="font-serif text-lg font-bold text-white mb-1">{call.title}</h3>
      <p className="text-xs text-[var(--gd)] mb-2">{call.organization}</p>
      <p className="text-xs text-[#606060] line-clamp-2 mb-3">{call.description}</p>
      <div className="flex flex-wrap gap-3 text-[10px] text-[#909090]">
        {call.deadline ? <span>Deadline: {call.deadline}</span> : null}
        {call.prize ? <span>Prize: {call.prize}</span> : null}
        <span>{call.pitchCount || 0} pitches</span>
      </div>
    </Link>
  );
}
