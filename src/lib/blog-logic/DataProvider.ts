import type { HafbeTypesAccount } from "@hiveio/wax-api-hafbe"
import type { Community as CommunityData, PostBridgeApi, ActiveVotesDatabaseApi } from "@hiveio/wax-api-jsonrpc";
import { WorkerBeeError } from "./errors";
import { BloggingPlatform } from "./BloggingPlatform";
import type {
  IAccountPostsFilters,
  ICommonFilters,
  ICommunityFilters,
  IPagination,
  IPostCommentIdentity,
  IPostFilters,
  IVotesFilters,
  IProfile,
  IDatabaseAccount,
  IGlobalProperties,
  IFullUserData,
  CommentSortOption,
  IPaginationCursor,
  IPaginatedResult,
  NaiAsset,
} from "./interfaces";
import { paginateData } from "./utils";
import { getWax, resetWax, type WaxExtendedChain } from "./wax";

const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = lastError.message.toLowerCase();

      // Check if this is a retryable network error
      const isTimeout = errorMsg.includes('timeout');
      const isNetworkError = errorMsg.includes('fetch') ||
                             errorMsg.includes('network') ||
                             errorMsg.includes('econnrefused') ||
                             errorMsg.includes('enotfound') ||
                             errorMsg.includes('failed to fetch') ||
                             errorMsg.includes('502') ||
                             errorMsg.includes('503') ||
                             errorMsg.includes('504');
      const isAborted = errorMsg.includes('aborted');

      // Don't retry if request was aborted by user (e.g., navigation, new request)
      if (isAborted) {
        throw lastError;
      }

      // Retry on timeout or network errors
      if ((isTimeout || isNetworkError) && attempt < MAX_RETRIES - 1) {
        console.warn(`API request failed (attempt ${attempt + 1}/${MAX_RETRIES}): ${lastError.message}, switching endpoint...`);
        resetWax();
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1))); // Exponential backoff
      } else if (!isTimeout && !isNetworkError) {
        // Non-retryable error (e.g., "Account not found") - throw immediately
        throw lastError;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Main class to call all of Blog Logic. The class is responsible for making instances of Blog Logic's objects and
 * getting and caching all the necessary data for them.
 */
export class DataProvider {
  private _chain: WaxExtendedChain;
  public bloggingPlatform: BloggingPlatform;

  private comments: Map<string, PostBridgeApi> = new Map();
  private repliesByPostId: Map<string, IPostCommentIdentity[]> = new Map();
  private accounts: Map<string, HafbeTypesAccount> = new Map();
  private communities: Map<string, CommunityData> = new Map();
  private votesByCommentsAndVoter: Map<string, Map<string, ActiveVotesDatabaseApi>> = new Map();


  public constructor(chain: WaxExtendedChain) {
    this._chain = chain;
    this.bloggingPlatform = new BloggingPlatform(this);
  }

  // Getter that always returns fresh chain (allows endpoint switching on retry)
  public get chain(): WaxExtendedChain {
    return this._chain;
  }

  // Update chain reference after reset
  public async refreshChain(): Promise<void> {
    this._chain = await getWax();
  }

  /**
   * For keeping universal author-permlink strings as a map key. The string is done the same way as in WP API.
   */
  private convertCommentIdToHash(commentId: IPostCommentIdentity): string {
    return `${commentId.author}_${commentId.permlink}`
  }

  public getComment(postId: IPostCommentIdentity): PostBridgeApi | null {
    return this.comments.get(this.convertCommentIdToHash(postId)) || null;
  }

  public async fetchPost(postId: IPostCommentIdentity): Promise<void> {
    const fetchedPostData = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.get_post({
        author: postId.author,
        permlink: postId.permlink,
        observer: this.bloggingPlatform.viewerContext.name,
      });
    });
    if (!fetchedPostData)
      throw new Error("Post not found");
    this.comments.set(this.convertCommentIdToHash(postId), fetchedPostData);
  }

  public async enumPosts(filter: IPostFilters, pagination: IPagination): Promise<IPostCommentIdentity[]> {
    const posts = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.get_ranked_posts({
        sort: filter.sort,
        observer: this.bloggingPlatform.viewerContext.name,
        tag: filter.tag
      });
    });
    if (!posts)
      throw new WorkerBeeError("Posts not found");
    const paginatedPosts = paginateData(posts, pagination);
    paginatedPosts.forEach((post) => {
      const postId = {author: post.author, permlink: post.permlink}
      this.comments.set(this.convertCommentIdToHash(postId), post);
    })
    return paginatedPosts.map((post) => ({author: post.author, permlink: post.permlink}));
  }

  /**
   * Fetch posts for a specific account using bridge.get_account_posts
   */
  public async enumAccountPosts(filter: IAccountPostsFilters, pagination: IPagination): Promise<IPostCommentIdentity[]> {
    const posts = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.get_account_posts({
        sort: filter.sort,
        account: filter.account,
        observer: this.bloggingPlatform.viewerContext.name,
        limit: pagination.pageSize,
      });
    });
    if (!posts)
      throw new WorkerBeeError("Posts not found");
    posts.forEach((post) => {
      const postId = {author: post.author, permlink: post.permlink}
      this.comments.set(this.convertCommentIdToHash(postId), post);
    })
    return posts.map((post) => ({author: post.author, permlink: post.permlink}));
  }

  public getRepliesIdsByPost(postId: IPostCommentIdentity): IPostCommentIdentity[] | null {
    return this.repliesByPostId.get(this.convertCommentIdToHash(postId)) || null;
  }

  public async enumReplies(postId: IPostCommentIdentity, filter: ICommonFilters, pagination: IPagination): Promise<IPostCommentIdentity[]> {
    const replies = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.get_discussion({
        author: postId.author,
        permlink: postId.permlink,
        observer: this.bloggingPlatform.viewerContext.name,
      });
    });
    if (!replies) throw new WorkerBeeError("Replies not found");
    const filteredReplies = Object.values(replies).filter((rawReply) => !!rawReply.parent_author);
    const repliesIds: IPostCommentIdentity[] = [];
    filteredReplies.forEach((reply) => {
      const replyId = {
        author: reply.author,
        permlink: reply.permlink
      }
      repliesIds.push(replyId);
      this.comments.set(this.convertCommentIdToHash(replyId), reply);
    })
    this.repliesByPostId.set(this.convertCommentIdToHash(postId), repliesIds);

    return paginateData(filteredReplies, pagination).map((reply) => ({author: reply.author, permlink: reply.permlink}));
  }

  public getAccount(accountName: string): HafbeTypesAccount | null {
    return this.accounts.get(accountName) || null;
  }

  public async fetchAccount(accountName: string): Promise<void> {
    // Use database_api.find_accounts instead of HAFBE REST API (more reliable)
    const result = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.database_api.find_accounts({
        accounts: [accountName],
      });
    });
    if (!result.accounts || result.accounts.length === 0)
      throw new Error("Account not found");
    // Store the account data - note: this is DatabaseApiAccount format, not HafbeTypesAccount
    // but they share the same essential fields we use (name, posting_json_metadata, created)
    this.accounts.set(accountName, result.accounts[0] as unknown as HafbeTypesAccount);
  }

  public getCommunity(communityName: string): CommunityData | null {
    return this.communities.get(communityName) || null;
  }
  public async enumCommunities(filter: ICommunityFilters, pagination: IPagination): Promise<string[]> {
    const communities = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.list_communities({
        observer: this.bloggingPlatform.viewerContext.name,
        sort: filter.sort,
        query: filter.query,
      });
    });
    const communitiesNames: string[] = [];
    if (communities)
      communities.forEach((community) => {
        this.communities.set(community.name, community);
        communitiesNames.push(community.name);
      })
    return paginateData(communitiesNames, pagination);
  }

  public getVote(commentId: IPostCommentIdentity, voter: string): ActiveVotesDatabaseApi | null {
    return this.votesByCommentsAndVoter.get(this.convertCommentIdToHash(commentId))?.get(voter) || null;
  }

  public getVoters(commentId: IPostCommentIdentity): string[] | null {
    const votesMap = this.votesByCommentsAndVoter.get(this.convertCommentIdToHash(commentId));
    const votes = Array.from(votesMap?.keys() || []);
    return votes || null;
  }

  public async enumVotes(commentId: IPostCommentIdentity, filter: IVotesFilters, pagination: IPagination): Promise<string[]> {
    const votesData = await withRetry(async () => {
      await this.refreshChain();
      const result = await this.chain.api.database_api.list_votes({
        limit: filter.limit,
        order: filter.votesSort,
        start: [commentId.author, commentId.permlink, ""],
      });
      return result.votes;
    });
    const votersForComment: string[] = [];
    const votesByVoters: Map<string, ActiveVotesDatabaseApi> = new Map();
    votesData.forEach((voteData) => {
      votersForComment.push(voteData.voter);
      votesByVoters.set(voteData.voter, voteData);
    })
    this.votesByCommentsAndVoter.set(this.convertCommentIdToHash(commentId), votesByVoters);
    return paginateData(votersForComment, pagination);
  }

  // ============================================================================
  // Profile & Account Methods (replacing hive.ts functionality)
  // ============================================================================

  /**
   * Get user profile using bridge.get_profile
   * Returns profile info including reputation, post count, followers
   */
  public async getProfile(username: string): Promise<IProfile | null> {
    const profile = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.get_profile({
        account: username,
        observer: this.bloggingPlatform.viewerContext.name,
      });
    });

    if (!profile) return null;

    return {
      name: profile.name,
      created: profile.created,
      postCount: profile.post_count,
      reputation: profile.reputation,
      stats: {
        followers: profile.stats.followers,
        following: profile.stats.following,
        rank: profile.stats.rank,
      },
      metadata: {
        name: profile.metadata?.profile?.name,
        about: profile.metadata?.profile?.about,
        location: profile.metadata?.profile?.location,
        website: profile.metadata?.profile?.website,
        profileImage: profile.metadata?.profile?.profile_image,
        coverImage: profile.metadata?.profile?.cover_image,
      },
    };
  }

  /**
   * Get full account data using database_api.find_accounts
   * Returns financial data, voting power, balances etc.
   */
  public async getDatabaseAccount(username: string): Promise<IDatabaseAccount | null> {
    const result = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.database_api.find_accounts({
        accounts: [username],
      });
    });

    if (!result.accounts || result.accounts.length === 0) return null;

    const account = result.accounts[0];
    const formatter = this.chain.formatter;

    // Convert raw curation_rewards/posting_rewards numbers to NaiAsset (VESTS)
    // The API returns these as raw numbers, we need to construct NaiAsset for Wax conversion
    const curationRewardsAsset: NaiAsset = {
      amount: String(account.curation_rewards),
      precision: 6,
      nai: "@@000000037", // VESTS NAI
    };
    const postingRewardsAsset: NaiAsset = {
      amount: String(account.posting_rewards),
      precision: 6,
      nai: "@@000000037", // VESTS NAI
    };

    return {
      name: account.name,
      balance: formatter.format(account.balance),
      hbdBalance: formatter.format(account.hbd_balance),
      // Keep raw NaiAsset for HP calculations via chain.vestsToHp()
      vestingShares: account.vesting_shares,
      delegatedVestingShares: account.delegated_vesting_shares,
      receivedVestingShares: account.received_vesting_shares,
      postCount: Number(account.post_count),
      curationRewards: curationRewardsAsset,
      postingRewards: postingRewardsAsset,
    };
  }

  /**
   * Get dynamic global properties (needed for VESTS to HP conversion)
   */
  public async getGlobalProperties(): Promise<IGlobalProperties> {
    const props = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.database_api.get_dynamic_global_properties({});
    });

    // Keep raw NaiAsset for HP calculations via chain.vestsToHp()
    return {
      totalVestingFundHive: props.total_vesting_fund_hive,
      totalVestingShares: props.total_vesting_shares,
    };
  }

  /**
   * Get comments for a user with pagination support
   */
  public async getCommentsPaginated(
    username: string,
    sort: CommentSortOption = "comments",
    limit = 20,
    cursor?: IPaginationCursor
  ): Promise<IPaginatedResult<PostBridgeApi>> {
    const MAX_API_LIMIT = 20;
    // API has hard limit of 20, so we limit user's request to 19 to have room for +1 check
    const safeLimit = Math.min(Math.max(1, limit), MAX_API_LIMIT - 1);
    // Request one extra to check if there are more (still within API limit of 20)
    const requestLimit = safeLimit + 1;

    const posts = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.api.bridge.get_account_posts({
        sort,
        account: username,
        limit: requestLimit,
        observer: this.bloggingPlatform.viewerContext.name,
        ...(cursor?.startAuthor && cursor?.startPermlink ? {
          start_author: cursor.startAuthor,
          start_permlink: cursor.startPermlink,
        } : {}),
      });
    });

    const hasMore = posts.length > safeLimit;
    const items = hasMore ? posts.slice(0, safeLimit) : posts;

    // Cache the comments
    items.forEach((post) => {
      const postId = { author: post.author, permlink: post.permlink };
      this.comments.set(this.convertCommentIdToHash(postId), post);
    });

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
   * Get complete user data combining profile and financial information
   * Uses bridge.get_profile (no condenser_api) and database_api.find_accounts
   */
  public async getFullUserData(username: string): Promise<IFullUserData | null> {
    // Fetch profile and database account in parallel
    const [profile, dbAccount, globalProps] = await Promise.all([
      this.getProfile(username),
      this.getDatabaseAccount(username),
      this.getGlobalProperties(),
    ]);

    if (!profile) return null;

    const formatter = this.chain.formatter;
    const zeroHive = this.chain.hiveSatoshis(0);

    // Calculate HP using wax's vestsToHp method
    const hivePowerAsset = dbAccount
      ? this.chain.vestsToHp(
          dbAccount.vestingShares,
          globalProps.totalVestingFundHive,
          globalProps.totalVestingShares
        )
      : zeroHive;

    // Calculate effective HP (own - delegated + received)
    const effectiveHivePowerAsset = dbAccount
      ? (() => {
          const ownHp = this.chain.vestsToHp(
            dbAccount.vestingShares,
            globalProps.totalVestingFundHive,
            globalProps.totalVestingShares
          );
          const delegatedHp = this.chain.vestsToHp(
            dbAccount.delegatedVestingShares,
            globalProps.totalVestingFundHive,
            globalProps.totalVestingShares
          );
          const receivedHp = this.chain.vestsToHp(
            dbAccount.receivedVestingShares,
            globalProps.totalVestingFundHive,
            globalProps.totalVestingShares
          );
          // own - delegated + received (amounts are in satoshis)
          const effectiveAmount = BigInt(ownHp.amount) - BigInt(delegatedHp.amount) + BigInt(receivedHp.amount);
          return { ...ownHp, amount: effectiveAmount.toString() };
        })()
      : zeroHive;

    return {
      // Profile data
      name: profile.name,
      created: profile.created,
      postCount: profile.postCount,
      reputation: profile.reputation,
      stats: profile.stats,
      metadata: profile.metadata,

      // Financial data (formatted for display)
      balance: dbAccount?.balance ?? "0 HIVE",
      hbdBalance: dbAccount?.hbdBalance ?? "0 HBD",
      curationRewards: dbAccount?.curationRewards ?? { amount: "0", precision: 6, nai: "@@000000037" },
      postingRewards: dbAccount?.postingRewards ?? { amount: "0", precision: 6, nai: "@@000000037" },

      // Calculated HP values (formatted via wax formatter)
      hivePower: formatter.format(hivePowerAsset),
      effectiveHivePower: formatter.format(effectiveHivePowerAsset),
    };
  }

}
