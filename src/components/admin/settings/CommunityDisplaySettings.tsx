// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from "solid-js";
import { settings, updateSettings } from "../store";
import type { CommunityDisplaySortOrder } from "../types/settings";

// ============================================
// Type Guards
// ============================================

const VALID_SORTS = [
  "trending",
  "hot",
  "created",
  "payout",
  "muted",
] as const;

function is_valid_sort(value: string): value is CommunityDisplaySortOrder {
  return (VALID_SORTS as readonly string[]).includes(value);
}

// ============================================
// Constants
// ============================================

const ALL_SORT_OPTIONS: {
  value: CommunityDisplaySortOrder;
  label: string;
  description: string;
}[] = [
  {
    value: "trending",
    label: "Trending",
    description: "Posts sorted by recent engagement and votes",
  },
  {
    value: "hot",
    label: "Hot",
    description: "Posts with the most activity right now",
  },
  {
    value: "created",
    label: "New",
    description: "Most recently published posts",
  },
  {
    value: "payout",
    label: "Payouts",
    description: "Posts with the highest pending payout",
  },
  {
    value: "muted",
    label: "Muted",
    description: "Posts muted by community moderators",
  },
];

const DEFAULT_VISIBLE: CommunityDisplaySortOrder[] = [
  "trending",
  "hot",
  "created",
  "payout",
];

// ============================================
// Helpers
// ============================================

function get_visible_sorts(): CommunityDisplaySortOrder[] {
  const val = settings.community_visible_sorts;
  return Array.isArray(val) && val.length > 0 ? val : DEFAULT_VISIBLE;
}

function toggle_sort_visibility(sort: CommunityDisplaySortOrder) {
  const current = get_visible_sorts();
  const is_visible = current.includes(sort);

  if (is_visible && current.length <= 1) return;

  const next = is_visible
    ? current.filter((s) => s !== sort)
    : [...current, sort];

  updateSettings({ community_visible_sorts: next });

  const default_sort = settings.community_default_sort ?? "trending";
  if (is_visible && default_sort === sort) {
    updateSettings({ community_default_sort: next[0] });
  }
}

// ============================================
// Component
// ============================================

export function CommunityDisplaySettings() {
  const current_sort = () => settings.community_default_sort ?? "trending";
  const visible_sorts = () => get_visible_sorts();
  const visible_options = () =>
    ALL_SORT_OPTIONS.filter((o) => visible_sorts().includes(o.value));

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-2">
        Community Posts Settings
      </h2>
      <p class="text-sm text-text-muted mb-6">
        Configure which sort tabs are visible and the default sorting.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: controls */}
        <div class="space-y-5">
          {/* Visible sort tabs */}
          <div>
            <h3 class="text-sm font-medium text-text mb-2">
              Visible Sort Tabs
            </h3>
            <p class="text-xs text-text-muted mb-3">
              Choose which sorting options are shown to visitors.
            </p>
            <div class="space-y-2">
              <For each={ALL_SORT_OPTIONS}>
                {(option) => {
                  const is_checked = () =>
                    visible_sorts().includes(option.value);
                  const is_only_one = () =>
                    is_checked() && visible_sorts().length <= 1;

                  return (
                    <label class="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={is_checked()}
                        disabled={is_only_one()}
                        onChange={() => toggle_sort_visibility(option.value)}
                        class="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <div>
                        <span class="text-sm font-medium text-text">
                          {option.label}
                        </span>
                        <p class="text-xs text-text-muted">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  );
                }}
              </For>
            </div>
          </div>

          {/* Default sort order */}
          <div class="border-t border-border pt-4">
            <label class="block text-sm font-medium text-text mb-1">
              Default Sort Order
            </label>
            <select
              value={current_sort()}
              onChange={(e) => {
                const value = e.currentTarget.value;
                if (is_valid_sort(value)) {
                  updateSettings({ community_default_sort: value });
                }
              }}
              class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <For each={visible_options()}>
                {(option) => (
                  <option value={option.value}>{option.label}</option>
                )}
              </For>
            </select>
            <p class="text-xs text-text-muted mt-1">
              The default sorting when visitors first open the community page.
            </p>
          </div>
        </div>

        {/* Right column: sort tabs preview */}
        <div class="bg-bg rounded-lg p-4 border border-border">
          <p class="text-xs text-text-muted uppercase tracking-wide mb-3">
            Preview
          </p>

          <div class="flex flex-wrap gap-2">
            <For each={visible_options()}>
              {(option) => (
                <button
                  type="button"
                  class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    current_sort() === option.value
                      ? "bg-primary text-primary-text"
                      : "bg-bg-secondary text-text-muted"
                  }`}
                  onClick={() => {
                    updateSettings({
                      community_default_sort: option.value,
                    });
                  }}
                >
                  {option.label}
                </button>
              )}
            </For>
          </div>

          <Show when={visible_options().length === 0}>
            <p class="text-sm text-text-muted text-center py-2">
              No sort tabs selected.
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}
