// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { EditorView, keymap, placeholder as cm_placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { renderPostBody } from "../../../../lib/renderer";

// --- Types ---

type EditorMode = "write" | "preview";

interface MarkdownEditorProps {
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
}

// --- Toolbar Actions ---

interface ToolbarAction {
  label: string;
  icon: string;
  title: string;
  action: (view: EditorView) => void;
}

function wrap_selection(
  view: EditorView,
  before: string,
  after: string,
  placeholder_text?: string,
) {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const text = selected || placeholder_text || "";
  const insert = `${before}${text}${after}`;

  view.dispatch({
    changes: { from, to, insert },
    selection: {
      anchor: from + before.length,
      head: from + before.length + text.length,
    },
  });
  view.focus();
}

function prefix_line(
  view: EditorView,
  prefix: string,
  placeholder_text?: string,
) {
  const { from, to } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);

  if (from === to && !view.state.sliceDoc(from, to)) {
    // Empty selection: insert prefix + placeholder on current line
    const text = placeholder_text || "";
    const insert = `${prefix}${text}`;
    view.dispatch({
      changes: { from: line.from, to: line.from, insert },
      selection: {
        anchor: line.from + prefix.length,
        head: line.from + prefix.length + text.length,
      },
    });
  } else {
    // Prefix each selected line
    const end_line = view.state.doc.lineAt(to);
    let offset = 0;
    const changes: Array<{ from: number; to: number; insert: string }> = [];

    for (let i = line.number; i <= end_line.number; i++) {
      const current_line = view.state.doc.line(i);
      changes.push({
        from: current_line.from + offset,
        to: current_line.from + offset,
        insert: prefix,
      });
      offset += prefix.length;
    }

    view.dispatch({ changes });
  }
  view.focus();
}

function insert_at_cursor(view: EditorView, text: string) {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  view.focus();
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: "B",
    icon: "bold",
    title: "Bold",
    action: (v) => wrap_selection(v, "**", "**", "bold text"),
  },
  {
    label: "I",
    icon: "italic",
    title: "Italic",
    action: (v) => wrap_selection(v, "*", "*", "italic text"),
  },
  {
    label: "H2",
    icon: "heading",
    title: "Heading",
    action: (v) => prefix_line(v, "## ", "Heading"),
  },
  {
    label: "Link",
    icon: "link",
    title: "Link",
    action: (v) => {
      const { from, to } = v.state.selection.main;
      const selected = v.state.sliceDoc(from, to);
      const text = selected || "link text";
      const insert = `[${text}](url)`;
      v.dispatch({
        changes: { from, to, insert },
        selection: {
          anchor: from + text.length + 3,
          head: from + text.length + 6,
        },
      });
      v.focus();
    },
  },
  {
    label: "Img",
    icon: "image",
    title: "Image URL",
    action: (v) => {
      const insert = "![alt text](image-url)";
      const { from, to } = v.state.selection.main;
      v.dispatch({
        changes: { from, to, insert },
        selection: { anchor: from + 12, head: from + 21 },
      });
      v.focus();
    },
  },
  {
    label: ">",
    icon: "quote",
    title: "Quote",
    action: (v) => prefix_line(v, "> ", "quote"),
  },
  {
    label: "`",
    icon: "code",
    title: "Inline code",
    action: (v) => wrap_selection(v, "`", "`", "code"),
  },
  {
    label: "```",
    icon: "code-block",
    title: "Code block",
    action: (v) => {
      const { from, to } = v.state.selection.main;
      const selected = v.state.sliceDoc(from, to);
      const text = selected || "code here";
      const insert = `\n\`\`\`\n${text}\n\`\`\`\n`;
      v.dispatch({
        changes: { from, to, insert },
        selection: {
          anchor: from + 5,
          head: from + 5 + text.length,
        },
      });
      v.focus();
    },
  },
  {
    label: "UL",
    icon: "list-bullet",
    title: "Bullet list",
    action: (v) => prefix_line(v, "- ", "list item"),
  },
  {
    label: "OL",
    icon: "list-number",
    title: "Numbered list",
    action: (v) => prefix_line(v, "1. ", "list item"),
  },
  {
    label: "---",
    icon: "hr",
    title: "Horizontal rule",
    action: (v) => insert_at_cursor(v, "\n---\n"),
  },
];

// --- Component ---

export function MarkdownEditor(props: MarkdownEditorProps) {
  const [mode, set_mode] = createSignal<EditorMode>("write");
  const [preview_html, set_preview_html] = createSignal("");
  let editor_container: HTMLDivElement | undefined;
  let editor_view: EditorView | undefined;

  // Build CodeMirror extensions
  function create_extensions() {
    return [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      oneDark,
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      cm_placeholder(props.placeholder || "Write your post in markdown..."),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const value = update.state.doc.toString();
          props.onInput(value);
        }
      }),
      // Custom theme overrides for integration with our design tokens
      EditorView.theme({
        "&": {
          fontSize: "0.875rem",
          minHeight: "20rem",
          maxHeight: "60vh",
          overflow: "auto",
        },
        ".cm-content": {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          padding: "0.75rem",
        },
        ".cm-gutters": {
          display: "none",
        },
        "&.cm-focused": {
          outline: "none",
        },
        ".cm-scroller": {
          overflow: "auto",
        },
      }),
    ];
  }

  onMount(() => {
    if (!editor_container) return;

    const state = EditorState.create({
      doc: props.value,
      extensions: create_extensions(),
    });

    editor_view = new EditorView({
      state,
      parent: editor_container,
    });
  });

  onCleanup(() => {
    editor_view?.destroy();
  });

  // Sync external value changes into the editor
  // (e.g. when loading a draft from localStorage)
  function sync_value_if_needed() {
    if (!editor_view) return;
    const current = editor_view.state.doc.toString();
    if (current !== props.value) {
      editor_view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: props.value,
        },
      });
    }
  }

  function switch_to_write() {
    set_mode("write");
    // Sync value back from props in case it was modified externally
    requestAnimationFrame(() => sync_value_if_needed());
  }

  function switch_to_preview() {
    const html = renderPostBody(props.value);
    set_preview_html(html);
    set_mode("preview");
  }

  function tab_class(target: EditorMode): string {
    const is_active = mode() === target;
    return `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      is_active
        ? "bg-bg-card text-text border-b-2 border-primary"
        : "text-text-muted hover:text-text hover:bg-bg-secondary"
    }`;
  }

  return (
    <div>
      <label class="block text-sm font-medium text-text mb-1.5">Body</label>

      {/* Tabs */}
      <div class="flex items-center gap-1 border-b border-border">
        <button
          type="button"
          onClick={switch_to_write}
          class={tab_class("write")}
        >
          Write
        </button>
        <button
          type="button"
          onClick={switch_to_preview}
          class={tab_class("preview")}
        >
          Preview
        </button>
      </div>

      {/* Toolbar (write mode only) */}
      <Show when={mode() === "write"}>
        <div
          class="flex flex-wrap items-center gap-0.5 px-2 py-1.5
            bg-bg-secondary border-x border-border"
        >
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              type="button"
              title={action.title}
              onClick={() => {
                if (editor_view) action.action(editor_view);
              }}
              class="px-2 py-1 text-xs font-mono text-text-muted hover:text-text
                hover:bg-bg-card rounded transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </Show>

      {/* Editor / Preview */}
      <div
        class="border border-border rounded-b-lg overflow-hidden"
        classList={{ "border-t-0": mode() === "write" }}
      >
        <div
          ref={editor_container}
          class="markdown-editor"
          style={{ display: mode() === "write" ? undefined : "none" }}
        />

        <Show when={mode() === "preview"}>
          <div
            class="min-h-[20rem] max-h-[60vh] overflow-auto p-6 bg-bg-card prose prose-invert max-w-none"
            innerHTML={preview_html()}
          />
        </Show>
      </div>

      <p class="mt-1 text-xs text-text-muted">
        Markdown supported. Minimum 50 characters.
      </p>
    </div>
  );
}
