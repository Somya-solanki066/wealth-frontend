"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Circle,
  Loader2,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

type Stage = {
  id: string;
  title: string;
  items: { id: string; label: string; group?: string }[];
};

type RouteMeta = {
  id: "kdp" | "d2d";
  title: string;
  subtitle: string;
  steps: string[];
};

type Progress = {
  done: number;
  total: number;
  percent: number;
  complete: boolean;
  remaining: { id: string; label: string }[];
};

type Checklist = {
  id?: string;
  bookId?: string | null;
  bookTitle: string;
  checked: Record<string, boolean>;
  route?: "kdp" | "d2d" | null;
  progress: Progress;
};

type BookOption = { id: string; title: string; chapters?: unknown[] };

type View = "books" | "checklist" | "route" | "guide";

export default function PublishingChecklistWorkspace({
  onBack,
}: {
  onBack?: () => void;
}) {
  const [view, setView] = useState<View>("books");
  const [stages, setStages] = useState<Stage[]>([]);
  const [routes, setRoutes] = useState<RouteMeta[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [lists, setLists] = useState<Checklist[]>([]);
  const [list, setList] = useState<Checklist | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [showRemaining, setShowRemaining] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadMeta = useCallback(async () => {
    try {
      const res = await api.get("/writer/publishing-checklist/meta");
      setStages(res.data.stages || []);
      setRoutes(res.data.routes || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadBooks = useCallback(async () => {
    try {
      const res = await api.get("/writer/self-interview/books");
      setBooks(res.data.books || []);
    } catch {
      setBooks([]);
    }
  }, []);

  const loadLists = useCallback(async () => {
    try {
      const res = await api.get("/writer/publishing-checklist/lists");
      setLists(res.data.lists || []);
    } catch {
      setLists([]);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
    void loadBooks();
    void loadLists();
  }, [loadMeta, loadBooks, loadLists]);

  const openChecklist = async (payload: {
    bookId?: string | null;
    bookTitle: string;
    checklistId?: string;
  }) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/publishing-checklist/lists", payload);
      setList(res.data.list);
      setView("checklist");
      setShowRemaining(false);
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not open checklist.");
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (itemId: string) => {
    if (!list?.id) return;
    const prev = list;
    const nextChecked = { ...list.checked, [itemId]: !list.checked[itemId] };
    setList({ ...list, checked: nextChecked });
    try {
      const res = await api.patch(`/writer/publishing-checklist/lists/${list.id}`, {
        toggleItemId: itemId,
      });
      setList(res.data.list);
      setLists((all) =>
        all.map((l) => (l.id === res.data.list.id ? res.data.list : l))
      );
    } catch (err: any) {
      setList(prev);
      setError(err.response?.data?.error || "Save failed.");
    }
  };

  const setRoute = async (route: "kdp" | "d2d") => {
    if (!list?.id) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.patch(`/writer/publishing-checklist/lists/${list.id}`, { route });
      setList(res.data.list);
      setView("guide");
      showToast(route === "kdp" ? "Amazon KDP selected" : "Draft2Digital selected");
    } catch (err: any) {
      setError(err.response?.data?.error || "Could not save route.");
    } finally {
      setBusy(false);
    }
  };

  const removeList = async (id?: string) => {
    if (!id) return;
    try {
      await api.delete(`/writer/publishing-checklist/lists/${id}`);
      setLists((all) => all.filter((l) => l.id !== id));
      if (list?.id === id) {
        setList(null);
        setView("books");
      }
      showToast("Deleted");
    } catch (err: any) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const activeRoute = useMemo(
    () => routes.find((r) => r.id === list?.route) || null,
    [routes, list?.route]
  );

  const progress = list?.progress;
  const pct = progress?.percent ?? 0;

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => {
          if (view === "guide") {
            setView("route");
            return;
          }
          if (view === "route") {
            setView("checklist");
            return;
          }
          if (view === "checklist") {
            setView("books");
            void loadLists();
            return;
          }
          onBack?.();
        }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        {view === "books" ? "Nonfiction & Ghostwriting" : "Publishing Checklist"}
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
          <Square size={18} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">Publishing Checklist</h2>
          <p className="mt-1 text-sm text-[#909090]">
            Steps to get KDP-ready and self-publish
          </p>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-2 text-sm text-[#52C07A]">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {view === "books" && (
        <div className="space-y-4">
          <p className="text-sm text-[#F0EBE0]">Select a book</p>

          {books.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#606060]">
                My books
              </p>
              {books.map((b) => {
                const existing = lists.find((l) => l.bookId === b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void openChecklist({
                        bookId: b.id,
                        bookTitle: b.title,
                        checklistId: existing?.id,
                      })
                    }
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3.5 text-left hover:border-[#333]"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{b.title}</div>
                      <div className="mt-1 text-[11px] text-[#606060]">
                        {existing
                          ? `${existing.progress.percent}% ready · ${existing.progress.done}/${existing.progress.total}`
                          : "Start publishing checklist"}
                      </div>
                    </div>
                    {existing?.progress.complete ? (
                      <Check size={16} className="shrink-0 text-[#52C07A]" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-[#606060]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {lists.filter((l) => !l.bookId || !books.some((b) => b.id === l.bookId)).length >
            0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#606060]">
                Saved checklists
              </p>
              {lists
                .filter((l) => !l.bookId || !books.some((b) => b.id === l.bookId))
                .map((l) => (
                  <div
                    key={l.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-[#242424] bg-[#161616] p-3"
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() =>
                        void openChecklist({
                          bookTitle: l.bookTitle,
                          checklistId: l.id,
                          bookId: l.bookId,
                        })
                      }
                    >
                      <div className="text-sm text-white">{l.bookTitle}</div>
                      <div className="mt-1 text-[11px] text-[#606060]">
                        {l.progress.percent}% · {l.progress.done}/{l.progress.total}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="p-2 text-[#909090] hover:text-red-300"
                      onClick={() => void removeList(l.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          )}

          <div className="rounded-xl border border-[#242424] bg-[#121212] p-4 space-y-3">
            <p className="text-xs text-[#909090]">Or start a checklist for a new title</p>
            <input
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]"
              placeholder="Book title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={busy || !newTitle.trim()}
              onClick={() =>
                void openChecklist({ bookTitle: newTitle.trim(), bookId: null })
              }
            >
              {busy ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <Plus size={14} className="mr-1.5" />
              )}
              Create checklist
            </Button>
          </div>
        </div>
      )}

      {view === "checklist" && list && (
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              {list.bookTitle}
            </p>
            <h3 className="mt-1 text-lg font-medium text-white">Self-publishing checklist</h3>
          </div>

          <div className="rounded-2xl border border-[#242424] bg-[#161616] p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-[#606060]">Publishing readiness</p>
                <p className="mt-1 font-serif text-3xl font-bold text-[var(--gd)]">{pct}%</p>
              </div>
              <p className="text-xs text-[#909090]">
                {progress?.done || 0} / {progress?.total || 0} tasks
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
              <div
                className="h-full rounded-full bg-[var(--gd)] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {progress?.complete ? (
            <div className="space-y-3 rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 p-4">
              <p className="text-sm font-semibold text-[#52C07A]">100% Complete ✓</p>
              <p className="text-xs text-[#c8c4bc]">
                Your book is ready for the final publishing process.
              </p>
              <Button className="w-full" onClick={() => setView("route")}>
                Continue to Publishing
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {(progress?.remaining.length || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRemaining((v) => !v)}
                  className="w-full rounded-xl border border-[#333] bg-[#121212] px-4 py-3 text-left"
                >
                  <p className="text-sm text-[#F0EBE0]">
                    {pct}% complete · {progress?.remaining.length} item
                    {(progress?.remaining.length || 0) === 1 ? "" : "s"} still need attention
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--gd)]">
                    {showRemaining ? "Hide remaining tasks" : "View remaining tasks"}
                  </p>
                </button>
              )}
              {showRemaining && (
                <ul className="space-y-1.5 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3">
                  {(progress?.remaining || []).map((r) => (
                    <li key={r.id} className="flex items-start gap-2 text-xs text-[#c8c4bc]">
                      <AlertTriangle size={12} className="mt-0.5 shrink-0 text-[var(--gd)]" />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-5">
            {stages.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[#606060]">
                  {stage.title}
                </p>
                {stage.items.map((item) => {
                  const on = !!list.checked[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void toggleItem(item.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3.5 text-left hover:border-[#333]"
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          on
                            ? "border-[#52C07A] bg-[#52C07A] text-zinc-950"
                            : "border-[#606060] text-transparent"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className={`text-sm ${on ? "text-[#c8c4bc] line-through" : "text-white"}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-[#606060]">
            Built around Amazon KDP and Draft2Digital — the two most common self-publish routes.
            Progress is saved to this book.
          </p>
        </div>
      )}

      {view === "route" && list && (
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-2xl font-bold text-white">How do you want to publish?</h3>
            <p className="mt-1 text-sm text-[#909090]">Choose a platform to see the final steps.</p>
          </div>
          {routes.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-3"
            >
              <div>
                <div className="text-lg font-medium text-white">{r.title}</div>
                <p className="mt-1 text-sm text-[#909090]">{r.subtitle}</p>
              </div>
              <Button className="w-full" disabled={busy} onClick={() => void setRoute(r.id)}>
                {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                Continue
              </Button>
            </div>
          ))}
        </div>
      )}

      {view === "guide" && list && activeRoute && (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
              Final publishing
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-white">{activeRoute.title}</h3>
            <p className="mt-1 text-sm text-[#909090]">{activeRoute.subtitle}</p>
          </div>
          <ol className="space-y-2">
            {activeRoute.steps.map((step, i) => (
              <li
                key={step}
                className="flex gap-3 rounded-xl border border-[#242424] bg-[#161616] px-4 py-3"
              >
                <span className="font-serif text-lg font-bold text-[var(--gd)]">{i + 1}</span>
                <span className="pt-1 text-sm text-[#F0EBE0]">{step}</span>
              </li>
            ))}
          </ol>
          <Button variant="secondary" className="w-full" onClick={() => setView("route")}>
            Switch publishing route
          </Button>
          <p className="text-center text-[11px] text-[#606060]">
            Checklist for “{list.bookTitle}” stays saved — come back anytime.
          </p>
        </div>
      )}
    </div>
  );
}
