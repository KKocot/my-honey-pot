import type { BridgePost, IDatabaseAccount, AccountPostsSortOption, CommentSortOption } from '../../lib/blog-logic'
import type { SettingsData } from '../admin/types'

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
// Default values
// ============================================

export const defaultLayoutSections: import('../admin/types/index').LayoutSection[] = [
  { id: 'header', position: 'top', enabled: true },
  { id: 'authorProfile', position: 'sidebar-left', enabled: true },
  { id: 'posts', position: 'main', enabled: true },
  { id: 'footer', position: 'bottom', enabled: false },
]

export const defaultPageLayout: import('../admin/types/index').PageLayout = {
  sections: [
    { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
    { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
    { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'], active: true },
    { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
  ],
}
