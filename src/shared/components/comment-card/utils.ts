// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * CommentCard utilities - data transformation and processing functions
 */

import type { CommentCardData, CommentCardSettings } from './types'
import type { BridgePost } from '@hiveio/workerbee/blog-logic'
import { formatTimeAgo } from '../../formatters'
import { defaultCommentCardSettings } from './types'

/**
 * Process comment body - strip markdown but keep readable
 */
export function processCommentBody(body: string, maxLength: number): string {
  let processed = body
    // Remove images
    .replace(/!\[.*?\]\(.*?\)/g, '[image]')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/`[^`]+`/g, '[code]')
    // Normalize whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Truncate if maxLength is set
  if (maxLength > 0 && processed.length > maxLength) {
    processed = processed.slice(0, maxLength) + '...'
  }

  return processed
}

/**
 * Parse parent post info from comment URL
 * URL format: /category/@author/permlink#@commenter/comment-permlink
 */
export function parseParentFromUrl(url: string): { author: string; permlink: string } {
  const urlParts = url.split('/')
  return {
    author: urlParts[2]?.replace('@', '') || '',
    permlink: urlParts[3]?.split('#')[0] || '',
  }
}

/**
 * Create normalized comment data from BridgePost
 */
export function createCommentCardData(comment: BridgePost): CommentCardData {
  const parent = parseParentFromUrl(comment.url)
  const payout = comment.payout > 0 ? comment.payout : parseFloat(comment.pending_payout_value ?? '0') || 0

  return {
    author: comment.author,
    permlink: comment.permlink,
    body: comment.body,
    created: comment.created,
    parentAuthor: parent.author,
    parentPermlink: parent.permlink,
    children: comment.children,
    votesCount: comment.stats?.total_votes ?? comment.active_votes?.length ?? 0,
    payout,
    url: comment.url,
    avatarUrl: `https://images.hive.blog/u/${comment.author}/avatar`,
  }
}

/**
 * Create comment card settings from partial settings object
 */
export function createCommentCardSettings(settings: Partial<{
  commentShowAuthor: boolean
  commentShowAvatar: boolean
  commentAvatarSizePx: number
  commentShowReplyContext: boolean
  commentShowTimestamp: boolean
  commentShowRepliesCount: boolean
  commentShowVotes: boolean
  commentShowPayout: boolean
  commentMaxLength: number
  commentPaddingPx: number
}>): CommentCardSettings {
  return {
    showAuthor: settings.commentShowAuthor ?? defaultCommentCardSettings.showAuthor,
    showAvatar: settings.commentShowAvatar ?? defaultCommentCardSettings.showAvatar,
    avatarSize: settings.commentAvatarSizePx ?? defaultCommentCardSettings.avatarSize,
    showReplyContext: settings.commentShowReplyContext ?? defaultCommentCardSettings.showReplyContext,
    showTimestamp: settings.commentShowTimestamp ?? defaultCommentCardSettings.showTimestamp,
    showRepliesCount: settings.commentShowRepliesCount ?? defaultCommentCardSettings.showRepliesCount,
    showVotes: settings.commentShowVotes ?? defaultCommentCardSettings.showVotes,
    showPayout: settings.commentShowPayout ?? defaultCommentCardSettings.showPayout,
    maxLength: settings.commentMaxLength ?? defaultCommentCardSettings.maxLength,
    padding: settings.commentPaddingPx ?? defaultCommentCardSettings.padding,
  }
}

/**
 * Format relative time for comments
 */
export { formatTimeAgo }
