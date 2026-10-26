// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { load_and_prepare_config } from "../config-pipeline";
import {
  create_query_client,
  query_keys,
  fetch_profile,
  fetch_database_account,
  fetch_global_properties,
  fetch_manabars,
  fetch_posts_or_throw,
  fetch_comments_or_throw,
  fetch_post_replies_or_throw,
  fetch_single_post,
  read_through_server_cache,
  server_cache_keys,
  HiveUnavailableError,
  type FetchPostsResult,
  type FetchCommentsResult,
  type FetchPostRepliesResult,
} from "../queries";
import { dehydrate_to_json } from "../dehydrate";
import type {
  AccountPostsSortOption,
  CommentSortOption,
  IPaginationCursor,
  BridgePost,
  BridgeComment,
  IDatabaseAccount,
  IProfile,
  IGlobalProperties,
  IAccountManabars,
} from "@hiveio/workerbee/blog-logic";
import { get_default_settings } from "../../components/admin/types/settings";
import type { SiteSettings } from "../../components/home/types";
import type { UserPageData, UserQueryParams } from "./types";

export interface UserPageResult extends UserPageData {
  /** Hive API timed out or failed; the page should be served with 503. */
  hive_unavailable: boolean;
}

const HIVE_UNAVAILABLE_MESSAGE =
  "Hive blockchain API is temporarily unavailable. Please try again shortly.";

// ============================================
// Tab resolution
// ============================================

interface ResolvedTabs {
  active_tab: string;
  show_comments_tab: boolean;
  active_category_tag: string | null;
}

function resolve_tabs(
  settings: SiteSettings,
  requested_tab: string | undefined
): ResolvedTabs {
  const comments_tab_config = settings.navigationTabs?.find(
    (tab) => tab.id === "comments"
  );
  const show_comments_tab = comments_tab_config?.enabled !== false;

  const tab_from_url = requested_tab || "blog";
  const known_tab_ids = [
    "blog",
    "posts",
    "comments",
    ...(settings.navigationTabs?.map((t) => t.id) || []),
  ];
  const validated_tab = known_tab_ids.includes(tab_from_url)
    ? tab_from_url
    : "blog";

  const threads_tab_config = settings.navigationTabs?.find(
    (tab) => tab.id === "threads"
  );
  const show_threads_tab = threads_tab_config?.enabled === true;

  let active_tab = validated_tab;
  if (active_tab === "comments" && !show_comments_tab) active_tab = "blog";
  if (active_tab === "threads" && !show_threads_tab) active_tab = "blog";

  const active_category_tab = settings.navigationTabs?.find(
    (tab) => tab.id === active_tab && tab.tag
  );
  const active_category_tag = active_category_tab?.tag || null;

  return { active_tab, show_comments_tab, active_category_tag };
}

// ============================================
// Pagination cursor parsing
// ============================================

function parse_cursor(
  start_author: string | undefined,
  start_permlink: string | undefined
): IPaginationCursor | undefined {
  if (start_author && start_permlink) {
    return { startAuthor: start_author, startPermlink: start_permlink };
  }
  return undefined;
}

// ============================================
// Cached profile reads (shared across requests on the server)
// ============================================

function fetch_profile_cached(username: string) {
  return read_through_server_cache(
    server_cache_keys.profile(username),
    () => fetch_profile(username),
    (profile) => profile !== null
  );
}

function fetch_global_properties_cached() {
  return read_through_server_cache(
    server_cache_keys.global_properties(),
    () => fetch_global_properties(),
    (properties) => properties !== null
  );
}

// ============================================
// Main SSR function
// ============================================

/**
 * Prepares all SSR data for user mode homepage.
 * Loads config from Hive, prefetches profile/account/posts/comments,
 * dehydrates query client state for client-side hydration.
 */
export async function prepare_user_page(
  hive_username: string,
  query_params: UserQueryParams
): Promise<UserPageResult> {
  let error: string | null = null;
  let hive_unavailable = false;

  // Load settings through unified pipeline (migrations + mode-specific defaults)
  let settings: SiteSettings;
  try {
    settings = await load_and_prepare_config(hive_username, false);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to load config from Hive:", message);
    if (err instanceof HiveUnavailableError) hive_unavailable = true;
    settings = { ...get_default_settings(false), hiveUsername: hive_username };
  }

  const { active_tab, show_comments_tab, active_category_tag } = resolve_tabs(
    settings,
    query_params.tab
  );

  const cursor = parse_cursor(
    query_params.start_author,
    query_params.start_permlink
  );

  const posts_limit = settings.postsPerPage || 20;

  // Determine sort based on active tab
  let posts_sort_order: AccountPostsSortOption;
  if (active_tab === "blog") {
    posts_sort_order = "blog";
  } else if (active_tab === "posts") {
    posts_sort_order = "posts";
  } else {
    posts_sort_order = settings.postsSortOrder || "blog";
  }

  const comments_sort_order: CommentSortOption =
    settings.commentsSortOrder || "comments";

  // Create per-request QueryClient (NEVER global on server)
  const query_client = create_query_client();

  let blog_logic_posts: BridgePost[] = [];
  let hive_comments: readonly BridgeComment[] = [];
  let threads: FetchPostRepliesResult | null = null;
  let has_more_posts = false;
  let has_more_comments = false;
  let next_posts_cursor: IPaginationCursor | undefined;
  let next_comments_cursor: IPaginationCursor | undefined;
  let total_fetched_before_filter = 0;
  let pinned_posts: BridgePost[] = [];

  try {
    // Fetch pinned posts in parallel with profile/account data
    const pinned_permlinks = settings.pinnedPostPermlinks ?? [];
    // Pinned posts are secondary (like the profile): a failed one is dropped, not a 503
    const pinned_promise = Promise.all(
      pinned_permlinks.map((permlink) => fetch_single_post(hive_username, permlink))
    );

    // Prefetch profile, account, global properties, manabars in parallel
    await Promise.allSettled([
      query_client.prefetchQuery({
        queryKey: query_keys.profile(hive_username),
        queryFn: () => fetch_profile_cached(hive_username),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.database_account(hive_username),
        queryFn: () => fetch_database_account(hive_username),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.global_properties(),
        queryFn: () => fetch_global_properties_cached(),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.manabars(hive_username),
        queryFn: () => fetch_manabars(hive_username),
      }),
    ]);

    // Fetch content based on active tab
    if (active_tab === "threads") {
      // Threads = comments under the author's "my-threads" post
      threads = await fetch_post_replies_or_throw(hive_username, "my-threads");
    } else if (active_tab === "comments" && show_comments_tab) {
      await query_client.prefetchQuery({
        queryKey: query_keys.comments(
          hive_username,
          comments_sort_order,
          posts_limit,
          cursor
        ),
        queryFn: () =>
          fetch_comments_or_throw(
            hive_username,
            comments_sort_order,
            posts_limit,
            cursor
          ),
      });

      const comments_data = query_client.getQueryData<FetchCommentsResult>(
        query_keys.comments(
          hive_username,
          comments_sort_order,
          posts_limit,
          cursor
        )
      );
      throw_if_query_failed(
        query_client.getQueryState(
          query_keys.comments(hive_username, comments_sort_order, posts_limit, cursor)
        )?.error
      );
      if (comments_data) {
        hive_comments = comments_data.comments;
        has_more_comments = comments_data.has_more;
        next_comments_cursor = comments_data.next_cursor;
      }
    } else {
      await query_client.prefetchQuery({
        queryKey: query_keys.posts(
          hive_username,
          posts_sort_order,
          posts_limit,
          cursor,
          active_category_tag
        ),
        queryFn: () =>
          fetch_posts_or_throw(
            hive_username,
            posts_sort_order,
            posts_limit,
            cursor,
            active_category_tag
          ),
      });

      const posts_data = query_client.getQueryData<FetchPostsResult>(
        query_keys.posts(
          hive_username,
          posts_sort_order,
          posts_limit,
          cursor,
          active_category_tag
        )
      );
      throw_if_query_failed(
        query_client.getQueryState(
          query_keys.posts(
            hive_username,
            posts_sort_order,
            posts_limit,
            cursor,
            active_category_tag
          )
        )?.error
      );
      if (posts_data) {
        blog_logic_posts = posts_data.posts;
        has_more_posts = posts_data.has_more;
        next_posts_cursor = posts_data.next_cursor;
        total_fetched_before_filter = posts_data.total_before_filter;
      }
    }
    // Collect pinned posts (runs in parallel with above fetches)
    pinned_posts = (await pinned_promise).filter(
      (post): post is BridgePost => post !== null
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching Hive data:", message);
    if (err instanceof HiveUnavailableError) hive_unavailable = true;
    error = "Error fetching data from Hive blockchain.";
  }

  if (hive_unavailable) error = HIVE_UNAVAILABLE_MESSAGE;

  const hive_profile =
    query_client.getQueryData<IProfile>(query_keys.profile(hive_username)) ?? null;
  const hive_account =
    query_client.getQueryData<IDatabaseAccount>(query_keys.database_account(hive_username)) ??
    null;
  const global_properties =
    query_client.getQueryData<IGlobalProperties>(query_keys.global_properties()) ?? null;
  const account_manabars =
    query_client.getQueryData<IAccountManabars>(query_keys.manabars(hive_username)) ?? null;

  const dehydrated_state = dehydrate_to_json(query_client);

  return {
    settings,
    dehydrated_state,
    hive_account,
    hive_profile,
    global_properties,
    account_manabars,
    blog_logic_posts,
    hive_comments,
    active_tab,
    show_comments_tab,
    active_category_tag,
    posts_sort_order,
    comments_sort_order,
    posts_limit,
    has_more_posts,
    has_more_comments,
    next_posts_cursor,
    next_comments_cursor,
    total_fetched_before_filter,
    threads,
    pinned_posts,
    error,
    hive_unavailable,
  };
}

function throw_if_query_failed(query_error: Error | null | undefined): void {
  if (query_error) throw query_error;
}
