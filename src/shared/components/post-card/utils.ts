// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * PostCard utilities - data transformation and parsing functions
 */

import type { PostCardData, PostCardSettings } from './types'
import type { BridgePost } from '@hiveio/workerbee/blog-logic'
import { getSummary, stripMarkdownSimple, safe_url } from '../../formatters'
import { hive_image_proxy, HIVE_BLOG_URL } from '../../../lib/config'

/** Owner's posts link to the local route; others (reblogs) to the original on the external Hive frontend. */
export function get_post_href(author: string, permlink: string, owner: string): string {
  const local_href = `/${encodeURIComponent(permlink)}`
  if (author.toLowerCase() === owner.toLowerCase()) return local_href
  const base = HIVE_BLOG_URL.replace(/\/+$/, '')
  return safe_url(`${base}/@${encodeURIComponent(author)}/${encodeURIComponent(permlink)}`) || local_href
}

/**
 * Parse thumbnail from HivePost json_metadata
 */
export function getPostThumbnail(post: BridgePost, thumbnailSizePx: number): string | null {
  try {
    const metadata = typeof post.json_metadata === 'string'
      ? JSON.parse(post.json_metadata)
      : post.json_metadata
    const image = safe_url(metadata?.image?.[0])
    if (image) {
      return safe_url(hive_image_proxy(image, thumbnailSizePx * 2)) || null
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
export function formatPayout(value: number): string {
  return `$${value.toFixed(2)}`
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
    payout: post.payout > 0 ? post.payout : parseFloat(post.pending_payout_value ?? '0') || 0,
    author: post.author,
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
  const image = safe_url(imageUrl)
  if (!image) return null
  return safe_url(hive_image_proxy(image, thumbnailSizePx * 2)) || null
}

/**
 * Post interface (from workerbee/blog-logic)
 * Note: pendingPayoutValue is optional as workerbee's Post doesn't include it
 */
interface BlogLogicPost {
  permlink: string
  title: string
  summary: string
  tags: string[]
  publishedAt: Date
  votesCount: number
  payout?: number
  pendingPayoutValue?: string
  images: readonly string[]
  author?: string
  getTitleImage: () => string
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
    payout: (post.payout ?? 0) > 0 ? post.payout ?? 0 : parseFloat(post.pendingPayoutValue ?? '0') || 0,
    author: post.author,
  }
}
