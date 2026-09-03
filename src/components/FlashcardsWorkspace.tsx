"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";

type StudyMode = "notes" | "topic";
type SessionPhase = "idle" | "studying" | "complete";

type Flashcard = { question: string; answer: string };

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
  "English Language",
  "Government",
  "Economics",
  "Literature-in-English",
  "Accounting",
  "Computer Science",
  "Other",
];

const LEVELS = [
  "JSS1",
  "JSS2",
  "JSS3",
  "SS1",
  "SS2",
  "SS3",
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level+",
  "JAMB / UTME",
  "Other",
];

const CARD_COUNTS = [10, 15, 20] as const;

function RadioPill({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all ${
        checked
          ? "border-[#5298E0] bg-[rgba(82,152,224,0.15)] text-[#5298E0]"
          : "border-[#242424] bg-[#080808] text-[#909090] hover:border-[#5298E0]/40"
      }`}
    >
      <span className="mr-1.5">{checked ? "●" : "○"}</span>
      {label}
    </button>
  );
}

export default function FlashcardsWorkspace() {
  const [mode, setMode] = useState<StudyMode>("notes");
  const [notes, setNotes] = useState("");
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [level, setLevel] = useState("SS3");
  const [cardCount, setCardCount] = useState<10 | 15 | 20>(15);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [setTitle, setSetTitle] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gotIt, setGotIt] = useState(0);
  const [reviewAgain, setReviewAgain] = useState(0);
  const [reviewQueue, setReviewQueue] = useState<Flashcard[]>([]);
  const [phase, setPhase] = useState<SessionPhase>("idle");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentCard = cards[cardIndex];
  const answered = gotIt + reviewAgain;
  const remaining = Math.max(0, cards.length - answered);
  const progressPct = cards.length ? Math.round((answered / cards.length) * 100) : 0;
  const accuracy = answered ? Math.round((gotIt / answered) * 100) : 0;

  const studyLabel = useMemo(() => {
    if (setTitle) return setTitle;
    if (mode === "topic" && topic.trim()) return `${subject} — ${topic.trim()}`;
    return subject;
  }, [setTitle, mode, topic, subject]);

  const resetSessionStats = () => {
    setCardIndex(0);
    setFlipped(false);
    setGotIt(0);
    setReviewAgain(0);
    setReviewQueue([]);
  };

  const generateFlashcards = async () => {
    if (mode === "notes" && !notes.trim()) {
      setError("Paste your lecture notes.");
      return;
    }
    if (mode === "topic" && !topic.trim()) {
      setError("Enter a topic to study.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/student/flashcards", {
        mode,
        notes: mode === "notes" ? notes : undefined,
        topic: mode === "topic" ? topic : undefined,
        subject,
        level,
        count: cardCount,
      });
      const next: Flashcard[] = (res.data.cards || [])
        .map((c: any) => ({
          question: c.question || c.q || "",
          answer: c.answer || c.a || "",
        }))
        .filter((c: Flashcard) => c.question && c.answer);

      if (!next.length) {
        setError("No flashcards returned. Try again with more detail.");
        return;
      }

      setCards(next);
      setSetTitle(res.data.title || studyLabel);
      resetSessionStats();
      setPhase("studying");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate flashcards.");
    } finally {
      setLoading(false);
    }
  };

  const markCard = (result: "got" | "review") => {
    if (!currentCard) return;

    if (result === "got") {
      setGotIt((n) => n + 1);
    } else {
      setReviewAgain((n) => n + 1);
      setReviewQueue((q) => [...q, currentCard]);
    }

    const nextAnswered = answered + 1;
    if (nextAnswered >= cards.length) {
      setFlipped(false);
      setPhase("complete");
      return;
    }

    setFlipped(false);
    setCardIndex((i) => i + 1);
  };

  const reviewMissed = () => {
    if (!reviewQueue.length) {
      setPhase("studying");
      resetSessionStats();
      return;
    }
    setCards(reviewQueue);
    setSetTitle((t) => (t ? `${t} (Review)` : "Review session"));
    resetSessionStats();
    setPhase("studying");
  };

  const startNewSession = () => {
    setCards([]);
    setSetTitle("");
    resetSessionStats();
    setPhase("idle");
    setError("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT — create / study material */}
      <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
            {phase === "studying" ? "Study material" : "Create flashcards"}
          </p>
          {phase === "studying" || phase === "complete" ? (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-bold text-white">{subject}</p>
              <p className="text-xs text-[#909090]">{studyLabel}</p>
              <p className="text-[10px] text-[#606060]">{level} · {cards.length} cards</p>
            </div>
          ) : (
            <p className="text-[11px] text-[#909090] mt-1">
              Choose notes or a topic, then generate an active-recall deck.
            </p>
          )}
        </div>

        {phase === "idle" && (
          <>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                What do you want to study?
              </p>
              <div className="flex flex-wrap gap-2">
                <RadioPill
                  checked={mode === "notes"}
                  label="Paste Notes"
                  onChange={() => setMode("notes")}
                />
                <RadioPill
                  checked={mode === "topic"}
                  label="Enter Topic"
                  onChange={() => setMode("topic")}
                />
              </div>
            </div>

            {mode === "topic" ? (
              <>
                <Input
                  label="Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Newton's Laws of Motion"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    options={SUBJECTS.map((s) => ({ label: s, value: s }))}
                  />
                  <Select
                    label="Level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    options={LEVELS.map((l) => ({ label: l, value: l }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    options={SUBJECTS.map((s) => ({ label: s, value: s }))}
                  />
                  <Select
                    label="Level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    options={LEVELS.map((l) => ({ label: l, value: l }))}
                  />
                </div>
                <Textarea
                  label="Paste your lecture notes"
                  rows={8}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste your lecture notes here..."
                />
              </>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                Number of flashcards
              </p>
              <div className="flex flex-wrap gap-2">
                {CARD_COUNTS.map((n) => (
                  <RadioPill
                    key={n}
                    checked={cardCount === n}
                    label={String(n)}
                    onChange={() => setCardCount(n)}
                  />
                ))}
              </div>
            </div>

            {error ? <p className="text-xs text-red-400">{error}</p> : null}

            <Button
              type="button"
              className="w-full !bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
              isLoading={loading}
              onClick={generateFlashcards}
            >
              Generate Flashcards
            </Button>
          </>
        )}

        {(phase === "studying" || phase === "complete") && (
          <div className="pt-2 border-t border-[#242424] space-y-3">
            <div className="text-[11px] text-[#909090] space-y-1">
              <p>
                Got It: <span className="text-[#52C07A] font-bold">{gotIt}</span>
              </p>
              <p>
                Review Again: <span className="text-[#E2C06A] font-bold">{reviewAgain}</span>
              </p>
              {phase === "studying" ? (
                <p>
                  Remaining: <span className="text-white font-bold">{remaining}</span>
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full !border-[#5298E0]/50 !text-[#5298E0]"
              onClick={startNewSession}
            >
              New session
            </Button>
          </div>
        )}
      </div>

      {/* RIGHT — flashcard experience */}
      <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 min-h-[420px] flex flex-col">
        {phase === "idle" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(82,152,224,0.12)] border border-[rgba(82,152,224,0.35)] flex items-center justify-center text-[#5298E0]">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
              Your flashcards
            </p>
            <p className="text-xs text-[#606060] max-w-xs">
              Generate cards to start studying with active recall.
            </p>
          </div>
        )}

        {phase === "studying" && currentCard && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5298E0]">
                Card {cardIndex + 1} / {cards.length}
              </p>
              <p className="text-[10px] text-[#606060]">{progressPct}%</p>
            </div>

            <div className="h-2 rounded-full bg-[#080808] border border-[#242424] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5298E0] to-[#2a5a9e] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              className="flex-1 min-h-[220px] w-full rounded-2xl border border-[#242424] bg-[#080808] p-6 text-left transition-colors hover:border-[#5298E0]/40"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5298E0] mb-3">
                {flipped ? "Answer" : "Question"}
              </p>
              <p className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {flipped ? currentCard.answer : currentCard.question}
              </p>
              {!flipped ? (
                <p className="text-[10px] text-[#606060] mt-8">Tap card or use Flip below</p>
              ) : null}
            </button>

            {!flipped ? (
              <Button
                type="button"
                className="w-full !bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
                onClick={() => setFlipped(true)}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
              >
                Flip Card
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="!border-[#E2C06A]/40 !text-[#E2C06A]"
                  onClick={() => markCard("review")}
                >
                  Review Again
                </Button>
                <Button
                  type="button"
                  className="!bg-gradient-to-r !from-[#52C07A] !to-[#2d7a4a] !text-white"
                  onClick={() => markCard("got")}
                >
                  Got It
                </Button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#242424]">
              <div className="rounded-xl bg-[#080808] border border-[#242424] px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-[#606060]">Got It</p>
                <p className="text-sm font-bold text-[#52C07A]">{gotIt}</p>
              </div>
              <div className="rounded-xl bg-[#080808] border border-[#242424] px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-[#606060]">Review</p>
                <p className="text-sm font-bold text-[#E2C06A]">{reviewAgain}</p>
              </div>
              <div className="rounded-xl bg-[#080808] border border-[#242424] px-3 py-2 text-center">
                <p className="text-[9px] uppercase tracking-wider text-[#606060]">Left</p>
                <p className="text-sm font-bold text-white">{remaining}</p>
              </div>
            </div>
          </div>
        )}

        {phase === "complete" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-2">
            <p className="text-3xl">🎉</p>
            <div>
              <h4 className="font-serif text-xl font-bold text-white">Session Complete</h4>
              <p className="text-xs text-[#909090] mt-1">
                {cards.length} Flashcards Reviewed
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2 text-left">
              <div className="flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-xs">
                <span className="text-[#909090]">✓ Got It</span>
                <span className="font-bold text-[#52C07A]">{gotIt}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-xs">
                <span className="text-[#909090]">↻ Review Again</span>
                <span className="font-bold text-[#E2C06A]">{reviewAgain}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#242424] bg-[#080808] px-4 py-3 text-xs">
                <span className="text-[#909090]">Accuracy</span>
                <span className="font-bold text-[#5298E0]">{accuracy}%</span>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-2 pt-2">
              {reviewAgain > 0 ? (
                <Button
                  type="button"
                  className="w-full !bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
                  onClick={reviewMissed}
                >
                  Review {reviewAgain} Cards Again
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full !border-[#5298E0]/50 !text-[#5298E0]"
                onClick={startNewSession}
              >
                Start New Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
