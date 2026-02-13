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
  fetch_posts,
  fetch_comments,
  type FetchPostsResult,
  type FetchCommentsResult,
} from "../queries";
import { dehydrate_to_json } from "../dehydrate";
import type {
  AccountPostsSortOption,
  CommentSortOption,
  IPaginationCursor,
  Post,
  BridgeComment,
} from "@hiveio/workerbee/blog-logic";
import { get_default_settings } from "../../components/admin/types/settings";
import type { SiteSettings } from "../../components/home/types";
import type { UserPageData, UserQueryParams } from "./types";

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

  const tab_from_url = requested_tab || "posts";
  const known_tab_ids = [
    "posts",
    "comments",
    ...(settings.navigationTabs?.map((t) => t.id) || []),
  ];
  const validated_tab = known_tab_ids.includes(tab_from_url)
    ? tab_from_url
    : "posts";

  const active_tab =
    validated_tab === "comments" && !show_comments_tab ? "posts" : validated_tab;

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
): Promise<UserPageData> {
  let error: string | null = null;

  // Load settings through unified pipeline (migrations + mode-specific defaults)
  let settings: SiteSettings;
  try {
    settings = await load_and_prepare_config(hive_username, false);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to load config from Hive:", message);
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
  const posts_sort_order: AccountPostsSortOption =
    settings.postsSortOrder || "blog";
  const comments_sort_order: CommentSortOption =
    settings.commentsSortOrder || "comments";

  // Create per-request QueryClient (NEVER global on server)
  const query_client = create_query_client();

  let blog_logic_posts: Post[] = [];
  let hive_comments: readonly BridgeComment[] = [];
  let has_more_posts = false;
  let has_more_comments = false;
  let next_posts_cursor: IPaginationCursor | undefined;
  let next_comments_cursor: IPaginationCursor | undefined;
  let total_fetched_before_filter = 0;

  try {
    // Prefetch profile, account, global properties, manabars in parallel
    await Promise.allSettled([
      query_client.prefetchQuery({
        queryKey: query_keys.profile(hive_username),
        queryFn: () => fetch_profile(hive_username),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.database_account(hive_username),
        queryFn: () => fetch_database_account(hive_username),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.global_properties(),
        queryFn: () => fetch_global_properties(),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.manabars(hive_username),
        queryFn: () => fetch_manabars(hive_username),
      }),
    ]);

    // Fetch posts or comments based on active tab
    if (active_tab === "comments" && show_comments_tab) {
      await query_client.prefetchQuery({
        queryKey: query_keys.comments(
          hive_username,
          comments_sort_order,
          posts_limit,
          cursor
        ),
        queryFn: () =>
          fetch_comments(
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
          fetch_posts(
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
      if (posts_data) {
        blog_logic_posts = posts_data.posts;
        has_more_posts = posts_data.has_more;
        next_posts_cursor = posts_data.next_cursor;
        total_fetched_before_filter = posts_data.posts.length;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching Hive data:", message);
    error = "Error fetching data from Hive blockchain.";
  }

  const hive_profile =
    query_client.getQueryData(query_keys.profile(hive_username)) ?? null;
  const hive_account =
    query_client.getQueryData(query_keys.database_account(hive_username)) ??
    null;
  const global_properties =
    query_client.getQueryData(query_keys.global_properties()) ?? null;
  const account_manabars =
    query_client.getQueryData(query_keys.manabars(hive_username)) ?? null;

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
    error,
  };
}
