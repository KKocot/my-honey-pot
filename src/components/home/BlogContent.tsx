import { createSignal, createEffect, Show, For, ErrorBoundary, onCleanup, type Component } from "solid-js";
import { QueryClient, QueryClientProvider, createQuery, type DehydratedState, hydrate } from "@tanstack/solid-query";
import { query_keys, fetch_posts, fetch_comments, create_query_client } from "../../lib/queries";
import type { Post, BridgeComment, AccountPostsSortOption, CommentSortOption, IPaginationCursor } from "../../lib/blog-logic";
import type { SiteSettings, CardLayout } from "./types";
import {
  createPostCardDataFromPost,
  renderPostCard,
  type PostCardSettings,
  type PostCardData,
} from "../../shared/components/post-card";
import {
  createCommentCardData,
  createCommentCardSettings,
  renderCommentCard,
  type CommentCardSettings,
} from "../../shared/components/comment-card";
import sanitize from "sanitize-html";

// ============================================
// Types
// ============================================

interface BlogContentProps {
  hive_username: string;
  initial_tab: string;
  show_comments_tab: boolean;
  posts_sort_order: AccountPostsSortOption;
  comments_sort_order: CommentSortOption;
  posts_per_page: number;
  settings: SiteSettings;
  dehydrated_state?: DehydratedState;
  category_tag?: string | null;
  navigation_tabs?: Array<{ id: string; label: string; tag?: string }>;
  post_card_layout?: CardLayout;
}

// ============================================
// Post Card Component (uses shared render)
// ============================================

const PostCard: Component<{ post: Post; settings: SiteSettings; layout?: CardLayout }> = (props) => {
  // Create PostCardData from Post (async operation wrapped in createEffect)
  const [post_card_html, set_post_card_html] = createSignal<string>("");

  createEffect(() => {
    let cancelled = false;

    // Wrap async logic in IIFE to avoid async createEffect
    (async () => {
      try {
        const post_data: PostCardData = await createPostCardDataFromPost(props.post, {
          thumbnailSizePx: props.settings.thumbnailSizePx ?? 128,
          maxTags: props.settings.maxTags ?? 3,
          summaryMaxLength: props.settings.summaryMaxLength ?? 200,
        });

        if (cancelled) return;

        const card_settings: PostCardSettings = {
          thumbnailSizePx: props.settings.thumbnailSizePx ?? 128,
          cardPaddingPx: props.settings.cardPaddingPx ?? 24,
          cardBorderRadiusPx: props.settings.cardBorderRadiusPx ?? 16,
          titleSizePx: props.settings.titleSizePx ?? 20,
          summaryMaxLength: props.settings.summaryMaxLength ?? 200,
          maxTags: props.settings.maxTags ?? 3,
          cardBorder: props.settings.cardBorder ?? true,
          postCardLayout: props.layout ?? {
            sections: [
              {
                id: "main",
                orientation: "horizontal",
                children: [
                  { type: "element", id: "thumbnail" },
                  {
                    type: "section",
                    section: {
                      id: "content",
                      orientation: "vertical",
                      children: [
                        { type: "element", id: "title" },
                        { type: "element", id: "date" },
                      ],
                    },
                  },
                ],
              },
            ],
          },
          cardHoverEffect: props.settings.cardHoverEffect ?? "shadow",
          cardTransitionDuration: props.settings.cardTransitionDuration ?? 200,
          cardHoverScale: props.settings.cardHoverScale ?? 1.02,
          cardHoverShadow: props.settings.cardHoverShadow ?? "md",
          cardHoverBrightness: props.settings.cardHoverBrightness ?? 1.0,
        };

        const html = renderPostCard(post_data, card_settings, false, `/posts/${props.post.permlink}`);

        if (cancelled) return;

        // Sanitize HTML before rendering (XSS protection)
        const sanitized_html = sanitize(html, {
          allowedTags: sanitize.defaults.allowedTags.concat(['img', 'svg', 'path', 'article', 'time']),
          allowedAttributes: {
            ...sanitize.defaults.allowedAttributes,
            img: ['src', 'alt', 'class', 'style', 'onerror'],
            a: ['href', 'target', 'rel', 'class'],
            div: ['class', 'style'],
            span: ['class', 'style'],
            article: ['class', 'style', 'data-shadow'],
            svg: ['class', 'fill', 'stroke', 'viewBox'],
            path: ['stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd'],
            time: ['class', 'datetime'],
          },
          allowedStyles: {
            '*': {
              'width': [/^\d+(?:px)?$/],
              'height': [/^\d+(?:px)?$/],
              'font-size': [/^\d+(?:px)?$/],
              'padding': [/^\d+(?:px)?$/],
              'border-radius': [/^\d+(?:px)?$/],
              'border': [/.*/],
              'object-fit': [/^cover$/],
              'flex-shrink': [/^\d+$/],
            }
          }
        });

        set_post_card_html(sanitized_html);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to render post card:", err);
        set_post_card_html(`<div>Error rendering post</div>`);
      }
    })();

    onCleanup(() => { cancelled = true; });
  });

  return <div innerHTML={post_card_html()} />;
};

// ============================================
// Comment Card Component (uses shared render)
// ============================================

const CommentCard: Component<{ comment: BridgeComment; settings: SiteSettings }> = (props) => {
  const comment_data = createCommentCardData(props.comment);

  const comment_settings: CommentCardSettings = createCommentCardSettings({
    commentShowAuthor: props.settings.commentShowAuthor,
    commentShowAvatar: props.settings.commentShowAvatar,
    commentAvatarSizePx: props.settings.commentAvatarSizePx,
    commentShowReplyContext: props.settings.commentShowReplyContext,
    commentShowTimestamp: props.settings.commentShowTimestamp,
    commentShowRepliesCount: props.settings.commentShowRepliesCount,
    commentShowVotes: props.settings.commentShowVotes,
    commentShowPayout: props.settings.commentShowPayout,
    commentShowViewLink: props.settings.commentShowViewLink,
    commentMaxLength: props.settings.commentMaxLength,
    commentPaddingPx: props.settings.commentPaddingPx,
  });

  const comment_html = renderCommentCard(comment_data, comment_settings, "list");

  // Sanitize HTML before rendering (XSS protection)
  const sanitized_html = sanitize(comment_html, {
    allowedTags: sanitize.defaults.allowedTags.concat(['img', 'svg', 'path', 'article', 'time']),
    allowedAttributes: {
      ...sanitize.defaults.allowedAttributes,
      img: ['src', 'alt', 'class', 'style', 'onerror'],
      a: ['href', 'target', 'rel', 'class'],
      div: ['class', 'style'],
      span: ['class', 'style'],
      article: ['class', 'style'],
      svg: ['class', 'fill', 'stroke', 'viewBox'],
      path: ['stroke-linecap', 'stroke-linejoin', 'stroke-width', 'd'],
      time: ['class', 'datetime'],
    },
    allowedStyles: {
      '*': {
        'width': [/^\d+(?:px)?$/],
        'height': [/^\d+(?:px)?$/],
        'padding': [/^\d+(?:px)?$/],
      }
    }
  });

  return <div innerHTML={sanitized_html} />;
};

// ============================================
// Main Component
// ============================================

const BlogContentInner: Component<BlogContentProps> = (props) => {
  const [active_tab, set_active_tab] = createSignal(props.initial_tab);
  const [page_cursor, set_page_cursor] = createSignal<IPaginationCursor | undefined>(undefined);

  // Determine if current tab is a category
  const active_category_tag = () => {
    const tab = props.navigation_tabs?.find((t) => t.id === active_tab());
    return tab?.tag || null;
  };

  // Posts query
  const posts_query = createQuery(() => ({
    queryKey: query_keys.posts(
      props.hive_username,
      props.posts_sort_order,
      props.posts_per_page,
      page_cursor(),
      active_category_tag()
    ),
    queryFn: () =>
      fetch_posts(
        props.hive_username,
        props.posts_sort_order,
        props.posts_per_page,
        page_cursor(),
        active_category_tag()
      ),
    enabled: active_tab() === "posts" || !!active_category_tag(),
    staleTime: 1000 * 60 * 5,
  }));

  // Comments query
  const comments_query = createQuery(() => ({
    queryKey: query_keys.comments(
      props.hive_username,
      props.comments_sort_order,
      props.posts_per_page,
      page_cursor()
    ),
    queryFn: () =>
      fetch_comments(
        props.hive_username,
        props.comments_sort_order,
        props.posts_per_page,
        page_cursor()
      ),
    enabled: active_tab() === "comments",
    staleTime: 1000 * 60 * 5,
  }));

  // Handle tab switch
  const handle_tab_switch = (tab_id: string) => {
    set_active_tab(tab_id);
    set_page_cursor(undefined); // Reset pagination
  };

  // Handle pagination
  const handle_next_page = () => {
    if (active_tab() === "comments") {
      const data = comments_query.data;
      if (data?.next_cursor) {
        set_page_cursor(data.next_cursor);
      }
    } else {
      const data = posts_query.data;
      if (data?.next_cursor) {
        set_page_cursor(data.next_cursor);
      }
    }
  };

  const handle_prev_page = () => {
    set_page_cursor(undefined); // Reset to first page
  };

  // Build tabs list
  const tabs = () => {
    const result = [{ id: "posts", label: "Posts" }];
    if (props.show_comments_tab) {
      result.push({ id: "comments", label: "Comments" });
    }
    // Add custom category tabs
    if (props.navigation_tabs) {
      props.navigation_tabs.forEach((tab) => {
        if (tab.id !== "posts" && tab.id !== "comments") {
          result.push(tab);
        }
      });
    }
    return result;
  };

  return (
    <div>
      {/* Tab Navigation */}
      <nav class="border-b border-border mb-6">
        <div class="flex">
          <For each={tabs()}>
            {(tab) => (
              <button
                onClick={() => handle_tab_switch(tab.id)}
                class={`relative px-6 py-4 text-sm font-medium transition-colors hover:bg-bg-card/50 ${
                  active_tab() === tab.id ? "text-text" : "text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
                <Show when={active_tab() === tab.id}>
                  <span class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                </Show>
              </button>
            )}
          </For>
        </div>
      </nav>

      {/* Content Area */}
      <Show when={active_tab() === "comments"}>
        <Show when={comments_query.isLoading}>
          <div class="text-center py-12 text-text-muted">Loading comments...</div>
        </Show>
        <Show when={comments_query.isError}>
          <div class="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
            Error loading comments: {String(comments_query.error)}
          </div>
        </Show>
        <Show when={comments_query.data}>
          <div class="flex flex-col gap-4">
            <For each={comments_query.data?.comments as BridgeComment[]}>
              {(comment) => <CommentCard comment={comment} settings={props.settings} />}
            </For>
          </div>
        </Show>
      </Show>

      <Show when={active_tab() !== "comments"}>
        <Show when={posts_query.isLoading}>
          <div class="text-center py-12 text-text-muted">Loading posts...</div>
        </Show>
        <Show when={posts_query.isError}>
          <div class="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">
            Error loading posts: {String(posts_query.error)}
          </div>
        </Show>
        <Show when={posts_query.data}>
          <div class="flex flex-col gap-4">
            <For each={posts_query.data?.posts || []}>
              {(post) => <PostCard post={post} settings={props.settings} layout={props.post_card_layout} />}
            </For>
          </div>
        </Show>
      </Show>

      {/* Pagination */}
      <Show when={!posts_query.isLoading && !comments_query.isLoading}>
        <div class="flex justify-between items-center mt-8">
          <Show when={page_cursor()}>
            <button
              onClick={handle_prev_page}
              class="px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors"
            >
              ← Previous
            </button>
          </Show>
          <Show when={!page_cursor()}>
            <div />
          </Show>

          <Show when={
            (active_tab() === "comments" && comments_query.data?.has_more) ||
            (active_tab() !== "comments" && posts_query.data?.has_more)
          }>
            <button
              onClick={handle_next_page}
              class="px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors"
            >
              Next →
            </button>
          </Show>
        </div>
      </Show>
    </div>
  );
};

// ============================================
// Wrapper with QueryClientProvider
// ============================================

export const BlogContent: Component<BlogContentProps> = (props) => {
  // SAFE: client:load means browser-only execution, no cross-request sharing
  const [query_client] = createSignal(create_query_client());

  // Hydrate dehydrated state if provided
  createEffect(() => {
    if (props.dehydrated_state) {
      hydrate(query_client(), props.dehydrated_state);
    }
  });

  return (
    <ErrorBoundary
      fallback={(err) => (
        <div class="bg-error/10 text-error p-4 rounded-lg">
          Failed to load content. Please refresh the page.
        </div>
      )}
    >
      <QueryClientProvider client={query_client()}>
        <BlogContentInner {...props} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
