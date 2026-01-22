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
  href?: string
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
  external: boolean
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
