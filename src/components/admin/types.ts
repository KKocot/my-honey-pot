// ============================================
// Shared types for admin panel
// ============================================

// Old layout section (kept for backwards compatibility)
export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

// ============================================
// Page Layout System (section-based drag & drop)
// ============================================

// Page slot positions
export type PageSlotPosition = 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'

// Page section with slot, orientation, and elements
export interface PageLayoutSection {
  id: string
  slot: PageSlotPosition
  orientation: 'horizontal' | 'vertical'
  elements: string[] // page element IDs
}

// Page layout with sections per slot
export interface PageLayout {
  sections: PageLayoutSection[]
}

// Page elements that can be placed in slots
export type PageElementId = 'header' | 'authorProfile' | 'posts' | 'comments' | 'footer' | 'navigation' | 'search' | 'tags' | 'recentPosts'

// Card element that can be reordered
export interface CardElement {
  id: string
  enabled: boolean
}

// ============================================
// Recursive nested sections system
// ============================================

// Child of a section - can be an element or a nested section
export type CardSectionChild =
  | { type: 'element'; id: string }
  | { type: 'section'; section: CardSection }

// Card section with orientation and recursive children
export interface CardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  children: CardSectionChild[]
}

// Card layout with multiple top-level sections
export interface CardLayout {
  sections: CardSection[]
}

// Legacy section format (for backwards compatibility)
export interface LegacyCardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  elements: string[]
}

// Migrate legacy layout to new format
export function migrateCardSection(section: CardSection | LegacyCardSection): CardSection {
  // If already has children array, it's new format
  if ('children' in section && Array.isArray(section.children)) {
    return section as CardSection
  }
  // Convert elements array to children array
  const legacySection = section as LegacyCardSection
  return {
    id: legacySection.id,
    orientation: legacySection.orientation,
    children: (legacySection.elements || []).map((elementId) => ({
      type: 'element' as const,
      id: elementId,
    })),
  }
}

// Migrate entire layout
export function migrateCardLayout(layout: CardLayout): CardLayout {
  return {
    sections: layout.sections.map(migrateCardSection),
  }
}

// Helper to collect all element IDs from a section (recursively)
export function collectElementIds(section: CardSection): string[] {
  const ids: string[] = []
  for (const child of section.children) {
    if (child.type === 'element') {
      ids.push(child.id)
    } else {
      ids.push(...collectElementIds(child.section))
    }
  }
  return ids
}

// Helper to collect all element IDs from a layout
export function collectAllElementIds(layout: CardLayout): string[] {
  const ids: string[] = []
  for (const section of layout.sections) {
    ids.push(...collectElementIds(section))
  }
  return ids
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

// Author profile elements
export type AuthorProfileElementId =
  | 'coverImage'
  | 'avatar'
  | 'username'
  | 'displayName'
  | 'reputation'
  | 'about'
  | 'location'
  | 'website'
  | 'joinDate'
  | 'followers'
  | 'following'
  | 'postCount'
  | 'hpEarned'
  | 'votingPower'
  | 'hiveBalance'
  | 'hbdBalance'

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
  authorProfileLayout2: CardLayout
  // Page layout with sections (drag & drop)
  pageLayout: PageLayout
  // Sorting settings
  postsSortOrder: 'blog' | 'posts' | 'payout'
  commentsSortOrder: 'comments' | 'replies'
  includeReblogs: boolean
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
  // Default card layouts with sections (using new recursive children format)
  postCardLayout: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'thumbnail' }] },
      { id: 'sec-2', orientation: 'vertical', children: [{ type: 'element', id: 'title' }, { type: 'element', id: 'summary' }] },
      { id: 'sec-3', orientation: 'horizontal', children: [{ type: 'element', id: 'date' }, { type: 'element', id: 'votes' }, { type: 'element', id: 'comments' }, { type: 'element', id: 'payout' }] },
      { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'tags' }] },
    ],
  },
  commentCardLayout: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'replyContext' }] },
      { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'author' }, { type: 'element', id: 'timestamp' }] },
      { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'body' }] },
      { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'replies' }, { type: 'element', id: 'votes' }, { type: 'element', id: 'payout' }, { type: 'element', id: 'viewLink' }] },
    ],
  },
  authorProfileLayout2: {
    sections: [
      { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
      { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'username' }, { type: 'element', id: 'reputation' }] },
      { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
      { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'location' }, { type: 'element', id: 'website' }, { type: 'element', id: 'joinDate' }] },
      { id: 'sec-5', orientation: 'horizontal', children: [{ type: 'element', id: 'followers' }, { type: 'element', id: 'following' }, { type: 'element', id: 'postCount' }, { type: 'element', id: 'hpEarned' }] },
      { id: 'sec-6', orientation: 'horizontal', children: [{ type: 'element', id: 'votingPower' }, { type: 'element', id: 'hiveBalance' }, { type: 'element', id: 'hbdBalance' }] },
    ],
  },
  // Default page layout with sections per slot
  pageLayout: {
    sections: [
      { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'] },
      { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'] },
      { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'] },
      { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'] },
    ],
  },
  // Sorting defaults
  postsSortOrder: 'blog',
  commentsSortOrder: 'comments',
  includeReblogs: false,
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

export const postsSortOptions = [
  { value: 'blog', label: 'Blog (chronological)' },
  { value: 'posts', label: 'Posts only (no reblogs)' },
  { value: 'payout', label: 'By payout' },
]

export const commentsSortOptions = [
  { value: 'comments', label: 'Comments by user' },
  { value: 'replies', label: 'Replies to user' },
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

// Labels for author profile elements
export const authorProfileElementLabels: Record<string, string> = {
  coverImage: 'Cover Image',
  avatar: 'Avatar',
  username: 'Username',
  displayName: 'Display Name',
  reputation: 'Reputation',
  about: 'About / Bio',
  location: 'Location',
  website: 'Website',
  joinDate: 'Join Date',
  followers: 'Followers',
  following: 'Following',
  postCount: 'Post Count',
  hivePower: 'Hive Power',
  hpEarned: 'HP Earned',
  votingPower: 'Voting Power',
  hiveBalance: 'HIVE Balance',
  hbdBalance: 'HBD Balance',
}

// Labels for page elements
export const pageElementLabels: Record<string, string> = {
  header: 'Header',
  authorProfile: 'Author Profile',
  posts: 'Posts List',
  comments: 'Comments List',
  footer: 'Footer',
  navigation: 'Navigation',
  search: 'Search',
  tags: 'Tags Cloud',
  recentPosts: 'Recent Posts',
}

// Colors for page elements
export const pageElementColors: Record<string, string> = {
  header: 'bg-primary',
  authorProfile: 'bg-accent',
  posts: 'bg-success',
  comments: 'bg-info',
  footer: 'bg-text-muted',
  navigation: 'bg-warning',
  search: 'bg-info',
  tags: 'bg-accent',
  recentPosts: 'bg-success',
}

// Slot labels
export const slotLabels: Record<string, string> = {
  top: 'Top (Header Area)',
  'sidebar-left': 'Left Sidebar',
  main: 'Main Content',
  'sidebar-right': 'Right Sidebar',
  bottom: 'Bottom (Footer Area)',
}

// All available page element IDs
export const ALL_PAGE_ELEMENT_IDS = [
  'header',
  'authorProfile',
  'posts',
  'comments',
  'footer',
  'navigation',
  'search',
  'tags',
  'recentPosts',
]
