export type ScriptElementKey =
  | "scene"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export const SCRIPT_ELEMENTS: {
  key: ScriptElementKey;
  label: string;
  description: string;
}[] = [
  {
    key: "scene",
    label: "Scene Heading",
    description: "Slugline — location & time (e.g. INT. OFFICE - NIGHT).",
  },
  {
    key: "action",
    label: "Action",
    description: "Narrative description of what happens on screen.",
  },
  {
    key: "character",
    label: "Character",
    description: "Speaker name above dialogue (e.g. ARJUN).",
  },
  {
    key: "dialogue",
    label: "Dialogue",
    description: "Spoken lines under the character name.",
  },
  {
    key: "parenthetical",
    label: "Parenthetical",
    description: "Delivery note under character (e.g. whispers).",
  },
  {
    key: "transition",
    label: "Transition",
    description: "Cut / fade markers (e.g. CUT TO:, FADE OUT).",
  },
];

export const SCRIPT_ELEMENT_CLASS: Record<ScriptElementKey, string> = {
  scene: "script-el-scene",
  action: "script-el-action",
  character: "script-el-character",
  dialogue: "script-el-dialogue",
  parenthetical: "script-el-parenthetical",
  transition: "script-el-transition",
};

export const TEXT_COLORS = [
  { label: "White", value: "#F0EBE0" },
  { label: "Gold", value: "#C9A84C" },
  { label: "Red", value: "#E05252" },
  { label: "Green", value: "#52C07A" },
  { label: "Blue", value: "#5298E0" },
  { label: "Orange", value: "#F97316" },
  { label: "Purple", value: "#A855F7" },
  { label: "Yellow", value: "#FACC15" },
];

/** Page background presets for the script surface (saved on the project). */
export const PAGE_BACKGROUND_PRESETS = [
  { label: "Pure Black", value: "#000000" },
  { label: "Ink Black", value: "#080808" },
  { label: "Charcoal", value: "#161616" },
  { label: "Slate", value: "#1a1a1a" },
  { label: "Warm Dark", value: "#1a1200" },
  { label: "Navy Night", value: "#0a1020" },
  { label: "Paper Cream", value: "#F4F1EA" },
  { label: "White Page", value: "#FFFFFF" },
];

export const DEFAULT_SCRIPT_PAGE_BG = "#000000";

export function isLightPageBackground(hex: string) {
  const raw = String(hex || "").replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (full.length !== 6) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Perceived luminance
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}

function getEditorBlock(editor: HTMLElement, node: Node | null): HTMLElement | null {
  if (!node) return null;
  let current: HTMLElement | null =
    node.nodeType === Node.TEXT_NODE ? (node.parentElement as HTMLElement) : (node as HTMLElement);

  while (current && current !== editor) {
    if (current.parentElement === editor) return current;
    current = current.parentElement;
  }

  if (current === editor) return null;

  // Empty editor or cursor with no block yet
  if (!editor.innerHTML.trim() || editor.innerHTML === "<br>") {
    const block = document.createElement("div");
    block.className = SCRIPT_ELEMENT_CLASS.action;
    block.dataset.scriptElement = "action";
    block.innerHTML = "<br>";
    editor.innerHTML = "";
    editor.appendChild(block);
    return block;
  }

  return editor.firstElementChild as HTMLElement | null;
}

export function applyScriptElement(
  editor: HTMLElement,
  elementKey: ScriptElementKey
): void {
  editor.focus();
  const selection = window.getSelection();
  const className = SCRIPT_ELEMENT_CLASS[elementKey];

  if (!selection || selection.rangeCount === 0) {
    const block = document.createElement("div");
    block.className = className;
    block.dataset.scriptElement = elementKey;
    block.innerHTML = "<br>";
    editor.appendChild(block);
    return;
  }

  let block = getEditorBlock(editor, selection.anchorNode);

  if (!block) {
    document.execCommand("formatBlock", false, "div");
    block = getEditorBlock(editor, selection.anchorNode);
  }

  if (block) {
    block.className = className;
    block.dataset.scriptElement = elementKey;
    // Remove conflicting inline styles from element type switch
    block.style.textAlign = "";
  }
}

export function handleScriptEnter(
  editor: HTMLElement,
  elementKey: ScriptElementKey
): void {
  document.execCommand("insertParagraph");
  window.setTimeout(() => {
    applyScriptElement(editor, elementKey);
  }, 0);
}

export function execEditorCommand(command: string, value?: string): void {
  if (command === "foreColor" && value) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, value);
    return;
  }

  if (command === "hiliteColor" && value) {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("hiliteColor", false, value);
    return;
  }

  if (command === "formatBlock" && value) {
    document.execCommand("formatBlock", false, value);
    return;
  }

  document.execCommand(command, false, value ?? undefined);
}
