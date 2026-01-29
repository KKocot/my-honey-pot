/**
 * Navigation shared component utilities
 * Provides data transformation and rendering for navigation
 */

export type {
  NavigationTabConfig,
  NavigationItem,
  NavigationSettings,
} from './types'
export { defaultNavigationTabs } from './types'

export {
  getTabCount,
  buildNavHref,
  buildNavigationItems,
  createNavigationSettings,
} from './utils'

export {
  renderNavigationItem,
  getNavigationItemClasses,
  renderNavigation,
  renderNavigationItems,
} from './render'
