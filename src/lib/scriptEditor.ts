export type ScriptElementKey =
  | "scene"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export const SCRIPT_ELEMENTS: { key: ScriptElementKey; label: string }[] = [
  { key: "scene", label: "Scene Heading" },
  { key: "action", label: "Action" },
  { key: "character", label: "Character" },
  { key: "dialogue", label: "Dialogue" },
  { key: "parenthetical", label: "Parenthetical" },
  { key: "transition", label: "Transition" },
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
