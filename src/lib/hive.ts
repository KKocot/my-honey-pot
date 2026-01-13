import { createHiveChain, type IHiveChainInterface, type TWaxApiRequest } from '@hiveio/wax'

// Hive chain singleton
let hiveChainInstance: IHiveChainInterface | null = null

export async function getHiveClient(): Promise<IHiveChainInterface> {
  if (hiveChainInstance) return hiveChainInstance
  hiveChainInstance = await createHiveChain({
    apiEndpoint: 'https://api.hive.blog',
  })
  return hiveChainInstance
}

// Types for condenser_api extension
export interface HiveBlogEntry {
  blog: string
  entry_id: number
  author: string
  permlink: string
  reblogged_on: string
}

export interface HiveComment {
  id: number
  author: string
  permlink: string
  category: string
  parent_author: string
  parent_permlink: string
  title: string
  body: string
  json_metadata: string
  created: string
  last_update: string
  depth: number
  children: number
  net_votes: number
  active_votes: HiveActiveVote[]
  pending_payout_value: string
  total_payout_value: string
  curator_payout_value: string
  url: string
}

export interface HiveActiveVote {
  voter: string
  weight: number
  rshares: string
  percent: number
  reputation: string
  time: string
}

export interface HiveAccount {
  id: number
  name: string
  owner: HiveAuthority
  active: HiveAuthority
  posting: HiveAuthority
  memo_key: string
  json_metadata: string
  posting_json_metadata: string
  proxy: string
  last_owner_update: string
  last_account_update: string
  created: string
  mined: boolean
  recovery_account: string
  last_account_recovery: string
  reset_account: string
  comment_count: number
  lifetime_vote_count: number
  post_count: number
  can_vote: boolean
  voting_manabar: HiveManabar
  downvote_manabar: HiveManabar
  voting_power: number
  balance: string
  savings_balance: string
  hbd_balance: string
  hbd_seconds: string
  hbd_seconds_last_update: string
  hbd_last_interest_payment: string
  savings_hbd_balance: string
  savings_hbd_seconds: string
  savings_hbd_seconds_last_update: string
  savings_hbd_last_interest_payment: string
  savings_withdraw_requests: number
  reward_hbd_balance: string
  reward_hive_balance: string
  reward_vesting_balance: string
  reward_vesting_hive: string
  vesting_shares: string
  delegated_vesting_shares: string
  received_vesting_shares: string
  vesting_withdraw_rate: string
  post_voting_power: string
  next_vesting_withdrawal: string
  withdrawn: number
  to_withdraw: number
  withdraw_routes: number
  pending_transfers: number
  curation_rewards: number
  posting_rewards: number
  proxied_vsf_votes: string[]
  witnesses_voted_for: number
  last_post: string
  last_root_post: string
  last_vote_time: string
  post_bandwidth: number
  pending_claimed_accounts: number
  governance_vote_expiration_ts: string
}

export interface HiveAuthority {
  weight_threshold: number
  account_auths: [string, number][]
  key_auths: [string, number][]
}

export interface HiveManabar {
  current_mana: string
  last_update_time: number
}

// Extended API type for condenser_api
type TCondenserApi = {
  condenser_api: {
    get_blog_entries: TWaxApiRequest<
      [string, number, number],
      HiveBlogEntry[]
    >
    get_content: TWaxApiRequest<
      [string, string],
      HiveComment
    >
    get_accounts: TWaxApiRequest<
      [string[]],
      HiveAccount[]
    >
    get_blog: TWaxApiRequest<
      [string, number, number],
      Array<{
        blog: string
        entry_id: number
        comment: HiveComment
        reblog_on: string
      }>
    >
  }
}

// Extended Hive client with condenser_api
let extendedHiveClient: ReturnType<IHiveChainInterface['extend']> | null = null

export async function getExtendedHiveClient() {
  if (extendedHiveClient) return extendedHiveClient

  const chain = await getHiveClient()
  extendedHiveClient = chain.extend<TCondenserApi>()

  return extendedHiveClient
}

// Helper function to get blog posts for a user
export async function getHiveBlogPosts(username: string, limit = 10): Promise<HiveComment[]> {
  const client = await getExtendedHiveClient()

  const blogEntries = await client.api.condenser_api.get_blog(
    [username, 0, limit]
  )

  // Filter out reblogs and return only original posts
  return blogEntries
    .filter(entry => entry.comment.author === username)
    .map(entry => entry.comment)
}

// Helper function to get a single post
export async function getHivePost(author: string, permlink: string): Promise<HiveComment> {
  const client = await getExtendedHiveClient()

  const post = await client.api.condenser_api.get_content([author, permlink])

  return post
}

// Helper function to get account info
export async function getHiveAccount(username: string): Promise<HiveAccount | null> {
  const client = await getExtendedHiveClient()

  const accounts = await client.api.condenser_api.get_accounts([[username]])

  return accounts.length > 0 ? accounts[0] : null
}
