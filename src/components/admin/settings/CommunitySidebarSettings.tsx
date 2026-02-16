// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For } from "solid-js";
import { settings, updateSettings } from "../store";
import { useCommunityPreviewQuery, is_community_mode } from "../queries";

// ============================================
// Types & Constants
// ============================================

interface SidebarToggleField {
  key:
    | "community_show_description"
    | "community_show_rules"
    | "community_show_leadership";
  label: string;
  description: string;
  default: boolean;
}

const TOGGLE_FIELDS: SidebarToggleField[] = [
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
    description:
      "Display the team (owners, admins, moderators) in the sidebar",
    default: true,
  },
];

// Role badge styles (matching CommunitySidebar.tsx)
const ROLE_COLORS: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-accent/10 text-accent",
  mod: "bg-success/10 text-success",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  mod: "Moderator",
};

// Mock data for preview when no real data
const MOCK_SIDEBAR = {
  description: "A sample community description for preview.",
  rules: ["Be respectful", "No spam", "Stay on topic"],
  team: [
    { username: "sampleuser", role: "owner" },
    { username: "moduser", role: "mod" },
  ],
};

// ============================================
// Helpers
// ============================================

function update_sidebar_toggle(
  key: SidebarToggleField["key"],
  value: boolean,
) {
  if (key === "community_show_description") {
    updateSettings({ community_show_description: value });
  } else if (key === "community_show_rules") {
    updateSettings({ community_show_rules: value });
  } else if (key === "community_show_leadership") {
    updateSettings({ community_show_leadership: value });
  }
}

function get_toggle_value(key: SidebarToggleField["key"]): boolean {
  const val = settings[key];
  const field = TOGGLE_FIELDS.find((f) => f.key === key);
  return typeof val === "boolean" ? val : (field?.default ?? true);
}

function parse_rules(flag_text: string): string[] {
  if (!flag_text.trim()) return [];
  return flag_text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parse_team(
  team: Array<Array<string>>,
): Array<{ username: string; role: string }> {
  const leadership_roles = new Set(["owner", "admin", "mod"]);
  const result: Array<{ username: string; role: string }> = [];
  for (const member of team) {
    if (!Array.isArray(member) || member.length < 2) continue;
    if (!leadership_roles.has(member[1])) continue;
    result.push({ username: member[0], role: member[1] });
  }
  return result;
}

// ============================================
// Component
// ============================================

export function CommunitySidebarSettings() {
  const community_query = useCommunityPreviewQuery(
    () => (is_community_mode() ? settings.hiveUsername : undefined),
    () => 1,
    () => is_community_mode() && !!settings.hiveUsername,
  );

  const sidebar_data = () => {
    const data = community_query.data;
    if (data?.community) {
      return {
        description: data.community.description,
        rules: parse_rules(data.community.flag_text),
        team: parse_team(data.community.team),
      };
    }
    return MOCK_SIDEBAR;
  };

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-2">
        Community Sidebar Settings
      </h2>
      <p class="text-sm text-text-muted mb-6">
        Control which community elements are visible in the sidebar.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: toggle controls */}
        <div class="space-y-3">
          <For each={TOGGLE_FIELDS}>
            {(field) => (
              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={get_toggle_value(field.key)}
                  onChange={(e) => {
                    update_sidebar_toggle(
                      field.key,
                      e.currentTarget.checked,
                    );
                  }}
                  class="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <span class="text-sm font-medium text-text">
                    {field.label}
                  </span>
                  <p class="text-xs text-text-muted">{field.description}</p>
                </div>
              </label>
            )}
          </For>
        </div>

        {/* Right column: live preview */}
        <div class="bg-bg rounded-lg p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs text-text-muted uppercase tracking-wide">
              Preview
            </p>
            <Show when={community_query.isLoading}>
              <div class="flex items-center gap-2 text-xs text-text-muted">
                <div class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            </Show>
          </div>

          <div class="space-y-3">
            {/* Description */}
            <Show when={get_toggle_value("community_show_description")}>
              <div class="bg-bg-card rounded-xl border border-border p-4">
                <h3 class="text-text font-semibold text-sm mb-2">
                  Description
                </h3>
                <p class="text-text-muted text-sm leading-relaxed">
                  {sidebar_data().description}
                </p>
              </div>
            </Show>

            {/* Rules */}
            <Show
              when={
                get_toggle_value("community_show_rules") &&
                sidebar_data().rules.length > 0
              }
            >
              <div class="bg-bg-card rounded-xl border border-border p-4">
                <h3 class="text-text font-semibold text-sm mb-2">Rules</h3>
                <ol class="list-decimal list-inside space-y-1.5">
                  <For each={sidebar_data().rules}>
                    {(rule) => (
                      <li class="text-text-muted text-sm leading-relaxed">
                        {rule}
                      </li>
                    )}
                  </For>
                </ol>
              </div>
            </Show>

            {/* Team */}
            <Show
              when={
                get_toggle_value("community_show_leadership") &&
                sidebar_data().team.length > 0
              }
            >
              <div class="bg-bg-card rounded-xl border border-border p-4">
                <h3 class="text-text font-semibold text-sm mb-2">Team</h3>
                <div class="space-y-2">
                  <For each={sidebar_data().team}>
                    {(member) => (
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-sm text-text truncate">
                          @{member.username}
                        </span>
                        <span
                          class={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[member.role] ?? ""}`}
                        >
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Empty state */}
            <Show
              when={
                !get_toggle_value("community_show_description") &&
                !get_toggle_value("community_show_rules") &&
                !get_toggle_value("community_show_leadership")
              }
            >
              <div class="bg-bg-card rounded-xl border border-border p-4">
                <p class="text-text-muted text-sm text-center">
                  All sidebar sections are hidden.
                </p>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
