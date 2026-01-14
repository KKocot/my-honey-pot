// ============================================
// Shared types for admin panel
// ============================================

export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

// Card element that can be reordered
export interface CardElement {
  id: string
  enabled: boolean
}

// Card section with orientation and elements
export interface CardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  elements: string[] // element IDs
}

// Card layout with multiple sections
export interface CardLayout {
  sections: CardSection[]
}

// Post card elements
export type PostCardElementId =
  | 'thumbnail'
  | 'title'
  | 'summary'
  | 'date'
  | 'votes'
  | 'comments'
  | 'payout'
  | 'tags'

// Comment card elements
export type CommentCardElementId =
  | 'replyContext'
  | 'avatar'
  | 'author'
  | 'timestamp'
  | 'body'
  | 'replies'
  | 'votes'
  | 'payout'
  | 'viewLink'

export interface SettingsData {
  hiveUsername: string
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
  // Comments Tab settings
  showCommentsTab: boolean
  commentsLayout: 'list' | 'grid' | 'masonry'
  commentsGridColumns: number
  commentsGapPx: number
  // Comment Card settings
  commentShowAuthor: boolean
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
  // Card layout with sections (drag & drop)
  postCardLayout: CardLayout
  commentCardLayout: CardLayout
}

export const defaultSettings: SettingsData = {
  hiveUsername: '',
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
  // Comments Tab defaults
  showCommentsTab: true,
  commentsLayout: 'list',
  commentsGridColumns: 2,
  commentsGapPx: 16,
  // Comment Card defaults
  commentShowAuthor: true,
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
  // Default card layouts with sections
  postCardLayout: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', elements: ['thumbnail'] },
      { id: 'sec-2', orientation: 'vertical', elements: ['title', 'summary'] },
      { id: 'sec-3', orientation: 'horizontal', elements: ['date', 'votes', 'comments', 'payout'] },
      { id: 'sec-4', orientation: 'horizontal', elements: ['tags'] },
    ],
  },
  commentCardLayout: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', elements: ['replyContext'] },
      { id: 'sec-2', orientation: 'horizontal', elements: ['avatar', 'author', 'timestamp'] },
      { id: 'sec-3', orientation: 'vertical', elements: ['body'] },
      { id: 'sec-4', orientation: 'horizontal', elements: ['replies', 'votes', 'payout', 'viewLink'] },
    ],
  },
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

// Labels for post card elements
export const postCardElementLabels: Record<string, string> = {
  thumbnail: 'Thumbnail',
  title: 'Title',
  summary: 'Summary',
  meta: 'Meta (date, votes, comments, payout)',
  tags: 'Tags',
}

// Labels for comment card elements
export const commentCardElementLabels: Record<string, string> = {
  replyContext: 'Reply Context',
  avatar: 'Avatar',
  author: 'Author',
  timestamp: 'Timestamp',
  body: 'Comment Body',
  actionBar: 'Action Bar (replies, votes, payout)',
}
