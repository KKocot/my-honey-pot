// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// Blog Logic - Hive blockchain blogging library
// See readme.md for usage instructions

export { DataProvider } from "./DataProvider";
export { BloggingPlatform } from "./BloggingPlatform";
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
  IFullUserData,
  CommentSortOption,
  IPaginationCursor,
  IPaginatedResult,
  // NaiAsset type from wax
  NaiAsset,
  // Observer pattern types
  Observer,
  Unsubscribable,
  Subscribable,
} from "./interfaces";

// Re-export utilities
export {
  paginateData,
  // Wax-based asset utilities (require chain instance)
  parseAssetWithChain,
  formatAsset,
  getAssetAmount,
  getAssetSymbol,
  vestsToHpAsset,
  vestsToHpNumber,
  calculateEffectiveHpAsset,
  calculateEffectiveHpNumber,
  // Standalone asset utilities (no chain required)
  parseNaiAsset,
  parseFormattedAsset,
  stripAssetSuffix,
  convertVestsToHP,
  calculateEffectiveHP,
  // Display formatting utilities
  formatCompactNumber,
  formatNumber,
  formatJoinDate,
  formatReputation,
} from "./utils";
export { WorkerBeeError } from "./errors";

// Re-export PostBridgeApi type from wax-api-jsonrpc for post/comment data
export type { PostBridgeApi as BridgeComment, PostBridgeApi as BridgePost } from "@hiveio/wax-api-jsonrpc";
