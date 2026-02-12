// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { loadConfigFromHive } from "../../components/admin/hive-broadcast";
import {
  defaultSettings,
  settingsToRecord,
  type SettingsData,
} from "../../components/admin/types";
import {
  create_query_client,
  query_keys,
  fetch_community,
  fetch_community_posts,
  type FetchCommunityPostsResult,
  type CommunitySortOrder,
} from "../queries";
import { dehydrate_to_json } from "../dehydrate";
import type { SiteSettings } from "../../components/home/types";
import type { CommunityPageData, CommunityQueryParams } from "./types";

// ============================================
// Community sort validation
// ============================================

const COMMUNITY_SORT_OPTIONS: CommunitySortOrder[] = [
  "trending",
  "hot",
  "created",
  "payout",
];

function validate_community_sort(
  value: string,
  fallback: CommunitySortOrder
): CommunitySortOrder {
  const valid_sorts: readonly string[] = COMMUNITY_SORT_OPTIONS;
  if (valid_sorts.includes(value)) {
    return value as CommunitySortOrder;
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
  let settings: SiteSettings = { ...defaultSettings, hiveUsername: hive_username };
  let error: string | null = null;

  // Load settings from Hive blockchain (merge with defaults)
  try {
    const hive_config = await loadConfigFromHive(hive_username);
    if (hive_config) {
      const hive_record = settingsToRecord(hive_config);
      for (const key of Object.keys(hive_config) as (keyof SettingsData)[]) {
        if (hive_config[key] !== undefined && hive_config[key] !== null) {
          Object.assign(settings, { [key]: hive_record[key] });
        }
      }

      if (!settings.layoutSections?.length) {
        settings.layoutSections = defaultSettings.layoutSections;
      }
      if (!settings.pageLayout?.sections?.length) {
        settings.pageLayout = defaultSettings.pageLayout;
      }
      if (!settings.postCardLayout?.sections?.length) {
        settings.postCardLayout = defaultSettings.postCardLayout;
      }
      if (!settings.commentCardLayout?.sections?.length) {
        settings.commentCardLayout = defaultSettings.commentCardLayout;
      }
      if (!settings.authorProfileLayout2?.sections?.length) {
        settings.authorProfileLayout2 = defaultSettings.authorProfileLayout2;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to load config from Hive:", message);
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
