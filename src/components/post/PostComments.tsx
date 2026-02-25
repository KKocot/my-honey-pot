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
}

// ============================================
// Constants
// ============================================

const MAX_NESTING_DEPTH = 8;

// ============================================
// Single Comment Node (recursive)
// ============================================

const CommentNode: Component<CommentNodeProps> = (props) => {
  const comment = () => props.node.comment;
  const rendered_body = createMemo(() => render_comment_body(comment().body));
  const avatar_url = () => hive_avatar_url(comment().author);
  const author_url = () => `${HIVE_BLOG_URL}/@${comment().author}`;
  const time_ago = () => formatTimeAgo(comment().created);
  const effective_depth = () => Math.min(props.depth, MAX_NESTING_DEPTH);
  const has_children = () => props.node.children.length > 0;

  const votes_count = () =>
    comment().stats?.total_votes ?? comment().active_votes?.length ?? 0;

  const payout = () => {
    const p = comment().payout;
    if (typeof p === "number" && p > 0) return p;
    const pending = parseFloat(comment().pending_payout_value ?? "0");
    return Number.isNaN(pending) ? 0 : pending;
  };

  return (
    <div
      class={effective_depth() > 0 ? "pl-4 sm:pl-6 border-l-2 border-border/50" : ""}
    >
      <article class="bg-bg-card rounded-xl border border-border p-4">
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <a href={author_url()} target="_blank" rel="noopener">
              <img
                src={avatar_url()}
                alt={comment().author}
                class="w-9 h-9 rounded-full border border-border"
                onError={(e) => {
                  (e.currentTarget).src = "/hive-logo.png";
                }}
              />
            </a>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <a
                href={author_url()}
                target="_blank"
                rel="noopener"
                class="font-semibold text-text hover:text-primary transition-colors"
              >
                {comment().author}
              </a>
              <span class="text-text-muted">·</span>
              <time
                class="text-text-muted text-sm"
                datetime={comment().created}
              >
                {time_ago()}
              </time>
            </div>

            <div
              class="mt-2 rendered-content text-text break-words leading-relaxed"
              innerHTML={rendered_body()}
            />

            <div class="flex items-center gap-6 mt-3 text-text-muted">
              <Show when={has_children()}>
                <div class="flex items-center gap-1.5 text-sm">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span>{props.node.children.length}</span>
                </div>
              </Show>

              <Show when={votes_count() > 0}>
                <div class="flex items-center gap-1.5 text-sm">
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
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                  <span>{votes_count()}</span>
                </div>
              </Show>

              <Show when={payout() > 0}>
                <div class="flex items-center gap-1.5 text-sm">
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
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>${payout().toFixed(2)}</span>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </article>

      <Show when={has_children()}>
        <div class="mt-2 flex flex-col gap-2">
          <For each={props.node.children}>
            {(child) => (
              <CommentNode node={child} depth={props.depth + 1} />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

// ============================================
// Comments List (inner, needs QueryClientProvider)
// ============================================

const PostCommentsInner: Component<PostCommentsProps> = (props) => {
  const replies_query = createQuery(() => ({
    queryKey: query_keys.post_replies(props.author, props.permlink),
    queryFn: () => fetch_post_replies(props.author, props.permlink),
    staleTime: 1000 * 60 * 5,
  }));

  return (
    <section class="mt-8 pt-6 border-t border-border">
      <h2 class="text-xl font-bold text-text mb-6">
        Comments
        <Show when={replies_query.data}>
          {(data) => (
            <span class="text-text-muted font-normal text-base ml-2">
              ({data().total_count})
            </span>
          )}
        </Show>
      </h2>

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
            <div class="flex flex-col gap-4">
              <For each={data().tree}>
                {(node) => <CommentNode node={node} depth={0} />}
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
