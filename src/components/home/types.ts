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
