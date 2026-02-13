// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Settings Data Structure
// ============================================

import type { ThemeColors } from './theme'
import type { LayoutSection, CardLayout, PageLayout } from './layout'
import type { NavigationTab } from './navigation'
import type { SocialLink } from './social'

/** Sort order options for community posts display */
export type CommunityDisplaySortOrder = 'trending' | 'hot' | 'created' | 'payout'

// Naming convention:
// Legacy fields use camelCase (e.g. postsSortOrder, showAuthorProfile).
// New community fields use snake_case (e.g. community_default_sort, community_show_rules)
// per project coding rules. Migration of legacy fields is not worth the cost
// as it would break configs already saved on blockchain.

/**
 * Complete site settings data structure.
 * This is persisted to the database and controls all customizable aspects of the site.
 */
export interface SettingsData {
  hiveUsername: string
  siteTheme: string
  customColors: ThemeColors | null
  siteName: string
  siteDescription: string
  layoutSections: LayoutSection[]
  postsLayout: 'list' | 'grid' | 'masonry'
  gridColumns: number
  cardGapPx: number
  cardLayout: 'horizontal' | 'vertical'
  thumbnailPosition: 'left' | 'right'
  thumbnailSizePx: number
  cardPaddingPx: number
  cardBorderRadiusPx: number
  titleSizePx: number
  showThumbnail: boolean
  showSummary: boolean
  summaryMaxLength: number
  showDate: boolean
  showVotes: boolean
  showComments: boolean
  showPayout: boolean
  showTags: boolean
  cardBorder: boolean
  maxTags: number
  showHeader: boolean
  showAuthorProfile: boolean
  authorAvatarSizePx: number
  showPostCount: boolean
  showAuthorRewards: boolean
  postsPerPage: number
  sidebarWidthPx: number
  headerMaxWidthPx: number
  // Author Profile extended settings
  authorProfileLayout: 'horizontal' | 'vertical'
  showAuthorAbout: boolean
  showAuthorLocation: boolean
  showAuthorWebsite: boolean
  showAuthorJoinDate: boolean
  showAuthorReputation: boolean
  showAuthorFollowers: boolean
  showAuthorFollowing: boolean
  showAuthorVotingPower: boolean
  showAuthorHiveBalance: boolean
  showAuthorHbdBalance: boolean
  showAuthorCoverImage: boolean
  authorCoverHeightPx: number
  authorUsernameSizePx: number
  authorDisplayNameSizePx: number
  authorAboutSizePx: number
  authorStatsSizePx: number
  authorMetaSizePx: number
  authorReputationSizePx: number
  // Comments Tab settings
  showCommentsTab: boolean
  // Comment Card settings
  commentShowAuthor: boolean
  commentShowAvatar: boolean
  commentAvatarSizePx: number
  commentShowReplyContext: boolean
  commentShowTimestamp: boolean
  commentShowRepliesCount: boolean
  commentShowVotes: boolean
  commentShowPayout: boolean
  commentShowViewLink: boolean
  commentMaxLength: number
  commentPaddingPx: number
  // Card layout with sections (drag & drop)
  postCardLayout: CardLayout
  commentCardLayout: CardLayout
  authorProfileLayout2: CardLayout
  // Page layout with sections (drag & drop)
  pageLayout: PageLayout
  // Sorting settings
  postsSortOrder: 'blog' | 'posts'
  includeReblogs: boolean
  // Card Hover Animation settings
  cardHoverEffect: 'none' | 'shadow' | 'lift' | 'scale' | 'glow'
  cardTransitionDuration: number // ms
  cardHoverScale: number // 1.0 = none, 1.02 = 2% scale, etc.
  cardHoverShadow: string // shadow intensity: 'sm' | 'md' | 'lg' | 'xl'
  cardHoverBrightness: number // 1.0 = none, 1.05 = 5% brighter
  // Scroll Animation settings
  scrollAnimationEnabled: boolean
  scrollAnimationType: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip'
  scrollAnimationDuration: number // ms
  scrollAnimationDelay: number // ms delay between each card
  // Navigation Tabs settings
  navigationTabs: NavigationTab[]
  // Social media links for author profile
  socialLinks: SocialLink[]
  // Community-specific display settings
  community_default_sort?: CommunityDisplaySortOrder
  community_show_rules?: boolean
  community_show_leadership?: boolean
  community_show_subscribers?: boolean
  community_show_description?: boolean
}

export const defaultSettings: SettingsData = {
  hiveUsername: '',
  siteTheme: 'light',
  customColors: null,
  siteName: '',
  siteDescription: '',
  layoutSections: [
    { id: 'header', position: 'top', enabled: true },
    { id: 'authorProfile', position: 'sidebar-left', enabled: true },
    { id: 'posts', position: 'main', enabled: true },
    { id: 'footer', position: 'bottom', enabled: false },
  ],
  postsLayout: 'list',
  gridColumns: 2,
  cardGapPx: 24,
  cardLayout: 'horizontal',
  thumbnailPosition: 'left',
  thumbnailSizePx: 96,
  cardPaddingPx: 24,
  cardBorderRadiusPx: 16,
  titleSizePx: 20,
  showThumbnail: true,
  showSummary: true,
  summaryMaxLength: 150,
  showDate: true,
  showVotes: true,
  showComments: true,
  showPayout: true,
  showTags: true,
  cardBorder: true,
  maxTags: 5,
  showHeader: true,
  showAuthorProfile: true,
  authorAvatarSizePx: 64,
  showPostCount: true,
  showAuthorRewards: true,
  postsPerPage: 20,
  sidebarWidthPx: 280,
  headerMaxWidthPx: 1280,
  authorProfileLayout: 'horizontal',
  showAuthorAbout: true,
  showAuthorLocation: true,
  showAuthorWebsite: true,
  showAuthorJoinDate: true,
  showAuthorReputation: true,
  showAuthorFollowers: true,
  showAuthorFollowing: true,
  showAuthorVotingPower: false,
  showAuthorHiveBalance: false,
  showAuthorHbdBalance: false,
  showAuthorCoverImage: true,
  authorCoverHeightPx: 64,
  authorUsernameSizePx: 14,
  authorDisplayNameSizePx: 18,
  authorAboutSizePx: 14,
  authorStatsSizePx: 14,
  authorMetaSizePx: 12,
  authorReputationSizePx: 12,
  showCommentsTab: true,
  commentShowAuthor: true,
  commentShowAvatar: true,
  commentAvatarSizePx: 40,
  commentShowReplyContext: true,
  commentShowTimestamp: true,
  commentShowRepliesCount: true,
  commentShowVotes: true,
  commentShowPayout: true,
  commentShowViewLink: true,
  commentMaxLength: 0,
  commentPaddingPx: 16,
  postCardLayout: {
    sections: [
      {
        id: 'sec-main',
        orientation: 'horizontal',
        children: [
          { type: 'element', id: 'thumbnail' },
          {
            type: 'section',
            section: {
              id: 'sec-content',
              orientation: 'vertical',
              children: [
                { type: 'element', id: 'title' },
                { type: 'element', id: 'summary' },
                {
                  type: 'section',
                  section: {
                    id: 'sec-meta',
                    orientation: 'horizontal',
                    children: [
                      { type: 'element', id: 'date' },
                      { type: 'element', id: 'votes' },
                      { type: 'element', id: 'comments' },
                      { type: 'element', id: 'payout' },
                    ],
                  },
                },
                { type: 'element', id: 'tags' },
              ],
            },
          },
        ],
      },
    ],
  },
  commentCardLayout: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'replyContext' }] },
      { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'author' }, { type: 'element', id: 'timestamp' }] },
      { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'body' }] },
      { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'replies' }, { type: 'element', id: 'votes' }, { type: 'element', id: 'payout' }, { type: 'element', id: 'viewLink' }] },
    ],
  },
  authorProfileLayout2: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
      { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'username' }, { type: 'element', id: 'reputation' }] },
      { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
      { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'location' }, { type: 'element', id: 'website' }, { type: 'element', id: 'joinDate' }] },
      { id: 'sec-5', orientation: 'horizontal', children: [{ type: 'element', id: 'followers' }, { type: 'element', id: 'following' }, { type: 'element', id: 'postCount' }, { type: 'element', id: 'hpEarned' }] },
      { id: 'sec-6', orientation: 'horizontal', children: [{ type: 'element', id: 'votingPower' }, { type: 'element', id: 'hiveBalance' }, { type: 'element', id: 'hbdBalance' }] },
    ],
  },
  pageLayout: {
    sections: [
      { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
      { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
      { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
      { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
    ],
  },
  postsSortOrder: 'blog',
  includeReblogs: false,
  cardHoverEffect: 'shadow',
  cardTransitionDuration: 200,
  cardHoverScale: 1.02,
  cardHoverShadow: 'md',
  cardHoverBrightness: 1.0,
  scrollAnimationEnabled: true,
  scrollAnimationType: 'fade',
  scrollAnimationDuration: 400,
  scrollAnimationDelay: 100,
  navigationTabs: [
    { id: 'posts', label: 'Posts', enabled: true, showCount: false },
    { id: 'threads', label: 'Hive Threads', enabled: false, showCount: false },
    { id: 'comments', label: 'Comments', enabled: true, showCount: false },
  ],
  socialLinks: [],
  community_default_sort: 'trending',
  community_show_rules: true,
  community_show_leadership: true,
  community_show_subscribers: true,
  community_show_description: true,
}

export const defaultCommunitySettings: SettingsData = {
  ...defaultSettings,
  siteTheme: "ocean",
  postsLayout: "grid",
  gridColumns: 2,
  cardLayout: "vertical",
  cardGapPx: 20,
  cardPaddingPx: 20,
  cardBorderRadiusPx: 12,
  titleSizePx: 18,
  thumbnailSizePx: 200,
  showSummary: true,
  summaryMaxLength: 100,
  showAuthorProfile: false,
  cardHoverEffect: "lift",
  scrollAnimationType: "slide-up",
  postCardLayout: {
    sections: [
      {
        id: "sec-main",
        orientation: "vertical",
        children: [
          { type: "element", id: "thumbnail" },
          {
            type: "section",
            section: {
              id: "sec-author-date",
              orientation: "horizontal",
              children: [
                { type: "element", id: "avatar" },
                { type: "element", id: "date" },
              ],
            },
          },
          { type: "element", id: "title" },
          { type: "element", id: "summary" },
          {
            type: "section",
            section: {
              id: "sec-meta",
              orientation: "horizontal",
              children: [
                { type: "element", id: "votes" },
                { type: "element", id: "comments" },
              ],
            },
          },
        ],
      },
    ],
  },
  layoutSections: [
    { id: "header", position: "top", enabled: true },
    { id: "posts", position: "main", enabled: true },
    { id: "footer", position: "bottom", enabled: true },
  ],
  pageLayout: {
    sections: [
      {
        id: "page-sec-1",
        slot: "top",
        orientation: "horizontal",
        elements: ["header"],
        active: true,
      },
      {
        id: "page-sec-2",
        slot: "sidebar-left",
        orientation: "vertical",
        elements: ["communityProfile", "communitySidebar"],
        active: true,
      },
      {
        id: "page-sec-3",
        slot: "main",
        orientation: "vertical",
        elements: ["posts"],
        active: true,
      },
      {
        id: "page-sec-4",
        slot: "bottom",
        orientation: "horizontal",
        elements: ["footer"],
        active: true,
      },
    ],
  },
};

export function get_default_settings(is_community: boolean): SettingsData {
  return is_community ? defaultCommunitySettings : defaultSettings;
}

/** Keys of SettingsData that are community-only and should be stripped in user mode */
export const COMMUNITY_SETTINGS_KEYS: ReadonlyArray<keyof SettingsData> = [
  "community_default_sort",
  "community_show_rules",
  "community_show_leadership",
  "community_show_subscribers",
  "community_show_description",
] as const;

/**
 * Remove community-specific fields from a settings object (used in user mode).
 * Works with both full SettingsData and Partial<SettingsData>.
 * COMMUNITY_SETTINGS_KEYS is the single source of truth for which fields to strip.
 */
export function strip_community_fields<T extends Partial<SettingsData>>(
  config: T
): T {
  const keys_to_strip: ReadonlySet<string> = new Set(COMMUNITY_SETTINGS_KEYS);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (!keys_to_strip.has(key)) {
      result[key] = value;
    }
  }
  // Safe: we only removed keys, shape is subset of T
  return result as T;
}

/**
 * Helper function to convert SettingsData to Record for diff comparison.
 * Uses JSON round-trip to produce a plain object (no prototype chain issues).
 */
export function settings_to_record(
  settings: SettingsData
): Record<string, unknown> {
  const json: unknown = JSON.parse(JSON.stringify(settings));
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}
