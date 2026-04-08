// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import {
  createSignal,
  Show,
  onCleanup,
  onMount,
  type Component,
} from "solid-js";
import { sign_vote } from "../../lib/signer-relay";
import {
  get_stored_username,
  set_stored_username,
  is_valid_hive_username,
} from "../../lib/hive-auth";

// ============================================
// Types
// ============================================

interface VoteButtonProps {
  author: string;
  permlink: string;
  initial_votes_count: number;
  initial_payout?: number;
  show_payout?: boolean;
  size?: "sm" | "md";
}

type VoteState = "idle" | "prompt" | "slider" | "sending" | "success" | "error";

// ============================================
// Constants
// ============================================

const ERROR_DISPLAY_MS = 5000;
const DEFAULT_WEIGHT = 100;

// ============================================
// VoteButton
// ============================================

export const VoteButton: Component<VoteButtonProps> = (props) => {
  const size = () => props.size ?? "md";

  const [state, set_state] = createSignal<VoteState>("idle");
  const [votes_count, set_votes_count] = createSignal(props.initial_votes_count);
  const [weight, set_weight] = createSignal(DEFAULT_WEIGHT);
  const [username, set_username] = createSignal(get_stored_username());
  const [error_message, set_error_message] = createSignal("");

  let container_ref: HTMLDivElement | undefined;
  let error_timeout: ReturnType<typeof setTimeout> | undefined;

  // --- Click outside handler ---

  function handle_click_outside(event: MouseEvent) {
    const current_state = state();
    if (current_state !== "prompt" && current_state !== "slider") return;
    if (container_ref && !container_ref.contains(event.target as Node)) {
      set_state("idle");
    }
  }

  function handle_keydown(e: KeyboardEvent) {
    if (e.key === "Escape" && (state() === "prompt" || state() === "slider")) {
      set_state("idle");
    }
  }

  onMount(() => {
    document.addEventListener("click", handle_click_outside, true);
    document.addEventListener("keydown", handle_keydown);
  });

  onCleanup(() => {
    if (typeof document !== "undefined") {
      document.removeEventListener("click", handle_click_outside, true);
      document.removeEventListener("keydown", handle_keydown);
    }
    if (error_timeout) clearTimeout(error_timeout);
  });

  // --- Actions ---

  /** Handle upvote button click */
  function handle_upvote_click() {
    if (state() === "sending" || state() === "success") return;
    set_state("prompt");
  }

  /** Handle username submission from prompt */
  function handle_username_submit() {
    const trimmed = username().trim().toLowerCase().replace(/^@/, "");
    if (!trimmed) return;

    set_username(trimmed);
    set_stored_username(trimmed);
    set_state("slider");
  }

  /** Handle vote submission */
  async function handle_vote_submit() {
    if (state() === "sending") return;

    const voter = username().trim().toLowerCase();
    if (!voter) return;

    if (!is_valid_hive_username(voter)) {
      set_error_message("Invalid Hive username format");
      set_state("error");
      error_timeout = setTimeout(() => {
        if (state() === "error") {
          set_state("idle");
          set_error_message("");
        }
      }, ERROR_DISPLAY_MS);
      return;
    }

    const blockchain_weight = weight() * 100; // 100% = 10000
    const previous_count = votes_count();

    // Optimistic update
    set_votes_count(previous_count + 1);
    set_state("sending");

    try {
      const result = await sign_vote(voter, props.author, props.permlink, blockchain_weight);

      if (result.success) {
        set_state("success");
      } else {
        // Rollback
        set_votes_count(previous_count);
        set_error_message(result.error ?? "Vote failed");
        set_state("error");

        error_timeout = setTimeout(() => {
          if (state() === "error") {
            set_state("idle");
            set_error_message("");
          }
        }, ERROR_DISPLAY_MS);
      }
    } catch (err) {
      // Rollback
      set_votes_count(previous_count);
      set_error_message(err instanceof Error ? err.message : "Unexpected error");
      set_state("error");

      error_timeout = setTimeout(() => {
        if (state() === "error") {
          set_state("idle");
          set_error_message("");
        }
      }, ERROR_DISPLAY_MS);
    }
  }

  /** Cancel and return to idle */
  function handle_cancel() {
    set_state("idle");
  }

  /** Handle Enter key in username input */
  function handle_username_keydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      handle_username_submit();
    }
  }

  // --- Derived values ---

  const icon_size = () => (size() === "sm" ? "w-4 h-4" : "w-5 h-5");
  const text_size = () => (size() === "sm" ? "text-sm" : "text-base");

  const icon_color = () => {
    const s = state();
    if (s === "success" || s === "sending") return "text-primary";
    return "text-text-muted hover:text-primary";
  };

  // --- Render ---

  return (
    <div ref={container_ref} class="relative inline-flex items-center gap-1">
      {/* Upvote button + count */}
      <button
        type="button"
        onClick={handle_upvote_click}
        disabled={state() === "sending" || state() === "success"}
        class={`flex items-center gap-1 transition-colors cursor-pointer disabled:cursor-default ${icon_color()} ${text_size()}`}
        aria-label="Upvote"
        aria-expanded={state() === "prompt" || state() === "slider"}
        aria-haspopup="dialog"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={`${icon_size()} ${state() === "success" ? "fill-primary" : "fill-none"}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 15l7-7 7 7"
          />
        </svg>
        <span class={text_size()}>{votes_count()}</span>
      </button>

      {/* Payout display */}
      <Show when={props.show_payout && props.initial_payout !== undefined}>
        <span class={`text-text-muted ${text_size()}`}>
          ${props.initial_payout?.toFixed(2)}
        </span>
      </Show>

      {/* Username prompt popup */}
      <Show when={state() === "prompt"}>
        <div class="absolute top-full left-0 mt-2 bg-bg-card border border-border rounded-xl p-3 shadow-lg z-50 min-w-56">
          <label class="block text-text text-sm mb-1.5">Hive username</label>
          <input
            type="text"
            placeholder="username"
            value={username()}
            onInput={(e) => set_username(e.currentTarget.value)}
            onKeyDown={handle_username_keydown}
            class="w-full bg-transparent border border-border rounded-lg px-2.5 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary"
            autofocus
          />
          <div class="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={handle_username_submit}
              class="flex-1 bg-primary hover:bg-primary-hover text-primary-text text-sm font-medium rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={handle_cancel}
              class="flex-1 border border-border text-text-muted text-sm rounded-lg px-3 py-1.5 hover:text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>

      {/* Weight slider popup */}
      <Show when={state() === "slider" || state() === "sending"}>
        <div class="absolute top-full left-0 mt-2 bg-bg-card border border-border rounded-xl p-3 shadow-lg z-50 min-w-52">
          <div class="flex items-center justify-between mb-2">
            <label class="text-text text-sm">Vote weight</label>
            <span class="text-primary text-sm font-medium">{weight()}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={weight()}
            onInput={(e) => set_weight(parseInt(e.currentTarget.value, 10))}
            disabled={state() === "sending"}
            class="w-full accent-primary"
          />
          <div class="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={handle_vote_submit}
              disabled={state() === "sending"}
              class="flex-1 bg-primary hover:bg-primary-hover text-primary-text text-sm font-medium rounded-lg px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              {state() === "sending" ? "Sending..." : "Vote"}
            </button>
            <button
              type="button"
              onClick={handle_cancel}
              disabled={state() === "sending"}
              class="flex-1 border border-border text-text-muted text-sm rounded-lg px-3 py-1.5 hover:text-text transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
            >
              Cancel
            </button>
          </div>
        </div>
      </Show>

      {/* Error message */}
      <Show when={state() === "error"}>
        <div class="absolute top-full left-0 mt-2 bg-bg-card border border-border rounded-xl p-2.5 shadow-lg z-50 min-w-48">
          <p class="text-error text-sm">{error_message()}</p>
        </div>
      </Show>
    </div>
  );
};
