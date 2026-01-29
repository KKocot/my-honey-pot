import type { BridgePost, IDatabaseAccount, AccountPostsSortOption, CommentSortOption } from '../../lib/blog-logic'

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
} from '../admin/types/index'

// ============================================
// Site Settings (partial version for SSR)
// ============================================

export interface SiteSettings {
  hiveUsername?: string
  siteName?: string
  siteDescription?: string
  siteTheme?: string
  customColors?: import('../admin/types/index').ThemeColors | null
  layoutSections?: import('../admin/types/index').LayoutSection[]
  pageLayout?: import('../admin/types/index').PageLayout
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
  // Post card sections layout for drag & drop
  postCardLayout?: import('../admin/types/index').CardLayout
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
  authorProfileLayout2?: import('../admin/types/index').CardLayout
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
  // Author Profile size settings
  authorCoverHeightPx?: number
  authorUsernameSizePx?: number
  authorDisplayNameSizePx?: number
  authorAboutSizePx?: number
  authorStatsSizePx?: number
  authorMetaSizePx?: number
  // Social Links
  socialLinks?: import('../admin/types/index').SocialLink[]
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
  commentCardLayout?: import('../admin/types/index').CardLayout
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
  // Navigation Tabs settings
  navigationTabs?: import('../admin/types/index').NavigationTab[]
}

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
    { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'] },
    { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'] },
    { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'] },
    { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'] },
  ],
}
