/**
 * PostCard types - shared between Astro and SolidJS
 */

/**
 * Normalized post data - framework-agnostic
 */
export interface PostCardData {
  permlink: string
  title: string
  body: string
  thumbnail: string | null
  tags: string[]
  publishedAt: Date
  votesCount: number
  commentsCount: number
  pendingPayout: string
}

/**
 * Card section child - can be element or nested section
 */
export type CardSectionChild =
  | { type: 'element'; id: string }
  | { type: 'section'; section: CardSection }

/**
 * Card section with orientation and children
 */
export interface CardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  children: CardSectionChild[]
}

/**
 * Card layout with sections for drag & drop
 */
export interface CardLayout {
  sections: CardSection[]
}

/**
 * Post card display settings
 */
export interface PostCardSettings {
  // Size settings
  thumbnailSizePx: number
  cardPaddingPx: number
  cardBorderRadiusPx: number
  titleSizePx: number
  summaryMaxLength: number
  maxTags: number
  cardBorder: boolean
  // Sections layout (optional)
  postCardLayout?: CardLayout
  // Hover effect settings
  cardHoverEffect?: 'none' | 'shadow' | 'lift' | 'scale' | 'glow'
  cardTransitionDuration?: number
  cardHoverScale?: number
  cardHoverShadow?: string
  cardHoverBrightness?: number
}

/**
 * Posts grid layout settings
 */
export interface PostsGridSettings {
  layout: 'list' | 'grid' | 'masonry'
  columns: number
  gap_px: number
}

/**
 * Default posts grid settings
 */
export const DEFAULT_POSTS_GRID_SETTINGS: PostsGridSettings = {
  layout: 'grid',
  columns: 2,
  gap_px: 24,
}
