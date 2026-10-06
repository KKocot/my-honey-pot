// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { QueryClient } from "@tanstack/solid-query";
import {
  configureEndpoints,
  DataProvider,
  getWax,
  resetWax,
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
// Configure workerbee to use our custom Hive API endpoints
// This must be called before the first getWax() call
configureEndpoints(HIVE_API_ENDPOINTS);

// ============================================
// Hive availability: timeout + typed error
// ============================================

const HIVE_REQUEST_TIMEOUT_MS = 4000;

/** Hive API timed out or failed at transport level (distinct from "not found"). */
export class HiveUnavailableError extends Error {
  constructor(operation: string, options?: { cause?: unknown }) {
    super(`Hive API unavailable during ${operation}`, options);
    this.name = "HiveUnavailableError";
  }
}

/**
 * Run a Hive call with a hard deadline. wax/workerbee accept no AbortSignal, so the
 * underlying request keeps running; we stop waiting and rotate the node for later calls.
 */
export async function with_hive_timeout<T>(
  operation: string,
  hive_call: () => Promise<T>,
  timeout_ms: number = HIVE_REQUEST_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      resetWax();
      reject(new HiveUnavailableError(`${operation} (timeout ${timeout_ms} ms)`));
    }, timeout_ms);
  });
  try {
    return await Promise.race([hive_call(), deadline]);
  } catch (error) {
    if (error instanceof HiveUnavailableError || is_hive_not_found(error)) throw error;
    throw new HiveUnavailableError(operation, { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

/** Hivemind asserts "Post ... does not exist" / "Account ... does not exist" for missing objects. */
function is_hive_not_found(error: unknown): boolean {
  return error instanceof Error && error.message.includes("does not exist");
}

function describe_error(error: unknown): string {
  if (error instanceof HiveUnavailableError && error.cause instanceof Error) {
    return `${error.message}: ${error.cause.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}

// ============================================
// Server-side read-through cache (TTL + single-flight)
// ============================================

const SERVER_CACHE_TTL_MS = 60_000;
const SERVER_CACHE_MAX_ENTRIES = 500;

interface ServerCacheEntry {
  value: unknown;
  expires_at: number;
}

const server_cache = new Map<string, ServerCacheEntry>();
const in_flight_reads = new Map<string, Promise<unknown>>();

// Hive account names are case-insensitive; one lowercase key per account/post avoids duplicate entries
const account_key = (name: string) => name.toLowerCase();

export const server_cache_keys = {
  blog_config: (username: string) => `blog_config:${account_key(username)}`,
  profile: (username: string) => `profile:${account_key(username)}`,
  global_properties: () => "global_properties",
  posts: (
    username: string,
    sort: AccountPostsSortOption,
    limit: number,
    cursor: IPaginationCursor | undefined,
    category_tag: string | null | undefined
  ) =>
    `posts:${account_key(username)}:${sort}:${limit}:${account_key(cursor?.startAuthor ?? "")}/${cursor?.startPermlink ?? ""}:${category_tag ?? ""}`,
  comments: (
    username: string,
    sort: CommentSortOption,
    limit: number,
    cursor: IPaginationCursor | undefined
  ) =>
    `comments:${account_key(username)}:${sort}:${limit}:${account_key(cursor?.startAuthor ?? "")}/${cursor?.startPermlink ?? ""}`,
  single_post: (author: string, permlink: string) => `single_post:${account_key(author)}/${permlink}`,
  post_replies: (author: string, permlink: string) => `post_replies:${account_key(author)}/${permlink}`,
};

function remember_in_server_cache(key: string, value: unknown): void {
  const now = Date.now();
  server_cache.delete(key);
  server_cache.set(key, { value, expires_at: now + SERVER_CACHE_TTL_MS });
  if (server_cache.size <= SERVER_CACHE_MAX_ENTRIES) return;
  for (const [cached_key, entry] of server_cache) {
    if (entry.expires_at <= now) server_cache.delete(cached_key);
  }
  while (server_cache.size > SERVER_CACHE_MAX_ENTRIES) {
    const oldest_key = server_cache.keys().next().value;
    if (oldest_key === undefined) break;
    server_cache.delete(oldest_key);
  }
}

/**
 * Process-wide read-through cache for Hive reads (server only; browser calls go straight to Hive).
 * Concurrent reads of one key share a single request; errors and values rejected by
 * `is_cacheable` are never stored.
 */
export async function read_through_server_cache<T>(
  key: string,
  load: () => Promise<T>,
  is_cacheable: (value: T) => boolean
): Promise<T> {
  if (typeof window !== "undefined") return load();

  const cached = server_cache.get(key);
  if (cached && cached.expires_at > Date.now()) return cached.value as T;

  const pending = in_flight_reads.get(key);
  if (pending) return pending as Promise<T>;

  const loading = (async () => {
    try {
      const loaded = await load();
      if (is_cacheable(loaded)) remember_in_server_cache(key, loaded);
      return loaded;
    } finally {
      in_flight_reads.delete(key);
    }
  })();
  in_flight_reads.set(key, loading);
  return loading;
}

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

  // Post replies (comments under a specific post)
  post_replies: (author: string, permlink: string) =>
    ["post_replies", author, permlink] as const,

  user_subscriptions: (username: string) => ["user_subscriptions", username] as const,
};

// ============================================
// Query Function Return Types
// ============================================

export interface FetchPostsResult {
  posts: BridgePost[];
  has_more: boolean;
  next_cursor?: IPaginationCursor;
  total_before_filter: number;
}

export interface FetchCommentsResult {
  comments: readonly BridgeComment[];
  has_more: boolean;
  next_cursor?: IPaginationCursor;
}

export interface CommentTreeNode {
  comment: BridgePost;
  children: CommentTreeNode[];
  hidden: boolean;
  hide_reason: string;
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
  try {
    return await with_hive_timeout("fetch_profile", async () => {
      const data_provider = new DataProvider(await getWax());
      return data_provider.getProfile(username);
    });
  } catch (error) {
    console.error("fetch_profile failed:", describe_error(error));
    return null;
  }
}

/**
 * Fetch database account data (balances, vesting shares)
 */
export async function fetch_database_account(
  username: string
): Promise<IDatabaseAccount | null> {
  try {
    return await with_hive_timeout("fetch_database_account", async () => {
      const data_provider = new DataProvider(await getWax());
      return data_provider.getDatabaseAccount(username);
    });
  } catch (error) {
    console.error("fetch_database_account failed:", describe_error(error));
    return null;
  }
}

/**
 * Fetch global properties (needed for VESTS to HP conversion)
 */
export async function fetch_global_properties(): Promise<IGlobalProperties | null> {
  try {
    return await with_hive_timeout("fetch_global_properties", async () => {
      const data_provider = new DataProvider(await getWax());
      return data_provider.getGlobalProperties();
    });
  } catch (error) {
    console.error("fetch_global_properties failed:", describe_error(error));
    return null;
  }
}

/**
 * Fetch account manabars (voting power, RC)
 */
export async function fetch_manabars(
  username: string
): Promise<IAccountManabars | null> {
  try {
    return await with_hive_timeout("fetch_manabars", async () => {
      const data_provider = new DataProvider(await getWax());
      const account = await data_provider.bloggingPlatform.getAccount(username);
      return account.getManabars();
    });
  } catch (error) {
    console.error("fetch_manabars failed:", describe_error(error));
    return null;
  }
}

/**
 * Fetch a single post by author and permlink using bridge.get_discussion.
 * Returns null when the post does not exist; throws HiveUnavailableError on timeout/transport failure.
 *
 * NOTE: bridge.get_discussion fetches the full comment tree, which is heavier
 * than needed for a single post. However, @hiveio/wax does not expose a lighter
 * alternative (e.g. condenser_api.get_content).
 */
export async function fetch_single_post_or_throw(
  author: string,
  permlink: string
): Promise<BridgePost | null> {
  return read_through_server_cache(
    server_cache_keys.single_post(author, permlink),
    async () => {
      try {
        const discussion = await with_hive_timeout("fetch_single_post", () =>
          withRetry((chain) =>
            chain.api.bridge.get_discussion({ author, permlink, observer: "" })
          )
        );
        const post = discussion[`${author}/${permlink}`];
        return post && post.author ? (post as BridgePost) : null;
      } catch (error) {
        if (is_hive_not_found(error)) return null;
        throw error;
      }
    },
    (post) => post !== null
  );
}

/** Same as fetch_single_post_or_throw, but swallows Hive failures as null (legacy contract). */
export async function fetch_single_post(
  author: string,
  permlink: string
): Promise<BridgePost | null> {
  try {
    return await fetch_single_post_or_throw(author, permlink);
  } catch (error) {
    console.error("fetch_single_post failed:", describe_error(error));
    return null;
  }
}

/**
 * Fetch posts with optional category filtering and cursor-based pagination.
 * Calls get_account_posts directly (bypassing enumAccountPosts which lacks cursor support).
 */
export async function fetch_posts_or_throw(
  username: string,
  sort: AccountPostsSortOption,
  limit: number,
  cursor?: IPaginationCursor,
  category_tag?: string | null
): Promise<FetchPostsResult> {
  if (!username) {
    return { posts: [], has_more: false, total_before_filter: 0 };
  }

  return read_through_server_cache(
    server_cache_keys.posts(username, sort, limit, cursor, category_tag),
    () => load_account_posts(username, sort, limit, cursor, category_tag),
    (page) => page.total_before_filter > 0
  );
}

/** Same as fetch_posts_or_throw, but swallows Hive failures as an empty page (legacy contract). */
export async function fetch_posts(
  username: string,
  sort: AccountPostsSortOption,
  limit: number,
  cursor?: IPaginationCursor,
  category_tag?: string | null
): Promise<FetchPostsResult> {
  try {
    return await fetch_posts_or_throw(username, sort, limit, cursor, category_tag);
  } catch (error) {
    console.error("fetch_posts failed:", describe_error(error));
    return { posts: [], has_more: false, total_before_filter: 0 };
  }
}

async function load_account_posts(
  username: string,
  sort: AccountPostsSortOption,
  limit: number,
  cursor: IPaginationCursor | undefined,
  category_tag: string | null | undefined
): Promise<FetchPostsResult> {
  // Request one extra to detect if more pages exist
  const safe_limit = Math.min(Math.max(1, limit), 19);
  const request_limit = safe_limit + 1;

  let posts;
  try {
    posts = await with_hive_timeout("fetch_posts", () =>
      withRetry((chain) =>
        chain.api.bridge.get_account_posts({
          sort,
          account: username,
          limit: request_limit,
          observer: "",
          ...(cursor?.startAuthor && cursor?.startPermlink
            ? { start_author: cursor.startAuthor, start_permlink: cursor.startPermlink }
            : {}),
        })
      )
    );
  } catch (error) {
    if (is_hive_not_found(error)) return { posts: [], has_more: false, total_before_filter: 0 };
    throw error;
  }

  const has_more_raw = posts.length > safe_limit;
  const all_posts = has_more_raw ? posts.slice(0, safe_limit) : posts;

  // Filter by tag if this is a category tab
  let filtered_posts = all_posts;
  if (category_tag) {
    filtered_posts = all_posts.filter((post) => {
      try {
        const metadata = typeof post.json_metadata === "string"
          ? JSON.parse(post.json_metadata)
          : post.json_metadata;
        return metadata?.tags?.includes(category_tag);
      } catch {
        return false;
      }
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
    total_before_filter: all_posts.length,
  };
}

/**
 * Fetch comments with pagination. Throws HiveUnavailableError on timeout/transport failure.
 */
export async function fetch_comments_or_throw(
  username: string,
  sort: CommentSortOption,
  limit: number,
  cursor?: IPaginationCursor
): Promise<FetchCommentsResult> {
  return read_through_server_cache(
    server_cache_keys.comments(username, sort, limit, cursor),
    async () => {
      try {
        const page = await with_hive_timeout("fetch_comments", async () => {
          const data_provider = new DataProvider(await getWax());
          return data_provider.getCommentsPaginated(username, sort, limit, cursor);
        });
        return { comments: page.items, has_more: page.hasMore, next_cursor: page.nextCursor };
      } catch (error) {
        if (is_hive_not_found(error)) return { comments: [], has_more: false };
        throw error;
      }
    },
    (page) => page.comments.length > 0
  );
}

/** Same as fetch_comments_or_throw, but swallows Hive failures as an empty page (legacy contract). */
export async function fetch_comments(
  username: string,
  sort: CommentSortOption,
  limit: number,
  cursor?: IPaginationCursor
): Promise<FetchCommentsResult> {
  try {
    return await fetch_comments_or_throw(username, sort, limit, cursor);
  } catch (error) {
    console.error("fetch_comments failed:", describe_error(error));
    return { comments: [], has_more: false };
  }
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

function get_hide_reason(comment: BridgePost): string {
  if (comment.author_role === "muted") return "muted";
  if (comment.author_reputation < MIN_REPUTATION) return "low reputation";
  if (comment.stats.hide) return "hidden by community";
  if (comment.stats.gray) return "low ratings";
  return "";
}

const OWNER_ONLY_PERMLINKS = new Set(["my-threads"]);

/**
 * Fetch full comment tree under a specific post.
 * Uses bridge.get_discussion which returns the full discussion tree as a flat map,
 * then builds a nested tree structure. Hidden comments are kept with a flag.
 */
export async function fetch_post_replies_or_throw(
  author: string,
  permlink: string
): Promise<FetchPostRepliesResult> {
  return read_through_server_cache(
    server_cache_keys.post_replies(author, permlink),
    async () => {
      try {
        const discussion = await with_hive_timeout("fetch_post_replies", () =>
          withRetry((chain) =>
            chain.api.bridge.get_discussion({ author, permlink, observer: "" })
          )
        );
        return build_reply_tree(discussion, author, permlink);
      } catch (error) {
        if (is_hive_not_found(error)) return { tree: [], total_count: 0 };
        throw error;
      }
    },
    (replies) => replies.tree.length > 0
  );
}

/** Same as fetch_post_replies_or_throw, but swallows Hive failures as an empty tree (legacy contract). */
export async function fetch_post_replies(
  author: string,
  permlink: string
): Promise<FetchPostRepliesResult> {
  try {
    return await fetch_post_replies_or_throw(author, permlink);
  } catch (error) {
    console.error("fetch_post_replies failed:", describe_error(error));
    return { tree: [], total_count: 0 };
  }
}

function build_reply_tree(
  discussion: Record<string, unknown>,
  author: string,
  permlink: string
): FetchPostRepliesResult {
  const root_key = `${author}/${permlink}`;

  // Index all valid comments by their key (hidden ones kept with flag)
  const comment_map = new Map<string, BridgePost>();
  for (const [key, entry] of Object.entries(discussion)) {
    if (key === root_key) continue;
    if (!is_bridge_post(entry)) continue;
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

    return direct_children.map((child) => {
      const child_key = `${child.author}/${child.permlink}`;
      const reason = get_hide_reason(child);
      return {
        comment: child,
        children: build_subtree(child_key, depth + 1),
        hidden: reason !== "",
        hide_reason: reason,
      };
    });
  }

  const full_tree = build_subtree(root_key);
  // Any Hive account can reply under the owner's threads post; only the owner's own entries are threads.
  const tree = OWNER_ONLY_PERMLINKS.has(permlink)
    ? full_tree.filter((node) => node.comment.author === author)
    : full_tree;

  return { tree, total_count: tree === full_tree ? comment_map.size : tree.length };
}

// ============================================
// User Subscriptions (communities)
// ============================================

export interface CommunitySubscription {
  community: string; // e.g. "hive-123456"
  title: string; // e.g. "Photography Lovers"
  role: string; // e.g. "guest"
}

export async function fetch_user_subscriptions(
  username: string
): Promise<CommunitySubscription[]> {
  try {
    const raw = await with_hive_timeout("fetch_user_subscriptions", () =>
      withRetry((chain) => chain.api.bridge.list_all_subscriptions({ account: username }))
    );
    return raw.map((entry) => ({
      community: String(entry[0]),
      title: String(entry[1]),
      role: String(entry[2]),
    }));
  } catch (error) {
    console.error("fetch_user_subscriptions failed:", describe_error(error));
    return [];
  }
}
