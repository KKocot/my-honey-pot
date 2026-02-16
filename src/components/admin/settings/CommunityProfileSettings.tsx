// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show } from "solid-js";
import { settings, updateSettings } from "../store";
import { useCommunityPreviewQuery, is_community_mode } from "../queries";
import { Slider } from "../../ui";

// ============================================
// Mock data for preview when no real data
// ============================================

const MOCK_COMMUNITY = {
  title: "Sample Community",
  about: "A sample community for preview",
  avatar_url: "",
  subscribers: 1234,
  num_authors: 56,
};

// ============================================
// Component
// ============================================

export function CommunityProfileSettings() {
  const show_subscribers = () => {
    const val = settings.community_show_subscribers;
    return typeof val === "boolean" ? val : true;
  };

  const community_query = useCommunityPreviewQuery(
    () => (is_community_mode() ? settings.hiveUsername : undefined),
    () => 1,
    () => is_community_mode() && !!settings.hiveUsername,
  );

  const community_data = () => {
    const data = community_query.data;
    if (data?.community) {
      return {
        title: data.community.title || data.community.name,
        about: data.community.about,
        avatar_url: data.community.avatar_url,
        subscribers: data.community.subscribers,
        num_authors: data.community.num_authors,
      };
    }
    return MOCK_COMMUNITY;
  };

  const avatar_size = () => settings.community_avatar_size_px ?? 48;
  const title_size = () => settings.community_title_size_px ?? 16;
  const about_size = () => settings.community_about_size_px ?? 14;

  const avatar_src = () => {
    const url = community_data().avatar_url;
    if (url) return `https://images.hive.blog/256x512/${url}`;
    return `https://images.hive.blog/u/${settings.hiveUsername || "null"}/avatar`;
  };

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-2">
        Community Profile Settings
      </h2>
      <p class="text-sm text-text-muted mb-6">
        Customize the community profile card appearance.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: controls */}
        <div class="space-y-5">
          {/* Show Subscribers toggle */}
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={show_subscribers()}
              onChange={(e) => {
                updateSettings({
                  community_show_subscribers: e.currentTarget.checked,
                });
              }}
              class="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <div>
              <span class="text-sm font-medium text-text">
                Show Subscribers Count
              </span>
              <p class="text-xs text-text-muted">
                Display subscriber stats in the community profile card
              </p>
            </div>
          </label>

          {/* Style Settings */}
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
              Style Settings
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <Slider
                label="Avatar size:"
                unit="px"
                min={32}
                max={96}
                value={settings.community_avatar_size_px ?? 48}
                onChange={(val) =>
                  updateSettings({ community_avatar_size_px: val })
                }
              />
              <Slider
                label="Title size:"
                unit="px"
                min={14}
                max={28}
                value={settings.community_title_size_px ?? 16}
                onChange={(val) =>
                  updateSettings({ community_title_size_px: val })
                }
              />
              <Slider
                label="About text size:"
                unit="px"
                min={12}
                max={18}
                value={settings.community_about_size_px ?? 14}
                onChange={(val) =>
                  updateSettings({ community_about_size_px: val })
                }
              />
            </div>
          </div>
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

          <div class="bg-bg-card rounded-xl border border-border overflow-hidden">
            <div class="p-4 flex items-center gap-3">
              <img
                src={avatar_src()}
                alt="Community avatar"
                style={{
                  width: `${avatar_size()}px`,
                  height: `${avatar_size()}px`,
                }}
                class="rounded-full object-cover flex-shrink-0"
              />
              <div class="min-w-0">
                <h3
                  class="text-text font-semibold truncate"
                  style={{ "font-size": `${title_size()}px` }}
                >
                  {community_data().title}
                </h3>
                <p
                  class="text-text-muted truncate"
                  style={{ "font-size": `${about_size()}px` }}
                >
                  {community_data().about}
                </p>
              </div>
            </div>

            <Show when={show_subscribers()}>
              <div class="border-t border-border px-4 py-2 flex gap-4">
                <span class="text-xs text-text-muted">
                  <span class="font-medium text-text">
                    {community_data().subscribers.toLocaleString()}
                  </span>{" "}
                  subscribers
                </span>
                <span class="text-xs text-text-muted">
                  <span class="font-medium text-text">
                    {community_data().num_authors.toLocaleString()}
                  </span>{" "}
                  active authors
                </span>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
