import {
  createHiveChain,
  type IHiveChainInterface,
  type TWaxApiRequest,
} from "@hiveio/wax";

// ============================================================================
// Hive Chain Client - Single instance for entire application
// ============================================================================

const HIVE_API_ENDPOINT = "https://api.dev.openhive.network";

let chainInstance: ReturnType<IHiveChainInterface["extend"]> | null = null;
let chainPromise: Promise<ReturnType<IHiveChainInterface["extend"]>> | null = null;

// Reset on HMR in dev mode
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    chainInstance = null;
    chainPromise = null;
  });
}

/**
 * Get the singleton Hive chain instance.
 * This ensures chain is created only once across the entire application.
 */
export async function getHiveChain(): Promise<ReturnType<IHiveChainInterface["extend"]>> {
  // Return cached instance if available
  if (chainInstance) {
    return chainInstance;
  }

  // If initialization is in progress, wait for it
  if (chainPromise) {
    return chainPromise;
  }

  // Start initialization
  chainPromise = (async () => {
    const baseChain = await createHiveChain({
      apiEndpoint: HIVE_API_ENDPOINT,
      apiTimeout: 10000, // 10 seconds timeout
    });

    chainInstance = baseChain.extend<THiveApi>();
    return chainInstance;
  })();

  return chainPromise;
}

// ============================================================================
// Bridge API Types - Posts
// ============================================================================

/** Active vote on a post */
export interface BridgeActiveVote {
  readonly voter: string;
  readonly rshares: number;
}

/** Post statistics */
export interface BridgePostStats {
  readonly hide: boolean;
  readonly gray: boolean;
  readonly total_votes: number;
  readonly flag_weight: number;
}

/** Beneficiary configuration */
export interface BridgeBeneficiary {
  readonly account: string;
  readonly weight: number;
}

/** Post object returned by bridge API */
export interface BridgePost {
  readonly post_id: number;
  readonly author: string;
  readonly permlink: string;
  readonly category: string;
  readonly title: string;
  readonly body: string;
  readonly json_metadata: string;
  readonly created: string;
  readonly updated: string;
  readonly depth: number;
  readonly children: number;
  readonly net_rshares: number;
  readonly is_paidout: boolean;
  readonly payout_at: string;
  readonly payout: number;
  readonly pending_payout_value: string;
  readonly author_payout_value: string;
  readonly curator_payout_value: string;
  readonly max_accepted_payout: string;
  readonly percent_hbd: number;
  readonly url: string;
  readonly author_reputation: number;
  readonly author_role: string | null;
  readonly author_title: string | null;
  readonly beneficiaries: readonly BridgeBeneficiary[];
  readonly blacklists: readonly string[];
  readonly community: string | null;
  readonly community_title: string | null;
  readonly stats: BridgePostStats;
  readonly active_votes: readonly BridgeActiveVote[];
  readonly replies: readonly string[];
  readonly reblogs: number;
}

/** Parameters for get_account_posts */
export interface GetAccountPostsParams {
  readonly sort: "blog" | "feed" | "posts" | "comments" | "replies" | "payout";
  readonly account: string;
  readonly start_author?: string;
  readonly start_permlink?: string;
  readonly limit?: number;
  readonly observer?: string;
}

/** Parameters for get_post */
export interface GetPostParams {
  readonly author: string;
  readonly permlink: string;
  readonly observer?: string;
}

/** Parameters for get_ranked_posts */
export interface GetRankedPostsParams {
  readonly sort:
    | "trending"
    | "hot"
    | "created"
    | "promoted"
    | "payout"
    | "payout_comments"
    | "muted";
  readonly tag?: string;
  readonly observer?: string;
  readonly start_author?: string;
  readonly start_permlink?: string;
  readonly limit?: number;
}

// ============================================================================
// Bridge API Types - Profile
// ============================================================================

/** Profile metadata */
export interface BridgeProfileMetadata {
  readonly profile?: {
    readonly name?: string;
    readonly about?: string;
    readonly location?: string;
    readonly website?: string;
    readonly profile_image?: string;
    readonly cover_image?: string;
    readonly blacklist_description?: string;
    readonly muted_list_description?: string;
  };
}

/** Profile statistics */
export interface BridgeProfileStats {
  readonly followers: number;
  readonly following: number;
  readonly rank: number;
}

/** Profile object returned by bridge.get_profile */
export interface BridgeProfile {
  readonly id: number;
  readonly name: string;
  readonly created: string;
  readonly active: string;
  readonly post_count: number;
  readonly reputation: number;
  readonly blacklists: readonly string[];
  readonly stats: BridgeProfileStats;
  readonly metadata: BridgeProfileMetadata;
}

/** Parameters for get_profile */
export interface GetProfileParams {
  readonly account: string;
  readonly observer?: string;
}

// ============================================================================
// Bridge API Types - Discussion
// ============================================================================

/** Parameters for get_discussion */
export interface GetDiscussionParams {
  readonly author: string;
  readonly permlink: string;
  readonly observer?: string;
}

/** Discussion result - map of author/permlink to post */
export type BridgeDiscussion = Record<string, BridgePost>;

// ============================================================================
// Database API Types - Accounts (for financial data)
// ============================================================================

/** Authority structure */
export interface DatabaseAuthority {
  readonly weight_threshold: number;
  readonly account_auths: readonly (readonly [string, number])[];
  readonly key_auths: readonly (readonly [string, number])[];
}

/** Manabar structure */
export interface DatabaseManabar {
  readonly current_mana: string;
  readonly last_update_time: number;
}

/** Account object from database_api */
export interface DatabaseAccount {
  readonly id: number;
  readonly name: string;
  readonly owner: DatabaseAuthority;
  readonly active: DatabaseAuthority;
  readonly posting: DatabaseAuthority;
  readonly memo_key: string;
  readonly json_metadata: string;
  readonly posting_json_metadata: string;
  readonly proxy: string;
  readonly last_owner_update: string;
  readonly last_account_update: string;
  readonly created: string;
  readonly mined: boolean;
  readonly recovery_account: string;
  readonly last_account_recovery: string;
  readonly reset_account: string;
  readonly comment_count: number;
  readonly lifetime_vote_count: number;
  readonly post_count: number;
  readonly can_vote: boolean;
  readonly voting_manabar: DatabaseManabar;
  readonly downvote_manabar: DatabaseManabar;
  readonly voting_power: number;
  readonly balance: string;
  readonly savings_balance: string;
  readonly hbd_balance: string;
  readonly hbd_seconds: string;
  readonly hbd_seconds_last_update: string;
  readonly hbd_last_interest_payment: string;
  readonly savings_hbd_balance: string;
  readonly savings_hbd_seconds: string;
  readonly savings_hbd_seconds_last_update: string;
  readonly savings_hbd_last_interest_payment: string;
  readonly savings_withdraw_requests: number;
  readonly reward_hbd_balance: string;
  readonly reward_hive_balance: string;
  readonly reward_vesting_balance: string;
  readonly reward_vesting_hive: string;
  readonly vesting_shares: string;
  readonly delegated_vesting_shares: string;
  readonly received_vesting_shares: string;
  readonly vesting_withdraw_rate: string;
  readonly post_voting_power: string;
  readonly next_vesting_withdrawal: string;
  readonly withdrawn: number;
  readonly to_withdraw: number;
  readonly withdraw_routes: number;
  readonly pending_transfers: number;
  readonly curation_rewards: number;
  readonly posting_rewards: number;
  readonly proxied_vsf_votes: readonly string[];
  readonly witnesses_voted_for: number;
  readonly last_post: string;
  readonly last_root_post: string;
  readonly last_vote_time: string;
  readonly post_bandwidth: number;
  readonly pending_claimed_accounts: number;
  readonly governance_vote_expiration_ts: string;
}

/** Parameters for find_accounts */
export interface FindAccountsParams {
  readonly accounts: readonly string[];
}

/** Result of find_accounts */
export interface FindAccountsResult {
  readonly accounts: readonly DatabaseAccount[];
}

// ============================================================================
// Wax API Extension Types
// ============================================================================

type TBridgeApi = {
  bridge: {
    get_account_posts: TWaxApiRequest<GetAccountPostsParams, BridgePost[]>;
    get_post: TWaxApiRequest<GetPostParams, BridgePost | null>;
    get_profile: TWaxApiRequest<GetProfileParams, BridgeProfile | null>;
    get_discussion: TWaxApiRequest<GetDiscussionParams, BridgeDiscussion>;
    get_ranked_posts: TWaxApiRequest<GetRankedPostsParams, BridgePost[]>;
  };
};

type TDatabaseApi = {
  database_api: {
    find_accounts: TWaxApiRequest<FindAccountsParams, FindAccountsResult>;
  };
};

type THiveApi = TBridgeApi & TDatabaseApi;

// ============================================================================
// Helper Functions
// ============================================================================

/** Max limit for bridge API calls */
const MAX_API_LIMIT = 20;

/** Available sort options for posts */
export type PostSortOption = "blog" | "posts" | "payout";

/** Available sort options for comments */
export type CommentSortOption = "comments" | "replies";

/** Pagination cursor for cursor-based pagination */
export interface PaginationCursor {
  startAuthor?: string;
  startPermlink?: string;
}

/** Result with pagination info */
export interface PaginatedResult<T> {
  items: readonly T[];
  hasMore: boolean;
  nextCursor?: PaginationCursor;
}

/**
 * Get blog posts for a user using bridge.get_account_posts
 * Returns posts authored by the user (blog sort includes reblogs)
 * Note: API limit is max 20 per request
 */
export async function getHiveBlogPosts(
  username: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const chain = await getHiveChain();
  const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT);

  const posts = await chain.api.bridge.get_account_posts({
    sort: "blog",
    account: username,
    limit: safeLimit,
  });

  // Filter to only include posts by this author (exclude reblogs)
  return posts.filter((post) => post.author === username);
}

/**
 * Get posts for a user with pagination and sorting support
 * @param username - Hive username
 * @param sort - Sort option: "blog", "posts", "payout"
 * @param limit - Number of posts to fetch (max 20)
 * @param cursor - Pagination cursor (start_author, start_permlink)
 * @param includeReblogs - Include reblogs in "blog" sort
 */
export async function getHivePostsPaginated(
  username: string,
  sort: PostSortOption = "blog",
  limit = 20,
  cursor?: PaginationCursor,
  includeReblogs = false
): Promise<PaginatedResult<BridgePost>> {
  const chain = await getHiveChain();
  // API has hard limit of 20, so we limit user's request to 19 to have room for +1 check
  const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT - 1);
  // Request one extra to check if there are more (still within API limit of 20)
  const requestLimit = safeLimit + 1;

  const params: GetAccountPostsParams = {
    sort,
    account: username,
    limit: requestLimit,
    ...(cursor?.startAuthor && cursor?.startPermlink ? {
      start_author: cursor.startAuthor,
      start_permlink: cursor.startPermlink,
    } : {}),
  };

  const posts = await chain.api.bridge.get_account_posts(params);
  // API already excludes the cursor post, so no need to skip first element

  // Filter reblogs if needed for "blog" sort
  let filteredPosts = posts;
  if (sort === "blog" && !includeReblogs) {
    filteredPosts = posts.filter((post) => post.author === username);
  }

  // Determine if there are more results
  const hasMore = filteredPosts.length > safeLimit;
  const items = hasMore ? filteredPosts.slice(0, safeLimit) : filteredPosts;

  // Build next cursor from last item
  const lastPost = items[items.length - 1];
  const nextCursor = hasMore && lastPost ? {
    startAuthor: lastPost.author,
    startPermlink: lastPost.permlink,
  } : undefined;

  return {
    items,
    hasMore,
    nextCursor,
  };
}

/**
 * Get comments for a user with pagination support
 * @param username - Hive username
 * @param sort - Sort option: "comments" or "replies"
 * @param limit - Number of comments to fetch (max 20)
 * @param cursor - Pagination cursor (start_author, start_permlink)
 */
export async function getHiveCommentsPaginated(
  username: string,
  sort: CommentSortOption = "comments",
  limit = 20,
  cursor?: PaginationCursor
): Promise<PaginatedResult<BridgePost>> {
  const chain = await getHiveChain();
  // API has hard limit of 20, so we limit user's request to 19 to have room for +1 check
  const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT - 1);
  // Request one extra to check if there are more (still within API limit of 20)
  const requestLimit = safeLimit + 1;

  const params: GetAccountPostsParams = {
    sort,
    account: username,
    limit: requestLimit,
    ...(cursor?.startAuthor && cursor?.startPermlink ? {
      start_author: cursor.startAuthor,
      start_permlink: cursor.startPermlink,
    } : {}),
  };

  const posts = await chain.api.bridge.get_account_posts(params);
  // API already excludes the cursor post, so no need to skip first element

  const hasMore = posts.length > safeLimit;
  const items = hasMore ? posts.slice(0, safeLimit) : posts;

  const lastPost = items[items.length - 1];
  const nextCursor = hasMore && lastPost ? {
    startAuthor: lastPost.author,
    startPermlink: lastPost.permlink,
  } : undefined;

  return {
    items,
    hasMore,
    nextCursor,
  };
}

/**
 * Get all posts (including reblogs) for a user's blog
 * Note: API limit is max 20 per request
 */
export async function getHiveBlogWithReblogs(
  username: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const chain = await getHiveChain();
  const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT);

  return chain.api.bridge.get_account_posts({
    sort: "blog",
    account: username,
    limit: safeLimit,
  });
}

/**
 * Get a single post by author and permlink
 */
export async function getHivePost(
  author: string,
  permlink: string
): Promise<BridgePost | null> {
  const chain = await getHiveChain();

  return chain.api.bridge.get_post({
    author,
    permlink,
  });
}

/**
 * Get user profile using bridge.get_profile
 * Returns profile info including reputation, post count, followers
 */
export async function getHiveProfile(
  username: string
): Promise<BridgeProfile | null> {
  const chain = await getHiveChain();

  return chain.api.bridge.get_profile({
    account: username,
  });
}

/**
 * Get full account data using database_api.find_accounts
 * Returns financial data, voting power, balances etc.
 */
export async function getHiveAccount(
  username: string
): Promise<DatabaseAccount | null> {
  const chain = await getHiveChain();

  const result = await chain.api.database_api.find_accounts({
    accounts: [username],
  });

  return result.accounts.length > 0 ? result.accounts[0] : null;
}

/**
 * Get discussion (post with all replies) as a flat map
 */
export async function getHiveDiscussion(
  author: string,
  permlink: string
): Promise<BridgeDiscussion> {
  const chain = await getHiveChain();

  return chain.api.bridge.get_discussion({
    author,
    permlink,
  });
}

/**
 * Get ranked posts (trending, hot, created, etc.)
 * Note: API limit is max 20 per request
 */
export async function getHiveRankedPosts(
  sort: GetRankedPostsParams["sort"],
  tag?: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const chain = await getHiveChain();
  const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT);

  return chain.api.bridge.get_ranked_posts({
    sort,
    tag,
    limit: safeLimit,
  });
}

/**
 * Get comments made by a user using bridge.get_account_posts with sort="comments"
 * Returns comments authored by the user (not replies to them)
 * Note: API limit is max 20 per request
 */
export async function getHiveUserComments(
  username: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const chain = await getHiveChain();
  const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT);

  return chain.api.bridge.get_account_posts({
    sort: "comments",
    account: username,
    limit: safeLimit,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse JSON metadata from a post
 * Bridge API may return json_metadata as string or already-parsed object
 */
export function parsePostMetadata(jsonMetadata: string | object): {
  image?: string[];
  tags?: string[];
  app?: string;
  format?: string;
  description?: string;
} {
  // If it's already an object, return it directly
  if (typeof jsonMetadata === "object" && jsonMetadata !== null) {
    return jsonMetadata as {
      image?: string[];
      tags?: string[];
      app?: string;
      format?: string;
      description?: string;
    };
  }
  // If it's a string, parse it
  if (typeof jsonMetadata === "string") {
    try {
      return JSON.parse(jsonMetadata);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Format Hive amount string (e.g., "123.456 HIVE" -> "123.456")
 */
export function formatHiveAmount(amount: string): string {
  return amount.replace(/\s*(HIVE|HBD|VESTS)$/i, "");
}

/**
 * Calculate reputation from raw value
 * Bridge API already returns calculated reputation, but this is for raw values
 */
export function calculateReputation(rawReputation: number | string): number {
  const rep =
    typeof rawReputation === "string"
      ? parseFloat(rawReputation)
      : rawReputation;
  if (rep === 0) return 25;
  const neg = rep < 0;
  const repLog = Math.log10(Math.abs(rep));
  let out = Math.max(repLog - 9, 0);
  if (neg) out *= -1;
  return Math.round((out * 9 + 25) * 100) / 100;
}

/**
 * Get total votes count from active_votes
 */
export function getTotalVotes(post: BridgePost): number {
  return post.stats.total_votes;
}

/**
 * Get net votes (upvotes - downvotes) approximation
 */
export function getNetVotes(post: BridgePost): number {
  return (
    post.active_votes.filter((v) => v.rshares > 0).length -
    post.active_votes.filter((v) => v.rshares < 0).length
  );
}

// ============================================================================
// Type Re-exports for backward compatibility
// ============================================================================

// Export BridgePost as HiveComment for backward compatibility
export type HiveComment = BridgePost;

// Export DatabaseAccount as HiveAccount for backward compatibility
export type HiveAccount = DatabaseAccount;
