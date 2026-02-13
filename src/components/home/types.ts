// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { BridgePost, IDatabaseAccount, AccountPostsSortOption, CommentSortOption } from '@hiveio/workerbee/blog-logic'
import type { SettingsData } from '../admin/types'
import { defaultSettings, defaultCommunitySettings } from "../admin/types/settings"

// ============================================
// Re-export types from admin/types
// ============================================

export type {
  CardSectionChild,
  CardSection,
  CardLayout,
  SocialLink,
  LayoutSection,
  PageSlotPosition,
  PageLayoutSection,
  PageLayout,
  ThemeColors,
  NavigationTab,
} from '../admin/types/index'

// ============================================
// Site Settings (partial version for SSR)
// ============================================

// SiteSettings is the SSR-side config loaded from Hive
// All fields are optional because config may be incomplete
// Extends SettingsData with SSR-specific fields
interface SiteSettingsExtras {
  commentsSortOrder?: CommentSortOption
}

export type SiteSettings = Partial<SettingsData> & SiteSettingsExtras

// ============================================
// Homepage Data
// ============================================

export interface HomePageData {
  siteName: string
  siteDescription: string
  hiveUsername: string | undefined
  hiveAccount: IDatabaseAccount | null
  hivePosts: readonly BridgePost[]
  settings: SiteSettings
  error: string | null
}

// ============================================
// Default values (single source of truth: settings.ts)
// ============================================

export const defaultLayoutSections = defaultSettings.layoutSections;
export const defaultPageLayout = defaultSettings.pageLayout;
export const defaultCommunityPageLayout = defaultCommunitySettings.pageLayout;
