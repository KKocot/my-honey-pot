import { createHiveChain, type IHiveChainInterface, type TWaxApiRequest } from '@hiveio/wax'

// ============================================================================
// Hive Chain Client
// ============================================================================

let hiveChainInstance: IHiveChainInterface | null = null

export async function getHiveClient(): Promise<IHiveChainInterface> {
  if (hiveChainInstance) return hiveChainInstance
  hiveChainInstance = await createHiveChain({
    apiEndpoint: 'https://api.hive.blog',
  })
  return hiveChainInstance
}

// ============================================================================
// Bridge API Types - Posts
// ============================================================================

/** Active vote on a post */
export interface BridgeActiveVote {
  readonly voter: string
  readonly rshares: number
}

/** Post statistics */
export interface BridgePostStats {
  readonly hide: boolean
  readonly gray: boolean
  readonly total_votes: number
  readonly flag_weight: number
}

/** Beneficiary configuration */
export interface BridgeBeneficiary {
  readonly account: string
  readonly weight: number
}

/** Post object returned by bridge API */
export interface BridgePost {
  readonly post_id: number
  readonly author: string
  readonly permlink: string
  readonly category: string
  readonly title: string
  readonly body: string
  readonly json_metadata: string
  readonly created: string
  readonly updated: string
  readonly depth: number
  readonly children: number
  readonly net_rshares: number
  readonly is_paidout: boolean
  readonly payout_at: string
  readonly payout: number
  readonly pending_payout_value: string
  readonly author_payout_value: string
  readonly curator_payout_value: string
  readonly max_accepted_payout: string
  readonly percent_hbd: number
  readonly url: string
  readonly author_reputation: number
  readonly author_role: string | null
  readonly author_title: string | null
  readonly beneficiaries: readonly BridgeBeneficiary[]
  readonly blacklists: readonly string[]
  readonly community: string | null
  readonly community_title: string | null
  readonly stats: BridgePostStats
  readonly active_votes: readonly BridgeActiveVote[]
  readonly replies: readonly string[]
  readonly reblogs: number
}

/** Parameters for get_account_posts */
export interface GetAccountPostsParams {
  readonly sort: 'blog' | 'feed' | 'posts' | 'comments' | 'replies' | 'payout'
  readonly account: string
  readonly start_author?: string
  readonly start_permlink?: string
  readonly limit?: number
  readonly observer?: string
}

/** Parameters for get_post */
export interface GetPostParams {
  readonly author: string
  readonly permlink: string
  readonly observer?: string
}

/** Parameters for get_ranked_posts */
export interface GetRankedPostsParams {
  readonly sort: 'trending' | 'hot' | 'created' | 'promoted' | 'payout' | 'payout_comments' | 'muted'
  readonly tag?: string
  readonly observer?: string
  readonly start_author?: string
  readonly start_permlink?: string
  readonly limit?: number
}

// ============================================================================
// Bridge API Types - Profile
// ============================================================================

/** Profile metadata */
export interface BridgeProfileMetadata {
  readonly profile?: {
    readonly name?: string
    readonly about?: string
    readonly location?: string
    readonly website?: string
    readonly profile_image?: string
    readonly cover_image?: string
    readonly blacklist_description?: string
    readonly muted_list_description?: string
  }
}

/** Profile statistics */
export interface BridgeProfileStats {
  readonly followers: number
  readonly following: number
  readonly rank: number
}

/** Profile object returned by bridge.get_profile */
export interface BridgeProfile {
  readonly id: number
  readonly name: string
  readonly created: string
  readonly active: string
  readonly post_count: number
  readonly reputation: number
  readonly blacklists: readonly string[]
  readonly stats: BridgeProfileStats
  readonly metadata: BridgeProfileMetadata
}

/** Parameters for get_profile */
export interface GetProfileParams {
  readonly account: string
  readonly observer?: string
}

// ============================================================================
// Bridge API Types - Discussion
// ============================================================================

/** Parameters for get_discussion */
export interface GetDiscussionParams {
  readonly author: string
  readonly permlink: string
  readonly observer?: string
}

/** Discussion result - map of author/permlink to post */
export type BridgeDiscussion = Record<string, BridgePost>

// ============================================================================
// Database API Types - Accounts (for financial data)
// ============================================================================

/** Authority structure */
export interface DatabaseAuthority {
  readonly weight_threshold: number
  readonly account_auths: readonly (readonly [string, number])[]
  readonly key_auths: readonly (readonly [string, number])[]
}

/** Manabar structure */
export interface DatabaseManabar {
  readonly current_mana: string
  readonly last_update_time: number
}

/** Account object from database_api */
export interface DatabaseAccount {
  readonly id: number
  readonly name: string
  readonly owner: DatabaseAuthority
  readonly active: DatabaseAuthority
  readonly posting: DatabaseAuthority
  readonly memo_key: string
  readonly json_metadata: string
  readonly posting_json_metadata: string
  readonly proxy: string
  readonly last_owner_update: string
  readonly last_account_update: string
  readonly created: string
  readonly mined: boolean
  readonly recovery_account: string
  readonly last_account_recovery: string
  readonly reset_account: string
  readonly comment_count: number
  readonly lifetime_vote_count: number
  readonly post_count: number
  readonly can_vote: boolean
  readonly voting_manabar: DatabaseManabar
  readonly downvote_manabar: DatabaseManabar
  readonly voting_power: number
  readonly balance: string
  readonly savings_balance: string
  readonly hbd_balance: string
  readonly hbd_seconds: string
  readonly hbd_seconds_last_update: string
  readonly hbd_last_interest_payment: string
  readonly savings_hbd_balance: string
  readonly savings_hbd_seconds: string
  readonly savings_hbd_seconds_last_update: string
  readonly savings_hbd_last_interest_payment: string
  readonly savings_withdraw_requests: number
  readonly reward_hbd_balance: string
  readonly reward_hive_balance: string
  readonly reward_vesting_balance: string
  readonly reward_vesting_hive: string
  readonly vesting_shares: string
  readonly delegated_vesting_shares: string
  readonly received_vesting_shares: string
  readonly vesting_withdraw_rate: string
  readonly post_voting_power: string
  readonly next_vesting_withdrawal: string
  readonly withdrawn: number
  readonly to_withdraw: number
  readonly withdraw_routes: number
  readonly pending_transfers: number
  readonly curation_rewards: number
  readonly posting_rewards: number
  readonly proxied_vsf_votes: readonly string[]
  readonly witnesses_voted_for: number
  readonly last_post: string
  readonly last_root_post: string
  readonly last_vote_time: string
  readonly post_bandwidth: number
  readonly pending_claimed_accounts: number
  readonly governance_vote_expiration_ts: string
}

/** Parameters for find_accounts */
export interface FindAccountsParams {
  readonly accounts: readonly string[]
}

/** Result of find_accounts */
export interface FindAccountsResult {
  readonly accounts: readonly DatabaseAccount[]
}

// ============================================================================
// Wax API Extension Types
// ============================================================================

type TBridgeApi = {
  bridge: {
    get_account_posts: TWaxApiRequest<GetAccountPostsParams, BridgePost[]>
    get_post: TWaxApiRequest<GetPostParams, BridgePost | null>
    get_profile: TWaxApiRequest<GetProfileParams, BridgeProfile | null>
    get_discussion: TWaxApiRequest<GetDiscussionParams, BridgeDiscussion>
    get_ranked_posts: TWaxApiRequest<GetRankedPostsParams, BridgePost[]>
  }
}

type TDatabaseApi = {
  database_api: {
    find_accounts: TWaxApiRequest<FindAccountsParams, FindAccountsResult>
  }
}

type THiveApi = TBridgeApi & TDatabaseApi

// ============================================================================
// Extended Client
// ============================================================================

let extendedHiveClient: ReturnType<IHiveChainInterface['extend']> | null = null

export async function getExtendedHiveClient(): Promise<ReturnType<IHiveChainInterface['extend']>> {
  if (extendedHiveClient) return extendedHiveClient

  const chain = await getHiveClient()
  extendedHiveClient = chain.extend<THiveApi>()

  return extendedHiveClient
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get blog posts for a user using bridge.get_account_posts
 * Returns posts authored by the user (blog sort includes reblogs)
 */
export async function getHiveBlogPosts(
  username: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const client = await getExtendedHiveClient()

  const posts = await client.api.bridge.get_account_posts({
    sort: 'blog',
    account: username,
    limit,
  })

  // Filter to only include posts by this author (exclude reblogs)
  return posts.filter((post) => post.author === username)
}

/**
 * Get all posts (including reblogs) for a user's blog
 */
export async function getHiveBlogWithReblogs(
  username: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const client = await getExtendedHiveClient()

  return client.api.bridge.get_account_posts({
    sort: 'blog',
    account: username,
    limit,
  })
}

/**
 * Get a single post by author and permlink
 */
export async function getHivePost(
  author: string,
  permlink: string
): Promise<BridgePost | null> {
  const client = await getExtendedHiveClient()

  return client.api.bridge.get_post({
    author,
    permlink,
  })
}

/**
 * Get user profile using bridge.get_profile
 * Returns profile info including reputation, post count, followers
 */
export async function getHiveProfile(
  username: string
): Promise<BridgeProfile | null> {
  const client = await getExtendedHiveClient()

  return client.api.bridge.get_profile({
    account: username,
  })
}

/**
 * Get full account data using database_api.find_accounts
 * Returns financial data, voting power, balances etc.
 */
export async function getHiveAccount(
  username: string
): Promise<DatabaseAccount | null> {
  const client = await getExtendedHiveClient()

  const result = await client.api.database_api.find_accounts({
    accounts: [username],
  })

  return result.accounts.length > 0 ? result.accounts[0] : null
}

/**
 * Get discussion (post with all replies) as a flat map
 */
export async function getHiveDiscussion(
  author: string,
  permlink: string
): Promise<BridgeDiscussion> {
  const client = await getExtendedHiveClient()

  return client.api.bridge.get_discussion({
    author,
    permlink,
  })
}

/**
 * Get ranked posts (trending, hot, created, etc.)
 */
export async function getHiveRankedPosts(
  sort: GetRankedPostsParams['sort'],
  tag?: string,
  limit = 20
): Promise<readonly BridgePost[]> {
  const client = await getExtendedHiveClient()

  return client.api.bridge.get_ranked_posts({
    sort,
    tag,
    limit,
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse JSON metadata from a post
 */
export function parsePostMetadata(jsonMetadata: string): {
  image?: string[]
  tags?: string[]
  app?: string
  format?: string
  description?: string
} {
  try {
    return JSON.parse(jsonMetadata)
  } catch {
    return {}
  }
}

/**
 * Format Hive amount string (e.g., "123.456 HIVE" -> "123.456")
 */
export function formatHiveAmount(amount: string): string {
  return amount.replace(/\s*(HIVE|HBD|VESTS)$/i, '')
}

/**
 * Calculate reputation from raw value
 * Bridge API already returns calculated reputation, but this is for raw values
 */
export function calculateReputation(rawReputation: number | string): number {
  const rep = typeof rawReputation === 'string' ? parseFloat(rawReputation) : rawReputation
  if (rep === 0) return 25
  const neg = rep < 0
  const repLog = Math.log10(Math.abs(rep))
  let out = Math.max(repLog - 9, 0)
  if (neg) out *= -1
  return Math.round((out * 9 + 25) * 100) / 100
}

/**
 * Get total votes count from active_votes
 */
export function getTotalVotes(post: BridgePost): number {
  return post.stats.total_votes
}

/**
 * Get net votes (upvotes - downvotes) approximation
 */
export function getNetVotes(post: BridgePost): number {
  return post.active_votes.filter((v) => v.rshares > 0).length -
    post.active_votes.filter((v) => v.rshares < 0).length
}

// ============================================================================
// Type Re-exports for backward compatibility
// ============================================================================

// Export BridgePost as HiveComment for backward compatibility
export type HiveComment = BridgePost

// Export DatabaseAccount as HiveAccount for backward compatibility
export type HiveAccount = DatabaseAccount
