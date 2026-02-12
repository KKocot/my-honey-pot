// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type {
  Post,
  BridgeComment,
  IDatabaseAccount,
  IProfile,
  IGlobalProperties,
  IAccountManabars,
  AccountPostsSortOption,
  CommentSortOption,
  IPaginationCursor,
} from "@hiveio/workerbee/blog-logic";
import type { SiteSettings } from "../../components/home/types";
import type { HiveCommunity } from "../types/community";
import type { CommunitySortOrder } from "../queries";

// ============================================
// Query params parsed from URL
// ============================================

export interface CommunityQueryParams {
  sort?: string;
  start_author?: string;
  start_permlink?: string;
}

export interface UserQueryParams {
  tab?: string;
  start_author?: string;
  start_permlink?: string;
}

// ============================================
// SSR prepare results
// ============================================

export interface CommunityPageData {
  settings: SiteSettings;
  dehydrated_state: string | null;
  community_data: HiveCommunity | null;
  community_sort_order: CommunitySortOrder;
  has_more_posts: boolean;
  posts_limit: number;
  error: string | null;
}

export interface UserPageData {
  settings: SiteSettings;
  dehydrated_state: string | null;
  hive_account: IDatabaseAccount | null;
  hive_profile: IProfile | null;
  global_properties: IGlobalProperties | null;
  account_manabars: IAccountManabars | null;
  blog_logic_posts: Post[];
  hive_comments: readonly BridgeComment[];
  active_tab: string;
  show_comments_tab: boolean;
  active_category_tag: string | null;
  posts_sort_order: AccountPostsSortOption;
  comments_sort_order: CommentSortOption;
  posts_limit: number;
  has_more_posts: boolean;
  has_more_comments: boolean;
  next_posts_cursor: IPaginationCursor | undefined;
  next_comments_cursor: IPaginationCursor | undefined;
  total_fetched_before_filter: number;
  error: string | null;
}
