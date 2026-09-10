"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import api from "@/services/api";
import type { OpenCall } from "@/lib/industry";
import {
  INDUSTRY_GENRE_FILTERS,
  formatPostedAt,
  openCallMetaLine,
} from "@/lib/industry";
import Button from "@/components/ui/Button";

export default function IndustryHubWorkspace({ onBack }: { onBack?: () => void }) {
  const [genre, setGenre] = useState("All genres");
  const [calls, setCalls] = useState<OpenCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (selectedGenre = genre) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (selectedGenre && selectedGenre !== "All genres") {
          params.set("genre", selectedGenre);
        }
        const res = await api.get(`/wealth/industry?${params.toString()}`);
        let list: OpenCall[] = res.data?.calls || [];

        if (list.length === 0 && selectedGenre === "All genres") {
          const seed = await api.post("/wealth/industry/seed-demo");
          list = seed.data?.calls || [];
        }

        setCalls(list);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load open calls.");
        setCalls([]);
      } finally {
        setLoading(false);
      }
    },
    [genre]
  );

  useEffect(() => {
    void load(genre);
  }, [genre]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-xl space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#2a1018] bg-[#160004] text-[#f0ebe0] hover:border-[var(--gd)]"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <h2 className="font-serif text-2xl font-bold text-[#f0ebe0]">
          Industry Hub & Open Calls
        </h2>
      </div>

      <div className="rounded-2xl border border-[#2a1018] bg-[#160004] p-3">
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_GENRE_FILTERS.map((g) => {
            const active = genre === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-[var(--gd)] text-white"
                    : "bg-[#1c080e] text-[#a0a0a0] hover:text-[#f0ebe0]"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/wealth/industry/post"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gd)] hover:underline"
        >
          <Plus className="h-3.5 w-3.5" /> Post a listing
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--gd)]" />
        </div>
      ) : calls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2a1018] px-5 py-12 text-center text-sm text-[#707070]">
          No open calls in this genre yet. Check back after the next board refresh.
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => (
            <article
              key={call.id}
              className="rounded-2xl border border-[#2a1018] bg-[#160004] p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-serif text-lg font-bold text-white leading-snug">
                  {call.title}
                </h3>
                <span className="shrink-0 rounded-full bg-[#1c080e] px-2.5 py-1 text-[10px] font-medium text-[#909090]">
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
          ))}
        </div>
      )}

      <div className="pt-2">
        <Button variant="outline" className="w-full" onClick={() => load(genre)}>
          Refresh board
        </Button>
      </div>
    </div>
  );
}
