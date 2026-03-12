// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { QueryClient } from "@tanstack/solid-query";
import {
  configureEndpoints,
  DataProvider,
  getWax,
  withRetry,
  type BridgeComment,
  type BridgePost,
  type IDatabaseAccount,
  type IProfile,
  type IGlobalProperties,
  type IAccountManabars,
  type AccountPostsSortOption,
  type CommentSortOption,
  type IPaginationCursor,
} from "@hiveio/workerbee/blog-logic";
import { HIVE_API_ENDPOINTS } from "./config";
import type {
  HiveCommunity,
  CommunityTeamMember,
  CommunitySubscriber,
} from "./types/community";

export type CommunitySortOrder =
  | "trending"
  | "hot"
  | "created"
  | "payout"
  | "muted";

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

  // Community query keys
  community: (name: string) => ["community", name] as const,
  community_posts: (
    name: string,
    sort: CommunitySortOrder,
    limit: number,
    cursor_author?: string,
    cursor_permlink?: string
  ) =>
    ["community_posts", name, sort, limit, cursor_author, cursor_permlink] as const,
  subscribers: (name: string) => ["subscribers", name] as const,
  community_roles: (name: string) => ["community_roles", name] as const,

  // Post replies (comments under a specific post)
  post_replies: (author: string, permlink: string) =>
    ["post_replies", author, permlink] as const,
};

// ============================================
// Query Function Return Types
// ============================================

export interface FetchPostsResult {
  posts: BridgePost[];
  has_more: boolean;
  next_cursor?: IPaginationCursor;
}

export interface FetchCommentsResult {
  comments: readonly BridgeComment[];
  has_more: boolean;
  next_cursor?: IPaginationCursor;
}

export interface CommentTreeNode {
  comment: BridgePost;
  children: CommentTreeNode[];
}

export interface FetchPostRepliesResult {
  tree: CommentTreeNode[];
  total_count: number;
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
 * Fetch posts with optional category filtering and cursor-based pagination.
 * Calls get_account_posts directly (bypassing enumAccountPosts which lacks cursor support).
 */
export async function fetch_posts(
  username: string,
  sort: AccountPostsSortOption,
  limit: number,
  cursor?: IPaginationCursor,
  category_tag?: string | null
): Promise<FetchPostsResult> {
  // Request one extra to detect if more pages exist
  const safe_limit = Math.min(Math.max(1, limit), 19);
  const request_limit = safe_limit + 1;

  const posts = await withRetry((chain) =>
    chain.api.bridge.get_account_posts({
      sort,
      account: username,
      limit: request_limit,
      observer: "",
      ...(cursor?.startAuthor && cursor?.startPermlink
        ? { start_author: cursor.startAuthor, start_permlink: cursor.startPermlink }
        : {}),
    })
  );

  const has_more_raw = posts.length > safe_limit;
  const all_posts = has_more_raw ? posts.slice(0, safe_limit) : posts;

  // Filter by tag if this is a category tab
  let filtered_posts = all_posts;
  if (category_tag) {
    filtered_posts = all_posts.filter((post) => {
      const metadata = typeof post.json_metadata === "string"
        ? JSON.parse(post.json_metadata)
        : post.json_metadata;
      return metadata?.tags?.includes(category_tag);
    });
  }

  // Only enable pagination for non-category tabs
  let has_more = false;
  let next_cursor: IPaginationCursor | undefined;

  if (!category_tag) {
    has_more = has_more_raw;
    const last_post = all_posts[all_posts.length - 1];
    if (last_post && has_more) {
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

// ============================================
// Community Query Functions
// ============================================

export interface FetchCommunityPostsResult {
  posts: BridgePost[];
  has_more: boolean;
  next_author?: string;
  next_permlink?: string;
}

/**
 * Fetch community details (title, about, description, rules, team, subscribers count)
 * Uses withRetry for automatic endpoint rotation on timeout.
 */
export async function fetch_community(name: string): Promise<HiveCommunity | null> {
  return withRetry((chain) =>
    chain.api.bridge.get_community({ name, observer: "" })
  );
}

/**
 * Fetch community posts with server-side pagination via get_ranked_posts.
 * Sort options: "trending" | "hot" | "created" | "payout" | "muted"
 * Pagination: pass start_author + start_permlink from previous page's last post.
 */
export async function fetch_community_posts(
  name: string,
  sort: CommunitySortOrder,
  limit: number,
  start_author?: string,
  start_permlink?: string
): Promise<FetchCommunityPostsResult> {
  // Build params as variable to allow extra fields not typed in SDK.
  // Hive bridge API accepts limit/start_author/start_permlink but
  // @hiveio/wax-api-jsonrpc GetRankedPosts omits them (SDK limitation).
  const params = {
    sort,
    tag: name,
    observer: "",
    limit,
    ...(start_author && start_permlink
      ? { start_author, start_permlink }
      : {}),
  };

  const posts = await withRetry((chain) =>
    chain.api.bridge.get_ranked_posts(params)
  );

  const has_more = posts.length >= limit;
  const last_post = posts[posts.length - 1];

  return {
    posts,
    has_more,
    next_author: last_post?.author,
    next_permlink: last_post?.permlink,
  };
}

/**
 * Fetch community subscribers list.
 * Returns array of tuples: [username, role, title, ...]
 */
export async function fetch_subscribers(
  name: string
): Promise<CommunitySubscriber[]> {
  return withRetry((chain) =>
    chain.api.bridge.list_subscribers({ community: name })
  );
}

/**
 * Fetch community roles (moderators, admins, members).
 * Returns array of tuples: [username, role, title]
 */
export async function fetch_community_roles(
  name: string
): Promise<CommunityTeamMember[]> {
  return withRetry((chain) =>
    chain.api.bridge.list_community_roles({ community: name })
  );
}

// ============================================
// Post Replies (comments under a specific post)
// ============================================

function is_bridge_post(entry: unknown): entry is BridgePost {
  if (typeof entry !== "object" || entry === null) return false;
  return (
    "author" in entry &&
    typeof entry.author === "string" &&
    "permlink" in entry &&
    typeof entry.permlink === "string" &&
    "parent_author" in entry &&
    typeof entry.parent_author === "string" &&
    "parent_permlink" in entry &&
    typeof entry.parent_permlink === "string" &&
    "body" in entry &&
    typeof entry.body === "string" &&
    "created" in entry &&
    typeof entry.created === "string" &&
    "author_reputation" in entry &&
    typeof entry.author_reputation === "number" &&
    "stats" in entry &&
    typeof entry.stats === "object" &&
    entry.stats !== null &&
    "gray" in entry.stats &&
    typeof entry.stats.gray === "boolean" &&
    "hide" in entry.stats &&
    typeof entry.stats.hide === "boolean"
  );
}

/** Hive bridge API returns reputation as a pre-calculated float (e.g. 25.5). Negative values indicate heavily downvoted accounts. */
const MIN_REPUTATION = 0;

function should_hide_comment(comment: BridgePost): boolean {
  return (
    comment.author_reputation < MIN_REPUTATION ||
    comment.stats.gray === true ||
    comment.stats.hide === true ||
    comment.author_role === "muted"
  );
}

function sort_newest_first(nodes: BridgePost[]): BridgePost[] {
  return [...nodes].sort((a, b) => {
    const time_a = new Date(a.created).getTime();
    const time_b = new Date(b.created).getTime();
    if (Number.isNaN(time_a) || Number.isNaN(time_b)) return 0;
    return time_b - time_a;
  });
}

/**
 * Fetch full comment tree under a specific post.
 * Uses bridge.get_discussion which returns the full discussion tree as a flat map,
 * then builds a nested tree structure with hidden comments filtered out.
 */
export async function fetch_post_replies(
  author: string,
  permlink: string
): Promise<FetchPostRepliesResult> {
  const discussion = await withRetry((chain) =>
    chain.api.bridge.get_discussion({ author, permlink, observer: "" })
  );

  const root_key = `${author}/${permlink}`;

  // Index all valid, visible comments by their key
  const comment_map = new Map<string, BridgePost>();
  for (const [key, entry] of Object.entries(discussion)) {
    if (key === root_key) continue;
    if (!is_bridge_post(entry)) continue;
    if (should_hide_comment(entry)) continue;
    comment_map.set(key, entry);
  }

  // Build children lookup: parent_key -> list of child BridgePosts
  const children_map = new Map<string, BridgePost[]>();
  for (const [, comment] of comment_map) {
    const parent_key = `${comment.parent_author}/${comment.parent_permlink}`;
    const siblings = children_map.get(parent_key);
    if (siblings) {
      siblings.push(comment);
    } else {
      children_map.set(parent_key, [comment]);
    }
  }

  function build_subtree(parent_key: string, depth = 0): CommentTreeNode[] {
    if (depth > 50) return [];

    const direct_children = children_map.get(parent_key);
    if (!direct_children) return [];

    const sorted = sort_newest_first(direct_children);

    return sorted.map((child) => {
      const child_key = `${child.author}/${child.permlink}`;
      return {
        comment: child,
        children: build_subtree(child_key, depth + 1),
      };
    });
  }

  const tree = build_subtree(root_key);

  return { tree, total_count: comment_map.size };
}
