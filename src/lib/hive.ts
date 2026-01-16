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

// ============================================================================
// Database API Types - Dynamic Global Properties
// ============================================================================

/** Dynamic global properties for VESTS to HP conversion */
export interface DynamicGlobalProperties {
  readonly head_block_number: number;
  readonly head_block_id: string;
  readonly time: string;
  readonly current_witness: string;
  readonly total_pow: number;
  readonly num_pow_witnesses: number;
  readonly virtual_supply: string;
  readonly current_supply: string;
  readonly init_hbd_supply: string;
  readonly current_hbd_supply: string;
  readonly total_vesting_fund_hive: string;
  readonly total_vesting_shares: string;
  readonly total_reward_fund_hive: string;
  readonly total_reward_shares2: string;
  readonly pending_rewarded_vesting_shares: string;
  readonly pending_rewarded_vesting_hive: string;
  readonly hbd_interest_rate: number;
  readonly hbd_print_rate: number;
  readonly maximum_block_size: number;
  readonly required_actions_partition_percent: number;
  readonly current_aslot: number;
  readonly recent_slots_filled: string;
  readonly participation_count: number;
  readonly last_irreversible_block_num: number;
  readonly vote_power_reserve_rate: number;
  readonly delegation_return_period: number;
  readonly reverse_auction_seconds: number;
  readonly available_account_subsidies: number;
  readonly hbd_stop_percent: number;
  readonly hbd_start_percent: number;
  readonly next_maintenance_time: string;
  readonly last_budget_time: string;
  readonly next_daily_maintenance_time: string;
  readonly content_reward_percent: number;
  readonly vesting_reward_percent: number;
  readonly proposal_fund_percent: number;
  readonly dhf_interval_ledger: string;
  readonly downvote_pool_percent: number;
  readonly current_remove_threshold: number;
  readonly early_voting_seconds: number;
  readonly mid_voting_seconds: number;
  readonly max_consecutive_recurrent_transfer_failures: number;
  readonly max_recurrent_transfer_end_date: number;
  readonly min_recurrent_transfers_recurrence: number;
  readonly max_open_recurrent_transfers: number;
}

/** Result of get_dynamic_global_properties */
export interface GetDynamicGlobalPropertiesResult extends DynamicGlobalProperties {}

type TDatabaseApi = {
  database_api: {
    find_accounts: TWaxApiRequest<FindAccountsParams, FindAccountsResult>;
    get_dynamic_global_properties: TWaxApiRequest<Record<string, never>, GetDynamicGlobalPropertiesResult>;
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

// Note: Post fetching functions (getHiveBlogPosts, getHivePostsPaginated) have been
// removed - use Blog Logic (src/lib/blog-logic) for post fetching instead.

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

// Note: getHiveBlogWithReblogs and getHivePost have been removed
// Use Blog Logic (src/lib/blog-logic) for post fetching instead.

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

// Note: getHiveDiscussion has been removed
// Use Blog Logic (src/lib/blog-logic) enumReplies for fetching post replies instead.

/**
 * Get dynamic global properties (needed for VESTS to HP conversion)
 */
export async function getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
  const chain = await getHiveChain();
  return chain.api.database_api.get_dynamic_global_properties({});
}

// Note: getHiveRankedPosts has been removed
// Use Blog Logic (src/lib/blog-logic) enumPosts for fetching ranked posts instead.

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

/** Asset object format from database_api */
interface AssetObject {
  amount: string;
  precision: number;
  nai: string;
}

/**
 * Parse VESTS amount to number
 * Handles both string format "123456.789012 VESTS" and asset object format
 */
export function parseVests(vests: string | AssetObject): number {
  if (typeof vests === "string") {
    return parseFloat(vests.replace(" VESTS", ""));
  }
  // Asset object format: { amount: "123456789012", precision: 6, nai: "..." }
  return parseInt(vests.amount) / Math.pow(10, vests.precision);
}

/**
 * Parse HIVE amount to number
 * Handles both string format "123.456 HIVE" and asset object format
 */
export function parseHive(hive: string | AssetObject): number {
  if (typeof hive === "string") {
    return parseFloat(hive.replace(" HIVE", ""));
  }
  // Asset object format: { amount: "123456", precision: 3, nai: "..." }
  return parseInt(hive.amount) / Math.pow(10, hive.precision);
}

/** Type for asset values that can be string or object format */
type AssetValue = string | AssetObject;

/**
 * Convert VESTS to HP (Hive Power) using dynamic global properties
 * Formula: HP = VESTS * (total_vesting_fund_hive / total_vesting_shares)
 *
 * @param vests - VESTS amount (as string, number, or asset object)
 * @param totalVestingFundHive - From getDynamicGlobalProperties
 * @param totalVestingShares - From getDynamicGlobalProperties
 */
export function convertVestsToHP(
  vests: AssetValue | number,
  totalVestingFundHive: AssetValue,
  totalVestingShares: AssetValue
): number {
  const vestsNum = typeof vests === "number" ? vests : parseVests(vests);
  const fundHive = parseHive(totalVestingFundHive);
  const totalShares = parseVests(totalVestingShares);

  if (totalShares === 0) return 0;

  return vestsNum * (fundHive / totalShares);
}

/**
 * Calculate effective HP for a user (own HP + received - delegated)
 */
export function calculateEffectiveHP(
  vestingShares: AssetValue,
  delegatedVestingShares: AssetValue,
  receivedVestingShares: AssetValue,
  totalVestingFundHive: AssetValue,
  totalVestingShares: AssetValue
): number {
  const own = parseVests(vestingShares);
  const delegated = parseVests(delegatedVestingShares);
  const received = parseVests(receivedVestingShares);

  const effectiveVests = own - delegated + received;

  return convertVestsToHP(effectiveVests, totalVestingFundHive, totalVestingShares);
}

/**
 * Calculate own HP for a user (without delegations)
 */
export function calculateOwnHP(
  vestingShares: AssetValue,
  totalVestingFundHive: AssetValue,
  totalVestingShares: AssetValue
): number {
  return convertVestsToHP(vestingShares, totalVestingFundHive, totalVestingShares);
}

// ============================================================================
// WAX-based Manabar Calculations (like Denser)
// ============================================================================

/** Manabar data structure */
export interface ManabarData {
  max: bigint;
  current: bigint;
  percent: number;
}

/** Single manabar result with cooldown */
export interface SingleManabar {
  max: string;
  current: string;
  percentageValue: number;
  cooldown: Date;
}

/** All manabars for an account */
export interface AccountManabars {
  upvote: SingleManabar;
  downvote: SingleManabar;
  rc: SingleManabar;
}

/**
 * Get voting power (upvote manabar) for an account using WAX
 * This is the accurate way to calculate voting power like Denser does
 *
 * @param username - Hive username
 * @returns Promise with manabar data including percentage
 */
export async function getVotingManabar(username: string): Promise<ManabarData | null> {
  try {
    const chain = await getHiveChain();
    // 0 = upvote manabar, 1 = downvote manabar, 2 = RC manabar
    const manabar = await chain.calculateCurrentManabarValueForAccount(username, 0);
    return manabar;
  } catch (error) {
    console.error("Error getting voting manabar:", error);
    return null;
  }
}

/**
 * Get downvote manabar for an account using WAX
 *
 * @param username - Hive username
 * @returns Promise with manabar data including percentage
 */
export async function getDownvoteManabar(username: string): Promise<ManabarData | null> {
  try {
    const chain = await getHiveChain();
    const manabar = await chain.calculateCurrentManabarValueForAccount(username, 1);
    return manabar;
  } catch (error) {
    console.error("Error getting downvote manabar:", error);
    return null;
  }
}

/**
 * Get RC (Resource Credits) manabar for an account using WAX
 *
 * @param username - Hive username
 * @returns Promise with manabar data including percentage
 */
export async function getRcManabar(username: string): Promise<ManabarData | null> {
  try {
    const chain = await getHiveChain();
    const manabar = await chain.calculateCurrentManabarValueForAccount(username, 2);
    return manabar;
  } catch (error) {
    console.error("Error getting RC manabar:", error);
    return null;
  }
}

/**
 * Get voting power cooldown (time until full regeneration)
 *
 * @param username - Hive username
 * @returns Promise with cooldown date
 */
export async function getVotingPowerCooldown(username: string): Promise<Date | null> {
  try {
    const chain = await getHiveChain();
    return chain.calculateManabarFullRegenerationTimeForAccount(username, 0);
  } catch (error) {
    console.error("Error getting voting power cooldown:", error);
    return null;
  }
}

/**
 * Get all manabars (upvote, downvote, RC) for an account at once
 * Similar to Denser's getManabars function
 *
 * @param username - Hive username
 * @returns Promise with all manabar data
 */
export async function getAllManabars(username: string): Promise<AccountManabars | null> {
  try {
    const chain = await getHiveChain();

    // Fetch all manabars and cooldowns in parallel
    const [
      upvoteManabar,
      upvoteCooldown,
      downvoteManabar,
      downvoteCooldown,
      rcManabar,
      rcCooldown,
    ] = await Promise.all([
      chain.calculateCurrentManabarValueForAccount(username, 0),
      chain.calculateManabarFullRegenerationTimeForAccount(username, 0),
      chain.calculateCurrentManabarValueForAccount(username, 1),
      chain.calculateManabarFullRegenerationTimeForAccount(username, 1),
      chain.calculateCurrentManabarValueForAccount(username, 2),
      chain.calculateManabarFullRegenerationTimeForAccount(username, 2),
    ]);

    return {
      upvote: {
        max: upvoteManabar.max.toString(),
        current: upvoteManabar.current.toString(),
        percentageValue: upvoteManabar.percent,
        cooldown: upvoteCooldown,
      },
      downvote: {
        max: downvoteManabar.max.toString(),
        current: downvoteManabar.current.toString(),
        percentageValue: downvoteManabar.percent,
        cooldown: downvoteCooldown,
      },
      rc: {
        max: rcManabar.max.toString(),
        current: rcManabar.current.toString(),
        percentageValue: rcManabar.percent,
        cooldown: rcCooldown,
      },
    };
  } catch (error) {
    console.error("Error getting all manabars:", error);
    return null;
  }
}

// ============================================================================
// Type Re-exports for backward compatibility
// ============================================================================

// Export BridgePost as HiveComment for backward compatibility
export type HiveComment = BridgePost;

// Export DatabaseAccount as HiveAccount for backward compatibility
export type HiveAccount = DatabaseAccount;
