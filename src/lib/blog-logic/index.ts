// Blog Logic - Hive blockchain blogging library
// See readme.md for usage instructions

export { DataProvider } from "./DataProvider";
export { BloggingPlaform } from "./BloggingPlatform";
export { Post } from "./Post";
export { Comment } from "./Comment";
export { Reply } from "./Reply";
export { Account } from "./Account";
export { Community } from "./Community";
export { Vote } from "./Vote";
export { getWax } from "./wax";
export type { WaxExtendedChain } from "./wax";
export {
  HbauthProvider,
  HbauthSession,
  HbauthSignatureProvider,
  getHbauthProvider,
} from "./HbauthProvider";
export type { KeyType, HbauthLoginOptions } from "./HbauthProvider";

// Re-export interfaces
export type {
  IPagination,
  ICommonFilters,
  IVotesFilters,
  IPostFilters,
  IAccountPostsFilters,
  AccountPostsSortOption,
  ICommunityFilters,
  IAccountIdentity,
  ICommunityIdentity,
  IPostCommentIdentity,
  IVote,
  ICommunity,
  IAccount,
  IAccountManabars,
  IManabar,
  IComment,
  IReply,
  IPost,
  IBloggingPlatform,
  ILoginSession,
  IAuthenticationProvider,
  IActiveBloggingPlatform,
  // New types for profile/account/global data
  IProfile,
  IProfileStats,
  IProfileMetadata,
  IDatabaseAccount,
  IGlobalProperties,
  CommentSortOption,
  IPaginationCursor,
  IPaginatedResult,
} from "./interfaces";

// Re-export utilities
export {
  paginateData,
  formatHiveAmount,
  convertVestsToHP,
  calculateEffectiveHP,
  parseBalance,
  parseVests,
  parseHive,
} from "./utils";
export { WorkerBeeError } from "./errors";

// Re-export PostBridgeApi type from wax-api-jsonrpc for post/comment data
export type { PostBridgeApi as BridgeComment, PostBridgeApi as BridgePost } from "@hiveio/wax-api-jsonrpc";
