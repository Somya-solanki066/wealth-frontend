"use client";

import { useState } from "react";
import WealthAiGenerateButton from "@/components/wealth/WealthAiGenerateButton";

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[2px] text-[var(--gm)]">
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="mb-3.5 w-full rounded-xl border border-[#242424] bg-[#161616] px-3.5 py-3 text-[13px] text-[#F0EBE0] outline-none placeholder:text-[#606060] focus:border-[var(--gm)]"
    />
  );
}

function TextSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="mb-3.5 w-full appearance-none rounded-xl border border-[#242424] bg-[#1c1c1c] px-3.5 py-2.5 text-[13px] text-[#F0EBE0] outline-none focus:border-[var(--gm)]"
    />
  );
}

function TextTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="mb-3.5 min-h-[100px] w-full resize-none rounded-xl border border-[#242424] bg-[#1c1c1c] px-3.5 py-3 text-[13px] leading-relaxed text-[#F0EBE0] outline-none placeholder:italic placeholder:text-[#606060] focus:border-[var(--gm)]"
    />
  );
}

function TipCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#242424] bg-[#1c1c1c] p-3.5">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--gd)]">{title}</p>
      <p className="text-xs leading-relaxed text-[#909090]">{body}</p>
    </div>
  );
}

function GoldButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-gradient-to-br from-[var(--gl)] to-[var(--gm)] py-3.5 text-sm font-bold text-[#080808] transition-transform hover:scale-[1.02]"
    >
      {children}
    </button>
  );
}

export default function WealthToolModals({
  activeModal,
  onClose,
  onToast,
}: {
  activeModal: ModalId;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [blurb, setBlurb] = useState({
    title: "",
    genre: "Werewolf Romance",
    synopsis: "",
    style: "Back cover (150 words)",
  });
  const [bio, setBio] = useState({
    name: "",
    genres: "",
    achievements: "",
    length: "Medium (100 words)",
  });
  const [press, setPress] = useState({
    announcementType: "New book launch",
    title: "",
    details: "",
  });
  const [pitch, setPitch] = useState({
    title: "",
    pitchingTo: "Book publisher",
    logline: "",
  });
  const [booktok, setBooktok] = useState({ title: "", hook: "" });
  const [medium, setMedium] = useState({ topic: "" });
  const [query, setQuery] = useState({
    title: "",
    genre: "",
    wordCount: "",
    synopsis: "",
    bio: "",
    comps: "",
  });
  const [social, setSocial] = useState({
    title: "",
    genre: "",
    hook: "",
    platforms: "TikTok, Instagram, Twitter/X, Facebook",
  });

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-h-[85vh] w-[90%] max-w-[520px] overflow-y-auto rounded-3xl border border-[#242424] bg-[#141414] p-9">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[#242424] bg-[#1c1c1c] text-sm text-[#909090]"
          aria-label="Close"
        >
          ✕
        </button>

        {activeModal === "blurb" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">📖 Book Blurb Writer</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[#909090]">
              AI writes your back cover description and Amazon listing that sells your book.
            </p>
            <FieldLabel>Book Title</FieldLabel>
            <TextInput
              value={blurb.title}
              onChange={(e) => setBlurb({ ...blurb, title: e.target.value })}
              placeholder="e.g. The Alpha's Hidden Heir"
            />
            <FieldLabel>Genre</FieldLabel>
            <TextSelect
              value={blurb.genre}
              onChange={(e) => setBlurb({ ...blurb, genre: e.target.value })}
            >
              <option>Werewolf Romance</option>
              <option>Vampire Romance</option>
              <option>Billionaire Romance</option>
              <option>Urban Fantasy</option>
              <option>Thriller</option>
            </TextSelect>
            <FieldLabel>What is Your Story About?</FieldLabel>
            <TextTextarea
              value={blurb.synopsis}
              onChange={(e) => setBlurb({ ...blurb, synopsis: e.target.value })}
              placeholder="2–3 sentences about your story..."
            />
            <FieldLabel>Blurb Style</FieldLabel>
            <TextSelect
              value={blurb.style}
              onChange={(e) => setBlurb({ ...blurb, style: e.target.value })}
            >
              <option>Back cover (150 words)</option>
              <option>Amazon listing (300 words)</option>
              <option>Platform summary (100 words)</option>
            </TextSelect>
            <WealthAiGenerateButton
              endpoint="/wealth/tools/blurb"
              payload={blurb}
              buttonLabel="📖 Generate My Blurb"
              successToast="📖 Book blurb generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                !blurb.title.trim() || blurb.synopsis.trim().length < 20
                  ? "Title and a short synopsis are required."
                  : null
              }
            />
          </>
        )}

        {activeModal === "bio" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">🖊️ Author Bio Generator</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[#909090]">
              Generate professional bios for your platform profiles, publisher submissions, and press
              kits.
            </p>
            <FieldLabel>Your Name / Pen Name</FieldLabel>
            <TextInput
              value={bio.name}
              onChange={(e) => setBio({ ...bio, name: e.target.value })}
              placeholder="e.g. Victor Daniels"
            />
            <FieldLabel>Genres You Write</FieldLabel>
            <TextInput
              value={bio.genres}
              onChange={(e) => setBio({ ...bio, genres: e.target.value })}
              placeholder="e.g. Werewolf Romance, Vampire Fiction"
            />
            <FieldLabel>Notable Achievements</FieldLabel>
            <TextInput
              value={bio.achievements}
              onChange={(e) => setBio({ ...bio, achievements: e.target.value })}
              placeholder="e.g. 50K+ readers on PocketFM"
            />
            <FieldLabel>Bio Length</FieldLabel>
            <TextSelect
              value={bio.length}
              onChange={(e) => setBio({ ...bio, length: e.target.value })}
            >
              <option>Short (50 words)</option>
              <option>Medium (100 words)</option>
              <option>Long (200 words)</option>
            </TextSelect>
            <WealthAiGenerateButton
              endpoint="/wealth/tools/bio"
              payload={bio}
              buttonLabel="🖊️ Generate My Bio"
              successToast="🖊️ Author bio generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() => (!bio.name.trim() ? "Name is required." : null)}
            />
          </>
        )}

        {activeModal === "press" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">📰 Press Release Writer</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[#909090]">
              AI writes a professional press release for your book launch, milestone, or publishing
              achievement.
            </p>
            <FieldLabel>Announcement Type</FieldLabel>
            <TextSelect
              value={press.announcementType}
              onChange={(e) => setPress({ ...press, announcementType: e.target.value })}
            >
              <option>New book launch</option>
              <option>Series milestone</option>
              <option>Award / contest win</option>
              <option>Publishing deal</option>
            </TextSelect>
            <FieldLabel>Book / Project Title</FieldLabel>
            <TextInput
              value={press.title}
              onChange={(e) => setPress({ ...press, title: e.target.value })}
              placeholder="Your book or series title"
            />
            <FieldLabel>Key Details</FieldLabel>
            <TextTextarea
              value={press.details}
              onChange={(e) => setPress({ ...press, details: e.target.value })}
              placeholder="e.g. Launching on PocketFM on July 1st..."
            />
            <WealthAiGenerateButton
              endpoint="/wealth/tools/press"
              payload={press}
              buttonLabel="📰 Generate Press Release"
              successToast="📰 Press release generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                !press.title.trim() || press.details.trim().length < 15
                  ? "Title and key details are required."
                  : null
              }
            />
          </>
        )}

        {activeModal === "pitch" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">📊 Pitch Deck Builder</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[#909090]">
              Build a professional pitch deck to present your novel or screenplay to publishers and
              producers.
            </p>
            <FieldLabel>Project Title</FieldLabel>
            <TextInput
              value={pitch.title}
              onChange={(e) => setPitch({ ...pitch, title: e.target.value })}
              placeholder="Your book or screenplay title"
            />
            <FieldLabel>Pitching To</FieldLabel>
            <TextSelect
              value={pitch.pitchingTo}
              onChange={(e) => setPitch({ ...pitch, pitchingTo: e.target.value })}
            >
              <option>Book publisher</option>
              <option>Streaming platform</option>
              <option>Film producer</option>
              <option>Literary agent</option>
              <option>Audio platform</option>
            </TextSelect>
            <FieldLabel>Logline (one sentence)</FieldLabel>
            <TextInput
              value={pitch.logline}
              onChange={(e) => setPitch({ ...pitch, logline: e.target.value })}
              placeholder="One-sentence hook..."
            />
            <WealthAiGenerateButton
              endpoint="/wealth/tools/pitch-deck"
              payload={pitch}
              buttonLabel="📊 Build Pitch Deck"
              successToast="📊 Pitch deck generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                !pitch.title.trim() || pitch.logline.trim().length < 10
                  ? "Title and logline are required."
                  : null
              }
            />
          </>
        )}

        {activeModal === "booktok" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">🎵 TikTok #BookTok Strategy</h3>
            <div className="mb-5 flex flex-col gap-2.5">
              <TipCard
                title="📌 Hook Formula"
                body='Open with a shocking line from your book. Show the reaction. End with "Chapter 1 is free — link in bio." Never start with "Hi guys."'
              />
              <TipCard
                title="📅 Posting Schedule"
                body="Post 3–5 times per week. Best times: 7–9am, 12–3pm, 7–9pm. Consistency beats virality."
              />
              <TipCard
                title="🏷️ Key Hashtags"
                body="#BookTok #WattpadStory #WebNovel #PocketFM #RomanceBooks #WerewolfRomance #VampireRomance #AuthorTikTok"
              />
            </div>
            <FieldLabel>Book Title (optional)</FieldLabel>
            <TextInput
              value={booktok.title}
              onChange={(e) => setBooktok({ ...booktok, title: e.target.value })}
              placeholder="Your book title"
            />
            <FieldLabel>Generate Hook Script for My Book</FieldLabel>
            <TextInput
              value={booktok.hook}
              onChange={(e) => setBooktok({ ...booktok, hook: e.target.value })}
              placeholder="Paste your most dramatic line or scene..."
            />
            <WealthAiGenerateButton
              endpoint="/wealth/tools/booktok"
              payload={booktok}
              buttonLabel="🎵 Generate My Hook Script"
              successToast="🎵 BookTok hook script generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                booktok.hook.trim().length < 10 ? "Paste a dramatic line (min 10 chars)." : null
              }
            />
          </>
        )}

        {activeModal === "goodreads" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">📚 Goodreads Promotion</h3>
            <div className="mb-5 flex flex-col gap-2.5">
              <TipCard
                title="Step 1 — Author Page"
                body="Claim your Goodreads Author Programme account. Fill every field — incomplete profiles get ignored by the algorithm."
              />
              <TipCard
                title="Step 2 — Run a Giveaway"
                body='Even 5 free copies creates hundreds of "want to read" additions, which triggers organic recommendations to millions of readers.'
              />
              <TipCard
                title="Step 3 — Reading Lists"
                body="Add your book to relevant Listopia lists. Ask your readers to vote. Votes equal visibility to new readers."
              />
              <TipCard
                title="Step 4 — Join Groups"
                body="Engage genuinely for 2 weeks before mentioning your book. Organic readers convert 10x better than ads."
              />
            </div>
            <GoldButton
              onClick={() => {
                onToast("📚 Goodreads strategy saved!");
                onClose();
              }}
            >
              📚 Start My Goodreads Page
            </GoldButton>
          </>
        )}

        {activeModal === "reddit" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">🔴 Reddit Book Promotion</h3>
            <div className="mb-5 flex flex-col gap-2.5">
              <TipCard
                title="Best Subreddits"
                body="r/romancebooks · r/fantasyromance · r/suggestmeabook · r/wattpad · r/webnovels · r/writing"
              />
              <TipCard
                title="High-Converting Post Format"
                body='Title: "I wrote a [genre] story about [hook]. First 5 chapters are free. Brutal feedback welcome." Then paste your opening paragraph.'
              />
            </div>
            <GoldButton
              onClick={() => {
                onToast("🔴 Reddit strategy saved!");
                onClose();
              }}
            >
              🔴 Got It — Post to Reddit
            </GoldButton>
          </>
        )}

        {activeModal === "medium" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">✍️ Medium Strategy</h3>
            <div className="mb-5 flex flex-col gap-2.5">
              <TipCard
                title="Article Ideas"
                body={
                  <>
                    • &quot;Why I write werewolf romance — and why millions can&apos;t stop reading
                    it&quot;
                    <br />• &quot;How I wrote 100 chapters in 6 months&quot;
                    <br />• &quot;What PocketFM taught me about storytelling&quot;
                  </>
                }
              />
              <TipCard
                title="The Traffic Loop"
                body='End every Medium article with: "If you enjoy this storytelling, Chapter 1 of my novel is free on PocketFM — link here."'
              />
            </div>
            <FieldLabel>Generate Article Outline</FieldLabel>
            <TextInput
              value={medium.topic}
              onChange={(e) => setMedium({ topic: e.target.value })}
              placeholder="e.g. Why readers can't stop reading rejection romance..."
            />
            <WealthAiGenerateButton
              endpoint="/wealth/tools/medium"
              payload={medium}
              buttonLabel="✍️ Generate Outline"
              successToast="✍️ Article outline generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                medium.topic.trim().length < 8 ? "Enter an article topic." : null
              }
            />
          </>
        )}

        {activeModal === "query" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">📝 Query Letter Builder</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[#909090]">
              AI builds your complete query letter and submission package for literary agents and
              publishers.
            </p>
            <FieldLabel>Book Title</FieldLabel>
            <TextInput
              value={query.title}
              onChange={(e) => setQuery({ ...query, title: e.target.value })}
              placeholder="Your book title"
            />
            <FieldLabel>Genre</FieldLabel>
            <TextInput
              value={query.genre}
              onChange={(e) => setQuery({ ...query, genre: e.target.value })}
              placeholder="e.g. Werewolf Romance"
            />
            <FieldLabel>Word Count</FieldLabel>
            <TextInput
              value={query.wordCount}
              onChange={(e) => setQuery({ ...query, wordCount: e.target.value })}
              placeholder="e.g. 85,000"
            />
            <FieldLabel>Story Summary (2–3 sentences)</FieldLabel>
            <TextTextarea
              value={query.synopsis}
              onChange={(e) => setQuery({ ...query, synopsis: e.target.value })}
              placeholder="Brief summary of your story..."
            />
            <FieldLabel>Comparable Titles (optional)</FieldLabel>
            <TextInput
              value={query.comps}
              onChange={(e) => setQuery({ ...query, comps: e.target.value })}
              placeholder="e.g. Fourth Wing meets The Bridge Kingdom"
            />
            <FieldLabel>Your Author Bio (1–2 sentences)</FieldLabel>
            <TextInput
              value={query.bio}
              onChange={(e) => setQuery({ ...query, bio: e.target.value })}
              placeholder="Brief bio notes..."
            />
            <WealthAiGenerateButton
              endpoint="/wealth/tools/query"
              payload={query}
              buttonLabel="📝 Build My Query Letter"
              successToast="📝 Query letter generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                !query.title.trim() || query.synopsis.trim().length < 40
                  ? "Title and synopsis (40+ chars) are required."
                  : null
              }
            />
          </>
        )}

        {activeModal === "social" && (
          <>
            <h3 className="mb-2 font-serif text-2xl font-bold text-white">📱 Social Media Kit</h3>
            <p className="mb-6 text-[13px] leading-relaxed text-[#909090]">
              AI creates ready-to-post content for TikTok, Instagram, Twitter, and Facebook.
            </p>
            <FieldLabel>Book Title</FieldLabel>
            <TextInput
              value={social.title}
              onChange={(e) => setSocial({ ...social, title: e.target.value })}
              placeholder="Your book title"
            />
            <FieldLabel>Genre</FieldLabel>
            <TextInput
              value={social.genre}
              onChange={(e) => setSocial({ ...social, genre: e.target.value })}
              placeholder="e.g. Romance"
            />
            <FieldLabel>Hook / Post Angle</FieldLabel>
            <TextTextarea
              value={social.hook}
              onChange={(e) => setSocial({ ...social, hook: e.target.value })}
              placeholder="What should the posts highlight?"
            />
            <FieldLabel>Platforms</FieldLabel>
            <TextSelect
              value={social.platforms}
              onChange={(e) => setSocial({ ...social, platforms: e.target.value })}
            >
              <option>TikTok, Instagram, Twitter/X, Facebook</option>
              <option>TikTok</option>
              <option>Instagram</option>
              <option>Twitter/X</option>
              <option>Facebook</option>
            </TextSelect>
            <WealthAiGenerateButton
              endpoint="/wealth/tools/social"
              payload={social}
              buttonLabel="📱 Generate Social Kit"
              successToast="📱 Social media kit generated!"
              onToast={onToast}
              onClose={onClose}
              validate={() =>
                !social.title.trim() || social.hook.trim().length < 10
                  ? "Title and a short hook are required."
                  : null
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
