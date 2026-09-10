"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlignLeft,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Lock,
  Plus,
  Trophy,
} from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";

export const DAO_VOTE_HANDOFF_KEY = "ink2wealth_dao_vote_direction";

type Tab = "vote" | "create" | "mine" | "history";

type Novel = { id: string; name: string; type?: string };
type Chapter = { id: string; title: string };

type PollOption = {
  id: string;
  label: string;
  votes: number | null;
  percent: number | null;
};

type Poll = {
  id: string;
  projectId: string;
  projectName: string;
  chapterId: string;
  chapterTitle: string;
  question: string;
  options: PollOption[];
  closesAt: string;
  resultsVisibility: string;
  status: "open" | "closed";
  totalVotes: number | null;
  winner: { id: string; label: string; votes: number; percent: number } | null;
  myOptionId: string | null;
  appliedAt?: string | null;
  ownerId?: string;
};

const inputClass =
  "w-full rounded-xl border border-[#2a2a2a] bg-[#161616] px-3 py-2.5 text-sm text-[#F0EBE0] outline-none focus:border-[var(--gd)]";
const labelClass = "mb-1.5 block text-xs text-[#909090]";

function formatClose(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function defaultClosesAt() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function DaoVoteWorkspace({ onBack }: { onBack?: () => void }) {
  const [tab, setTab] = useState<Tab>("vote");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [myPolls, setMyPolls] = useState<Poll[]>([]);
  const [activePollId, setActivePollId] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState("");
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [projectId, setProjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [closesAt, setClosesAt] = useState(defaultClosesAt());
  const [resultsVisibility, setResultsVisibility] = useState("after-vote");
  const [metaNote, setMetaNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2200);
  };

  const loadPolls = useCallback(async () => {
    try {
      const [all, mine] = await Promise.all([
        api.get("/writer/dao-vote/polls"),
        api.get("/writer/dao-vote/polls/mine"),
      ]);
      setPolls(all.data.polls || []);
      setMyPolls(mine.data.polls || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void api.get("/writer/dao-vote/meta").then((res) => {
      setMetaNote(res.data.note || "");
    });
    void api.get("/projects").then((res) => {
      setNovels((res.data || []).filter((p: Novel) => p.type === "novel"));
    });
    void loadPolls();
  }, [loadPolls]);

  useEffect(() => {
    if (!projectId) {
      setChapters([]);
      setChapterId("");
      return;
    }
    void api.get(`/projects/${projectId}/chapters`).then((res) => {
      const list = res.data || [];
      setChapters(list);
      setChapterId(list[0]?.id || "");
    });
  }, [projectId]);

  const activePoll = useMemo(() => {
    const list = [...polls, ...myPolls];
    const found = list.find((p) => p.id === activePollId);
    return found || polls.find((p) => p.status === "open") || polls[0] || null;
  }, [polls, myPolls, activePollId]);

  useEffect(() => {
    if (activePoll && !activePollId) setActivePollId(activePoll.id);
  }, [activePoll, activePollId]);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold ${
      active ? "bg-[var(--gd)] text-zinc-950" : "border border-[#333] text-[#c8c4bc]"
    }`;

  const refreshActive = async (id: string) => {
    const res = await api.get(`/writer/dao-vote/polls/${id}`);
    const p = res.data.poll as Poll;
    setPolls((list) => {
      const others = list.filter((x) => x.id !== id);
      return [p, ...others];
    });
    setMyPolls((list) => list.map((x) => (x.id === id ? p : x)));
    setActivePollId(id);
    return p;
  };

  const publishPoll = async () => {
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (!projectId || !chapterId) {
      setError("Select story and chapter.");
      return;
    }
    if (question.trim().length < 5) {
      setError("Enter a poll question.");
      return;
    }
    if (cleaned.length < 2 || cleaned.length > 5) {
      setError("Provide 2–5 options.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/writer/dao-vote/polls", {
        projectId,
        chapterId,
        question: question.trim(),
        options: cleaned,
        closesAt: new Date(closesAt).toISOString(),
        resultsVisibility,
      });
      await loadPolls();
      setActivePollId(res.data.poll.id);
      setTab("vote");
      setQuestion("");
      setOptions(["", ""]);
      showToast("Poll published");
    } catch (err: any) {
      setError(err.response?.data?.error || "Publish failed.");
    } finally {
      setBusy(false);
    }
  };

  const submitVote = async () => {
    if (!activePoll || !selectedOption) {
      setError("Select an option.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/writer/dao-vote/polls/${activePoll.id}/vote`, {
        optionId: selectedOption,
      });
      const p = res.data.poll as Poll;
      setPolls((list) => [p, ...list.filter((x) => x.id !== p.id)]);
      showToast("Your vote has been recorded");
    } catch (err: any) {
      setError(err.response?.data?.error || "Vote failed.");
    } finally {
      setBusy(false);
    }
  };

  const closeActive = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      await api.post(`/writer/dao-vote/polls/${id}/close`);
      await refreshActive(id);
      showToast("Poll closed");
    } catch (err: any) {
      setError(err.response?.data?.error || "Close failed.");
    } finally {
      setBusy(false);
    }
  };

  const applyWinner = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/writer/dao-vote/polls/${id}/apply`);
      const handoff = res.data.handoff;
      if (handoff) {
        sessionStorage.setItem(DAO_VOTE_HANDOFF_KEY, JSON.stringify(handoff));
      }
      await loadPolls();
      showToast("Chapter direction stub created — you stay in control");
    } catch (err: any) {
      setError(err.response?.data?.error || "Apply failed.");
    } finally {
      setBusy(false);
    }
  };

  const showResults =
    activePoll &&
    (activePoll.status === "closed" ||
      activePoll.myOptionId ||
      (activePoll.totalVotes != null && activePoll.options.some((o) => o.votes != null)));

  const openPolls = polls.filter((p) => p.status === "open");
  const closedPolls = polls.filter((p) => p.status === "closed");

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <button
        type="button"
        onClick={() => onBack?.()}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gd)] hover:opacity-90"
      >
        <ArrowLeft size={16} />
        Web3 Writing
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--gm)]/40 bg-[#3a2a12] text-[var(--gd)]">
          <AlignLeft size={20} />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-white">DAO Vote Tracker</h2>
          <p className="mt-1 text-sm text-[#909090]">Readers vote on plot direction</p>
        </div>
      </div>

      {metaNote && (
        <div className="rounded-xl border border-[#333] bg-[#161616] px-4 py-3 text-xs text-[#909090]">
          {metaNote}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["vote", "Live poll"],
            ["create", "Create poll"],
            ["mine", "My polls"],
            ["history", "History"],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={pill(tab === id)} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
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

      {tab === "create" && (
        <div className="space-y-4">
          <label className="block">
            <span className={labelClass}>Story</span>
            <select
              className={inputClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Choose…</option>
              {novels.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Chapter</span>
            <select
              className={inputClass}
              value={chapterId}
              disabled={!projectId}
              onChange={(e) => setChapterId(e.target.value)}
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Question</span>
            <input
              className={inputClass}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which path should Draco take?"
            />
          </label>
          <div className="space-y-2">
            <p className={labelClass}>Options (2–5)</p>
            {options.map((o, i) => (
              <input
                key={i}
                className={inputClass}
                value={o}
                onChange={(e) =>
                  setOptions((list) => list.map((x, idx) => (idx === i ? e.target.value : x)))
                }
                placeholder={`Option ${i + 1}`}
              />
            ))}
            {options.length < 5 && (
              <Button
                variant="secondary"
                onClick={() => setOptions((list) => [...list, ""])}
              >
                <Plus size={14} className="mr-1.5" /> Add option
              </Button>
            )}
          </div>
          <label className="block">
            <span className={labelClass}>Voting closes</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
            />
          </label>
          <div>
            <p className={labelClass}>Results visibility</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pill(resultsVisibility === "after-vote")}
                onClick={() => setResultsVisibility("after-vote")}
              >
                After vote
              </button>
              <button
                type="button"
                className={pill(resultsVisibility === "after-close")}
                onClick={() => setResultsVisibility("after-close")}
              >
                Blind until close
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={() => void publishPoll()} disabled={busy}>
            {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
            Publish Poll
          </Button>
        </div>
      )}

      {tab === "vote" && (
        <div className="space-y-4">
          {openPolls.length > 1 && (
            <label className="block">
              <span className={labelClass}>Active poll</span>
              <select
                className={inputClass}
                value={activePollId}
                onChange={(e) => {
                  setActivePollId(e.target.value);
                  setSelectedOption("");
                }}
              >
                {openPolls.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} — {p.question.slice(0, 40)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!activePoll ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No polls yet. Create one to get started.
            </p>
          ) : (
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gd)]">
                  {activePoll.status === "open" ? "Live poll" : "Poll closed"}
                </p>
                <span
                  className={`text-[11px] font-semibold ${
                    activePoll.status === "open" ? "text-[#52C07A]" : "text-[#909090]"
                  }`}
                >
                  {activePoll.status === "open" ? "🟢 Voting Open" : "🔒 Voting Closed"}
                </span>
              </div>
              <p className="text-xs text-[#606060]">
                {activePoll.projectName} · {activePoll.chapterTitle}
              </p>
              <h3 className="font-serif text-xl text-white">{activePoll.question}</h3>
              <p className="text-[11px] text-[#606060]">
                Voting ends: {formatClose(activePoll.closesAt)}
              </p>

              {!activePoll.myOptionId && activePoll.status === "open" && (
                <div className="space-y-2">
                  {activePoll.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${
                        selectedOption === o.id
                          ? "border-[var(--gd)] bg-[var(--gd)]/10 text-white"
                          : "border-[#333] text-[#c8c4bc]"
                      }`}
                      onClick={() => setSelectedOption(o.id)}
                    >
                      ○ {o.label}
                    </button>
                  ))}
                  <Button className="w-full" onClick={() => void submitVote()} disabled={busy}>
                    {busy ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : null}
                    Submit Vote
                  </Button>
                </div>
              )}

              {activePoll.myOptionId && activePoll.status === "open" && !showResults && (
                <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-3 text-sm text-[#52C07A]">
                  ✓ Your vote has been recorded. Results will be revealed when voting closes.
                </div>
              )}

              {activePoll.myOptionId && showResults && activePoll.status === "open" && (
                <div className="rounded-xl border border-[#52C07A]/30 bg-[#52C07A]/10 px-4 py-3 text-sm text-[#52C07A]">
                  ✓ Your vote has been recorded.
                </div>
              )}

              {showResults && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#909090]">
                    {activePoll.status === "closed" ? "Final results" : "Current results"}
                    {activePoll.totalVotes != null ? ` · Total votes: ${activePoll.totalVotes}` : ""}
                  </p>
                  {activePoll.options.map((o) => (
                    <div key={o.id}>
                      <div className="mb-1 flex justify-between text-sm text-[#F0EBE0]">
                        <span>{o.label}</span>
                        <span>
                          {o.percent != null ? `${o.percent}%` : "—"}
                          {o.votes != null ? ` (${o.votes})` : ""}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#2a2a2a]">
                        <div
                          className="h-full rounded-full bg-[var(--gd)] transition-all"
                          style={{ width: `${o.percent ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activePoll.status === "closed" && activePoll.winner && (
                <div className="rounded-xl border border-[var(--gd)]/40 bg-[#3a2a12]/40 p-4">
                  <div className="flex items-center gap-2 text-[var(--gd)]">
                    <Trophy size={16} />
                    <p className="font-semibold">Winning Choice</p>
                  </div>
                  <p className="mt-2 font-serif text-lg text-white">{activePoll.winner.label}</p>
                  <p className="mt-1 text-xs text-[#909090]">
                    {activePoll.winner.percent}% · {activePoll.winner.votes} votes
                  </p>
                </div>
              )}

              {activePoll.status === "open" && myPolls.some((p) => p.id === activePoll.id) && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => void closeActive(activePoll.id)}
                  disabled={busy}
                >
                  <Lock size={14} className="mr-1.5" /> Close poll early
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {tab === "mine" && (
        <div className="space-y-3">
          {myPolls.length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              You haven&apos;t created any polls yet.
            </p>
          ) : (
            myPolls.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[#242424] bg-[#161616] p-4 space-y-3">
                <div>
                  <div className="text-xs text-[#606060]">
                    {p.projectName} · {p.chapterTitle}
                  </div>
                  <div className="mt-1 font-medium text-white">{p.question}</div>
                  <div className="mt-1 text-[11px] text-[#909090]">
                    {p.status === "open" ? "🟢 Open" : "🔒 Closed"} ·{" "}
                    {p.totalVotes ?? 0} votes · ends {formatClose(p.closesAt)}
                  </div>
                </div>
                {p.status === "closed" && p.winner && (
                  <p className="text-sm text-[var(--gd)]">🏆 {p.winner.label}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActivePollId(p.id);
                      setTab("vote");
                    }}
                  >
                    View
                  </Button>
                  {p.status === "open" && (
                    <Button variant="secondary" onClick={() => void closeActive(p.id)} disabled={busy}>
                      Close
                    </Button>
                  )}
                  {p.status === "closed" && p.winner && !p.appliedAt && (
                    <Button onClick={() => void applyWinner(p.id)} disabled={busy}>
                      Use Winning Choice
                    </Button>
                  )}
                  {p.appliedAt && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#52C07A]">
                      <CheckCircle2 size={12} /> Applied to story
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          {[...closedPolls, ...openPolls].length === 0 ? (
            <p className="rounded-xl border border-[#242424] bg-[#161616] px-4 py-8 text-center text-sm text-[#606060]">
              No poll history yet.
            </p>
          ) : (
            [...closedPolls, ...openPolls].map((p) => (
              <button
                key={p.id}
                type="button"
                className="w-full rounded-2xl border border-[#242424] bg-[#161616] p-4 text-left hover:border-[#333]"
                onClick={() => {
                  setActivePollId(p.id);
                  setTab("vote");
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-white">
                      {p.status === "closed" ? "✓" : "🔴"} {p.chapterTitle} — {p.question}
                    </div>
                    <div className="mt-1 text-[11px] text-[#606060]">
                      {p.status === "closed"
                        ? `Winner: ${p.winner?.label || "Tie / no votes"}`
                        : "Voting Open"}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
