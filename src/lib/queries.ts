// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { QueryClient } from "@tanstack/solid-query";
import {
  configureEndpoints,
  DataProvider,
  getWax,
  Post,
  type BridgeComment,
  type IDatabaseAccount,
  type IProfile,
  type IGlobalProperties,
  type IAccountManabars,
  type AccountPostsSortOption,
  type CommentSortOption,
  type IPaginationCursor,
} from "@hiveio/workerbee/blog-logic";
import { HIVE_API_ENDPOINTS } from "./config";

// Configure workerbee to use our custom Hive API endpoints
// This must be called before the first getWax() call
configureEndpoints(HIVE_API_ENDPOINTS);

// ============================================
// Query Client Factory (per-request on server)
// ============================================

/**
 * Create a new QueryClient instance for each request
 * NEVER create a global singleton on the server - it would leak data between users
 */
export function create_query_client(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes - important for hydration to work
        retry: 1,
      },
    },
  });
}

// ============================================
// Query Keys Factory
// ============================================

export const query_keys = {
  profile: (username: string) => ["profile", username] as const,
  database_account: (username: string) => ["database_account", username] as const,
  global_properties: () => ["global_properties"] as const,
  manabars: (username: string) => ["manabars", username] as const,
  posts: (
    username: string,
    sort: AccountPostsSortOption,
    limit: number,
    cursor?: IPaginationCursor,
    categoryTag?: string | null
  ) => ["posts", username, sort, limit, cursor, categoryTag] as const,
  comments: (
    username: string,
    sort: CommentSortOption,
    limit: number,
    cursor?: IPaginationCursor
  ) => ["comments", username, sort, limit, cursor] as const,
};

// ============================================
// Query Function Return Types
// ============================================

export interface FetchPostsResult {
  posts: Post[];
  has_more: boolean;
  next_cursor?: IPaginationCursor;
}

export interface FetchCommentsResult {
  comments: readonly BridgeComment[];
  has_more: boolean;
  next_cursor?: IPaginationCursor;
}

// ============================================
// Query Functions
// ============================================

/**
 * Fetch user profile from Hive blockchain
 */
export async function fetch_profile(username: string): Promise<IProfile | null> {
  const chain = await getWax();
  const data_provider = new DataProvider(chain);
  return data_provider.getProfile(username);
}

/**
 * Fetch database account data (balances, vesting shares)
 */
export async function fetch_database_account(
  username: string
): Promise<IDatabaseAccount | null> {
  const chain = await getWax();
  const data_provider = new DataProvider(chain);
  return data_provider.getDatabaseAccount(username);
}

/**
 * Fetch global properties (needed for VESTS to HP conversion)
 */
export async function fetch_global_properties(): Promise<IGlobalProperties> {
  const chain = await getWax();
  const data_provider = new DataProvider(chain);
  return data_provider.getGlobalProperties();
}

/**
 * Fetch account manabars (voting power, RC)
 */
export async function fetch_manabars(
  username: string
): Promise<IAccountManabars | null> {
  const chain = await getWax();
  const data_provider = new DataProvider(chain);
  const account = await data_provider.bloggingPlatform.getAccount(username);
  return account.getManabars();
}

/**
 * Fetch posts with optional category filtering and pagination
 */
export async function fetch_posts(
  username: string,
  sort: AccountPostsSortOption,
  limit: number,
  cursor?: IPaginationCursor,
  category_tag?: string | null
): Promise<FetchPostsResult> {
  const chain = await getWax();
  const data_provider = new DataProvider(chain);

  // API hard limit is 20
  const page_size = Math.min(limit, 20);

  // Fetch posts from Hive
  const posts_iterator = await data_provider.bloggingPlatform.enumAccountPosts(
    { sort, account: username },
    { page: 1, pageSize: page_size }
  );

  const posts_array = Array.from(posts_iterator);
  const all_posts = posts_array.filter((p): p is Post => p instanceof Post);

  // Filter by tag if this is a category tab
  let filtered_posts = all_posts;
  if (category_tag) {
    filtered_posts = all_posts.filter((post) => post.tags.includes(category_tag));
  }

  // Only enable pagination for non-category tabs
  let has_more = false;
  let next_cursor: IPaginationCursor | undefined;

  if (!category_tag) {
    has_more = all_posts.length >= page_size;
    const last_post = all_posts[all_posts.length - 1];
    if (last_post) {
      next_cursor = { startAuthor: last_post.author, startPermlink: last_post.permlink };
    }
  }

  return {
    posts: filtered_posts,
    has_more,
    next_cursor,
  };
}

/**
 * Fetch comments with pagination
 */
export async function fetch_comments(
  username: string,
  sort: CommentSortOption,
  limit: number,
  cursor?: IPaginationCursor
): Promise<FetchCommentsResult> {
  const chain = await getWax();
  const data_provider = new DataProvider(chain);

  const result = await data_provider.getCommentsPaginated(username, sort, limit, cursor);

  return {
    comments: result.items,
    has_more: result.hasMore,
    next_cursor: result.nextCursor,
  };
}
