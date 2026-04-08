// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import {
  createSignal,
  createMemo,
  Show,
  For,
  ErrorBoundary,
  onCleanup,
  type Component,
} from "solid-js";
import {
  QueryClientProvider,
  createQuery,
  useQueryClient,
} from "@tanstack/solid-query";
import type { CommentTreeNode } from "../../lib/queries";
import {
  query_keys,
  fetch_post_replies,
  create_query_client,
} from "../../lib/queries";
import { render_comment_body } from "../../lib/comment_renderer";
import { hive_avatar_url, HIVE_BLOG_URL } from "../../lib/config";
import { formatTimeAgo } from "../../shared/formatters";
import { sign_comment } from "../../lib/signer-relay";
import { VoteButton } from "../ui/VoteButton";
import { get_stored_username, set_stored_username } from "../../lib/hive-auth";

// ============================================
// Types
// ============================================

interface PostCommentsProps {
  author: string;
  permlink: string;
}

interface CommentNodeProps {
  node: CommentTreeNode;
  depth: number;
  onCommentSuccess?: () => void;
}

// ============================================
// Constants
// ============================================

const MAX_NESTING_DEPTH = 8;

type CommentSortOrder = "trending" | "new" | "votes";

const DEPTH_BORDER_COLORS = [
  "border-l-blue-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-purple-500",
  "border-l-rose-500",
  "border-l-cyan-500",
  "border-l-orange-500",
  "border-l-indigo-500",
] as const;

function get_border_class(depth: number): string {
  return DEPTH_BORDER_COLORS[depth % DEPTH_BORDER_COLORS.length];
}

function count_all_descendants(node: CommentTreeNode): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + count_all_descendants(child);
  }
  return count;
}

function sort_comment_tree(nodes: CommentTreeNode[], order: CommentSortOrder): CommentTreeNode[] {
  const sorted = [...nodes];
  sorted.sort((a, b) => {
    // Demote hidden comments in trending/new
    if (order !== "votes") {
      if (a.hidden !== b.hidden) return a.hidden ? 1 : -1;
    }

    switch (order) {
      case "trending": {
        const a_payout = parseFloat(a.comment.pending_payout_value ?? "0");
        const b_payout = parseFloat(b.comment.pending_payout_value ?? "0");
        return (Number.isNaN(b_payout) ? 0 : b_payout) - (Number.isNaN(a_payout) ? 0 : a_payout);
      }
      case "new": {
        const time_a = new Date(a.comment.created).getTime();
        const time_b = new Date(b.comment.created).getTime();
        if (Number.isNaN(time_a) || Number.isNaN(time_b)) return 0;
        return time_b - time_a;
      }
      case "votes":
        return (b.comment.stats?.total_votes ?? 0) - (a.comment.stats?.total_votes ?? 0);
    }
  });
  return sorted;
}

// ============================================
// CommentForm
// ============================================

type FormStatus = "idle" | "sending" | "success" | "error";

const CommentForm: Component<{
  parent_author: string;
  parent_permlink: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}> = (props) => {
  let form_timeout: ReturnType<typeof setTimeout> | undefined;
  const [body, set_body] = createSignal("");
  const [username, set_username] = createSignal(get_stored_username());
  const [status, set_status] = createSignal<FormStatus>("idle");
  const [error_msg, set_error_msg] = createSignal("");

  onCleanup(() => {
    if (form_timeout) clearTimeout(form_timeout);
  });

  const can_submit = () =>
    body().trim().length > 0 && username().trim().length > 0 && status() !== "sending";

  async function handle_submit(e: Event) {
    e.preventDefault();
    if (!can_submit()) return;

    const trimmed_username = username().trim();
    set_stored_username(trimmed_username);
    set_status("sending");
    set_error_msg("");

    const permlink = `re-${props.parent_author}-${Date.now()}`;
    const json_metadata = JSON.stringify({ app: "my-honey-pot/1.0" });

    try {
      const result = await sign_comment(
        trimmed_username,
        permlink,
        props.parent_author,
        props.parent_permlink,
        "",
        body().trim(),
        json_metadata,
      );

      if (result.success) {
        set_status("success");
        set_body("");
        props.onSuccess?.();
        form_timeout = setTimeout(() => set_status("idle"), 4000);
      } else {
        set_status("error");
        set_error_msg(result.error ?? "Unknown error");
      }
    } catch (err) {
      set_status("error");
      set_error_msg(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <form onSubmit={handle_submit} class="bg-bg-card rounded-xl border border-border p-4 mb-6">
      <h3 class="text-text font-semibold mb-3">Leave a reply</h3>

      <div class="mb-3">
        <label class="block text-text-muted text-sm mb-1" for="comment-username">
          Hive username
        </label>
        <input
          id="comment-username"
          type="text"
          placeholder="your-username"
          value={username()}
          onInput={(e) => set_username(e.currentTarget.value)}
          class="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div class="mb-3">
        <label class="block text-text-muted text-sm mb-1" for="comment-body">
          Comment
        </label>
        <textarea
          id="comment-body"
          rows={4}
          placeholder="Write your comment..."
          value={body()}
          onInput={(e) => set_body(e.currentTarget.value)}
          class="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-text placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
        />
      </div>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          disabled={!can_submit()}
          class="bg-primary hover:bg-primary-hover text-primary-text font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Show when={status() === "sending"} fallback="Reply">
            Waiting for signer...
          </Show>
        </button>

        <Show when={props.onCancel}>
          <button
            type="button"
            onClick={props.onCancel}
            class="text-text-muted hover:text-text font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </Show>

        <Show when={status() === "success"}>
          <span class="text-sm text-primary" role="status">Comment submitted successfully!</span>
        </Show>

        <Show when={status() === "error"}>
          <span class="text-sm text-error" role="alert">{error_msg()}</span>
        </Show>
      </div>
    </form>
  );
};

// ============================================
// Single Comment Node (recursive)
// ============================================

const CommentNode: Component<CommentNodeProps> = (props) => {
  const comment = () => props.node.comment;
  const rendered_body = createMemo(() => render_comment_body(comment().body));
  const avatar_url = () => hive_avatar_url(comment().author);
  const author_url = () => `${HIVE_BLOG_URL}/@${comment().author}`;
  const comment_key = () => `${comment().author}/${comment().permlink}`;
  const time_ago = () => formatTimeAgo(comment().created);
  const has_children = () => props.node.children.length > 0;
  const border_class = () => get_border_class(props.depth);
  const [collapsed, set_collapsed] = createSignal(false);
  const [revealed, set_revealed] = createSignal(false);
  const [show_reply_form, set_show_reply_form] = createSignal(false);

  const votes_count = () =>
    comment().stats?.total_votes ?? comment().active_votes?.length ?? 0;

  const payout = () => {
    const p = comment().payout;
    if (typeof p === "number" && p > 0) return p;
    const pending = parseFloat(comment().pending_payout_value ?? "0");
    return Number.isNaN(pending) ? 0 : pending;
  };

  const descendant_count = createMemo(() => count_all_descendants(props.node));

  return (
    <div
      id={`@${comment_key()}`}
      class={`border-l-2 py-2 pl-2 sm:pl-4 transition-all duration-300 ${border_class()} ${props.depth > 0 ? "mt-3" : "mt-4"}`}
      classList={{ "opacity-50 hover:opacity-100": props.node.hidden && !revealed() }}
    >
      {/* Comment header */}
      <div class="mb-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => set_collapsed(!collapsed())}
          class="text-text-muted hover:text-text flex min-h-8 min-w-8 shrink-0 items-center justify-center rounded font-mono text-sm font-bold transition-colors"
          aria-label={collapsed()
            ? `Expand comment by @${comment().author}`
            : `Collapse comment by @${comment().author}`}
          aria-expanded={!collapsed()}
        >
          [{collapsed() ? "+" : "\u2212"}]
        </button>

        <a href={author_url()} target="_blank" rel="noopener" class="shrink-0">
          <img
            src={avatar_url()}
            alt={comment().author}
            class="w-8 h-8 rounded-full border border-border"
            onError={(e) => {
              (e.currentTarget).src = "/hive-logo.png";
            }}
          />
        </a>

        <a
          href={author_url()}
          target="_blank"
          rel="noopener"
          class="text-text text-xs font-semibold hover:underline"
        >
          @{comment().author}
        </a>

        <a
          href={`#@${comment_key()}`}
          class="text-text-muted hover:text-text text-xs transition-colors"
        >
          <time datetime={comment().created} title={new Date(comment().created.endsWith("Z") ? comment().created : comment().created + "Z").toLocaleString()}>
            {time_ago()}
          </time>
        </a>

        {/* Permalink icon */}
        <a
          href={`#@${comment_key()}`}
          class="text-text-muted hover:text-text shrink-0 transition-colors"
          title="Permalink"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </a>

        <Show when={props.node.hidden}>
          <button
            type="button"
            class="text-text-muted hover:text-text ml-auto text-xs underline transition-colors"
            onClick={() => set_revealed(!revealed())}
          >
            {revealed() ? "Hide" : `Reveal (${props.node.hide_reason})`}
          </button>
        </Show>
      </div>

      <Show when={collapsed()}>
        {/* Collapsed summary */}
        <Show when={has_children()}>
          <button
            type="button"
            onClick={() => set_collapsed(false)}
            class="text-text-muted hover:text-text mb-1 text-xs transition-colors"
          >
            [{descendant_count()} {descendant_count() === 1 ? "comment" : "comments"} hidden]
          </button>
        </Show>
      </Show>

      <Show when={!collapsed() && props.node.hidden && !revealed()}>
        {/* Hidden placeholder */}
        <p class="text-text-muted mb-2 text-xs italic">
          Comment hidden ({props.node.hide_reason})
        </p>

        {/* Still show nested replies */}
        <Show when={has_children() && props.depth < MAX_NESTING_DEPTH}>
          <div class="mt-2 flex flex-col gap-2">
            <For each={props.node.children}>
              {(child) => (
                <CommentNode node={child} depth={props.depth + 1} onCommentSuccess={props.onCommentSuccess} />
              )}
            </For>
          </div>
        </Show>
      </Show>

      <Show when={!collapsed() && (!props.node.hidden || revealed())}>
        {/* Comment body */}
        <div
          class="mt-2 mb-2 rendered-content text-text break-words leading-relaxed text-sm"
          innerHTML={rendered_body()}
        />

        {/* Comment footer */}
        <div class="mb-1 flex items-center gap-4 text-text-muted">
          <VoteButton
            author={comment().author}
            permlink={comment().permlink}
            initial_votes_count={votes_count()}
            initial_payout={payout()}
            show_payout={payout() > 0}
            size="sm"
          />

          <button
            type="button"
            onClick={() => set_show_reply_form(!show_reply_form())}
            class="flex items-center gap-1.5 text-xs hover:text-primary transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Reply
          </button>

          <Show when={has_children()}>
            <span class="flex items-center gap-1 text-xs">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {props.node.children.length}
            </span>
          </Show>
        </div>

        {/* Reply form */}
        <Show when={show_reply_form()}>
          <div class="mt-2">
            <CommentForm
              parent_author={comment().author}
              parent_permlink={comment().permlink}
              onCancel={() => set_show_reply_form(false)}
              onSuccess={props.onCommentSuccess}
            />
          </div>
        </Show>

        {/* Nested replies */}
        <Show when={has_children() && props.depth < MAX_NESTING_DEPTH}>
          <div class="mt-2 flex flex-col">
            <For each={props.node.children}>
              {(child) => (
                <CommentNode node={child} depth={props.depth + 1} onCommentSuccess={props.onCommentSuccess} />
              )}
            </For>
          </div>
        </Show>

        {/* Continue this thread... */}
        <Show when={has_children() && props.depth >= MAX_NESTING_DEPTH}>
          <a
            href={`${HIVE_BLOG_URL}/@${comment().author}/${comment().permlink}`}
            target="_blank"
            rel="noopener"
            class="text-primary mt-1 block text-xs hover:underline"
          >
            Continue this thread...
          </a>
        </Show>
      </Show>
    </div>
  );
};

// ============================================
// Comments List (inner, needs QueryClientProvider)
// ============================================

const SORT_OPTIONS: { value: CommentSortOrder; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "new", label: "New" },
  { value: "votes", label: "Votes" },
];

const PostCommentsInner: Component<PostCommentsProps> = (props) => {
  const query_client = useQueryClient();
  const [show_form, set_show_form] = createSignal(false);
  const [sort_order, set_sort_order] = createSignal<CommentSortOrder>("trending");

  const invalidate_replies = () => {
    setTimeout(() => {
      query_client.invalidateQueries({ queryKey: query_keys.post_replies(props.author, props.permlink) });
    }, 4000);
  };

  const replies_query = createQuery(() => ({
    queryKey: query_keys.post_replies(props.author, props.permlink),
    queryFn: () => fetch_post_replies(props.author, props.permlink),
    staleTime: 1000 * 60 * 5,
  }));

  const sorted_tree = createMemo(() => {
    const data = replies_query.data;
    if (!data) return [];
    return sort_comment_tree(data.tree, sort_order());
  });

  // Scroll to hash comment on load
  if (typeof window !== "undefined") {
    const scroll_to_hash = () => {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith("#@")) return;
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "bg-primary/10", "rounded-md");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "bg-primary/10", "rounded-md");
      }, 3000);
    };
    // Delay to let tree render
    setTimeout(scroll_to_hash, 800);
    window.addEventListener("hashchange", scroll_to_hash);
    onCleanup(() => window.removeEventListener("hashchange", scroll_to_hash));
  }

  return (
    <section class="mt-8 pt-6 border-t border-border">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-bold text-text">
          Comments
          <Show when={replies_query.data}>
            {(data) => (
              <span class="text-text-muted font-normal text-base ml-2">
                ({data().total_count})
              </span>
            )}
          </Show>
        </h2>

        <Show when={replies_query.data && (replies_query.data?.tree.length ?? 0) > 1}>
          <div class="flex items-center gap-2">
            <label for="comment-sort" class="text-text-muted text-xs">Sort by</label>
            <select
              id="comment-sort"
              class="bg-bg-card border-border text-text rounded-md border px-3 py-1.5 text-sm"
              value={sort_order()}
              onChange={(e) => {
                const value = e.currentTarget.value as CommentSortOrder;
                if (SORT_OPTIONS.some((o) => o.value === value)) {
                  set_sort_order(value);
                }
              }}
            >
              <For each={SORT_OPTIONS}>
                {(option) => <option value={option.value}>{option.label}</option>}
              </For>
            </select>
          </div>
        </Show>
      </div>

      <Show
        when={show_form()}
        fallback={
          <button
            type="button"
            onClick={() => set_show_form(true)}
            class="bg-bg-card hover:border-primary/50 border border-border rounded-xl px-4 py-3 mb-6 text-text-muted hover:text-text transition-colors w-full text-left"
          >
            Write a comment...
          </button>
        }
      >
        <CommentForm
          parent_author={props.author}
          parent_permlink={props.permlink}
          onCancel={() => set_show_form(false)}
          onSuccess={invalidate_replies}
        />
      </Show>

      <Show when={replies_query.isLoading}>
        <div class="text-center py-8 text-text-muted">
          Loading comments...
        </div>
      </Show>

      <Show when={replies_query.isError}>
        <div class="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
          Failed to load comments.
        </div>
      </Show>

      <Show when={replies_query.data}>
        {(data) => (
          <Show
            when={data().tree.length > 0}
            fallback={
              <div class="text-center py-8 bg-bg-card rounded-xl border border-border">
                <p class="text-text-muted">No comments yet</p>
              </div>
            }
          >
            <div class="flex flex-col">
              <For each={sorted_tree()}>
                {(node) => <CommentNode node={node} depth={0} onCommentSuccess={invalidate_replies} />}
              </For>
            </div>
          </Show>
        )}
      </Show>
    </section>
  );
};

// ============================================
// Wrapper with QueryClientProvider
// ============================================

export const PostComments: Component<PostCommentsProps> = (props) => {
  const [query_client] = createSignal(create_query_client());

  onCleanup(() => {
    query_client().clear();
  });

  return (
    <ErrorBoundary
      fallback={() => (
        <div class="bg-error/10 text-error p-4 rounded-lg mt-8">
          Failed to load comments. Please refresh the page.
        </div>
      )}
    >
      <QueryClientProvider client={query_client()}>
        <PostCommentsInner {...props} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
