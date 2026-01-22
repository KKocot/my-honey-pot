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
 * Post card display settings
 */
export interface PostCardSettings {
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
}

/**
 * Default settings for post card
 */
export const defaultPostCardSettings: PostCardSettings = {
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
}
