"use client";

import Link from "next/link";
import type { OpenCall } from "@/lib/industry";
import { formatPostedAt, openCallMetaLine } from "@/lib/industry";

export function OpenCallCard({ call }: { call: OpenCall }) {
  return (
    <article className="rounded-2xl border border-[#242424] bg-[#1c1c1c] p-5 transition-all hover:border-[var(--gm)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-serif text-lg font-bold text-white leading-snug">{call.title}</h3>
        <span className="shrink-0 rounded-full bg-[#161616] px-2.5 py-1 text-[10px] font-medium text-[#909090]">
          {formatPostedAt(call.createdAt)}
        </span>
      </div>
      <p className="text-xs text-[#909090] mb-4">{openCallMetaLine(call)}</p>
      <Link
        href={`/wealth/industry/${call.id}`}
        className="block w-full rounded-xl border border-[var(--gd)] bg-transparent px-4 py-3 text-center text-sm font-semibold text-[var(--gd)] transition hover:bg-[var(--gd)]/10"
      >
        Apply now
      </Link>
    </article>
  );
}
