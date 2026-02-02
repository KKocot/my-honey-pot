import { createSignal, createEffect, createMemo, Show, For, ErrorBoundary, onCleanup, onMount, type Component } from "solid-js";
import { QueryClient, QueryClientProvider, createQuery, type DehydratedState, hydrate } from "@tanstack/solid-query";
import { query_keys, fetch_posts, fetch_comments, create_query_client } from "../../lib/queries";
import type { Post, BridgeComment, AccountPostsSortOption, CommentSortOption, IPaginationCursor } from "../../lib/blog-logic";
import type { SiteSettings, CardLayout } from "./types";
import {
  createPostCardDataFromPost,
  renderPostCardContent,
  renderPostsGrid,
  type PostCardSettings,
  type PostCardData,
  type PostsGridSettings,
} from "../../shared/components/post-card";
import {
  createCommentCardData,
  createCommentCardSettings,
  renderCommentCardContent,
  type CommentCardSettings,
} from "../../shared/components/comment-card";

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
  dehydrated_state?: string;
  category_tag?: string | null;
  navigation_tabs?: Array<{ id: string; label: string; tag?: string }>;
  post_card_layout?: CardLayout;
}

// ============================================
// Animation helpers (same as FullPreview)
// ============================================

// Shadow map for hover effects
const shadowMap: Record<string, string> = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
}

// Get initial scroll animation style based on type
const getInitialScrollStyle = (type: string): Record<string, string> => {
  const base: Record<string, string> = { opacity: '0' }
  switch (type) {
    case 'fade':
      return base
    case 'slide-up':
      return { ...base, transform: 'translateY(20px)' }
    case 'slide-left':
      return { ...base, transform: 'translateX(-20px)' }
    case 'zoom':
      return { ...base, transform: 'scale(0.9)' }
    case 'flip':
      return { ...base, transform: 'perspective(600px) rotateX(-10deg)' }
    default:
      return {}
  }
}

// Get visible scroll animation style
const getVisibleScrollStyle = (): Record<string, string> => {
  return { opacity: '1', transform: 'none' }
}

// ============================================
// Posts Grid Component (uses shared render)
// Renders multiple post cards with layout support
// ============================================

const PostsGrid: Component<{ posts: Post[]; settings: SiteSettings; layout?: CardLayout }> = (props) => {
  const is_vertical = () => props.settings.postsLayout !== 'list';

  const card_settings = createMemo((): PostCardSettings => ({
    thumbnailSizePx: props.settings.thumbnailSizePx || 96,
    cardPaddingPx: props.settings.cardPaddingPx || 24,
    cardBorderRadiusPx: props.settings.cardBorderRadiusPx || 16,
    titleSizePx: props.settings.titleSizePx || 20,
    summaryMaxLength: props.settings.summaryMaxLength || 150,
    maxTags: props.settings.maxTags || 5,
    cardBorder: props.settings.cardBorder !== false,
    postCardLayout: props.layout || props.settings.postCardLayout,
    cardHoverEffect: props.settings.cardHoverEffect || "none",
    cardTransitionDuration: props.settings.cardTransitionDuration || 200,
    cardHoverScale: props.settings.cardHoverScale || 1.02,
    cardHoverShadow: props.settings.cardHoverShadow || "lg",
    cardHoverBrightness: props.settings.cardHoverBrightness || 1.05,
  }));

  const grid_settings = createMemo((): PostsGridSettings => ({
    layout: props.settings.postsLayout || "list",
    columns: props.settings.gridColumns || 2,
    gap_px: props.settings.cardGapPx || 24,
  }));

  // Render grid layout wrapper, each card rendered individually via PostCardItem
  return (
    <div>
      <Show when={props.posts.length > 0} fallback={
        <div class="text-center py-8 bg-bg-card rounded-xl border border-border">
          <p class="text-text-muted">No posts found</p>
        </div>
      }>
        {/* List layout */}
        <Show when={grid_settings().layout === 'list'}>
          <div style={`display: flex; flex-direction: column; gap: ${grid_settings().gap_px}px;`}>
            <For each={props.posts}>
              {(post, index) => <PostCardItem post={post} settings={props.settings} card_settings={card_settings()} is_vertical={false} index={index()} />}
            </For>
          </div>
        </Show>
        {/* Masonry layout */}
        <Show when={grid_settings().layout === 'masonry'}>
          <div style={`column-count: ${grid_settings().columns}; column-gap: ${grid_settings().gap_px}px;`}>
            <For each={props.posts}>
              {(post, index) => (
                <div style={`break-inside: avoid; margin-bottom: ${grid_settings().gap_px}px;`}>
                  <PostCardItem post={post} settings={props.settings} card_settings={card_settings()} is_vertical={true} index={index()} />
                </div>
              )}
            </For>
          </div>
        </Show>
        {/* Grid layout */}
        <Show when={grid_settings().layout === 'grid'}>
          <div style={`display: grid; grid-template-columns: repeat(${grid_settings().columns}, 1fr); gap: ${grid_settings().gap_px}px;`}>
            <For each={props.posts}>
              {(post, index) => <PostCardItem post={post} settings={props.settings} card_settings={card_settings()} is_vertical={true} index={index()} />}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

// Single post card - uses renderPostCardContent (same as FullPreview)
// With hover and scroll animations (1:1 match with FullPreview)
const PostCardItem: Component<{
  post: Post;
  settings: SiteSettings;
  card_settings: PostCardSettings;
  is_vertical: boolean;
  index: number;
}> = (props) => {
  // Effective vertical = prop override OR settings override OR layout-based
  const effective_vertical = () => props.is_vertical || props.settings.cardLayout === 'vertical' || props.settings.postsLayout !== 'list';

  // Hover state
  const [is_hovered, set_is_hovered] = createSignal(false);
  // Scroll animation visibility state
  const [is_visible, set_is_visible] = createSignal(false);

  // Trigger scroll animation on mount with staggered delay
  onMount(() => {
    if (props.settings.scrollAnimationType !== 'none' && props.settings.scrollAnimationEnabled) {
      const delay = props.index * (props.settings.scrollAnimationDelay || 100);
      setTimeout(() => set_is_visible(true), delay);
    } else {
      set_is_visible(true);
    }
  });

  const [post_data, set_post_data] = createSignal<PostCardData | null>(null);

  createEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await createPostCardDataFromPost(props.post, {
        thumbnailSizePx: props.settings.thumbnailSizePx || 96,
        maxTags: props.settings.maxTags || 5,
        summaryMaxLength: props.settings.summaryMaxLength || 150,
      });
      if (!cancelled) set_post_data(data);
    })();
    onCleanup(() => { cancelled = true; });
  });

  const content_html = createMemo(() => {
    const data = post_data();
    if (!data) return "";
    return renderPostCardContent(data, props.card_settings, effective_vertical());
  });

  // Compute card styles with hover and scroll animations (same as FullPreview)
  const card_style = createMemo(() => {
    const effect = props.settings.cardHoverEffect || 'none';
    const hover_duration = props.settings.cardTransitionDuration || 200;
    const scroll_duration = props.settings.scrollAnimationDuration || 400;
    const scroll_type = props.settings.scrollAnimationType || 'none';
    const scale = props.settings.cardHoverScale || 1.02;
    const shadow = props.settings.cardHoverShadow || 'lg';
    const brightness = props.settings.cardHoverBrightness || 1.05;

    // Base styles
    const styles: Record<string, string> = {
      padding: `${props.settings.cardPaddingPx || 24}px`,
      'border-radius': `${props.settings.cardBorderRadiusPx || 16}px`,
      border: props.settings.cardBorder !== false ? '1px solid var(--color-border)' : '1px solid transparent',
      transition: `all ${scroll_duration}ms ease-out, box-shadow ${hover_duration}ms ease-out, transform ${hover_duration}ms ease-out, filter ${hover_duration}ms ease-out`,
    };

    // Apply scroll animation initial state if not visible
    if (!is_visible() && scroll_type !== 'none') {
      Object.assign(styles, getInitialScrollStyle(scroll_type));
    } else if (is_visible()) {
      Object.assign(styles, getVisibleScrollStyle());
    }

    // Apply hover effects when hovered (override scroll transform)
    if (is_hovered() && effect !== 'none') {
      if (effect === 'shadow') {
        styles['box-shadow'] = shadowMap[shadow] || shadowMap.md;
      } else if (effect === 'scale') {
        styles.transform = `scale(${scale})`;
      } else if (effect === 'lift') {
        styles.transform = `scale(${scale}) translateY(-4px)`;
        styles['box-shadow'] = shadowMap[shadow] || shadowMap.lg;
      } else if (effect === 'glow') {
        styles.filter = `brightness(${brightness})`;
        styles['box-shadow'] = '0 0 20px var(--color-primary)';
      }
    }

    return styles;
  });

  // Convert styles object to CSS string
  const card_style_string = createMemo(() => {
    const styles = card_style();
    return Object.entries(styles).map(([key, value]) => `${key}: ${value}`).join('; ');
  });

  return (
    <Show when={post_data()}>
      <article
        class="bg-bg-card rounded-xl overflow-hidden cursor-pointer"
        style={card_style_string()}
        onMouseEnter={() => set_is_hovered(true)}
        onMouseLeave={() => set_is_hovered(false)}
        onClick={() => window.location.href = `/posts/${props.post.permlink}`}
        innerHTML={content_html()}
      />
    </Show>
  );
};

// ============================================
// Comment Card Component (uses shared render)
// ============================================

// Single comment card - uses renderCommentCardContent (same as FullPreview)
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

  // Use renderCommentCardContent (same function as FullPreview) - no wrapper
  const content_html = renderCommentCardContent(comment_data, comment_settings);

  return (
    <article
      class="bg-bg-card rounded-xl border border-border"
      innerHTML={content_html}
    />
  );
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


  return (
    <div>
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
          <div class="space-y-4">
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
          <PostsGrid posts={posts_query.data?.posts || []} settings={props.settings} layout={props.post_card_layout} />
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

  // Hydrate dehydrated state if provided (arrives as JSON string to avoid cyclic reference issues)
  createEffect(() => {
    if (props.dehydrated_state) {
      const parsed: DehydratedState = JSON.parse(props.dehydrated_state);
      hydrate(query_client(), parsed);
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
