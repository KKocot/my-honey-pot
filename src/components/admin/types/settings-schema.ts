// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Zod Schema for SettingsData validation
// ============================================
// Validates config loaded from Hive blockchain.
// Intentionally loose on complex nested objects (CardLayout, PageLayout)
// to avoid breaking on future schema changes. Uses passthrough()
// for forward compatibility with new fields.

import { z } from "zod";

/** Schema for settings data loaded from blockchain */
export const settings_schema = z
  .object({
    // Core identity
    hiveUsername: z.string().optional().default(""),
    siteTheme: z.string().optional().default("light"),
    customColors: z.unknown().optional().default(null),
    siteName: z.string().optional().default(""),
    siteDescription: z.string().optional().default(""),

    // Layout sections (complex nested array - validate loosely)
    layoutSections: z.array(z.unknown()).optional().default([]),

    // Posts layout
    postsLayout: z
      .enum(["list", "grid", "masonry"])
      .optional()
      .default("list"),
    gridColumns: z.number().optional().default(2),
    cardGapPx: z.number().optional().default(24),
    cardLayout: z
      .enum(["horizontal", "vertical"])
      .optional()
      .default("horizontal"),
    thumbnailPosition: z.enum(["left", "right"]).optional().default("left"),
    thumbnailSizePx: z.number().optional().default(96),
    cardPaddingPx: z.number().optional().default(24),
    cardBorderRadiusPx: z.number().optional().default(16),
    titleSizePx: z.number().optional().default(20),

    // Card visibility toggles
    showThumbnail: z.boolean().optional().default(true),
    showSummary: z.boolean().optional().default(true),
    summaryMaxLength: z.number().optional().default(150),
    showDate: z.boolean().optional().default(true),
    showVotes: z.boolean().optional().default(true),
    showComments: z.boolean().optional().default(true),
    showPayout: z.boolean().optional().default(true),
    showTags: z.boolean().optional().default(true),
    cardBorder: z.boolean().optional().default(true),
    maxTags: z.number().optional().default(5),

    // Header & author
    showHeader: z.boolean().optional().default(true),
    showAuthorProfile: z.boolean().optional().default(true),
    authorAvatarSizePx: z.number().optional().default(64),
    showPostCount: z.boolean().optional().default(true),
    showAuthorRewards: z.boolean().optional().default(true),
    postsPerPage: z.number().optional().default(20),
    sidebarWidthPx: z.number().optional().default(280),
    headerMaxWidthPx: z.number().optional().default(1280),

    // Author Profile extended settings
    authorProfileLayout: z
      .enum(["horizontal", "vertical"])
      .optional()
      .default("horizontal"),
    showAuthorAbout: z.boolean().optional().default(true),
    showAuthorLocation: z.boolean().optional().default(true),
    showAuthorWebsite: z.boolean().optional().default(true),
    showAuthorJoinDate: z.boolean().optional().default(true),
    showAuthorReputation: z.boolean().optional().default(true),
    showAuthorFollowers: z.boolean().optional().default(true),
    showAuthorFollowing: z.boolean().optional().default(true),
    showAuthorVotingPower: z.boolean().optional().default(false),
    showAuthorHiveBalance: z.boolean().optional().default(false),
    showAuthorHbdBalance: z.boolean().optional().default(false),
    showAuthorCoverImage: z.boolean().optional().default(true),
    authorCoverHeightPx: z.number().optional().default(64),
    authorUsernameSizePx: z.number().optional().default(14),
    authorDisplayNameSizePx: z.number().optional().default(18),
    authorAboutSizePx: z.number().optional().default(14),
    authorStatsSizePx: z.number().optional().default(14),
    authorMetaSizePx: z.number().optional().default(12),
    authorReputationSizePx: z.number().optional().default(12),

    // Comments Tab settings
    showCommentsTab: z.boolean().optional().default(true),

    // Comment Card settings
    commentShowAuthor: z.boolean().optional().default(true),
    commentShowAvatar: z.boolean().optional().default(true),
    commentAvatarSizePx: z.number().optional().default(40),
    commentShowReplyContext: z.boolean().optional().default(true),
    commentShowTimestamp: z.boolean().optional().default(true),
    commentShowRepliesCount: z.boolean().optional().default(true),
    commentShowVotes: z.boolean().optional().default(true),
    commentShowPayout: z.boolean().optional().default(true),
    commentShowViewLink: z.boolean().optional().default(true),
    commentMaxLength: z.number().optional().default(0),
    commentPaddingPx: z.number().optional().default(16),

    // Card layouts (complex recursive structures - validate loosely)
    postCardLayout: z.unknown().optional(),
    commentCardLayout: z.unknown().optional(),
    authorProfileLayout2: z.unknown().optional(),

    // Page layout (complex nested structure - validate loosely)
    pageLayout: z.unknown().optional(),

    // Sorting settings
    postsSortOrder: z.enum(["blog", "posts"]).optional().default("blog"),
    includeReblogs: z.boolean().optional().default(false),

    // Card Hover Animation settings
    cardHoverEffect: z
      .enum(["none", "shadow", "lift", "scale", "glow"])
      .optional()
      .default("shadow"),
    cardTransitionDuration: z.number().optional().default(200),
    cardHoverScale: z.number().optional().default(1.02),
    cardHoverShadow: z.string().optional().default("md"),
    cardHoverBrightness: z.number().optional().default(1.0),

    // Scroll Animation settings
    scrollAnimationEnabled: z.boolean().optional().default(true),
    scrollAnimationType: z
      .enum(["none", "fade", "slide-up", "slide-left", "zoom", "flip"])
      .optional()
      .default("fade"),
    scrollAnimationDuration: z.number().optional().default(400),
    scrollAnimationDelay: z.number().optional().default(100),

    // Navigation Tabs (array of objects - validate loosely)
    navigationTabs: z.array(z.unknown()).optional().default([]),

    // Social media links (array of objects - validate loosely)
    socialLinks: z.array(z.unknown()).optional().default([]),

    // Community-specific display settings
    community_default_sort: z
      .enum(["trending", "hot", "created", "payout"])
      .optional(),
    community_show_rules: z.boolean().optional(),
    community_show_leadership: z.boolean().optional(),
    community_show_subscribers: z.boolean().optional(),
    community_show_description: z.boolean().optional(),
  })
  .passthrough();

/** Type inferred from the Zod schema (after parsing with defaults applied) */
export type SettingsDataParsed = z.infer<typeof settings_schema>;
