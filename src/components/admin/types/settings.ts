// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Settings Data Structure
// ============================================

import type { ThemeColors } from './theme'
import type { LayoutSection, CardLayout, PageLayout } from './layout'
import type { NavigationTab } from './navigation'
import type { SocialLink } from './social'

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
  // Author Profile extended defaults
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
  // Comments Tab defaults
  showCommentsTab: true,
  // Comment Card defaults
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
  // Default card layouts with sections (using new recursive children format)
  // Main section is horizontal: thumbnail on left, content on right
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
  // Default page layout with sections per slot
  pageLayout: {
    sections: [
      { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
      { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
      { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
      { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
    ],
  },
  // Sorting defaults
  postsSortOrder: 'blog',
  includeReblogs: false,
  // Card Hover Animation defaults
  cardHoverEffect: 'shadow',
  cardTransitionDuration: 200,
  cardHoverScale: 1.02,
  cardHoverShadow: 'md',
  cardHoverBrightness: 1.0,
  // Scroll Animation defaults
  scrollAnimationEnabled: true,
  scrollAnimationType: 'fade',
  scrollAnimationDuration: 400,
  scrollAnimationDelay: 100,
  // Navigation Tabs defaults (only Hive content tabs)
  navigationTabs: [
    { id: 'posts', label: 'Posts', enabled: true, showCount: false },
    { id: 'threads', label: 'Hive Threads', enabled: false, showCount: false },
    { id: 'comments', label: 'Comments', enabled: true, showCount: false },
  ],
  // Social media links defaults
  socialLinks: [],
}

/**
 * Helper function to convert SettingsData to Record for diff comparison.
 * This avoids TypeScript errors when using object spread/iteration.
 */
export function settingsToRecord(settings: SettingsData): Record<string, unknown> {
  return { ...settings } as Record<string, unknown>
}
