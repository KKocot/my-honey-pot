// ============================================
// Shared types for admin panel
// ============================================

import { LAYOUT_CONSTANTS, COMMENT_CONSTANTS } from '../../lib/config'

// Re-export constants for use in components
export { LAYOUT_CONSTANTS, COMMENT_CONSTANTS }

// ============================================
// Theme Colors System
// ============================================

/**
 * All customizable theme colors used throughout the application.
 * These colors map to CSS custom properties (--theme-*) and are applied
 * dynamically to support theme switching without page reload.
 */
export interface ThemeColors {
  bg: string
  bgSecondary: string
  bgCard: string
  text: string
  textMuted: string
  primary: string
  primaryHover: string
  primaryText: string // Text color on primary buttons/elements
  accent: string
  border: string
  success: string
  error: string
  warning: string
  info: string
}

/**
 * Theme preset with id, display name, and full color palette.
 * Presets are predefined color schemes that users can select from.
 */
export interface ThemePreset {
  id: string
  name: string
  colors: ThemeColors
}

/** All available theme presets */
export const themePresets: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      bg: '#f5f5f5',
      bgSecondary: '#e5e5e5',
      bgCard: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryText: '#ffffff',
      accent: '#8b5cf6',
      border: '#d1d5db',
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      bgCard: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      primary: '#3b82f6',
      primaryHover: '#60a5fa',
      primaryText: '#ffffff',
      accent: '#a78bfa',
      border: '#334155',
      success: '#4ade80',
      error: '#f87171',
      warning: '#fbbf24',
      info: '#22d3ee',
    },
  },
  {
    id: 'green',
    name: 'Green',
    colors: {
      bg: '#ecfdf5',
      bgSecondary: '#d1fae5',
      bgCard: '#ffffff',
      text: '#064e3b',
      textMuted: '#047857',
      primary: '#10b981',
      primaryHover: '#059669',
      primaryText: '#ffffff',
      accent: '#14b8a6',
      border: '#a7f3d0',
      success: '#16a34a',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'pink',
    name: 'Pink',
    colors: {
      bg: '#fdf2f8',
      bgSecondary: '#fce7f3',
      bgCard: '#ffffff',
      text: '#831843',
      textMuted: '#be185d',
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryText: '#ffffff',
      accent: '#f472b6',
      border: '#fbcfe8',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#0c1929',
      bgSecondary: '#132f4c',
      bgCard: '#1a3a5c',
      text: '#e3f2fd',
      textMuted: '#90caf9',
      primary: '#00bcd4',
      primaryHover: '#00acc1',
      primaryText: '#ffffff',
      accent: '#ff4081',
      border: '#1e4976',
      success: '#00e676',
      error: '#ff5252',
      warning: '#ffab40',
      info: '#40c4ff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      bg: '#1a1a2e',
      bgSecondary: '#16213e',
      bgCard: '#0f3460',
      text: '#ffeaa7',
      textMuted: '#fdcb6e',
      primary: '#e17055',
      primaryHover: '#d63031',
      primaryText: '#ffffff',
      accent: '#fd79a8',
      border: '#2d3436',
      success: '#00b894',
      error: '#ff7675',
      warning: '#ffeaa7',
      info: '#74b9ff',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: '#1a2f1a',
      bgSecondary: '#243524',
      bgCard: '#2d4a2d',
      text: '#d4edda',
      textMuted: '#a3cfbb',
      primary: '#28a745',
      primaryHover: '#218838',
      primaryText: '#ffffff',
      accent: '#20c997',
      border: '#3d5c3d',
      success: '#00c853',
      error: '#ff6b6b',
      warning: '#ffc107',
      info: '#17a2b8',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      bg: '#f3e8ff',
      bgSecondary: '#e9d5ff',
      bgCard: '#ffffff',
      text: '#581c87',
      textMuted: '#7c3aed',
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryText: '#ffffff',
      accent: '#c084fc',
      border: '#d8b4fe',
      success: '#a855f7',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#0a0a0f',
      bgSecondary: '#121218',
      bgCard: '#1a1a24',
      text: '#e4e4e7',
      textMuted: '#a1a1aa',
      primary: '#a855f7',
      primaryHover: '#9333ea',
      primaryText: '#ffffff',
      accent: '#f472b6',
      border: '#27272a',
      success: '#4ade80',
      error: '#f87171',
      warning: '#fbbf24',
      info: '#22d3ee',
    },
  },
  {
    id: 'coffee',
    name: 'Coffee',
    colors: {
      bg: '#1c1612',
      bgSecondary: '#2a211a',
      bgCard: '#362b22',
      text: '#f5e6d3',
      textMuted: '#c4a77d',
      primary: '#d4a574',
      primaryHover: '#c49a6c',
      primaryText: '#1c1612',
      accent: '#a67c52',
      border: '#4a3c2f',
      success: '#7cb342',
      error: '#e57373',
      warning: '#ffb74d',
      info: '#4dd0e1',
    },
  },
]

// ============================================
// Layout Types
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

/**
 * Page slot positions define the main layout areas.
 * - top: Above the main content (header area)
 * - sidebar-left: Left sidebar
 * - main: Primary content area
 * - sidebar-right: Right sidebar
 * - bottom: Below the main content (footer area)
 */
export type PageSlotPosition = 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'

/**
 * Page section with slot placement, orientation, and element list.
 * Sections can be reordered within their slot and contain multiple elements.
 */
export interface PageLayoutSection {
  id: string
  slot: PageSlotPosition
  orientation: 'horizontal' | 'vertical'
  elements: string[] // page element IDs
  active: boolean // whether this section is visible in preview/output
}

/**
 * Page layout configuration with all sections.
 * Supports drag-and-drop reordering in the admin panel.
 */
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

/**
 * Child of a card section - can be either a simple element or a nested section.
 * This enables arbitrary nesting depth for complex card layouts.
 */
export type CardSectionChild =
  | { type: 'element'; id: string }
  | { type: 'section'; section: CardSection }

/**
 * Card section with orientation and recursive children.
 * Sections can contain elements or nested sections, allowing flexible layouts.
 */
export interface CardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  children: CardSectionChild[]
}

/**
 * Card layout with multiple top-level sections.
 * Used for post cards, comment cards, and author profile layouts.
 */
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

/**
 * Complete site settings data structure.
 * This is persisted to the database and controls all customizable aspects of the site.
 */
export interface SettingsData {
  hiveUsername: string
  siteTheme: string
  customColors: ThemeColors | null
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
  headerMaxWidthPx: number
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
  // Card Hover Animation settings
  cardHoverEffect: 'none' | 'shadow' | 'lift' | 'scale' | 'glow'
  cardTransitionDuration: number // ms
  cardHoverScale: number // 1.0 = none, 1.02 = 2% scale, etc.
  cardHoverShadow: string // shadow intensity: 'sm' | 'md' | 'lg' | 'xl'
  cardHoverBrightness: number // 1.0 = none, 1.05 = 5% brighter
  // Scroll Animation settings
  scrollAnimationEnabled: boolean
  scrollAnimationType: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip'
  scrollAnimationDuration: number // ms
  scrollAnimationDelay: number // ms delay between each card
}

export const defaultSettings: SettingsData = {
  hiveUsername: '',
  siteTheme: 'light',
  customColors: null,
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
  headerMaxWidthPx: 1280,
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
      { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
      { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
      { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'], active: true },
      { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
    ],
  },
  // Sorting defaults
  postsSortOrder: 'blog',
  commentsSortOrder: 'comments',
  includeReblogs: false,
  // Card Hover Animation defaults
  cardHoverEffect: 'shadow',
  cardTransitionDuration: 200,
  cardHoverScale: 1.02,
  cardHoverShadow: 'md',
  cardHoverBrightness: 1.0,
  // Scroll Animation defaults
  scrollAnimationEnabled: true,
  scrollAnimationType: 'fade',
  scrollAnimationDuration: 400,
  scrollAnimationDelay: 100,
}

export const sectionLabels: Record<string, string> = {
  header: 'Header',
  authorProfile: 'Author Profile',
  posts: 'Posts List',
  footer: 'Footer',
}

export const sectionColors: Record<string, string> = {
  header: 'bg-primary text-primary-text',
  authorProfile: 'bg-accent text-primary-text',
  posts: 'bg-success text-primary-text',
  footer: 'bg-text-muted text-primary-text',
}

// themeOptions replaced by themePresets - kept for reference
export const themeOptions = themePresets.map((p) => ({ value: p.id, label: p.name }))

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

// Card hover effect options
export const cardHoverEffectOptions = [
  { value: 'none', label: 'None' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'lift', label: 'Lift (scale + shadow)' },
  { value: 'scale', label: 'Scale only' },
  { value: 'glow', label: 'Glow' },
]

// Card hover shadow options
export const cardHoverShadowOptions = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
  { value: '2xl', label: '2X Large' },
]

// Scroll animation type options
export const scrollAnimationTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-left', label: 'Slide from Left' },
  { value: 'zoom', label: 'Zoom In' },
  { value: 'flip', label: 'Flip' },
]

// Labels for post card elements
export const postCardElementLabels: Record<string, string> = {
  thumbnail: 'Thumbnail',
  avatar: 'Author Avatar',
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

// Colors for page elements - unified color for consistent look
export const pageElementColors: Record<string, string> = {
  header: 'bg-accent text-white',
  authorProfile: 'bg-accent text-white',
  posts: 'bg-accent text-white',
  comments: 'bg-accent text-white',
  footer: 'bg-accent text-white',
  navigation: 'bg-accent text-white',
  search: 'bg-accent text-white',
  tags: 'bg-accent text-white',
  recentPosts: 'bg-accent text-white',
}

// Default fallback color for page elements
export const pageElementColor = 'bg-accent text-white'

// Helper to get color for a page element
export function getPageElementColor(elementId: string): string {
  return pageElementColors[elementId] || pageElementColor
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

// ============================================
// Website Templates (ready-made layouts)
// ============================================

/**
 * Website template with complete settings for a specific use case.
 * Templates combine theme, layout, and card settings for quick setup.
 */
export interface WebsiteTemplate {
  id: string
  name: string
  description: string
  icon: string // emoji or icon identifier
  settings: Partial<SettingsData>
}

/**
 * 10 ready-made website templates for different purposes
 * Each template includes postCardLayout with nested sections for advanced layouts
 */
export const websiteTemplates: WebsiteTemplate[] = [
  {
    id: 'developer-blog',
    name: 'Developer Blog',
    description: 'Code-focused layout for programming tutorials and tech articles',
    icon: '👨‍💻',
    settings: {
      siteTheme: 'dark',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 100,
      cardPaddingPx: 20,
      cardBorderRadiusPx: 8,
      titleSizePx: 20,
      showSummary: true,
      summaryMaxLength: 180,
      showTags: true,
      maxTags: 5,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'glow',
      cardHoverBrightness: 1.05,
      scrollAnimationType: 'slide-left',
      scrollAnimationDuration: 300,
      scrollAnimationDelay: 80,
      cardGapPx: 16,
      gridColumns: 1,
      cardBorder: true,
      // Nested card layout: thumbnail left, content right with nested meta section
      postCardLayout: {
        sections: [
          {
            id: 'sec-main',
            orientation: 'horizontal',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                        ],
                      },
                    },
                    { type: 'element', id: 'tags' },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'personal-blog',
    name: 'Personal Blog',
    description: 'Clean, readable layout for personal stories and diary entries',
    icon: '📝',
    settings: {
      siteTheme: 'light',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 120,
      cardPaddingPx: 24,
      cardBorderRadiusPx: 16,
      titleSizePx: 22,
      showSummary: true,
      summaryMaxLength: 200,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: true,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'md',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 100,
      cardGapPx: 24,
      gridColumns: 1,
      cardBorder: true,
      // Classic horizontal layout with grouped meta
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'horizontal',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-body',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-footer',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'tags' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'photo-portfolio',
    name: 'Photo Portfolio',
    description: 'Image-first masonry grid for photographers and visual artists',
    icon: '📷',
    settings: {
      siteTheme: 'dark',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 350,
      cardPaddingPx: 0,
      cardBorderRadiusPx: 4,
      titleSizePx: 14,
      showSummary: false,
      showTags: false,
      showDate: false,
      showVotes: false,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'scale',
      cardHoverScale: 1.03,
      cardTransitionDuration: 300,
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 500,
      scrollAnimationDelay: 50,
      cardGapPx: 8,
      gridColumns: 3,
      cardBorder: false,
      // Minimal card: just thumbnail with title overlay effect
      postCardLayout: {
        sections: [
          {
            id: 'sec-image',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              { type: 'element', id: 'title' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'tech-magazine',
    name: 'Tech Magazine',
    description: 'Modern news grid for tech publications and industry news',
    icon: '🔬',
    settings: {
      siteTheme: 'midnight',
      postsLayout: 'grid',
      cardLayout: 'vertical',
      thumbnailSizePx: 200,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 12,
      titleSizePx: 18,
      showSummary: true,
      summaryMaxLength: 100,
      showTags: true,
      maxTags: 2,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.02,
      cardHoverShadow: 'xl',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 350,
      scrollAnimationDelay: 75,
      cardGapPx: 20,
      gridColumns: 3,
      cardBorder: true,
      // Vertical card with image on top, nested content below
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'tags' },
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-stats',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-right', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'minimal-writer',
    name: 'Minimal Writer',
    description: 'Distraction-free reading experience for long-form content',
    icon: '✍️',
    settings: {
      siteTheme: 'light',
      postsLayout: 'list',
      cardLayout: 'vertical',
      thumbnailSizePx: 0,
      showThumbnail: false,
      cardPaddingPx: 32,
      cardBorderRadiusPx: 0,
      titleSizePx: 28,
      showSummary: true,
      summaryMaxLength: 350,
      showTags: false,
      showDate: true,
      showVotes: false,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'none',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 600,
      scrollAnimationDelay: 0,
      cardGapPx: 48,
      cardBorder: false,
      // Clean vertical stack: title, summary, date only
      postCardLayout: {
        sections: [
          {
            id: 'sec-article',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'title' },
              { type: 'element', id: 'date' },
              { type: 'element', id: 'summary' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
        ],
      },
    },
  },
  {
    id: 'crypto-trader',
    name: 'Crypto & Finance',
    description: 'Data-rich layout for financial analysis and market updates',
    icon: '📊',
    settings: {
      siteTheme: 'ocean',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 80,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 8,
      titleSizePx: 18,
      showSummary: true,
      summaryMaxLength: 120,
      showTags: true,
      maxTags: 4,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: true,
      cardHoverEffect: 'glow',
      cardHoverBrightness: 1.08,
      scrollAnimationType: 'slide-left',
      scrollAnimationDuration: 250,
      scrollAnimationDelay: 60,
      cardGapPx: 12,
      cardBorder: true,
      // Compact horizontal with all stats visible
      postCardLayout: {
        sections: [
          {
            id: 'sec-row',
            orientation: 'horizontal',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-info',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-metrics',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                          { type: 'element', id: 'payout' },
                        ],
                      },
                    },
                  ],
                },
              },
              { type: 'element', id: 'tags' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'travel-journal',
    name: 'Travel Journal',
    description: 'Vibrant masonry layout for travel stories and adventures',
    icon: '✈️',
    settings: {
      siteTheme: 'sunset',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 280,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 20,
      titleSizePx: 20,
      showSummary: true,
      summaryMaxLength: 150,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.03,
      cardHoverShadow: 'lg',
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 450,
      scrollAnimationDelay: 100,
      cardGapPx: 20,
      gridColumns: 2,
      cardBorder: true,
      // Vertical card with image filling top, content at bottom
      postCardLayout: {
        sections: [
          {
            id: 'sec-story',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-details',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                        ],
                      },
                    },
                    { type: 'element', id: 'tags' },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-right', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'gaming-hub',
    name: 'Gaming Hub',
    description: 'Dynamic grid layout for gaming news, reviews, and streams',
    icon: '🎮',
    settings: {
      siteTheme: 'midnight',
      postsLayout: 'grid',
      cardLayout: 'vertical',
      thumbnailSizePx: 200,
      cardPaddingPx: 12,
      cardBorderRadiusPx: 12,
      titleSizePx: 16,
      showSummary: false,
      showTags: true,
      maxTags: 2,
      showDate: false,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'scale',
      cardHoverScale: 1.06,
      cardTransitionDuration: 200,
      scrollAnimationType: 'flip',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 50,
      cardGapPx: 16,
      gridColumns: 4,
      cardBorder: true,
      // Compact card with image, title, and quick stats
      postCardLayout: {
        sections: [
          {
            id: 'sec-game',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              { type: 'element', id: 'title' },
              {
                type: 'section',
                section: {
                  id: 'sec-engagement',
                  orientation: 'horizontal',
                  children: [
                    { type: 'element', id: 'votes' },
                    { type: 'element', id: 'comments' },
                  ],
                },
              },
              { type: 'element', id: 'tags' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'eco-lifestyle',
    name: 'Eco Lifestyle',
    description: 'Fresh, natural aesthetic for sustainability and wellness content',
    icon: '🌿',
    settings: {
      siteTheme: 'green',
      postsLayout: 'grid',
      cardLayout: 'vertical',
      thumbnailSizePx: 220,
      cardPaddingPx: 20,
      cardBorderRadiusPx: 24,
      titleSizePx: 20,
      showSummary: true,
      summaryMaxLength: 120,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'lg',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 100,
      cardGapPx: 24,
      gridColumns: 2,
      cardBorder: true,
      // Organic layout with rounded elements
      postCardLayout: {
        sections: [
          {
            id: 'sec-eco',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'tags' },
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-footer',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'fashion-lookbook',
    name: 'Fashion Lookbook',
    description: 'Elegant Pinterest-style layout for fashion and beauty content',
    icon: '👗',
    settings: {
      siteTheme: 'pink',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 320,
      cardPaddingPx: 8,
      cardBorderRadiusPx: 4,
      titleSizePx: 14,
      showSummary: false,
      showTags: false,
      showDate: true,
      showVotes: true,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.02,
      cardHoverShadow: 'xl',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 500,
      scrollAnimationDelay: 75,
      cardGapPx: 12,
      gridColumns: 3,
      cardBorder: false,
      // Image-focused with minimal overlay
      postCardLayout: {
        sections: [
          {
            id: 'sec-look',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-info',
                  orientation: 'horizontal',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'votes' },
                  ],
                },
              },
              { type: 'element', id: 'date' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
  {
    id: 'coffee-shop',
    name: 'Coffee & Food',
    description: 'Warm, cozy aesthetic for food blogs and cafe reviews',
    icon: '☕',
    settings: {
      siteTheme: 'coffee',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 160,
      cardPaddingPx: 24,
      cardBorderRadiusPx: 20,
      titleSizePx: 22,
      showSummary: true,
      summaryMaxLength: 180,
      showTags: true,
      maxTags: 4,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: true,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'lg',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 120,
      cardGapPx: 28,
      cardBorder: true,
      // Cozy horizontal layout with all info
      postCardLayout: {
        sections: [
          {
            id: 'sec-recipe',
            orientation: 'horizontal',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    { type: 'element', id: 'tags' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                          { type: 'element', id: 'payout' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
    },
  },
]
