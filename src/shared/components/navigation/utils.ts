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
  if (tab.id === 'posts') return postsCount
  if (tab.id === 'comments') return commentsCount
  return undefined
}

/**
 * Build href for navigation item based on tab type
 */
export function buildNavHref(tab: { id: string; tag?: string }): string {
  if (tab.id === 'posts') {
    return '/'
  }
  // Category tabs link to /?tab={id} (filtered by tag on the server)
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
      // Threads are work in progress
      const disabled = tab.id === 'threads'

      return {
        id: tab.id,
        label: tab.label,
        count,
        href: buildNavHref(tab),
        disabled,
        tooltip: disabled ? 'Work in Progress' : tab.tooltip,
      }
    })
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
    activeTab: config.activeTab ?? 'posts',
    postsCount: config.postsCount ?? 0,
    commentsCount: config.commentsCount ?? 0,
  }
}
