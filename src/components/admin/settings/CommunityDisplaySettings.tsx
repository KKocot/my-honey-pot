// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For } from "solid-js";
import { IS_COMMUNITY } from "../../../lib/config";
import { settings, updateSettings } from "../store";
import type { CommunityDisplaySortOrder } from "../types/settings";

// ============================================
// Type Guards
// ============================================

const VALID_SORTS = ["trending", "hot", "created", "payout"] as const;

function is_valid_sort(value: string): value is CommunityDisplaySortOrder {
  return (VALID_SORTS as readonly string[]).includes(value);
}

// ============================================
// Constants
// ============================================

const SORT_OPTIONS: { value: CommunityDisplaySortOrder; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "hot", label: "Hot" },
  { value: "created", label: "New" },
  { value: "payout", label: "Payouts" },
];

interface CommunityToggleField {
  key:
    | "community_show_description"
    | "community_show_rules"
    | "community_show_leadership"
    | "community_show_subscribers";
  label: string;
  description: string;
  default: boolean;
}

const TOGGLE_FIELDS: CommunityToggleField[] = [
  {
    key: "community_show_description",
    label: "Show Description",
    description: "Display the community description in the sidebar",
    default: true,
  },
  {
    key: "community_show_rules",
    label: "Show Rules",
    description: "Display community rules / flag text in the sidebar",
    default: true,
  },
  {
    key: "community_show_leadership",
    label: "Show Leadership",
    description: "Display the team (owners, admins, moderators) in the sidebar",
    default: true,
  },
  {
    key: "community_show_subscribers",
    label: "Show Subscribers Count",
    description: "Display subscriber stats in the community profile card",
    default: true,
  },
];

// ============================================
// Helpers
// ============================================

function update_community_toggle(
  key: CommunityToggleField["key"],
  value: boolean,
) {
  if (key === "community_show_description") {
    updateSettings({ community_show_description: value });
  } else if (key === "community_show_rules") {
    updateSettings({ community_show_rules: value });
  } else if (key === "community_show_leadership") {
    updateSettings({ community_show_leadership: value });
  } else if (key === "community_show_subscribers") {
    updateSettings({ community_show_subscribers: value });
  }
}

// ============================================
// Component
// ============================================

export function CommunityDisplaySettings() {
  const disabled = !IS_COMMUNITY;

  return (
    <div
      class="bg-bg-card rounded-xl p-6 mb-6 border border-border"
      classList={{ "opacity-60": disabled }}
    >
      <h2 class="text-xl font-semibold text-primary mb-2">
        Community Display Settings
      </h2>

      {/* Disabled banner for user mode */}
      <Show when={disabled}>
        <div class="flex items-center gap-2 px-3 py-2 mb-6 rounded-lg bg-bg-secondary border border-border">
          <svg
            class="w-4 h-4 text-text-muted flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p class="text-sm text-text-muted">
            <span class="font-medium">Community only</span> -- These settings
            are only available for community accounts (hive-NUMBERS).
          </p>
        </div>
      </Show>

      <Show when={!disabled}>
        <p class="text-sm text-text-muted mb-6">
          Control which community elements are visible on the public page.
        </p>
      </Show>

      <div class="space-y-5">
        {/* Default sort order */}
        <div>
          <label class="block text-sm font-medium text-text mb-1">
            Default Sort Order
          </label>
          <select
            value={settings.community_default_sort ?? "trending"}
            disabled={disabled}
            onChange={(e) => {
              const value = e.currentTarget.value;
              if (is_valid_sort(value)) {
                updateSettings({ community_default_sort: value });
              }
            }}
            class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <For each={SORT_OPTIONS}>
              {(option) => (
                <option value={option.value}>{option.label}</option>
              )}
            </For>
          </select>
          <p class="text-xs text-text-muted mt-1">
            The default sorting when visitors first open the community page.
          </p>
        </div>

        {/* Toggle fields */}
        <div class="border-t border-border pt-4 space-y-3">
          <For each={TOGGLE_FIELDS}>
            {(field) => {
              const current_value = () => {
                const val = settings[field.key];
                return typeof val === "boolean" ? val : field.default;
              };

              return (
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={current_value()}
                    disabled={disabled}
                    onChange={(e) => {
                      update_community_toggle(
                        field.key,
                        e.currentTarget.checked,
                      );
                    }}
                    class="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <div>
                    <span class="text-sm font-medium text-text">
                      {field.label}
                    </span>
                    <p class="text-xs text-text-muted">{field.description}</p>
                  </div>
                </label>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
