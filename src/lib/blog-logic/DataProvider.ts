import type { HafbeTypesAccount } from "@hiveio/wax-api-hafbe"
import type { Community as CommunityData, PostBridgeApi, ActiveVotesDatabaseApi } from "@hiveio/wax-api-jsonrpc";
import { WorkerBeeError } from "./errors";
import { BloggingPlaform } from "./BloggingPlatform";
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
} from "./interfaces";
import { paginateData, convertVestsToHP, calculateEffectiveHP, parseBalance } from "./utils";
import { getWax, resetWax, type WaxExtendedChain } from "./wax";

const MAX_RETRIES = 3;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTimeout = lastError.message.toLowerCase().includes('timeout');

      if (isTimeout && attempt < MAX_RETRIES - 1) {
        console.warn(`API request timed out (attempt ${attempt + 1}/${MAX_RETRIES}), switching endpoint...`);
        resetWax();
        await new Promise(resolve => setTimeout(resolve, 300));
      } else if (!isTimeout) {
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
  public bloggingPlatform: BloggingPlaform;

  private comments: Map<string, PostBridgeApi> = new Map();
  private repliesByPostId: Map<string, IPostCommentIdentity[]> = new Map();
  private accounts: Map<string, HafbeTypesAccount> = new Map();
  private communities: Map<string, CommunityData> = new Map();
  private votesByCommentsAndVoter: Map<string, Map<string, ActiveVotesDatabaseApi>> = new Map();


  public constructor(chain: WaxExtendedChain) {
    this._chain = chain;
    this.bloggingPlatform = new BloggingPlaform(this);
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
    if (!replies) throw WorkerBeeError;
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
    const account = await withRetry(async () => {
      await this.refreshChain();
      return this.chain.restApi.hafbeApi.accounts.accountName({accountName: accountName});
    });
    if (!account)
      throw new Error("Account not found");
    this.accounts.set(accountName, account);
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
    // Convert NaiAsset to string - use toString() if available, otherwise stringify
    const assetToString = (asset: unknown): string => {
      if (typeof asset === "string") return asset;
      if (asset && typeof asset === "object" && "toString" in asset) {
        return String(asset);
      }
      return JSON.stringify(asset);
    };
    return {
      name: account.name,
      balance: assetToString(account.balance),
      hbdBalance: assetToString(account.hbd_balance),
      vestingShares: assetToString(account.vesting_shares),
      delegatedVestingShares: assetToString(account.delegated_vesting_shares),
      receivedVestingShares: assetToString(account.received_vesting_shares),
      postCount: Number(account.post_count),
      curationRewards: Number(account.curation_rewards),
      postingRewards: Number(account.posting_rewards),
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

    // Convert NaiAsset to string
    const assetToString = (asset: unknown): string => {
      if (typeof asset === "string") return asset;
      if (asset && typeof asset === "object" && "toString" in asset) {
        return String(asset);
      }
      return JSON.stringify(asset);
    };

    return {
      totalVestingFundHive: assetToString(props.total_vesting_fund_hive),
      totalVestingShares: assetToString(props.total_vesting_shares),
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

    // Calculate HP values
    const hivePower = dbAccount
      ? convertVestsToHP(parseBalance(dbAccount.vestingShares), globalProps)
      : 0;

    const effectiveHivePower = dbAccount
      ? calculateEffectiveHP(
          dbAccount.vestingShares,
          dbAccount.delegatedVestingShares,
          dbAccount.receivedVestingShares,
          globalProps
        )
      : 0;

    return {
      // Profile data
      name: profile.name,
      created: profile.created,
      postCount: profile.postCount,
      reputation: profile.reputation,
      stats: profile.stats,
      metadata: profile.metadata,

      // Financial data
      balance: dbAccount?.balance ?? "0 HIVE",
      hbdBalance: dbAccount?.hbdBalance ?? "0 HBD",
      vestingShares: dbAccount?.vestingShares ?? "0 VESTS",
      delegatedVestingShares: dbAccount?.delegatedVestingShares ?? "0 VESTS",
      receivedVestingShares: dbAccount?.receivedVestingShares ?? "0 VESTS",
      curationRewards: dbAccount?.curationRewards ?? 0,
      postingRewards: dbAccount?.postingRewards ?? 0,

      // Calculated values
      hivePower,
      effectiveHivePower,
    };
  }

}
