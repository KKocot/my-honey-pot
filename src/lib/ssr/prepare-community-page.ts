// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { load_and_prepare_config } from "../config-pipeline";
import {
  create_query_client,
  query_keys,
  fetch_community,
  fetch_community_posts,
  type FetchCommunityPostsResult,
  type CommunitySortOrder,
} from "../queries";
import { dehydrate_to_json } from "../dehydrate";
import { get_default_settings } from "../../components/admin/types/settings";
import type { SiteSettings } from "../../components/home/types";
import type { CommunityPageData, CommunityQueryParams } from "./types";

// ============================================
// Community sort validation
// ============================================

const COMMUNITY_SORT_OPTIONS: readonly CommunitySortOrder[] = [
  "trending",
  "hot",
  "created",
  "payout",
];

function is_community_sort(value: string): value is CommunitySortOrder {
  const valid_values: ReadonlySet<string> = new Set(COMMUNITY_SORT_OPTIONS);
  return valid_values.has(value);
}

function validate_community_sort(
  value: string,
  fallback: CommunitySortOrder
): CommunitySortOrder {
  if (is_community_sort(value)) {
    return value;
  }
  return fallback;
}

// ============================================
// Main SSR function
// ============================================

/**
 * Prepares all SSR data for community mode homepage.
 * Loads config from Hive, prefetches community + ranked posts,
 * dehydrates query client state for client-side hydration.
 */
export async function prepare_community_page(
  hive_username: string,
  query_params: CommunityQueryParams
): Promise<CommunityPageData> {
  let error: string | null = null;

  // Load settings through unified pipeline (migrations + mode-specific defaults)
  let settings: SiteSettings;
  try {
    settings = await load_and_prepare_config(hive_username, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to load config from Hive:", message);
    settings = { ...get_default_settings(true), hiveUsername: hive_username };
  }

  const community_default_sort: CommunitySortOrder =
    settings.community_default_sort ?? "trending";
  const requested_sort = query_params.sort || community_default_sort;
  const community_sort_order = validate_community_sort(
    requested_sort,
    community_default_sort
  );

  const posts_limit = settings.postsPerPage || 20;
  const start_author = query_params.start_author;
  const start_permlink = query_params.start_permlink;

  // Create per-request QueryClient (NEVER global on server)
  const query_client = create_query_client();
  let has_more_posts = false;

  try {
    await Promise.allSettled([
      query_client.prefetchQuery({
        queryKey: query_keys.community(hive_username),
        queryFn: () => fetch_community(hive_username),
      }),
      query_client.prefetchQuery({
        queryKey: query_keys.community_posts(
          hive_username,
          community_sort_order,
          posts_limit,
          start_author,
          start_permlink
        ),
        queryFn: () =>
          fetch_community_posts(
            hive_username,
            community_sort_order,
            posts_limit,
            start_author,
            start_permlink
          ),
      }),
    ]);

    const community_posts_data =
      query_client.getQueryData<FetchCommunityPostsResult>(
        query_keys.community_posts(
          hive_username,
          community_sort_order,
          posts_limit,
          start_author,
          start_permlink
        )
      );
    if (community_posts_data) {
      has_more_posts = community_posts_data.has_more;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching Hive data:", message);
    error = "Error fetching data from Hive blockchain.";
  }

  const community_data =
    query_client.getQueryData(query_keys.community(hive_username)) ?? null;
  const dehydrated_state = dehydrate_to_json(query_client);

  return {
    settings,
    dehydrated_state,
    community_data,
    community_sort_order,
    has_more_posts,
    posts_limit,
    error,
  };
}
