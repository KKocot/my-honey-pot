/**
 * PostCard utilities - data transformation and parsing functions
 */

import type { PostCardData, PostCardSettings } from './types'
import type { BridgePost } from '../../../lib/blog-logic'
import { getSummary, stripMarkdownSimple } from '../../formatters'

/**
 * Parse thumbnail from HivePost json_metadata
 */
export function getPostThumbnail(post: BridgePost, thumbnailSizePx: number): string | null {
  try {
    const metadata = typeof post.json_metadata === 'string'
      ? JSON.parse(post.json_metadata)
      : post.json_metadata
    const image = metadata?.image?.[0]
    if (image && image.startsWith('http')) {
      return `https://images.hive.blog/${thumbnailSizePx * 2}x0/${image}`
    }
  } catch { /* ignore */ }
  return null
}

/**
 * Parse tags from HivePost json_metadata
 */
export function getPostTags(post: BridgePost, maxTags: number): string[] {
  try {
    const metadata = typeof post.json_metadata === 'string'
      ? JSON.parse(post.json_metadata)
      : post.json_metadata
    return metadata?.tags?.slice(0, maxTags) || []
  } catch { /* ignore */ }
  return []
}

/**
 * Format payout value
 */
export function formatPayout(value: string): string {
  const num = parseFloat(value.replace(' HBD', '').replace(' HIVE', ''))
  return `$${num.toFixed(2)}`
}

/**
 * Create normalized post card data from BridgePost (Hive API)
 */
export function createPostCardDataFromBridge(
  post: BridgePost,
  settings: Pick<PostCardSettings, 'thumbnailSizePx' | 'maxTags'>
): PostCardData {
  return {
    permlink: post.permlink,
    title: post.title,
    body: post.body,
    thumbnail: getPostThumbnail(post, settings.thumbnailSizePx),
    tags: getPostTags(post, settings.maxTags),
    publishedAt: new Date(post.created),
    votesCount: post.active_votes?.length ?? 0,
    commentsCount: post.children ?? 0,
    pendingPayout: post.pending_payout_value ?? '0.00 HBD',
  }
}

/**
 * Get post summary (stripped markdown, truncated)
 */
export function getPostSummary(body: string, maxLength: number): string {
  return getSummary(body, maxLength)
}

/**
 * Get simple stripped summary (for FullPreview quick render)
 */
export function getSimpleSummary(body: string, maxLength: number): string {
  const stripped = stripMarkdownSimple(body)
  return stripped.slice(0, maxLength) + (stripped.length > maxLength ? '...' : '')
}

/**
 * Get thumbnail URL with proxy
 */
export function getThumbnailUrl(imageUrl: string | undefined, thumbnailSizePx: number): string | null {
  if (!imageUrl || imageUrl.length === 0) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return `https://images.hive.blog/${thumbnailSizePx * 2}x0/${imageUrl}`
  }
  return null
}

/**
 * Post interface (from blog-logic)
 */
interface BlogLogicPost {
  permlink: string
  title: string
  summary: string
  tags: string[]
  publishedAt: Date
  votesCount: number
  pendingPayoutValue: string
  images: readonly string[]
  getTitleImage: () => string | undefined
  getContent: () => Promise<string>
  getCommentsCount: () => Promise<number>
}

/**
 * Create PostCardData from Blog Logic Post object (async)
 */
export async function createPostCardDataFromPost(
  post: BlogLogicPost,
  settings: Pick<PostCardSettings, 'thumbnailSizePx' | 'maxTags' | 'summaryMaxLength'>
): Promise<PostCardData> {
  const [content, commentsCount] = await Promise.all([
    post.getContent(),
    post.getCommentsCount(),
  ])

  // Get thumbnail - first try getTitleImage, then images array
  let thumbnail: string | null = null
  const titleImage = post.getTitleImage()
  if (titleImage) {
    thumbnail = getThumbnailUrl(titleImage, settings.thumbnailSizePx)
  }
  if (!thumbnail) {
    for (const img of post.images) {
      const url = getThumbnailUrl(img, settings.thumbnailSizePx)
      if (url) {
        thumbnail = url
        break
      }
    }
  }

  return {
    permlink: post.permlink,
    title: post.title,
    body: content,
    thumbnail,
    tags: post.tags.slice(0, settings.maxTags),
    publishedAt: post.publishedAt,
    votesCount: post.votesCount,
    commentsCount,
    pendingPayout: post.pendingPayoutValue,
  }
}
