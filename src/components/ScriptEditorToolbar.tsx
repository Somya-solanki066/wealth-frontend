"use client";

import React, { useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Eraser,
  Undo2,
  Redo2,
  Highlighter,
} from "lucide-react";
import {
  PAGE_BACKGROUND_PRESETS,
  SCRIPT_ELEMENTS,
  TEXT_COLORS,
  type ScriptElementKey,
} from "@/lib/scriptEditor";

type ScriptEditorToolbarProps = {
  scriptElement: ScriptElementKey;
  onScriptElement: (key: ScriptElementKey) => void;
  onCommand: (command: string, value?: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  pageBackgroundColor?: string;
  onPageBackgroundChange?: (color: string) => void;
};

export default function ScriptEditorToolbar({
  scriptElement,
  onScriptElement,
  onCommand,
  canUndo = false,
  canRedo = false,
  pageBackgroundColor = "#000000",
  onPageBackgroundChange,
}: ScriptEditorToolbarProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const pageBgInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="script-editor-toolbar">
      {/* —— Undo / Redo —— */}
      <div className="script-editor-section script-editor-section-history">
        <div className="script-editor-section-head">
          <span className="script-editor-toolbar-label">Undo / Redo</span>
          <span className="script-editor-section-hint">
            Typing, paste &amp; upload changes · Ctrl+Z / Ctrl+Y
          </span>
        </div>
        <div className="script-editor-toolbar-row">
          <button
            type="button"
            className="script-editor-tool-btn script-editor-history-btn"
            title="Undo (Ctrl+Z)"
            disabled={!canUndo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("undo")}
          >
            <Undo2 className="h-4 w-4" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="script-editor-tool-btn script-editor-history-btn"
            title="Redo (Ctrl+Y)"
            disabled={!canRedo}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("redo")}
          >
            <Redo2 className="h-4 w-4" />
            <span>Redo</span>
          </button>
        </div>
      </div>

      {/* —— Screenplay elements —— */}
      <div className="script-editor-section">
        <div className="script-editor-section-head">
          <span className="script-editor-toolbar-label">Screenplay Elements</span>
          <span className="script-editor-section-hint">
            Pick the line type for the current block
          </span>
        </div>
        <div className="script-editor-toolbar-row elements">
          {SCRIPT_ELEMENTS.map((el) => (
            <button
              key={el.key}
              type="button"
              title={el.description}
              className={`script-editor-tool-btn script-editor-element-btn ${
                scriptElement === el.key ? "active" : ""
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onScriptElement(el.key)}
            >
              {el.label}
            </button>
          ))}
        </div>
      </div>

      {/* —— Text format —— */}
      <div className="script-editor-section">
        <div className="script-editor-section-head">
          <span className="script-editor-toolbar-label">Text Format</span>
          <span className="script-editor-section-hint">Bold, align, lists, undo</span>
        </div>
        <div className="script-editor-toolbar-row">
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Bold"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("bold")}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Italic"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("italic")}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("underline")}
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Strikethrough"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("strikeThrough")}
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="script-editor-tool-btn"
            title="Align left"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("justifyLeft")}
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Align center"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("justifyCenter")}
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Align right"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("justifyRight")}
          >
            <AlignRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="script-editor-tool-btn"
            title="Bullet list"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("insertUnorderedList")}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="script-editor-tool-btn"
            title="Numbered list"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("insertOrderedList")}
          >
            <ListOrdered className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="script-editor-tool-btn"
            title="Clear formatting"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("removeFormat")}
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* —— Text color —— */}
      <div className="script-editor-section">
        <div className="script-editor-section-head">
          <span className="script-editor-toolbar-label">Text Color</span>
          <span className="script-editor-section-hint">Ink & highlight for selected text</span>
        </div>
        <div className="script-editor-toolbar-row">
          <div className="script-editor-color-wrap">
            <button
              type="button"
              className="script-editor-tool-btn"
              title="Text color"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => colorInputRef.current?.click()}
            >
              <span className="text-xs font-bold">A</span>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className="script-editor-color-input"
              defaultValue="#F0EBE0"
              onChange={(e) => onCommand("foreColor", e.target.value)}
              aria-label="Pick text color"
            />
            <button
              type="button"
              className="script-editor-tool-btn"
              title="Highlight color"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => highlightInputRef.current?.click()}
            >
              <Highlighter className="h-4 w-4" />
            </button>
            <input
              ref={highlightInputRef}
              type="color"
              className="script-editor-color-input"
              defaultValue="#C9A84C"
              onChange={(e) => onCommand("hiliteColor", e.target.value)}
              aria-label="Pick highlight color"
            />
          </div>
          <div className="script-editor-color-swatches">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                className="script-editor-color-swatch"
                style={{ backgroundColor: c.value }}
                title={c.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onCommand("foreColor", c.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* —— Page background (saved with script) —— */}
      {onPageBackgroundChange && (
        <div className="script-editor-section script-editor-section-pagebg">
          <div className="script-editor-section-head">
            <span className="script-editor-toolbar-label">Page Background</span>
            <span className="script-editor-section-hint">
              Saved with this script — shows in editor, view & imports
            </span>
          </div>
          <div className="script-editor-toolbar-row">
            <button
              type="button"
              className="script-editor-tool-btn"
              title="Custom page background"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pageBgInputRef.current?.click()}
            >
              <span
                className="script-editor-pagebg-preview"
                style={{ backgroundColor: pageBackgroundColor }}
              />
            </button>
            <input
              ref={pageBgInputRef}
              type="color"
              className="script-editor-color-input"
              value={pageBackgroundColor}
              onChange={(e) => onPageBackgroundChange(e.target.value)}
              aria-label="Pick page background color"
            />
            <div className="script-editor-color-swatches">
              {PAGE_BACKGROUND_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`script-editor-color-swatch ${
                    pageBackgroundColor.toLowerCase() === c.value.toLowerCase() ? "selected" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPageBackgroundChange(c.value)}
                />
              ))}
            </div>
            <span className="script-editor-pagebg-hex">{pageBackgroundColor}</span>
          </div>
        </div>
      )}
    </div>
  );
}
