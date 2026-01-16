import type { BridgePost, IDatabaseAccount, AccountPostsSortOption, CommentSortOption } from '../../lib/blog-logic'

// ============================================
// Types for homepage components
// ============================================

// Old layout section format (legacy)
export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

// New page layout format (Page Layout Editor)
export type PageSlotPosition = 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'

export interface PageLayoutSection {
  id: string
  slot: PageSlotPosition
  orientation: 'horizontal' | 'vertical'
  elements: string[]
}

export interface PageLayout {
  sections: PageLayoutSection[]
}

export interface ThemeColors {
  bg: string
  bgSecondary: string
  bgCard: string
  text: string
  textMuted: string
  primary: string
  primaryHover: string
  primaryText: string
  accent: string
  border: string
  success: string
  error: string
  warning: string
  info: string
}

export interface SiteSettings {
  hiveUsername?: string
  siteName?: string
  siteDescription?: string
  siteTheme?: string
  customColors?: ThemeColors | null
  layoutSections?: LayoutSection[]
  pageLayout?: PageLayout
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
  headerMaxWidthPx?: number
  // Author Profile extended settings
  authorProfileLayout?: 'horizontal' | 'vertical'
  showAuthorAbout?: boolean
  showAuthorLocation?: boolean
  showAuthorWebsite?: boolean
  showAuthorJoinDate?: boolean
  showAuthorReputation?: boolean
  showAuthorFollowers?: boolean
  showAuthorFollowing?: boolean
  showAuthorVotingPower?: boolean
  showAuthorHiveBalance?: boolean
  showAuthorHbdBalance?: boolean
  showAuthorCoverImage?: boolean
  // Comments Tab settings
  showCommentsTab?: boolean
  commentsLayout?: 'list' | 'grid' | 'masonry'
  commentsGridColumns?: number
  commentsGapPx?: number
  // Comment Card settings
  commentShowAuthor?: boolean
  commentShowAvatar?: boolean
  commentAvatarSizePx?: number
  commentShowReplyContext?: boolean
  commentShowTimestamp?: boolean
  commentShowRepliesCount?: boolean
  commentShowVotes?: boolean
  commentShowPayout?: boolean
  commentShowViewLink?: boolean
  commentMaxLength?: number
  commentPaddingPx?: number
  // Card Hover Animation settings
  cardHoverEffect?: 'none' | 'shadow' | 'lift' | 'scale' | 'glow'
  cardTransitionDuration?: number
  cardHoverScale?: number
  cardHoverShadow?: string
  cardHoverBrightness?: number
  // Sorting settings
  postsSortOrder?: AccountPostsSortOption
  commentsSortOrder?: CommentSortOption
  includeReblogs?: boolean
  // Scroll Animation settings
  scrollAnimationEnabled?: boolean
  scrollAnimationType?: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip'
  scrollAnimationDuration?: number
  scrollAnimationDelay?: number
}

export interface HomePageData {
  siteName: string
  siteDescription: string
  hiveUsername: string | undefined
  hiveAccount: IDatabaseAccount | null
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

export const defaultPageLayout: PageLayout = {
  sections: [
    { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'] },
    { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'] },
    { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'] },
    { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'] },
  ],
}
