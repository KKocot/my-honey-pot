// ============================================
// Shared types for admin panel
// ============================================

export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

export interface SettingsData {
  siteTheme: 'light' | 'dark' | 'green' | 'pink'
  siteName: string
  siteDescription: string
  layoutSections: LayoutSection[]
  postsLayout: 'list' | 'grid' | 'masonry'
  gridColumns: number
  cardGapPx: number
  cardLayout: 'horizontal' | 'vertical'
  thumbnailPosition: 'left' | 'right'
  thumbnailSizePx: number
  cardPaddingPx: number
  cardBorderRadiusPx: number
  titleSizePx: number
  showThumbnail: boolean
  showSummary: boolean
  summaryMaxLength: number
  showDate: boolean
  showVotes: boolean
  showComments: boolean
  showPayout: boolean
  showTags: boolean
  cardBorder: boolean
  maxTags: number
  showHeader: boolean
  showAuthorProfile: boolean
  authorAvatarSizePx: number
  showPostCount: boolean
  showAuthorRewards: boolean
  postsPerPage: number
  sidebarWidthPx: number
  // Author Profile extended settings
  authorProfileLayout: 'horizontal' | 'vertical'
  showAuthorAbout: boolean
  showAuthorLocation: boolean
  showAuthorWebsite: boolean
  showAuthorJoinDate: boolean
  showAuthorReputation: boolean
  showAuthorFollowers: boolean
  showAuthorFollowing: boolean
  showAuthorVotingPower: boolean
  showAuthorHiveBalance: boolean
  showAuthorHbdBalance: boolean
  showAuthorCoverImage: boolean
  // Comment Card settings
  commentShowAvatar: boolean
  commentAvatarSizePx: number
  commentShowReplyContext: boolean
  commentShowTimestamp: boolean
  commentShowRepliesCount: boolean
  commentShowVotes: boolean
  commentShowPayout: boolean
  commentShowViewLink: boolean
  commentMaxLength: number
  commentPaddingPx: number
}

export const defaultSettings: SettingsData = {
  siteTheme: 'light',
  siteName: '',
  siteDescription: '',
  layoutSections: [
    { id: 'header', position: 'top', enabled: true },
    { id: 'authorProfile', position: 'sidebar-left', enabled: true },
    { id: 'posts', position: 'main', enabled: true },
    { id: 'footer', position: 'bottom', enabled: false },
  ],
  postsLayout: 'list',
  gridColumns: 2,
  cardGapPx: 24,
  cardLayout: 'horizontal',
  thumbnailPosition: 'left',
  thumbnailSizePx: 96,
  cardPaddingPx: 24,
  cardBorderRadiusPx: 16,
  titleSizePx: 20,
  showThumbnail: true,
  showSummary: true,
  summaryMaxLength: 150,
  showDate: true,
  showVotes: true,
  showComments: true,
  showPayout: true,
  showTags: true,
  cardBorder: true,
  maxTags: 5,
  showHeader: true,
  showAuthorProfile: true,
  authorAvatarSizePx: 64,
  showPostCount: true,
  showAuthorRewards: true,
  postsPerPage: 20,
  sidebarWidthPx: 280,
  // Author Profile extended defaults
  authorProfileLayout: 'horizontal',
  showAuthorAbout: true,
  showAuthorLocation: true,
  showAuthorWebsite: true,
  showAuthorJoinDate: true,
  showAuthorReputation: true,
  showAuthorFollowers: true,
  showAuthorFollowing: true,
  showAuthorVotingPower: false,
  showAuthorHiveBalance: false,
  showAuthorHbdBalance: false,
  showAuthorCoverImage: true,
  // Comment Card defaults
  commentShowAvatar: true,
  commentAvatarSizePx: 40,
  commentShowReplyContext: true,
  commentShowTimestamp: true,
  commentShowRepliesCount: true,
  commentShowVotes: true,
  commentShowPayout: true,
  commentShowViewLink: true,
  commentMaxLength: 0,
  commentPaddingPx: 16,
}

export const sectionLabels: Record<string, string> = {
  header: 'Header',
  authorProfile: 'Author Profile',
  posts: 'Posts List',
  footer: 'Footer',
}

export const sectionColors: Record<string, string> = {
  header: 'bg-primary text-white',
  authorProfile: 'bg-accent text-white',
  posts: 'bg-success text-white',
  footer: 'bg-text-muted text-white',
}

export const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'green', label: 'Green' },
  { value: 'pink', label: 'Pink' },
]

export const cardLayoutOptions = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]

export const thumbnailPositionOptions = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
]

export const authorProfileLayoutOptions = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
]
