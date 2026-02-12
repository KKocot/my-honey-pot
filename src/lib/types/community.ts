// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Community types — re-exported from @hiveio/wax-api-jsonrpc
// ============================================
// SDK already defines community-related types. We re-export them here
// to provide a single import point and avoid scattering SDK imports.
//
// Note: CommunityExtended.settings is typed as Record<string, any> in the SDK.
// This is a known SDK limitation — we accept it for re-exports from external packages.
//
// Note: Community (list variant) has `admins: string[]` but CommunityExtended
// (detail variant) does not. This appears to be an SDK inconsistency.
// When you need admins for an extended community, extract them from `team`
// where role === "admin".

// Community from list_communities (compact, includes admins)
export type { Community as HiveCommunityListItem } from "@hiveio/wax-api-jsonrpc";

// Community from get_community (extended, includes description/flag_text/team)
export type { CommunityExtended as HiveCommunity } from "@hiveio/wax-api-jsonrpc";

// Community context (role, subscription status)
export type { Context as CommunityContext } from "@hiveio/wax-api-jsonrpc";

// Team member tuple type (each entry is string[] with [username, role, title])
export type { TeamArray as CommunityTeamMember } from "@hiveio/wax-api-jsonrpc";

// Post stats (flag_weight, gray, hide, total_votes, is_pinned)
export type { Stats as CommunityPostStats } from "@hiveio/wax-api-jsonrpc";

// Subscriber tuple type (each entry is (string | null)[] with [username, role, title, ...])
export type { SubscriptionsArray as CommunitySubscriber } from "@hiveio/wax-api-jsonrpc";

// API response types for direct bridge calls
export type { GetCommunityResponse } from "@hiveio/wax-api-jsonrpc";
export type { GetCommunityContextResponse } from "@hiveio/wax-api-jsonrpc";
export type { ListCommunitiesResponse } from "@hiveio/wax-api-jsonrpc";
export type { ListCommunityRolesResponse } from "@hiveio/wax-api-jsonrpc";
export type { ListSubscribersResponse } from "@hiveio/wax-api-jsonrpc";
