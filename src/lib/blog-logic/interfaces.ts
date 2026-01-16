// WORK IN PROGRESS
import type { TAccountName, IOnlineSignatureProvider } from "@hiveio/wax";
import { type Observer } from "./types";

export interface IPagination {
  page: number;
  pageSize: number;
}

export interface ICommonFilters {
  readonly startTime?: Date;
  readonly endTime?: Date;
  order?: "asc" | "desc";
}

export interface IVotesFilters extends ICommonFilters {
  readonly limit: number;
  readonly votesSort: "by_comment_voter" | "by_voter_comment";
}
export interface IPostFilters extends ICommonFilters {
  readonly sort:  "trending" | "hot" | "created" | "promoted" | "payout" | "payout_comments" | "muted";
  readonly tag: string;
}

export type AccountPostsSortOption = "blog" | "posts" | "comments" | "replies" | "feed";

export interface IAccountPostsFilters extends ICommonFilters {
  readonly sort: AccountPostsSortOption;
  readonly account: string;
}

export interface ICommunityFilters extends ICommonFilters {
  readonly sort: string;
  readonly query: string
}

export interface IAccountIdentity {
  readonly name: string;
}

export interface ICommunityIdentity {
  readonly name: string;
}

/**
 * Represents a set of data uniquely identifying a post or reply object.
 */
export interface IPostCommentIdentity {
  readonly author: string;
  readonly permlink: string;
}

export interface IVote {
  readonly weight: number;
  readonly upvote: boolean;
  readonly voter: string;
  readonly parentComment: IPostCommentIdentity
}

export interface ICommunity extends ICommunityIdentity {
  readonly title: string;
  readonly about: string;
  readonly admins: string[];
  readonly avatarUrl: string;
  readonly creationDate: Date;
  readonly subscribersCount: number;
  readonly authorsCount: number;
  readonly pendingCount: number;
  getSlug(): string;
}
/** Single manabar data */
export interface IManabar {
  readonly max: bigint;
  readonly current: bigint;
  readonly percent: number;
}

/** All manabars for an account */
export interface IAccountManabars {
  readonly upvote: IManabar;
  readonly downvote: IManabar;
  readonly rc: IManabar;
}

/** Profile stats from bridge.get_profile */
export interface IProfileStats {
  readonly followers: number;
  readonly following: number;
  readonly rank: number;
}

/** Profile metadata from bridge.get_profile */
export interface IProfileMetadata {
  readonly name?: string;
  readonly about?: string;
  readonly location?: string;
  readonly website?: string;
  readonly profileImage?: string;
  readonly coverImage?: string;
}

/** Full profile data from bridge.get_profile */
export interface IProfile {
  readonly name: string;
  readonly created: string;
  readonly postCount: number;
  readonly reputation: number;
  readonly stats: IProfileStats;
  readonly metadata: IProfileMetadata;
}

/** Database account data for financial information */
export interface IDatabaseAccount {
  readonly name: string;
  readonly balance: string;
  readonly hbdBalance: string;
  readonly vestingShares: string;
  readonly delegatedVestingShares: string;
  readonly receivedVestingShares: string;
  readonly postCount: number;
  readonly curationRewards: number;
  readonly postingRewards: number;
}

/** Dynamic global properties for VESTS to HP conversion */
export interface IGlobalProperties {
  readonly totalVestingFundHive: string;
  readonly totalVestingShares: string;
}

/** Comment sort options */
export type CommentSortOption = "comments" | "replies";

/** Pagination cursor for cursor-based pagination */
export interface IPaginationCursor {
  startAuthor?: string;
  startPermlink?: string;
}

/** Paginated result */
export interface IPaginatedResult<T> {
  items: readonly T[];
  hasMore: boolean;
  nextCursor?: IPaginationCursor;
}

export interface IAccount extends IAccountIdentity {
  readonly creationDate: Date;
  readonly lastActivity: Date;
  readonly postCount: number;
  readonly registeredDate: Date;
  readonly description: string;
  readonly avatar: string;
  getSlug(): string;
  getManabars(): Promise<IAccountManabars>;
}

/**
 * Common representation of a post and reply objects
 */
export interface IComment extends IPostCommentIdentity {
  readonly publishedAt: Date;
  readonly updatedAt: Date;


  enumMentionedAccounts(): Promise<Iterable<string>>;
  enumVotes(filter: IVotesFilters, pagination: IPagination): Promise<Iterable<IVote>>;
  getContent(): Promise<string>;
  wasVotedByUser(userName: string): Promise<boolean>;
  getVotesCount(): Promise<number>;

  /**
   * Allows to generate a slug for the comment, which can be used in URLs or as a unique identifier.
   */
  getSlug(): string;
};

/**
 * Represents a reply to a post or another reply object.
 */
export interface IReply extends IComment {
  parent: IPostCommentIdentity;
  topPost: IPostCommentIdentity;
}

export interface ISession {

}

/**
 * Represents a post (article) published on the platform.
 */
export interface IPost extends IComment {
  title: string;
  summary: string;
  tags: string[];
  community?: ICommunityIdentity;
  communityTitle?: string;

  getCommentsCount(): Promise<number>;
  enumReplies(filter: ICommonFilters, pagination: IPagination): Promise<Iterable<IReply>>;
  getTitleImage(): string;
}

export interface ILoginSession {
  readonly authenticatedAccount: TAccountName;
  readonly sessionId: string;

  logout(): Promise<void>
}

export interface IAuthenticationProvider {
  login(account: TAccountName, signatureProvider: IOnlineSignatureProvider, directLogin: boolean, sessionTimeout: number): Promise<ILoginSession>;
}

export interface IActiveBloggingPlatform {
  readonly session: ILoginSession;
  // Add callbacks

  post(body: string, tags: string[], title?: string, observer?: Partial<Observer<IPost>>): Promise<boolean>;
  comment(postOrComment: IPostCommentIdentity, body: string, tags: string[], title?: string, observer?: Partial<Observer<IComment>>): Promise<boolean>;
  vote(postOrComment: IPostCommentIdentity, upvote: boolean, weight: number, observer?: Partial<Observer<IVote>>): Promise<boolean>;
  reblog(postOrComment: IPostCommentIdentity): Promise<boolean>;
  deletePost(postOrComment: IPostCommentIdentity): Promise<boolean>;
  editPost(postOrComment: IPostCommentIdentity, body: string, tags: string[], title?: string, observer?: Partial<Observer<IPost>>): Promise<boolean>;
  deleteComment(postOrComment: IPostCommentIdentity): Promise<boolean>;
  editComment(postOrComment: IPostCommentIdentity, body: string, tags: string[], title?: string, observer?: Partial<Observer<IComment>>): Promise<boolean>;
  followBlog(authorOrCommunity: IAccountIdentity | ICommunityIdentity): Promise<boolean>;
  getAccount(accountName: string): Promise<IAccount>;
}

export interface IBloggingPlatform {
  viewerContext: IAccountIdentity;
  getPost(postId: IPostCommentIdentity): Promise<IPost>;
  enumPosts(filter: IPostFilters, pagination: IPagination): Promise<Iterable<IPost>>;
  enumAccountPosts(filter: IAccountPostsFilters, pagination: IPagination): Promise<Iterable<IPost>>;
  configureViewContext(accontName: IAccountIdentity): void;
  enumCommunities(filter: ICommunityFilters, pagination: IPagination): Promise<Iterable<ICommunity>>;
  getAccount(accontName: string): Promise<IAccount>;

  // To do: add getAccount method later

  overwrittenGetTitleImage?: () => string;
  overwriteGetTitleImage(callback: () => string): void;

  // authorize(provider: IAuthenticationProvider): Promise<IActiveBloggingPlatform>;
}

// UI integration with mock data

