// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, createResource, Show, For } from "solid-js";
import type { BridgePost } from "@hiveio/workerbee/blog-logic";
import { fetch_community_posts } from "../../../lib/queries";
import { settings } from "../store";
import { currentUser } from "../../auth";
import {
  broadcast_pin_post,
  broadcast_unpin_post,
  broadcast_mute_post,
  broadcast_unmute_post,
} from "../community-broadcast";
import { showToast } from "../../ui";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "../../ui/Dialog";

// ============================================
// Types
// ============================================

type PostStatus = "pinned" | "muted" | "normal";

function get_post_status(post: BridgePost): PostStatus {
  if (post.stats.is_pinned === true) return "pinned";
  if (post.stats.gray === true) return "muted";
  return "normal";
}

function status_badge_class(status: PostStatus): string {
  switch (status) {
    case "pinned":
      return "bg-accent/20 text-accent";
    case "muted":
      return "bg-error/20 text-error";
    case "normal":
      return "bg-bg-secondary text-text-muted";
  }
}

// ============================================
// Mute Notes Dialog
// ============================================

interface MuteDialogProps {
  open: boolean;
  author: string;
  permlink: string;
  is_broadcasting: boolean;
  on_close: () => void;
  on_confirm: (notes: string) => void;
}

function MuteDialog(props: MuteDialogProps) {
  const [notes, set_notes] = createSignal("");

  const handle_confirm = () => {
    const trimmed = notes().trim();
    if (!trimmed) {
      showToast("Please provide a reason for muting this post.", "error");
      return;
    }
    props.on_confirm(trimmed);
    set_notes("");
  };

  const handle_close = () => {
    set_notes("");
    props.on_close();
  };

  return (
    <DialogContent open={() => props.open} onClose={handle_close}>
      <DialogHeader>
        <DialogTitle>Mute Post</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p class="text-sm text-text-muted mb-3">
          Muting will gray out <strong>@{props.author}/{props.permlink}</strong>.
          Please provide a reason.
        </p>
        <textarea
          value={notes()}
          onInput={(e) => set_notes(e.currentTarget.value)}
          placeholder="Reason for muting (e.g. spam, off-topic, rule violation)..."
          rows={3}
          class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text resize-y focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </DialogBody>
      <DialogFooter>
        <button
          type="button"
          onClick={handle_close}
          disabled={props.is_broadcasting}
          class="px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handle_confirm}
          disabled={props.is_broadcasting || !notes().trim()}
          class="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {props.is_broadcasting ? "Broadcasting..." : "Mute Post"}
        </button>
      </DialogFooter>
    </DialogContent>
  );
}

// ============================================
// Post Row
// ============================================

interface PostRowProps {
  post: BridgePost;
  is_broadcasting: boolean;
  on_pin: (post: BridgePost) => void;
  on_unpin: (post: BridgePost) => void;
  on_mute: (post: BridgePost) => void;
  on_unmute: (post: BridgePost) => void;
}

function PostRow(props: PostRowProps) {
  const status = () => get_post_status(props.post);
  const title_display = () =>
    props.post.title.length > 60
      ? props.post.title.slice(0, 57) + "..."
      : props.post.title;

  return (
    <tr class="border-b border-border/50 last:border-0">
      <td class="py-2 pr-3">
        <a
          href={`https://peakd.com/@${props.post.author}`}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:text-primary-hover transition-colors text-sm"
        >
          @{props.post.author}
        </a>
      </td>
      <td class="py-2 pr-3">
        <a
          href={`/${props.post.author}/${props.post.permlink}`}
          class="text-text hover:text-primary transition-colors text-sm"
          title={props.post.title}
        >
          {title_display()}
        </a>
      </td>
      <td class="py-2 pr-3">
        <span
          class={`inline-block px-2 py-0.5 text-xs font-medium rounded ${status_badge_class(status())}`}
        >
          {status()}
        </span>
      </td>
      <td class="py-2">
        <div class="flex items-center gap-1.5">
          {/* Pin / Unpin */}
          <Show
            when={status() === "pinned"}
            fallback={
              <button
                type="button"
                disabled={props.is_broadcasting}
                onClick={() => props.on_pin(props.post)}
                title="Pin post"
                class="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            }
          >
            <button
              type="button"
              disabled={props.is_broadcasting}
              onClick={() => props.on_unpin(props.post)}
              title="Unpin post"
              class="p-1.5 text-accent hover:text-accent/70 hover:bg-accent/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </Show>

          {/* Mute / Unmute */}
          <Show
            when={status() === "muted"}
            fallback={
              <button
                type="button"
                disabled={props.is_broadcasting}
                onClick={() => props.on_mute(props.post)}
                title="Mute post"
                class="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
            }
          >
            <button
              type="button"
              disabled={props.is_broadcasting}
              onClick={() => props.on_unmute(props.post)}
              title="Unmute post"
              class="p-1.5 text-error hover:text-error/70 hover:bg-error/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </Show>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Main Component
// ============================================

export function CommunityModeration() {
  const community_name = settings.hiveUsername;
  const [is_broadcasting, set_is_broadcasting] = createSignal(false);

  // Mute dialog state
  const [mute_target, set_mute_target] = createSignal<BridgePost | null>(null);

  // Fetch recent community posts (sorted by "created")
  const [posts_data, { refetch }] = createResource(
    () => community_name,
    (name) => fetch_community_posts(name, "created", 20)
  );

  const refetch_after_delay = () => {
    setTimeout(() => {
      refetch();
    }, 3000);
  };

  // ============================================
  // Action handlers
  // ============================================

  const handle_pin = async (post: BridgePost) => {
    const user = currentUser();
    if (!user) {
      showToast("Please login first", "error");
      return;
    }

    set_is_broadcasting(true);
    const result = await broadcast_pin_post(
      community_name,
      user.username,
      post.author,
      post.permlink
    );
    set_is_broadcasting(false);

    if (result.success) {
      showToast(`Pinned: ${post.title}`, "success");
      refetch_after_delay();
    } else {
      showToast(`Failed: ${result.error}`, "error");
    }
  };

  const handle_unpin = async (post: BridgePost) => {
    const user = currentUser();
    if (!user) {
      showToast("Please login first", "error");
      return;
    }

    set_is_broadcasting(true);
    const result = await broadcast_unpin_post(
      community_name,
      user.username,
      post.author,
      post.permlink
    );
    set_is_broadcasting(false);

    if (result.success) {
      showToast(`Unpinned: ${post.title}`, "success");
      refetch_after_delay();
    } else {
      showToast(`Failed: ${result.error}`, "error");
    }
  };

  const handle_mute_click = (post: BridgePost) => {
    set_mute_target(post);
  };

  const handle_mute_confirm = async (notes: string) => {
    const user = currentUser();
    const target = mute_target();
    if (!user || !target) return;

    set_is_broadcasting(true);
    const result = await broadcast_mute_post(
      community_name,
      user.username,
      target.author,
      target.permlink,
      notes
    );
    set_is_broadcasting(false);
    set_mute_target(null);

    if (result.success) {
      showToast(`Muted: ${target.title}`, "success");
      refetch_after_delay();
    } else {
      showToast(`Failed: ${result.error}`, "error");
    }
  };

  const handle_unmute = async (post: BridgePost) => {
    const user = currentUser();
    if (!user) {
      showToast("Please login first", "error");
      return;
    }

    set_is_broadcasting(true);
    const result = await broadcast_unmute_post(
      community_name,
      user.username,
      post.author,
      post.permlink,
      "Unmuted by moderator"
    );
    set_is_broadcasting(false);

    if (result.success) {
      showToast(`Unmuted: ${post.title}`, "success");
      refetch_after_delay();
    } else {
      showToast(`Failed: ${result.error}`, "error");
    }
  };

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">
        Post Moderation
      </h2>

      {/* Mute dialog */}
      <MuteDialog
        open={mute_target() !== null}
        author={mute_target()?.author ?? ""}
        permlink={mute_target()?.permlink ?? ""}
        is_broadcasting={is_broadcasting()}
        on_close={() => set_mute_target(null)}
        on_confirm={handle_mute_confirm}
      />

      {/* Loading */}
      <Show when={posts_data.loading}>
        <div class="flex items-center gap-3 py-4">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span class="text-text-muted text-sm">
            Loading community posts...
          </span>
        </div>
      </Show>

      {/* Error */}
      <Show when={posts_data.error}>
        <div class="p-4 bg-error/10 border border-error rounded-lg text-error text-sm mb-4">
          Failed to load community posts.
          <button
            type="button"
            onClick={() => refetch()}
            class="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </Show>

      {/* Posts table */}
      <Show when={posts_data()}>
        {(data) => (
          <Show
            when={data().posts.length > 0}
            fallback={
              <p class="text-sm text-text-muted py-4">
                No posts found in this community.
              </p>
            }
          >
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <th class="text-left py-2 pr-3 text-text-muted font-medium">
                      Author
                    </th>
                    <th class="text-left py-2 pr-3 text-text-muted font-medium">
                      Title
                    </th>
                    <th class="text-left py-2 pr-3 text-text-muted font-medium">
                      Status
                    </th>
                    <th class="text-left py-2 text-text-muted font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={data().posts}>
                    {(post) => (
                      <PostRow
                        post={post}
                        is_broadcasting={is_broadcasting()}
                        on_pin={handle_pin}
                        on_unpin={handle_unpin}
                        on_mute={handle_mute_click}
                        on_unmute={handle_unmute}
                      />
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        )}
      </Show>

      {/* RC warning */}
      <p class="text-xs text-text-muted flex items-center gap-1.5 mt-4">
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
        Moderation actions are blockchain transactions that cost Resource Credits
        (RC). Changes may take a few seconds to propagate.
      </p>
    </div>
  );
}
