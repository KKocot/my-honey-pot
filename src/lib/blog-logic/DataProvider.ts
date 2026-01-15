import type { HafbeTypesAccount } from "@hiveio/wax-api-hafbe"
import type { Community as CommunityData, PostBridgeApi, ActiveVotesDatabaseApi } from "@hiveio/wax-api-jsonrpc";
import { WorkerBeeError } from "./errors";
import { BloggingPlaform } from "./BloggingPlatform";
import type { ICommonFilters, ICommunityFilters, IPagination, IPostCommentIdentity, IPostFilters, IVotesFilters } from "./interfaces";
import { paginateData } from "./utils";
import type { WaxExtendedChain } from "./wax";

/**
 * Main class to call all of Blog Logic. The class is responsible for making instances of Blog Logic's objects and
 * getting and caching all the necessary data for them.
 */
export class DataProvider {
  public chain: WaxExtendedChain;
  public bloggingPlatform: BloggingPlaform;

  private comments: Map<string, PostBridgeApi> = new Map();
  private repliesByPostId: Map<string, IPostCommentIdentity[]> = new Map();
  private accounts: Map<string, HafbeTypesAccount> = new Map();
  private communities: Map<string, CommunityData> = new Map();
  private votesByCommentsAndVoter: Map<string, Map<string, ActiveVotesDatabaseApi>> = new Map();


  public constructor(chain: WaxExtendedChain) {
    this.chain = chain;
    this.bloggingPlatform = new BloggingPlaform(this);
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
    const fetchedPostData = await this.chain.api.bridge.get_post({
      author: postId.author,
      permlink: postId.permlink,
      observer: this.bloggingPlatform.viewerContext.name,
    });
    if (!fetchedPostData)
      throw new Error("Post not found");
    this.comments.set(this.convertCommentIdToHash(postId), fetchedPostData);
  }

  public async enumPosts(filter: IPostFilters, pagination: IPagination): Promise<IPostCommentIdentity[]> {
    const posts = await this.chain.api.bridge.get_ranked_posts({
      sort: filter.sort,
      observer: this.bloggingPlatform.viewerContext.name,
      tag: filter.tag
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

  public getRepliesIdsByPost(postId: IPostCommentIdentity): IPostCommentIdentity[] | null {
    return this.repliesByPostId.get(this.convertCommentIdToHash(postId)) || null;
  }

  public async enumReplies(postId: IPostCommentIdentity, filter: ICommonFilters, pagination: IPagination): Promise<IPostCommentIdentity[]> {
    const replies = await this.chain!.api.bridge.get_discussion({
      author: postId.author,
      permlink: postId.permlink,
      observer: this.bloggingPlatform.viewerContext.name,
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
    const account = await this.chain.restApi.hafbeApi.accounts.accountName({accountName: accountName});
    if (!account)
      throw new Error("Account not found");
    this.accounts.set(accountName, account);
  }

  public getCommunity(communityName: string): CommunityData | null {
    return this.communities.get(communityName) || null;
  }
  public async enumCommunities(filter: ICommunityFilters, pagination: IPagination): Promise<string[]> {
    const communities = await this.chain.api.bridge.list_communities({
      observer: this.bloggingPlatform.viewerContext.name,
      sort: filter.sort,
      query: filter.query,
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
    const votesData = (
      await this.chain!.api.database_api.list_votes({
        limit: filter.limit,
        order: filter.votesSort,
        start: [commentId.author, commentId.permlink, ""],
      })
    ).votes;
    const votersForComment: string[] = [];
    const votesByVoters: Map<string, ActiveVotesDatabaseApi> = new Map();
    votesData.forEach((voteData) => {
      votersForComment.push(voteData.voter);
      votesByVoters.set(voteData.voter, voteData);
    })
    this.votesByCommentsAndVoter.set(this.convertCommentIdToHash(commentId), votesByVoters);
    return paginateData(votersForComment, pagination);
  }

}
