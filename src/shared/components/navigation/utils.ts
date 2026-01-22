/**
 * Navigation utilities - data transformation and processing functions
 */

import type { NavigationTabConfig, NavigationItem, NavigationSettings } from './types'
import { defaultNavigationTabs } from './types'

/**
 * Check if URL is external (starts with http:// or https://)
 */
export function isExternalUrl(url: string | undefined): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

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
 * Build href for navigation item
 */
export function buildNavHref(item: { id: string; href?: string; external: boolean }): string {
  if (item.external && item.href) {
    return item.href
  }
  if (item.id === 'posts') {
    return '/'
  }
  return `/?tab=${item.id}`
}

/**
 * Process tab configs into navigation items
 */
export function buildNavigationItems(settings: NavigationSettings): NavigationItem[] {
  const tabs = settings.tabs.length > 0 ? settings.tabs : defaultNavigationTabs

  return tabs
    .filter(tab => tab.enabled)
    .map(tab => {
      const external = isExternalUrl(tab.href)
      const count = getTabCount(tab, settings.postsCount, settings.commentsCount)
      // Threads are work in progress
      const disabled = tab.id === 'threads'

      const item: NavigationItem = {
        id: tab.id,
        label: tab.label,
        count,
        href: '', // Will be set below
        external,
        disabled,
        tooltip: disabled ? 'Work in Progress' : tab.tooltip,
      }

      item.href = buildNavHref(item)

      return item
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
