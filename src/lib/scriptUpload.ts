import { SCRIPT_ELEMENT_CLASS, type ScriptElementKey } from "@/lib/scriptEditor";

export type ParsedScene = {
  title: string;
  heading: string;
  rawText: string;
  html: string;
};

/** 20 MB hard limit for script uploads (editor + analyzer). */
export const SCRIPT_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export const SCRIPT_UPLOAD_ACCEPT =
  ".txt,.pdf,.doc,.docx,.fountain,.fdx,.html,.htm,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const SCRIPT_UPLOAD_HINT = "TXT, PDF, Word (.doc/.docx) · max 20 MB";

const SCENE_HEADING_RE =
  /^(INT\.|EXT\.|I\/E\.|E\/I\.|INT\/EXT\.|EST\.)(.+)$/i;
const CHARACTER_RE = /^[A-Z0-9][A-Z0-9 .'\-]{1,40}(\s*\(.*\))?$/;
const PARENTHETICAL_RE = /^\(.*\)$/;
const TRANSITION_RE = /^[A-Z0-9 .]+TO:$/;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function classifyLine(line: string, prevKey: ScriptElementKey | null): ScriptElementKey {
  const trimmed = line.trim();
  if (!trimmed) return "action";
  if (SCENE_HEADING_RE.test(trimmed)) return "scene";
  if (PARENTHETICAL_RE.test(trimmed)) return "parenthetical";
  if (TRANSITION_RE.test(trimmed)) return "transition";
  if (
    CHARACTER_RE.test(trimmed) &&
    !trimmed.includes(".") &&
    trimmed === trimmed.toUpperCase() &&
    trimmed.length < 45
  ) {
    return "character";
  }
  if (prevKey === "character" || prevKey === "parenthetical") return "dialogue";
  return "action";
}

/** Convert plain screenplay text into editor HTML blocks. */
export function screenplayTextToHtml(text: string): string {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const blocks: string[] = [];
  let prev: ScriptElementKey | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, "    ");
    if (!line.trim()) {
      prev = null;
      continue;
    }
    const key = classifyLine(line, prev);
    const cls = SCRIPT_ELEMENT_CLASS[key];
    blocks.push(
      `<div class="${cls}" data-script-element="${key}">${escapeHtml(line.trim())}</div>`
    );
    prev = key;
  }

  if (!blocks.length) {
    return `<div class="${SCRIPT_ELEMENT_CLASS.action}" data-script-element="action"><br></div>`;
  }
  return blocks.join("");
}

function defaultSceneTitle(index: number, heading: string) {
  const clean = heading.replace(/\s+/g, " ").trim();
  if (clean && clean.length <= 60) return `Scene ${index}: ${clean}`;
  return `Scene ${index}`;
}

/**
 * Split a full screenplay into scenes on INT./EXT. headings.
 * If no headings found, returns one scene with the whole text.
 */
export function parseScreenplayIntoScenes(text: string, scriptName?: string): ParsedScene[] {
  const normalized = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalized) return [];

  const lines = normalized.split("\n");
  const scenes: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (SCENE_HEADING_RE.test(line.trim())) {
      if (current) scenes.push(current);
      current = { heading: line.trim(), lines: [line] };
    } else if (current) {
      current.lines.push(line);
    } else {
      current = { heading: scriptName || "Opening", lines: [line] };
    }
  }
  if (current) scenes.push(current);

  if (!scenes.length) {
    return [
      {
        title: "Scene 1",
        heading: "",
        rawText: normalized,
        html: screenplayTextToHtml(normalized),
      },
    ];
  }

  const hasRealHeadings = scenes.some((s) => SCENE_HEADING_RE.test(s.heading));
  if (!hasRealHeadings) {
    return [
      {
        title: "Scene 1",
        heading: "",
        rawText: normalized,
        html: screenplayTextToHtml(normalized),
      },
    ];
  }

  return scenes.map((s, i) => {
    const rawText = s.lines.join("\n").trim();
    return {
      title: defaultSceneTitle(i + 1, s.heading),
      heading: s.heading,
      rawText,
      html: screenplayTextToHtml(rawText),
    };
  });
}

function stripMarkupToText(raw: string) {
  const withoutScripts = raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  return withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function assertUploadAllowed(file: File) {
  if (file.size > SCRIPT_UPLOAD_MAX_BYTES) {
    throw new Error("File too large. Maximum upload size is 20 MB.");
  }

  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  const allowedExt =
    name.endsWith(".txt") ||
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".fountain") ||
    name.endsWith(".fdx") ||
    name.endsWith(".html") ||
    name.endsWith(".htm");
  const allowedMime =
    type.startsWith("text/") ||
    type === "application/pdf" ||
    type === "application/msword" ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/xml" ||
    type === "";

  if (!allowedExt && !allowedMime) {
    throw new Error("Unsupported file. Use TXT, PDF, or Word (.doc / .docx), max 20 MB.");
  }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // CDN worker avoids Next.js bundler issues with the worker file
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    const lines: string[] = [];
    let current = "";

    for (const item of content.items) {
      if (!item || typeof item !== "object" || !("str" in item)) continue;
      const str = String((item as { str?: string }).str || "");
      if (!str) continue;
      const transform = (item as { transform?: number[] }).transform;
      const y = Array.isArray(transform) ? Number(transform[5]) : null;

      if (lastY != null && y != null && Math.abs(y - lastY) > 4) {
        if (current.trim()) lines.push(current.trim());
        current = str;
      } else {
        current += (current && !current.endsWith(" ") && !str.startsWith(" ") ? " " : "") + str;
      }
      if (y != null) lastY = y;
    }
    if (current.trim()) lines.push(current.trim());
    pages.push(lines.join("\n"));
  }

  return pages.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return String(result.value || "").replace(/\n{3,}/g, "\n\n").trim();
}

export async function readScriptFileAsText(file: File): Promise<string> {
  assertUploadAllowed(file);

  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  if (name.endsWith(".pdf") || type === "application/pdf") {
    const text = await extractPdfText(file);
    if (!text) throw new Error("Could not extract text from this PDF.");
    return text;
  }

  if (name.endsWith(".docx") || type.includes("wordprocessingml")) {
    const text = await extractDocxText(file);
    if (!text) throw new Error("Could not extract text from this Word document.");
    return text;
  }

  if (name.endsWith(".doc") || type === "application/msword") {
    try {
      const text = await extractDocxText(file);
      if (text) return text;
    } catch {
      /* fall through */
    }
    throw new Error(
      "Legacy .doc format isn’t supported. Please re-save as .docx or PDF and upload again."
    );
  }

  const raw = await file.text();

  if (
    name.endsWith(".fdx") ||
    name.endsWith(".html") ||
    name.endsWith(".htm") ||
    (/<[a-z][\s\S]*>/i.test(raw) && raw.includes("</"))
  ) {
    return stripMarkupToText(raw);
  }

  return raw.trim();
}

export function wordCountFromHtml(html: string) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  return text.split(" ").filter(Boolean).length;
}

/** True when editor HTML is empty / placeholder only. */
export function isEmptyScriptHtml(html: string) {
  const text = String(html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return !text;
}

/** Append uploaded screenplay HTML below existing scene content (never wipe). */
export function appendScriptHtml(existing: string, incoming: string) {
  const next = String(incoming || "").trim();
  if (!next) return String(existing || "");
  if (isEmptyScriptHtml(existing)) return next;
  const prev = String(existing || "").trim();
  const spacer = `<div class="${SCRIPT_ELEMENT_CLASS.action}" data-script-element="action"><br></div>`;
  return `${prev}${spacer}${next}`;
}

