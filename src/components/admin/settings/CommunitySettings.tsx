// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, createResource, createEffect, Show, For } from "solid-js";
import { fetch_community } from "../../../lib/queries";
import { settings } from "../store";
import { currentUser, isAuthenticated } from "../../auth";
import {
  broadcast_update_community,
  type CommunityPropsUpdate,
} from "../community-broadcast";
import { showToast } from "../../ui";
import type { HiveCommunity } from "../../../lib/types/community";

// ============================================
// Supported languages for Hive communities
// ============================================

const COMMUNITY_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "kr", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "ms", label: "Malay" },
  { code: "pl", label: "Polish" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "sv", label: "Swedish" },
] as const;

// ============================================
// Community Settings Component
// ============================================

export function CommunitySettings() {
  const community_name = settings.hiveUsername;
  const [is_broadcasting, set_is_broadcasting] = createSignal(false);

  // Fetch current community data from blockchain
  const [community, { refetch }] = createResource(() => community_name, (name) =>
    fetch_community(name)
  );

  // Local form state - initialized from community data
  const [local_title, set_local_title] = createSignal("");
  const [local_about, set_local_about] = createSignal("");
  const [local_description, set_local_description] = createSignal("");
  const [local_flag_text, set_local_flag_text] = createSignal("");
  const [local_lang, set_local_lang] = createSignal("en");
  const [local_is_nsfw, set_local_is_nsfw] = createSignal(false);
  const [form_initialized, set_form_initialized] = createSignal(false);

  // Initialize form from fetched data
  const init_form = (data: HiveCommunity) => {
    set_local_title(data.title);
    set_local_about(data.about);
    set_local_description(data.description);
    set_local_flag_text(data.flag_text);
    set_local_lang(data.lang || "en");
    set_local_is_nsfw(data.is_nsfw);
    set_form_initialized(true);
  };

  // Watch for community data and init form
  createEffect(() => {
    const data = community();
    if (data && !form_initialized()) {
      init_form(data);
    }
  });

  // Check if current user can edit (must be admin or owner)
  const can_edit = (): boolean => {
    if (!isAuthenticated()) return false;
    const user = currentUser();
    if (!user) return false;

    const data = community();
    if (!data) return false;

    // Check team array for admin/owner roles
    const user_role = data.team.find(
      (member) => member[0] === user.username
    );
    if (!user_role) return false;

    const role = user_role[1];
    return role === "admin" || role === "owner";
  };

  const has_changes = (): boolean => {
    const data = community();
    if (!data) return false;

    return (
      local_title() !== data.title ||
      local_about() !== data.about ||
      local_description() !== data.description ||
      local_flag_text() !== data.flag_text ||
      local_lang() !== (data.lang || "en") ||
      local_is_nsfw() !== data.is_nsfw
    );
  };

  const handle_save = async () => {
    const user = currentUser();
    if (!user) {
      showToast("Please login first", "error");
      return;
    }

    if (!can_edit()) {
      showToast(
        "You do not have permission to edit this community",
        "error"
      );
      return;
    }

    if (!local_title().trim()) {
      showToast("Community title is required", "error");
      return;
    }

    set_is_broadcasting(true);

    const props: CommunityPropsUpdate = {
      title: local_title().trim(),
      about: local_about().trim(),
      description: local_description().trim(),
      flag_text: local_flag_text().trim(),
      lang: local_lang(),
      is_nsfw: local_is_nsfw(),
    };

    const result = await broadcast_update_community(
      community_name,
      user.username,
      props
    );

    set_is_broadcasting(false);

    if (result.success) {
      showToast(
        "Community settings updated! Changes may take a few seconds to propagate.",
        "success"
      );
      // Reset form_initialized to allow re-init on refetch
      set_form_initialized(false);
      // Refetch after a short delay to let the blockchain propagate
      setTimeout(() => {
        refetch();
      }, 5000);
    } else {
      showToast(`Failed: ${result.error}`, "error");
    }
  };

  const handle_reset = () => {
    const data = community();
    if (data) {
      init_form(data);
    }
  };

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">
        Community Settings
      </h2>

      {/* Loading */}
      <Show when={community.loading}>
        <div class="flex items-center gap-3 py-4">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span class="text-text-muted text-sm">
            Loading community settings...
          </span>
        </div>
      </Show>

      {/* Error */}
      <Show when={community.error}>
        <div class="p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
          Failed to load community data. Please try refreshing the page.
        </div>
      </Show>

      {/* Permission warning */}
      <Show when={community() && !can_edit()}>
        <div class="p-4 bg-warning/10 border border-warning rounded-lg mb-6">
          <div class="flex items-center gap-2">
            <svg
              class="w-5 h-5 text-warning flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p class="text-sm text-warning">
              <Show
                when={isAuthenticated()}
                fallback="Login as a community admin or owner to edit settings."
              >
                You are not an admin or owner of this community. Settings
                are read-only.
              </Show>
            </p>
          </div>
        </div>
      </Show>

      {/* Form */}
      <Show when={form_initialized()}>
        <div class="space-y-5">
          {/* Title */}
          <div>
            <label class="block text-sm font-medium text-text mb-1">
              Title
            </label>
            <input
              type="text"
              value={local_title()}
              disabled={!can_edit()}
              onInput={(e) => set_local_title(e.currentTarget.value)}
              placeholder="Community title"
              maxLength={80}
              class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* About (short description) */}
          <div>
            <label class="block text-sm font-medium text-text mb-1">
              About
              <span class="text-text-muted font-normal ml-1">
                (short description)
              </span>
            </label>
            <input
              type="text"
              value={local_about()}
              disabled={!can_edit()}
              onInput={(e) => set_local_about(e.currentTarget.value)}
              placeholder="Brief description of the community"
              maxLength={120}
              class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description (long) */}
          <div>
            <label class="block text-sm font-medium text-text mb-1">
              Description
              <span class="text-text-muted font-normal ml-1">
                (detailed, supports markdown)
              </span>
            </label>
            <textarea
              value={local_description()}
              disabled={!can_edit()}
              onInput={(e) =>
                set_local_description(e.currentTarget.value)
              }
              placeholder="Detailed community description..."
              rows={4}
              class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text resize-y focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Flag text (rules) */}
          <div>
            <label class="block text-sm font-medium text-text mb-1">
              Rules / Flag Text
              <span class="text-text-muted font-normal ml-1">
                (shown when flagging a post)
              </span>
            </label>
            <textarea
              value={local_flag_text()}
              disabled={!can_edit()}
              onInput={(e) =>
                set_local_flag_text(e.currentTarget.value)
              }
              placeholder="Community rules and posting guidelines..."
              rows={3}
              class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text resize-y focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Language + NSFW row */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Language */}
            <div>
              <label class="block text-sm font-medium text-text mb-1">
                Language
              </label>
              <select
                value={local_lang()}
                disabled={!can_edit()}
                onChange={(e) =>
                  set_local_lang(e.currentTarget.value)
                }
                class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <For each={COMMUNITY_LANGUAGES}>
                  {(lang) => (
                    <option value={lang.code}>{lang.label}</option>
                  )}
                </For>
              </select>
            </div>

            {/* NSFW */}
            <div class="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="community-nsfw"
                checked={local_is_nsfw()}
                disabled={!can_edit()}
                onChange={(e) =>
                  set_local_is_nsfw(e.currentTarget.checked)
                }
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <label
                for="community-nsfw"
                class="text-sm font-medium text-text"
              >
                NSFW Community
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <Show when={can_edit()}>
            <div class="flex items-center gap-3 pt-4 border-t border-border">
              <button
                type="button"
                disabled={is_broadcasting() || !has_changes()}
                onClick={handle_save}
                class="flex items-center gap-2 px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Show
                  when={is_broadcasting()}
                  fallback={
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
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  }
                >
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-text" />
                </Show>
                {is_broadcasting()
                  ? "Broadcasting..."
                  : "Save Community Settings"}
              </button>

              <button
                type="button"
                disabled={is_broadcasting() || !has_changes()}
                onClick={handle_reset}
                class="px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>

              <Show when={has_changes()}>
                <span class="text-xs text-warning">
                  Unsaved changes
                </span>
              </Show>
            </div>

            {/* RC warning */}
            <p class="text-xs text-text-muted flex items-center gap-1.5">
              <svg
                class="w-3.5 h-3.5 text-warning flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Updating community settings is a blockchain transaction that
              costs Resource Credits (RC).
            </p>
          </Show>
        </div>
      </Show>
    </div>
  );
}
