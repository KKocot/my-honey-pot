// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, type Component } from "solid-js";
import type { HiveCommunity } from "../../lib/types/community";

// ============================================
// Types
// ============================================

interface CommunityProfileProps {
  community: HiveCommunity;
  show_subscribers?: boolean;
}

// ============================================
// Helpers
// ============================================

function get_avatar_url(community_name: string): string {
  return `https://images.hive.blog/u/${community_name}/avatar/medium`;
}

function format_number(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return String(num);
}

// ============================================
// Component
// ============================================

const CommunityProfile: Component<CommunityProfileProps> = (props) => {
  const community = () => props.community;

  return (
    <div class="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden max-w-xs">
      {/* Avatar + Title */}
      <div class="p-4 flex items-center gap-3">
        <img
          src={get_avatar_url(community().name)}
          alt={`${community().title} avatar`}
          width={48}
          height={48}
          class="rounded-full flex-shrink-0"
          loading="lazy"
        />
        <div class="min-w-0">
          <h2 class="text-text font-semibold text-base leading-tight truncate">
            {community().title}
          </h2>
          <p class="text-text-muted text-xs mt-0.5">{community().name}</p>
        </div>
      </div>

      {/* About */}
      <Show when={community().about}>
        <p class="px-4 pb-3 text-text-muted text-sm leading-relaxed">
          {community().about}
        </p>
      </Show>

      {/* Stats */}
      <div class="px-4 pb-4 flex gap-4 text-sm">
        <Show when={props.show_subscribers !== false}>
          <div class="text-center">
            <span class="block font-semibold text-text">
              {format_number(community().subscribers)}
            </span>
            <span class="text-text-muted text-xs">Subscribers</span>
          </div>
        </Show>
        <div class="text-center">
          <span class="block font-semibold text-text">
            {format_number(community().num_authors)}
          </span>
          <span class="text-text-muted text-xs">Authors</span>
        </div>
        <Show when={community().sum_pending > 0}>
          <div class="text-center">
            <span class="block font-semibold text-text">
              ${community().sum_pending.toFixed(0)}
            </span>
            <span class="text-text-muted text-xs">Pending</span>
          </div>
        </Show>
      </div>
    </div>
  );
};

export { CommunityProfile };
