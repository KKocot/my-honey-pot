// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For, type Component } from "solid-js";
import type {
  HiveCommunity,
  CommunityTeamMember,
} from "../../lib/types/community";
import { escape_html } from "../../shared/formatters";

// ============================================
// Types
// ============================================

interface CommunitySidebarProps {
  community: HiveCommunity;
  show_description?: boolean;
  show_rules?: boolean;
  show_leadership?: boolean;
}

type TeamRole = "owner" | "admin" | "mod";

interface ParsedTeamMember {
  username: string;
  role: TeamRole;
  title: string;
}

// ============================================
// Helpers
// ============================================

const LEADERSHIP_ROLES: ReadonlySet<string> = new Set([
  "owner",
  "admin",
  "mod",
]);

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  mod: "Moderator",
};

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-accent/10 text-accent",
  mod: "bg-success/10 text-success",
};

function is_team_role(value: string): value is TeamRole {
  return LEADERSHIP_ROLES.has(value);
}

function parse_team(team: CommunityTeamMember[]): ParsedTeamMember[] {
  const result: ParsedTeamMember[] = [];
  for (const member of team) {
    if (!Array.isArray(member) || member.length < 2) continue;
    const role = member[1];
    if (!is_team_role(role)) continue;
    result.push({ username: member[0], role, title: member[2] || "" });
  }
  return result;
}

function parse_rules(flag_text: string): string[] {
  if (!flag_text.trim()) return [];
  return flag_text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function get_language_name(code: string): string {
  const languages: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    pt: "Portuguese",
    ko: "Korean",
    ja: "Japanese",
    zh: "Chinese",
    ru: "Russian",
    pl: "Polish",
    it: "Italian",
    nl: "Dutch",
    ar: "Arabic",
    tr: "Turkish",
    hi: "Hindi",
    id: "Indonesian",
    uk: "Ukrainian",
  };
  return languages[code] || code.toUpperCase();
}

// ============================================
// Component
// ============================================

const CommunitySidebar: Component<CommunitySidebarProps> = (props) => {
  const community = () => props.community;
  const team_members = () => parse_team(community().team);
  const rules = () => parse_rules(community().flag_text);

  return (
    <div class="space-y-4 max-w-xs">
      {/* Description */}
      <Show when={(props.show_description !== false) && community().description}>
        <div class="bg-bg-card rounded-xl shadow-sm border border-border p-4">
          <h3 class="text-text font-semibold text-sm mb-2">Description</h3>
          <div
            class="text-text-muted text-sm leading-relaxed prose prose-sm max-w-none"
            innerHTML={escape_html(community().description).replace(
              /\n/g,
              "<br />"
            )}
          />
        </div>
      </Show>

      {/* Rules */}
      <Show when={(props.show_rules !== false) && rules().length > 0}>
        <div class="bg-bg-card rounded-xl shadow-sm border border-border p-4">
          <h3 class="text-text font-semibold text-sm mb-2">Rules</h3>
          <ol class="list-decimal list-inside space-y-1.5">
            <For each={rules()}>
              {(rule) => (
                <li class="text-text-muted text-sm leading-relaxed">
                  {rule}
                </li>
              )}
            </For>
          </ol>
        </div>
      </Show>

      {/* Leadership */}
      <Show when={(props.show_leadership !== false) && team_members().length > 0}>
        <div class="bg-bg-card rounded-xl shadow-sm border border-border p-4">
          <h3 class="text-text font-semibold text-sm mb-2">Team</h3>
          <div class="space-y-2">
            <For each={team_members()}>
              {(member) => (
                <div class="flex items-center justify-between gap-2">
                  <a
                    href={`https://hive.blog/@${member.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-text hover:text-primary transition-colors truncate"
                  >
                    @{member.username}
                  </a>
                  <span
                    class={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ROLE_COLORS[member.role]}`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Language */}
      <Show when={community().lang}>
        <div class="bg-bg-card rounded-xl shadow-sm border border-border p-4">
          <h3 class="text-text font-semibold text-sm mb-2">Language</h3>
          <p class="text-text-muted text-sm">
            {get_language_name(community().lang)}
          </p>
        </div>
      </Show>
    </div>
  );
};

export { CommunitySidebar };
