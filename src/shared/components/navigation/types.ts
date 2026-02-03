// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Navigation types - shared between Astro and SolidJS
 */

/**
 * Navigation tab configuration from settings
 */
export interface NavigationTabConfig {
  id: string
  label: string
  enabled: boolean
  showCount: boolean
  tag?: string
  tooltip?: string
}

/**
 * Processed navigation item ready for rendering
 */
export interface NavigationItem {
  id: string
  label: string
  count?: number
  href: string
  disabled: boolean
  tooltip?: string
}

/**
 * Navigation settings for rendering
 */
export interface NavigationSettings {
  tabs: NavigationTabConfig[]
  activeTab: string
  postsCount: number
  commentsCount: number
}

/**
 * Default navigation tabs
 */
export const defaultNavigationTabs: NavigationTabConfig[] = [
  { id: 'posts', label: 'Posts', enabled: true, showCount: false },
  { id: 'comments', label: 'Comments', enabled: true, showCount: false },
]
