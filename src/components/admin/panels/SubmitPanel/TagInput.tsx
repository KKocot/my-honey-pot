// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, For, Show } from "solid-js";

const MAX_TAGS = 8;
const TAG_REGEX = /^[a-z][a-z0-9-]*$/;

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

/**
 * Tag chip input for Hive post tags.
 * - Max 8 tags
 * - First tag = category (visual indicator)
 * - Add on Enter or comma
 * - Remove on click or backspace when input is empty
 * - Lowercase, alphanumeric + hyphens only
 * - No duplicates
 */
export function TagInput(props: TagInputProps) {
  const [input_value, set_input_value] = createSignal("");
  const [error, set_error] = createSignal("");

  function normalize_tag(raw: string): string {
    return raw.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  }

  function add_tag(raw: string) {
    const tag = normalize_tag(raw);
    set_error("");

    if (!tag) return;

    if (!TAG_REGEX.test(tag)) {
      set_error("Tags must start with a letter and contain only a-z, 0-9, hyphens");
      return;
    }

    if (tag.length > 24) {
      set_error("Tag must be 24 characters or less");
      return;
    }

    if (props.tags.includes(tag)) {
      set_error(`Tag "${tag}" already added`);
      return;
    }

    if (props.tags.length >= MAX_TAGS) {
      set_error(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    props.onChange([...props.tags, tag]);
    set_input_value("");
  }

  function remove_tag(index: number) {
    const updated = props.tags.filter((_, i) => i !== index);
    props.onChange(updated);
    set_error("");
  }

  function handle_keydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = input_value().trim();
      if (value) {
        add_tag(value);
      }
    }

    if (e.key === "Backspace" && !input_value() && props.tags.length > 0) {
      remove_tag(props.tags.length - 1);
    }
  }

  function handle_input(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    let value = target.value;

    // If user types a comma, add the tag
    if (value.includes(",")) {
      const parts = value.split(",");
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          add_tag(trimmed);
        }
      }
      set_input_value("");
      return;
    }

    set_input_value(value);
  }

  function handle_paste(e: ClipboardEvent) {
    const pasted = e.clipboardData?.getData("text") ?? "";
    if (pasted.includes(",") || pasted.includes(" ")) {
      e.preventDefault();
      const parts = pasted.split(/[,\s]+/);
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
          add_tag(trimmed);
        }
      }
    }
  }

  return (
    <div>
      <label class="block text-sm font-medium text-text mb-1.5">
        Tags
        <span class="text-text-muted font-normal ml-1">
          ({props.tags.length}/{MAX_TAGS})
        </span>
      </label>

      <div
        class="flex flex-wrap items-center gap-1.5 min-h-[2.75rem] px-3 py-2
          bg-bg-secondary border border-border rounded-lg
          focus-within:ring-2 focus-within:ring-primary focus-within:border-primary
          transition-all"
      >
        <For each={props.tags}>
          {(tag, index) => (
            <span
              class={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium
                ${
                  index() === 0
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-bg-card text-text-muted border border-border"
                }`}
            >
              <Show when={index() === 0}>
                <span
                  class="text-[0.625rem] uppercase tracking-wider font-bold opacity-70"
                  title="Category tag"
                >
                  cat
                </span>
              </Show>
              {tag}
              <button
                type="button"
                onClick={() => remove_tag(index())}
                class="ml-0.5 hover:text-error transition-colors rounded-full"
                aria-label={`Remove tag ${tag}`}
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          )}
        </For>

        <Show when={props.tags.length < MAX_TAGS}>
          <input
            type="text"
            value={input_value()}
            onInput={handle_input}
            onKeyDown={handle_keydown}
            onPaste={handle_paste}
            placeholder={
              props.tags.length === 0
                ? "Add tags (first = category)..."
                : "Add more tags..."
            }
            class="flex-1 min-w-[8rem] bg-transparent border-none outline-none text-sm text-text placeholder:text-text-muted"
          />
        </Show>
      </div>

      <Show when={error()}>
        <p class="mt-1 text-xs text-error">{error()}</p>
      </Show>

      <p class="mt-1 text-xs text-text-muted">
        Press Enter or comma to add. First tag is the category.
      </p>
    </div>
  );
}
