// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, createEffect, on, Show, For, onMount, onCleanup } from "solid-js";
import { Button } from "../../../ui";
import { MarkdownEditor } from "./MarkdownEditor";
import { TagInput } from "./TagInput";
import type { PostData, RewardType, Beneficiary } from "./broadcast-post";
import { CommunitySelector } from "./CommunitySelector";

// --- Types ---

interface PostEditorProps {
  username?: string;
  hive_username?: string;
  is_submitting: boolean;
  onSubmit: (post: PostData) => void;
}

interface ValidationErrors {
  title?: string;
  body?: string;
  tags?: string;
  beneficiaries?: string;
}

// --- Constants ---

const DRAFT_DEBOUNCE_MS = 500;
const MAX_TITLE_LENGTH = 256;
const MAX_SUMMARY_LENGTH = 140;
const MIN_BODY_LENGTH = 50;
const MAX_BENEFICIARY_TOTAL = 100;

const REWARD_OPTIONS: Array<{ value: RewardType; label: string; description: string }> = [
  {
    value: "50_50",
    label: "50% HBD / 50% HP",
    description: "Default. Half paid in HBD, half in Hive Power.",
  },
  {
    value: "power_up",
    label: "100% Power Up",
    description: "All rewards paid as Hive Power.",
  },
  {
    value: "decline",
    label: "Decline Payout",
    description: "No rewards. Post is a donation to the reward pool.",
  },
];

// --- Draft Persistence ---

function get_draft_key(username?: string): string {
  return `mhp-post-draft-${username ?? "_anonymous"}`;
}

interface DraftData {
  title: string;
  body: string;
  tags: string[];
  summary: string;
  community: string;
  reward_type: RewardType;
  beneficiaries: Beneficiary[];
  saved_at: number;
}

function load_draft(username?: string): DraftData | null {
  try {
    const key = get_draft_key(username);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const draft = parsed as Record<string, unknown>;
    // Basic shape validation
    if (typeof draft.title !== "string") return null;
    if (typeof draft.body !== "string") return null;
    if (!Array.isArray(draft.tags)) return null;

    return parsed as DraftData;
  } catch {
    return null;
  }
}

function save_draft(username: string | undefined, data: DraftData) {
  try {
    const key = get_draft_key(username);
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // localStorage quota exceeded -- silently ignore
  }
}

function clear_draft(username?: string) {
  try {
    const key = get_draft_key(username);
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// --- Component ---

export function PostEditor(props: PostEditorProps) {
  // Form state
  const [title, set_title] = createSignal("");
  const [body, set_body] = createSignal("");
  const [tags, set_tags] = createSignal<string[]>([]);
  const [summary, set_summary] = createSignal("");
  const [reward_type, set_reward_type] = createSignal<RewardType>("50_50");
  const [community, set_community] = createSignal("");
  const [beneficiaries, set_beneficiaries] = createSignal<Beneficiary[]>([]);
  const [errors, set_errors] = createSignal<ValidationErrors>({});
  const [draft_loaded, set_draft_loaded] = createSignal(false);

  // Debounce timer for auto-save
  let save_timer: ReturnType<typeof setTimeout> | undefined;

  // Load draft on mount
  onMount(() => {
    const draft = load_draft(props.username);
    if (draft) {
      set_title(draft.title);
      set_body(draft.body);
      set_tags(draft.tags);
      set_summary(draft.summary || "");
      set_community(draft.community || "");
      set_reward_type(draft.reward_type || "50_50");
      set_beneficiaries(draft.beneficiaries || []);
      set_draft_loaded(true);
    }
  });

  onCleanup(() => {
    if (save_timer) clearTimeout(save_timer);
  });

  // Auto-save draft (debounced)
  function schedule_save() {
    if (save_timer) clearTimeout(save_timer);
    save_timer = setTimeout(() => {
      const data: DraftData = {
        title: title(),
        body: body(),
        tags: tags(),
        summary: summary(),
        community: community(),
        reward_type: reward_type(),
        beneficiaries: beneficiaries(),
        saved_at: Date.now(),
      };
      save_draft(props.username, data);
    }, DRAFT_DEBOUNCE_MS);
  }

  // Watch all form fields for auto-save
  createEffect(
    on(
      [title, body, tags, summary, community, reward_type, beneficiaries],
      () => {
        schedule_save();
      },
      { defer: true },
    ),
  );

  // --- Validation ---

  function validate(): ValidationErrors {
    const errs: ValidationErrors = {};

    if (!title().trim()) {
      errs.title = "Title is required";
    } else if (title().trim().length > MAX_TITLE_LENGTH) {
      errs.title = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
    }

    if (body().length < MIN_BODY_LENGTH) {
      errs.body = `Body must be at least ${MIN_BODY_LENGTH} characters (currently ${body().length})`;
    }

    if (tags().length === 0) {
      errs.tags = "At least one tag is required";
    }

    // Validate beneficiaries
    const total_weight = beneficiaries().reduce((sum, b) => sum + b.weight, 0);
    if (total_weight > MAX_BENEFICIARY_TOTAL) {
      errs.beneficiaries = `Total beneficiary weight cannot exceed ${MAX_BENEFICIARY_TOTAL}%`;
    }
    const invalid_bene = beneficiaries().find(
      (b) => b.account.trim() && (b.weight <= 0 || b.weight > 100),
    );
    if (invalid_bene) {
      errs.beneficiaries = "Each beneficiary weight must be between 1% and 100%";
    }

    return errs;
  }

  function handle_submit() {
    const validation_errors = validate();
    set_errors(validation_errors);

    if (Object.keys(validation_errors).length > 0) return;

    // Filter out empty beneficiaries
    const valid_beneficiaries = beneficiaries().filter(
      (b) => b.account.trim() && b.weight > 0,
    );

    const post: PostData = {
      title: title().trim(),
      body: body(),
      tags: tags(),
      community: community() || undefined,
      summary: summary().trim() || undefined,
      reward_type: reward_type(),
      beneficiaries: valid_beneficiaries,
    };

    props.onSubmit(post);
  }

  function handle_clear_draft() {
    set_title("");
    set_body("");
    set_tags([]);
    set_summary("");
    set_community("");
    set_reward_type("50_50");
    set_beneficiaries([]);
    set_errors({});
    set_draft_loaded(false);
    clear_draft(props.username);
  }

  // --- Beneficiary management ---

  function add_beneficiary() {
    set_beneficiaries([...beneficiaries(), { account: "", weight: 1 }]);
  }

  function update_beneficiary(index: number, field: keyof Beneficiary, value: string | number) {
    const updated = [...beneficiaries()];
    if (field === "account") {
      updated[index] = { ...updated[index], account: String(value).toLowerCase().trim() };
    } else {
      updated[index] = { ...updated[index], weight: Number(value) || 0 };
    }
    set_beneficiaries(updated);
  }

  function remove_beneficiary(index: number) {
    set_beneficiaries(beneficiaries().filter((_, i) => i !== index));
  }

  return (
    <div class="space-y-6">
      {/* Draft loaded notice */}
      <Show when={draft_loaded()}>
        <div class="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
          <p class="text-sm text-primary">Draft restored from previous session.</p>
          <button
            type="button"
            onClick={handle_clear_draft}
            class="text-sm text-primary hover:text-primary-hover underline"
          >
            Clear draft
          </button>
        </div>
      </Show>

      {/* Title */}
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="post-title">
          Title
          <span class="text-text-muted font-normal ml-1">
            ({title().length}/{MAX_TITLE_LENGTH})
          </span>
        </label>
        <input
          id="post-title"
          type="text"
          value={title()}
          onInput={(e) => set_title(e.currentTarget.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Enter your post title..."
          class="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text
            placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary
            transition-all text-lg"
        />
        <Show when={errors().title}>
          <p class="mt-1 text-xs text-error">{errors().title}</p>
        </Show>
      </div>

      {/* Community */}
      <CommunitySelector
        username={props.hive_username}
        selected={community()}
        onChange={set_community}
      />

      {/* Body (Markdown Editor) */}
      <div>
        <MarkdownEditor value={body()} onInput={set_body} />
        <Show when={errors().body}>
          <p class="mt-1 text-xs text-error">{errors().body}</p>
        </Show>
      </div>

      {/* Tags */}
      <div>
        <TagInput tags={tags()} onChange={set_tags} />
        <Show when={errors().tags}>
          <p class="mt-1 text-xs text-error">{errors().tags}</p>
        </Show>
      </div>

      {/* Summary (optional) */}
      <div>
        <label class="block text-sm font-medium text-text mb-1.5" for="post-summary">
          Summary
          <span class="text-text-muted font-normal ml-1">
            (optional, {summary().length}/{MAX_SUMMARY_LENGTH})
          </span>
        </label>
        <textarea
          id="post-summary"
          value={summary()}
          onInput={(e) => set_summary(e.currentTarget.value)}
          maxLength={MAX_SUMMARY_LENGTH}
          rows={2}
          placeholder="Brief description for post metadata..."
          class="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text text-sm
            placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary
            transition-all resize-none"
        />
        <p class="mt-1 text-xs text-text-muted">
          Used as description in json_metadata. Shown in search results and social previews.
        </p>
      </div>

      {/* Reward Type */}
      <div>
        <label class="block text-sm font-medium text-text mb-3">Reward Type</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <For each={REWARD_OPTIONS}>
            {(option) => (
              <button
                type="button"
                onClick={() => set_reward_type(option.value)}
                class={`p-3 rounded-lg border text-left transition-all ${
                  reward_type() === option.value
                    ? "border-primary bg-primary/10 text-text"
                    : "border-border bg-bg-secondary text-text-muted hover:border-border hover:bg-bg-card"
                }`}
              >
                <div class="text-sm font-medium">{option.label}</div>
                <div class="text-xs mt-0.5 opacity-70">{option.description}</div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* Beneficiaries */}
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-text">
            Beneficiaries
            <span class="text-text-muted font-normal ml-1">(optional)</span>
          </label>
          <button
            type="button"
            onClick={add_beneficiary}
            class="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            + Add beneficiary
          </button>
        </div>

        <Show when={beneficiaries().length > 0}>
          <div class="space-y-2">
            <For each={beneficiaries()}>
              {(bene, index) => (
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    value={bene.account}
                    onInput={(e) =>
                      update_beneficiary(index(), "account", e.currentTarget.value)
                    }
                    placeholder="hive username"
                    class="flex-1 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text
                      placeholder:text-text-muted focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <div class="flex items-center gap-1">
                    <input
                      type="number"
                      value={bene.weight}
                      onInput={(e) =>
                        update_beneficiary(index(), "weight", e.currentTarget.value)
                      }
                      min={1}
                      max={100}
                      class="w-20 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text text-center
                        focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                    <span class="text-sm text-text-muted">%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove_beneficiary(index())}
                    class="p-2 text-text-muted hover:text-error transition-colors rounded-lg hover:bg-bg-secondary"
                    aria-label="Remove beneficiary"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>

        <Show when={errors().beneficiaries}>
          <p class="mt-1 text-xs text-error">{errors().beneficiaries}</p>
        </Show>

        <Show when={beneficiaries().length === 0}>
          <p class="text-xs text-text-muted">
            No beneficiaries set. All rewards go to the author.
          </p>
        </Show>
      </div>

      {/* Submit / Clear */}
      <div class="flex items-center gap-3 pt-4 border-t border-border">
        <Button
          variant="primary"
          size="lg"
          loading={props.is_submitting}
          onClick={handle_submit}
          disabled={props.is_submitting}
        >
          {props.is_submitting ? "Broadcasting..." : "Publish to Hive"}
        </Button>

        <Button variant="ghost" size="lg" onClick={handle_clear_draft} disabled={props.is_submitting}>
          Clear
        </Button>
      </div>
    </div>
  );
}
