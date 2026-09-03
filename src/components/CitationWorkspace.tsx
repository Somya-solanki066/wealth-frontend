"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import api from "@/services/api";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export type CitationSourceType =
  | "website"
  | "book"
  | "journal"
  | "youtube"
  | "newspaper"
  | "thesis";

type FieldMap = Record<string, string>;

const STYLES = ["APA", "MLA", "Harvard", "Chicago", "Vancouver"];

const SOURCE_TYPES: { value: CitationSourceType; label: string }[] = [
  { value: "website", label: "Website" },
  { value: "book", label: "Book" },
  { value: "journal", label: "Journal Article" },
  { value: "youtube", label: "YouTube Video" },
  { value: "newspaper", label: "Newspaper" },
  { value: "thesis", label: "Thesis" },
];

const EMPTY_FIELDS: FieldMap = {
  url: "",
  title: "",
  author: "",
  year: "",
  publisher: "",
  edition: "",
  isbn: "",
  journalName: "",
  volume: "",
  issue: "",
  pages: "",
  doi: "",
  channel: "",
  publishDate: "",
  newspaperName: "",
  university: "",
  thesisType: "Master's",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">{children}</p>
  );
}

function validateCitation(sourceType: CitationSourceType, fields: FieldMap): string | null {
  const t = (k: string) => fields[k]?.trim() || "";

  switch (sourceType) {
    case "website":
      if (!t("url")) return "Please enter the website URL.";
      return null;
    case "book":
      if (!t("title") || !t("author")) return "Please enter the book title and author.";
      return null;
    case "journal":
      if (!t("title") || !t("author") || !t("journalName")) {
        return "Please enter the author, article title, and journal name.";
      }
      return null;
    case "youtube":
      if (!t("url")) return "Please enter the YouTube video URL.";
      return null;
    case "newspaper":
      if (!t("title") || !t("newspaperName") || !t("publishDate")) {
        return "Please enter the article title, newspaper name, and publication date.";
      }
      return null;
    case "thesis":
      if (!t("title") || !t("author") || !t("university") || !t("year")) {
        return "Please enter the thesis title, author, university, and year.";
      }
      return null;
    default:
      return "Select a valid source type.";
  }
}

function buildDetailsPayload(sourceType: CitationSourceType, fields: FieldMap) {
  const t = (k: string) => fields[k]?.trim() || "";
  switch (sourceType) {
    case "website":
      return { url: t("url") };
    case "book":
      return {
        title: t("title"),
        author: t("author"),
        year: t("year"),
        publisher: t("publisher"),
        edition: t("edition"),
        isbn: t("isbn"),
      };
    case "journal":
      return {
        title: t("title"),
        author: t("author"),
        journalName: t("journalName"),
        year: t("year"),
        volume: t("volume"),
        issue: t("issue"),
        pages: t("pages"),
        doi: t("doi"),
      };
    case "youtube":
      return {
        url: t("url"),
        title: t("title"),
        channel: t("channel"),
        publishDate: t("publishDate"),
      };
    case "newspaper":
      return {
        title: t("title"),
        author: t("author"),
        newspaperName: t("newspaperName"),
        publishDate: t("publishDate"),
        url: t("url"),
      };
    case "thesis":
      return {
        title: t("title"),
        author: t("author"),
        university: t("university"),
        year: t("year"),
        thesisType: t("thesisType"),
        url: t("url") || t("doi"),
        doi: t("doi"),
      };
    default:
      return {};
  }
}

export default function CitationWorkspace() {
  const [style, setStyle] = useState("APA");
  const [sourceType, setSourceType] = useState<CitationSourceType>("website");
  const [fields, setFields] = useState<FieldMap>({ ...EMPTY_FIELDS });
  const [citation, setCitation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const setField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setCopied(false);
  };

  const sourceLabel = useMemo(
    () => SOURCE_TYPES.find((s) => s.value === sourceType)?.label || sourceType,
    [sourceType]
  );

  const generate = async () => {
    const validationError = validateCitation(sourceType, fields);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const details = buildDetailsPayload(sourceType, fields);
      const res = await api.post("/student/citation", {
        style,
        sourceType,
        details,
      });
      setCitation(res.data.citation || "");
      setNotes(res.data.notes || "");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to generate citation.");
    } finally {
      setLoading(false);
    }
  };

  const copyCitation = async () => {
    if (!citation) return;
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 space-y-4">
        <Select
          label="Citation Style"
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          options={STYLES.map((s) => ({ label: s, value: s }))}
        />

        <Select
          label="Source Type"
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value as CitationSourceType);
            setFields({ ...EMPTY_FIELDS });
            setCitation("");
            setNotes("");
            setError("");
            setCopied(false);
          }}
          options={SOURCE_TYPES.map((s) => ({ label: s.label, value: s.value }))}
        />

        {sourceType === "website" && (
          <div className="space-y-3">
            <SectionLabel>Website</SectionLabel>
            <Input
              label="Website URL *"
              value={fields.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://example.com/article"
            />
          </div>
        )}

        {sourceType === "book" && (
          <div className="space-y-3">
            <SectionLabel>Book details</SectionLabel>
            <Input
              label="Book Title *"
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Book title"
            />
            <Input
              label="Author *"
              value={fields.author}
              onChange={(e) => setField("author", e.target.value)}
              placeholder="Author name"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Publication Year"
                value={fields.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="e.g. 2024"
              />
              <Input
                label="Edition"
                value={fields.edition}
                onChange={(e) => setField("edition", e.target.value)}
                placeholder="e.g. 2nd"
              />
            </div>
            <Input
              label="Publisher"
              value={fields.publisher}
              onChange={(e) => setField("publisher", e.target.value)}
              placeholder="Publisher"
            />
            <Input
              label="ISBN (optional)"
              value={fields.isbn}
              onChange={(e) => setField("isbn", e.target.value)}
              placeholder="ISBN"
            />
          </div>
        )}

        {sourceType === "journal" && (
          <div className="space-y-3">
            <SectionLabel>Journal article</SectionLabel>
            <Input
              label="Article Title *"
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Article title"
            />
            <Input
              label="Author(s) *"
              value={fields.author}
              onChange={(e) => setField("author", e.target.value)}
              placeholder="Author name(s)"
            />
            <Input
              label="Journal Name *"
              value={fields.journalName}
              onChange={(e) => setField("journalName", e.target.value)}
              placeholder="Journal name"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Year"
                value={fields.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="2024"
              />
              <Input
                label="Volume"
                value={fields.volume}
                onChange={(e) => setField("volume", e.target.value)}
                placeholder="12"
              />
              <Input
                label="Issue"
                value={fields.issue}
                onChange={(e) => setField("issue", e.target.value)}
                placeholder="3"
              />
              <Input
                label="Pages"
                value={fields.pages}
                onChange={(e) => setField("pages", e.target.value)}
                placeholder="45–52"
              />
            </div>
            <Input
              label="DOI"
              value={fields.doi}
              onChange={(e) => setField("doi", e.target.value)}
              placeholder="https://doi.org/..."
            />
          </div>
        )}

        {sourceType === "youtube" && (
          <div className="space-y-3">
            <SectionLabel>YouTube video</SectionLabel>
            <Input
              label="Video URL *"
              value={fields.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <Input
              label="Video Title"
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Optional if known"
            />
            <Input
              label="Channel / Author"
              value={fields.channel}
              onChange={(e) => setField("channel", e.target.value)}
              placeholder="Channel name"
            />
            <DatePicker
              label="Publication Date"
              value={fields.publishDate}
              onChange={(v) => setField("publishDate", v)}
              accent="blue"
            />
          </div>
        )}

        {sourceType === "newspaper" && (
          <div className="space-y-3">
            <SectionLabel>Newspaper</SectionLabel>
            <Input
              label="Article Title *"
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Article title"
            />
            <Input
              label="Author"
              value={fields.author}
              onChange={(e) => setField("author", e.target.value)}
              placeholder="Author name"
            />
            <Input
              label="Newspaper Name *"
              value={fields.newspaperName}
              onChange={(e) => setField("newspaperName", e.target.value)}
              placeholder="e.g. The Guardian"
            />
            <DatePicker
              label="Publication Date *"
              value={fields.publishDate}
              onChange={(v) => setField("publishDate", v)}
              accent="blue"
            />
            <Input
              label="URL"
              value={fields.url}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        {sourceType === "thesis" && (
          <div className="space-y-3">
            <SectionLabel>Thesis</SectionLabel>
            <Input
              label="Thesis Title *"
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Thesis title"
            />
            <Input
              label="Author *"
              value={fields.author}
              onChange={(e) => setField("author", e.target.value)}
              placeholder="Author name"
            />
            <Input
              label="University *"
              value={fields.university}
              onChange={(e) => setField("university", e.target.value)}
              placeholder="University name"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Year *"
                value={fields.year}
                onChange={(e) => setField("year", e.target.value)}
                placeholder="e.g. 2023"
              />
              <Select
                label="Thesis Type"
                value={fields.thesisType}
                onChange={(e) => setField("thesisType", e.target.value)}
                options={[
                  { label: "Master's", value: "Master's" },
                  { label: "Doctoral", value: "Doctoral" },
                  { label: "Undergraduate", value: "Undergraduate" },
                ]}
              />
            </div>
            <Input
              label="URL / DOI"
              value={fields.doi || fields.url}
              onChange={(e) => {
                setField("doi", e.target.value);
                setField("url", e.target.value);
              }}
              placeholder="Repository link or DOI"
            />
          </div>
        )}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <Button
          type="button"
          className="w-full !bg-gradient-to-r !from-[#5298E0] !to-[#2a5a9e] !text-white"
          isLoading={loading}
          onClick={generate}
        >
          Generate Citation
        </Button>
      </div>

      <div className="bg-[#161616] border border-[#242424] rounded-2xl p-5 space-y-4 min-h-[280px]">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5298E0]">
            Formatted citation
          </h4>
          {citation ? (
            <span className="text-[10px] text-[#606060]">
              {style} · {sourceLabel}
            </span>
          ) : null}
        </div>

        {citation ? (
          <>
            <div className="rounded-xl border border-[#242424] bg-[#080808] p-4">
              <p className="text-sm text-[#F0EBE0] leading-relaxed whitespace-pre-wrap">{citation}</p>
            </div>
            {notes ? <p className="text-[11px] text-[#909090]">{notes}</p> : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyCitation}
                className="!border-[#5298E0]/50 !text-[#5298E0]"
                leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
              {copied ? (
                <span className="text-[11px] font-semibold text-[#52C07A]">✓ Copied to clipboard</span>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-xs text-[#606060]">Citation output will appear here.</p>
        )}
      </div>
    </div>
  );
}
