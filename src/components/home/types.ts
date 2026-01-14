import type { BridgePost, DatabaseAccount } from '../../lib/hive'

// ============================================
// Types for homepage components
// ============================================

export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

export interface SiteSettings {
  siteName?: string
  siteDescription?: string
  siteTheme?: string
  layoutSections?: LayoutSection[]
  postsLayout?: 'list' | 'grid' | 'masonry'
  gridColumns?: number
  cardGapPx?: number
  cardLayout?: 'horizontal' | 'vertical'
  thumbnailPosition?: 'left' | 'right'
  thumbnailSizePx?: number
  cardPaddingPx?: number
  cardBorderRadiusPx?: number
  titleSizePx?: number
  showThumbnail?: boolean
  showSummary?: boolean
  summaryMaxLength?: number
  showDate?: boolean
  showVotes?: boolean
  showComments?: boolean
  showPayout?: boolean
  showTags?: boolean
  cardBorder?: boolean
  maxTags?: number
  showHeader?: boolean
  showAuthorProfile?: boolean
  authorAvatarSizePx?: number
  showPostCount?: boolean
  showAuthorRewards?: boolean
  postsPerPage?: number
  sidebarWidthPx?: number
}

export interface HomePageData {
  siteName: string
  siteDescription: string
  hiveUsername: string | undefined
  hiveAccount: DatabaseAccount | null
  hivePosts: readonly BridgePost[]
  settings: SiteSettings
  error: string | null
}

export const defaultLayoutSections: LayoutSection[] = [
  { id: 'header', position: 'top', enabled: true },
  { id: 'authorProfile', position: 'sidebar-left', enabled: true },
  { id: 'posts', position: 'main', enabled: true },
  { id: 'footer', position: 'bottom', enabled: false },
]
