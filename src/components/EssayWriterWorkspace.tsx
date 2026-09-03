"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, Lock, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isFreePlan } from "@/lib/plans";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import PaywallModal from "@/components/ui/PaywallModal";

type EducationBand = "JSS" | "SSS" | "University";

const DOCUMENT_TYPES = [
  "Essay",
  "Research Paper",
  "Dissertation Chapter",
  "Lab Report",
  "Case Study",
  "Literature Review",
  "Project Report",
];

const EDUCATION_LEVELS: { value: EducationBand; label: string }[] = [
  { value: "JSS", label: "Junior Secondary (JSS)" },
  { value: "SSS", label: "Senior Secondary (SSS)" },
  { value: "University", label: "University" },
];

const CLASS_OPTIONS: Record<EducationBand, string[]> = {
  JSS: ["JSS 1", "JSS 2", "JSS 3"],
  SSS: ["SS 1", "SS 2", "SS 3"],
  University: ["100 Level", "200 Level", "300 Level", "400 Level", "500 Level+"],
};

const PURPOSES = [
  "WAEC",
  "NECO",
  "JAMB",
  "School Assignment",
  "University Assignment",
  "General Learning",
];

const SUBJECTS = [
  "English Language",
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "Economics",
  "Government",
  "Literature-in-English",
  "History",
  "Geography",
  "CRS",
  "IRS",
  "Accounting",
  "Commerce",
  "Computer Science",
  "Agricultural Science",
  "Other",
];

const WORD_COUNTS = [
  { label: "500 words", value: "500" },
  { label: "1,000 words", value: "1000" },
  { label: "1,500 words", value: "1500" },
  { label: "2,000 words", value: "2000" },
  { label: "3,000 words", value: "3000" },
];

const WRITING_STYLES = ["Simple & Easy", "Academic", "Formal", "Detailed"];

const CITATION_STYLES = ["APA", "MLA", "Harvard", "Chicago", "Vancouver"];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">{children}</p>
  );
}

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

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function defaultStyleForLevel(band: EducationBand) {
  return band === "University" ? "Academic" : "Simple & Easy";
}

export default function EssayWriterWorkspace() {
  const { profile } = useAuth();
  const premiumLocked =
    isFreePlan({ id: profile?.subscriptionPlan || "free" }) || !profile?.subscriptionPlan;

  const [showPaywall, setShowPaywall] = useState(false);
  const [docType, setDocType] = useState("Essay");
  const [educationBand, setEducationBand] = useState<EducationBand>("SSS");
  const [classLevel, setClassLevel] = useState("SS 3");
  const [subject, setSubject] = useState("English Language");
  const [customSubject, setCustomSubject] = useState("");
  const [purpose, setPurpose] = useState("WAEC");
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState("1000");
  const [writingStyle, setWritingStyle] = useState("Simple & Easy");
  const [includeReferences, setIncludeReferences] = useState(false);
  const [citationStyle, setCitationStyle] = useState("APA");
  const [userSources, setUserSources] = useState("");
  const [instructions, setInstructions] = useState("");

  const [title, setTitle] = useState("");
  const [document, setDocument] = useState("");
  const [actualWords, setActualWords] = useState(0);
  const [referenceNote, setReferenceNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const resolvedSubject = subject === "Other" ? customSubject.trim() || "Other" : subject;
  const targetWords = Number(wordCount) || 1000;

  const classOptions = useMemo(() => CLASS_OPTIONS[educationBand], [educationBand]);

  const generate = async () => {
    if (premiumLocked) {
      setShowPaywall(true);
      return;
    }
    if (!topic.trim()) {
      setError("Enter a topic or assignment question.");
      return;
    }
    if (subject === "Other" && !customSubject.trim()) {
      setError("Enter your subject name.");
      return;
    }
    if (includeReferences && !userSources.trim()) {
      setError(
        "To include references, paste your source list (or switch to No references). We do not invent fake citations."
      );
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const res = await api.post("/student/essay", {
        documentType: docType,
        educationBand,
        educationLevel: classLevel,
        subject: resolvedSubject,
        purpose,
        topic: topic.trim(),
        wordCount: targetWords,
        writingStyle,
        includeReferences,
        citationStyle: includeReferences ? citationStyle : undefined,
        userSources: includeReferences ? userSources.trim() : undefined,
        instructions: instructions.trim() || undefined,
      });
      setTitle(res.data.title || "");
      setDocument(res.data.document || "");
      setActualWords(res.data.wordCount || 0);
      setReferenceNote(res.data.referenceNote || "");
    } catch (err: any) {
      if (err.response?.data?.premiumRequired || err.response?.status === 403) {
        setShowPaywall(true);
      }
      setError(err.response?.data?.error || "Failed to generate document.");
    } finally {
      setLoading(false);
    }
  };

  const copyDoc = async () => {
    if (!document) return;
    try {
      const text = title ? `${title}\n\n${document}` : document;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
              Essay & Project Writer
            </p>
            <p className="text-[11px] text-[#909090] mt-1">
              Premium AI writing matched to Nigerian exam and school levels.
            </p>
          </div>

          {premiumLocked ? (
            <div className="rounded-xl border border-[rgba(82,152,224,0.35)] bg-[rgba(82,152,224,0.08)] p-4 flex gap-3 items-start">
              <Lock className="h-4 w-4 text-[#5298E0] shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs text-[#F0EBE0]">
                  Premium required. Upgrade before AI generation.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowPaywall(true)}
                  className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
                >
                  Upgrade to unlock
                </Button>
              </div>
            </div>
          ) : null}

          <Select
            label="Document Type"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            options={DOCUMENT_TYPES.map((t) => ({ label: t, value: t }))}
          />

          <div className="space-y-2">
            <SectionLabel>Education Level</SectionLabel>
            <Select
              label="School / University"
              value={educationBand}
              onChange={(e) => {
                const band = e.target.value as EducationBand;
                setEducationBand(band);
                setClassLevel(CLASS_OPTIONS[band][0]);
                setWritingStyle(defaultStyleForLevel(band));
              }}
              options={EDUCATION_LEVELS.map((l) => ({ label: l.label, value: l.value }))}
            />
            <Select
              label={educationBand === "University" ? "Academic Level" : "Class"}
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              options={classOptions.map((c) => ({ label: c, value: c }))}
            />
          </div>

          <div className="space-y-2">
            <Select
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={SUBJECTS.map((s) => ({ label: s, value: s }))}
            />
            {subject === "Other" ? (
              <Input
                label="Custom Subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Nursing, Law, Accounting…"
              />
            ) : null}
          </div>

          <Select
            label="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            options={PURPOSES.map((p) => ({ label: p, value: p }))}
          />

          <Textarea
            label="Topic / Question *"
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Assignment question or topic..."
          />

          <Select
            label="Word Count"
            value={wordCount}
            onChange={(e) => setWordCount(e.target.value)}
            options={WORD_COUNTS}
          />

          <div className="pt-2 border-t border-[#242424] space-y-3">
            <SectionLabel>Optional</SectionLabel>
            <Select
              label="Writing Style"
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              options={WRITING_STYLES.map((s) => ({ label: s, value: s }))}
            />

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#909090]">
                References
              </p>
              <div className="flex flex-wrap gap-2">
                <RadioPill
                  checked={!includeReferences}
                  label="No references"
                  onChange={() => setIncludeReferences(false)}
                />
                <RadioPill
                  checked={includeReferences}
                  label="Include references"
                  onChange={() => setIncludeReferences(true)}
                />
              </div>
              {includeReferences ? (
                <div className="space-y-3">
                  <Select
                    label="Citation Style"
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value)}
                    options={CITATION_STYLES.map((s) => ({ label: s, value: s }))}
                  />
                  <Textarea
                    label="Your sources (required if references on)"
                    rows={3}
                    value={userSources}
                    onChange={(e) => setUserSources(e.target.value)}
                    placeholder="Paste real sources only — author, title, year, URL/DOI (one per line). We will not invent fake citations."
                  />
                  <p className="text-[10px] text-[#606060]">
                    References must come from your provided sources and should be verified.
                  </p>
                </div>
              ) : null}
            </div>

            <Textarea
              label="Additional Instructions"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Use simple English, include examples, and structure with introduction, body and conclusion."
            />
          </div>

          {error ? <p className="text-xs text-red-400">{error}</p> : null}

          <Button
            type="button"
            className="w-full !bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
            isLoading={loading}
            onClick={generate}
          >
            Generate Document
          </Button>
        </div>

        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 space-y-4 min-h-[420px] flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
              Complete document
            </h4>
            {document ? (
              <span className="text-[10px] text-[#909090]">
                {actualWords.toLocaleString()} / {targetWords.toLocaleString()} words
              </span>
            ) : null}
          </div>

          {document ? (
            <>
              <div className="flex-1 rounded-xl border border-[#242424] bg-[#080808] p-4 max-h-[520px] overflow-y-auto custom-scrollbar space-y-3">
                {title ? (
                  <h3 className="font-serif text-base font-bold text-white leading-snug">{title}</h3>
                ) : null}
                <pre className="text-xs sm:text-sm text-[#F0EBE0] whitespace-pre-wrap font-sans leading-relaxed">
                  {document}
                </pre>
              </div>
              {referenceNote ? (
                <p className="text-[11px] text-[#E2C06A]">{referenceNote}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyDoc}
                  className="!border-[#5298E0]/50 !text-[#5298E0]"
                  leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadText(
                      `${docType.replace(/\s+/g, "-").toLowerCase()}.txt`,
                      title ? `${title}\n\n${document}` : document
                    )
                  }
                  className="!border-[#5298E0]/50 !text-[#5298E0]"
                  leftIcon={<Download className="h-3.5 w-3.5" />}
                >
                  Download
                </Button>
                <Button
                  type="button"
                  size="sm"
                  isLoading={loading}
                  onClick={generate}
                  className="!bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
                  leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                >
                  Regenerate
                </Button>
                {copied ? (
                  <span className="text-[11px] font-semibold text-[#52C07A]">✓ Copied to clipboard</span>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-[#606060] text-center px-4">
                Generated essay/project text will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureName="Essay & Project Writer"
      />
    </>
  );
}
