import { Account } from "./Account";
import { Community } from "./Community";
import { DataProvider } from "./DataProvider";
import type {
  IAccount,
  IAccountIdentity,
  IAccountPostsFilters,
  IBloggingPlatform,
  ICommunity,
  ICommunityFilters,
  IPagination,
  IPost,
  IPostCommentIdentity,
  IPostFilters
} from "./interfaces";
import { Post } from "./Post";

export class BloggingPlatform implements IBloggingPlatform {
  private dataProvider: DataProvider;
  public viewerContext: IAccountIdentity;

  public overwrittenGetTitleImage?: () => string;

  public constructor(dataProvider: DataProvider) {
    this.viewerContext = {name: "hive.blog"}; // Set default
    this.dataProvider = dataProvider;
  }

  /**
   * Change the observer for blog.
   * @param accontName account name or community.
   */
  public configureViewContext(accontName: IAccountIdentity): void {
    this.viewerContext = accontName;
  }


  /**
   * Get single post idetified by author/permlink.
   * @param postId
   * @returns post object
   */
  public async getPost(postId: IPostCommentIdentity): Promise<IPost> {
    await this.dataProvider.fetchPost(postId);
    return new Post(postId, this.dataProvider);
  }

  /**
   * Enumarate all communities for given filters
   * @param filter
   * @param pagination
   * @returns iterable of community objects
   */
  public async enumCommunities(filter: ICommunityFilters, pagination: IPagination): Promise<Iterable<ICommunity>> {
    const communitiesIds = await this.dataProvider.enumCommunities(filter, pagination);
    return communitiesIds.map((communityId) => new Community(communityId, this.dataProvider));
  }

  /**
   * Get posts for selected filters.
   * @param filter
   * @param pagination
   * @returns iterable of posts
   */
  public async enumPosts(filter: IPostFilters, pagination: IPagination): Promise<Iterable<IPost>> {
    const postsIds = await this.dataProvider.enumPosts(filter, pagination);
    return postsIds.map((post) => new Post({author: post.author, permlink: post.permlink}, this.dataProvider))
  }

  /**
   * Get posts for a specific account.
   * @param filter - includes account name and sort type (blog, posts, comments, etc.)
   * @param pagination
   * @returns iterable of posts
   */
  public async enumAccountPosts(filter: IAccountPostsFilters, pagination: IPagination): Promise<Iterable<IPost>> {
    const postsIds = await this.dataProvider.enumAccountPosts(filter, pagination);
    return postsIds.map((post) => new Post({author: post.author, permlink: post.permlink}, this.dataProvider))
  }

  /**
   * Get account object for given account name.
   * @param accontName
   * @returns account object
   */
  public async getAccount(accontName: string): Promise<IAccount> {
    await this.dataProvider.fetchAccount(accontName);
    return new Account(accontName, this.dataProvider);
  }

  // Section for overwritting methods

  /**
   * It allows other project to overwrite title image method with their custom implementation.
   * @param callbackMethod custom method for getting title image.
   */
  public overwriteGetTitleImage(callbackMethod: () => string) {
    this.overwriteGetTitleImage = callbackMethod;
  }
}

