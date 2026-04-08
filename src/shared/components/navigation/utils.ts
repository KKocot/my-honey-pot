// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Navigation utilities - data transformation and processing functions
 */

import type { NavigationTabConfig, NavigationItem, NavigationSettings } from './types'
import { defaultNavigationTabs } from './types'

/**
 * Get count for a specific tab
 */
export function getTabCount(
  tab: NavigationTabConfig,
  postsCount: number,
  commentsCount: number
): number | undefined {
  if (!tab.showCount) return undefined
  if (tab.id === 'blog') return postsCount
  if (tab.id === 'posts') return postsCount
  if (tab.id === 'comments') return commentsCount
  return undefined
}

/**
 * Build href for navigation item based on tab type
 */
export function buildNavHref(tab: { id: string; tag?: string }): string {
  if (tab.id === 'blog') {
    return '/'
  }
  return `/?tab=${encodeURIComponent(tab.id)}`
}

/**
 * Process tab configs into navigation items
 */
export function buildNavigationItems(settings: NavigationSettings): NavigationItem[] {
  const tabs = settings.tabs.length > 0 ? settings.tabs : defaultNavigationTabs

  return tabs
    .filter(tab => tab.enabled)
    .map(tab => {
      const count = getTabCount(tab, settings.postsCount, settings.commentsCount)
      return {
        id: tab.id,
        label: tab.label,
        count,
        href: buildNavHref(tab),
        disabled: false,
        tooltip: tab.tooltip,
      }
    })
}

/**
 * Check if any navigation tabs are enabled
 */
export function hasEnabledTabs(tabs?: NavigationTabConfig[]): boolean {
  const resolved = tabs && tabs.length > 0 ? tabs : defaultNavigationTabs
  return resolved.some(tab => tab.enabled)
}

/**
 * Create navigation settings from partial config
 */
export function createNavigationSettings(config: {
  navigationTabs?: NavigationTabConfig[]
  activeTab?: string
  postsCount?: number
  commentsCount?: number
}): NavigationSettings {
  return {
    tabs: config.navigationTabs ?? defaultNavigationTabs,
    activeTab: config.activeTab ?? 'blog',
    postsCount: config.postsCount ?? 0,
    commentsCount: config.commentsCount ?? 0,
  }
}
