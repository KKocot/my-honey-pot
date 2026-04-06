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
}

// ============================================
// Constants
// ============================================

const MAX_NESTING_DEPTH = 8;

// ============================================
// CommentForm
// ============================================

type FormStatus = "idle" | "sending" | "success" | "error";

const CommentForm: Component<{
  parent_author: string;
  parent_permlink: string;
  onCancel?: () => void;
}> = (props) => {
  let form_timeout: ReturnType<typeof setTimeout> | undefined;
  const [body, set_body] = createSignal("");
  const [username, set_username] = createSignal("");
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
          <span class="text-sm text-primary">Comment submitted successfully!</span>
        </Show>

        <Show when={status() === "error"}>
          <span class="text-sm text-error">{error_msg()}</span>
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
  const time_ago = () => formatTimeAgo(comment().created);
  const effective_depth = () => Math.min(props.depth, MAX_NESTING_DEPTH);
  const has_children = () => props.node.children.length > 0;
  const [show_reply_form, set_show_reply_form] = createSignal(false);

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
                class="flex items-center gap-1.5 text-sm hover:text-primary transition-colors"
              >
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
                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                  />
                </svg>
                <span>Reply</span>
              </button>
            </div>
          </div>
        </div>
      </article>

      <Show when={show_reply_form()}>
        <div class="mt-2 pl-4 sm:pl-6">
          <CommentForm
            parent_author={comment().author}
            parent_permlink={comment().permlink}
            onCancel={() => set_show_reply_form(false)}
          />
        </div>
      </Show>

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
  const [show_form, set_show_form] = createSignal(false);

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
