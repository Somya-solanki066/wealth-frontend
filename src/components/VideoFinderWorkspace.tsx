"use client";

import { useState } from "react";
import { ExternalLink, Video } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

type VideoResult = {
  title: string;
  channel: string;
  why?: string;
  url: string;
  videoId?: string;
  thumbnail?: string;
  suitableForLevel?: boolean;
  examRelevant?: boolean;
};

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
  "Other",
];

const EXAMS = [
  "WAEC",
  "NECO",
  "JAMB",
  "School Exam",
  "University Exam",
  "General Learning",
];

const LANGUAGES = ["English", "Other"];

export default function VideoFinderWorkspace() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("SS2");
  const [exam, setExam] = useState("WAEC");
  const [language, setLanguage] = useState("English");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [meta, setMeta] = useState<{ topic: string; level: string; exam: string } | null>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const findVideos = async () => {
    if (!topic.trim()) {
      setError("Enter a subject or topic.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await api.post("/student/videos", {
        topic: topic.trim(),
        level,
        exam,
        language,
      });
      setVideos(res.data.videos || []);
      setMeta({
        topic: res.data.topic || topic.trim(),
        level: res.data.level || level,
        exam: res.data.exam || exam,
      });
      setNotice(res.data.notice || "");
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to find videos.");
      setSearched(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 space-y-4 w-full">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
            Course Video Finder
          </p>
          <p className="text-[11px] text-[#909090] mt-1">
            Find level-matched YouTube tutorials for WAEC, NECO, JAMB, school, and university study.
          </p>
        </div>

        <Input
          label="Subject / Topic *"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Photosynthesis"
          onKeyDown={(e) => {
            if (e.key === "Enter") findVideos();
          }}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Education Level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            options={LEVELS.map((l) => ({ label: l, value: l }))}
          />
          <Select
            label="Exam / Goal"
            value={exam}
            onChange={(e) => setExam(e.target.value)}
            options={EXAMS.map((x) => ({ label: x, value: x }))}
          />
          <Select
            label="Preferred Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={LANGUAGES.map((l) => ({ label: l, value: l }))}
          />
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <Button
          type="button"
          isLoading={loading}
          onClick={findVideos}
          className="w-full sm:w-auto !bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
        >
          Find Top 5 Tutorials
        </Button>
      </div>

      {searched && meta ? (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
              Top 5 recommended videos
            </p>
            <h4 className="font-serif text-lg font-bold text-white mt-1">{meta.topic}</h4>
            <p className="text-xs text-[#909090] mt-0.5">
              {meta.level} · {meta.exam}
              {videos.length ? ` · ${videos.length} recommended tutorials` : ""}
            </p>
            {notice ? <p className="text-[11px] text-[#E2C06A] mt-2">{notice}</p> : null}
          </div>

          {!videos.length ? (
            <div className="rounded-2xl border border-[#242424] bg-[#161616] p-6 text-center">
              <p className="text-xs text-[#606060]">No tutorials found. Try a broader topic.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((v, idx) => (
                <div
                  key={`${v.url}-${idx}`}
                  className="bg-[#161616] border border-[#242424] rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-video bg-[#080808] border-b border-[#242424]">
                    {v.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#5298E0]">
                        <Video className="h-8 w-8" />
                        <span className="text-[10px] uppercase tracking-wider text-[#606060]">
                          YouTube
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-serif text-sm font-bold text-white leading-snug">{v.title}</h4>
                      <p className="text-[11px] text-[#909090]">Channel: {v.channel}</p>
                      {v.why ? (
                        <p className="text-[11px] text-[#606060] leading-relaxed">
                          Why recommended: {v.why}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {v.suitableForLevel ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider rounded-md px-2 py-1 bg-[rgba(82,152,224,0.12)] text-[#5298E0] border border-[rgba(82,152,224,0.3)]">
                          ✓ Suitable for {meta.level}
                        </span>
                      ) : null}
                      {v.examRelevant ? (
                        <span className="text-[9px] font-bold uppercase tracking-wider rounded-md px-2 py-1 bg-[rgba(82,192,122,0.12)] text-[#52C07A] border border-[rgba(82,192,122,0.3)]">
                          ✓ {meta.exam} relevant
                        </span>
                      ) : null}
                    </div>

                    <a
                      href={v.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5298E0] to-[#2a5a9e] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 transition-opacity"
                    >
                      Open in YouTube
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !loading ? (
        <div className="rounded-2xl border border-dashed border-[#242424] bg-[#161616]/60 p-8 text-center w-full">
          <Video className="h-8 w-8 text-[#5298E0] mx-auto mb-3" />
          <p className="text-xs text-[#606060]">
            Enter a topic and click Find Top 5 Tutorials to see recommendations here.
          </p>
        </div>
      ) : null}
    </div>
  );
}
