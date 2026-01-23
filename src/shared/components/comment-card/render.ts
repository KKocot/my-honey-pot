/**
 * CommentCard render functions - HTML output for both Astro and SolidJS
 */

import type { CommentCardData, CommentCardSettings } from './types'
import { processCommentBody, formatTimeAgo } from './utils'

/**
 * Reply icon SVG
 */
const replyIcon = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
</svg>`

/**
 * Comment bubble icon SVG
 */
const commentIcon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
</svg>`

/**
 * Upvote icon SVG
 */
const voteIcon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
</svg>`

/**
 * Dollar/payout icon SVG
 */
const payoutIcon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>`

/**
 * External link icon SVG
 */
const externalLinkIcon = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
</svg>`

/**
 * Render reply context (which post this is a reply to)
 */
function renderReplyContext(data: CommentCardData, settings: CommentCardSettings): string {
  if (!settings.showReplyContext || !data.parentAuthor) return ''

  return `
    <div class="flex items-center gap-2 text-xs text-text-muted mb-2">
      ${replyIcon}
      <span>
        Replying to
        <span class="text-primary">@${data.parentAuthor}</span>
      </span>
    </div>
  `
}

/**
 * Render avatar
 */
function renderAvatar(data: CommentCardData, settings: CommentCardSettings): string {
  if (!settings.showAvatar) return ''

  return `
    <div class="flex-shrink-0">
      <img
        src="${data.avatarUrl}"
        alt="${data.author}"
        style="width: ${settings.avatarSize}px; height: ${settings.avatarSize}px;"
        class="rounded-full border border-border"
        onerror="this.src='/hive-logo.png'"
      />
    </div>
  `
}

/**
 * Render author info and timestamp
 */
function renderAuthorInfo(data: CommentCardData, settings: CommentCardSettings): string {
  if (!settings.showAuthor && !settings.showTimestamp) return ''

  const authorHtml = settings.showAuthor
    ? `<span class="font-semibold text-text">${data.author}</span>`
    : ''

  const separatorHtml = settings.showAuthor && settings.showTimestamp
    ? '<span class="text-text-muted">·</span>'
    : ''

  const timestampHtml = settings.showTimestamp
    ? `<time class="text-text-muted text-sm" datetime="${data.created}">${formatTimeAgo(data.created)}</time>`
    : ''

  return `<div class="flex items-center gap-2 flex-wrap">${authorHtml}${separatorHtml}${timestampHtml}</div>`
}

/**
 * Render action bar (replies, votes, payout, view link)
 */
function renderActionBar(data: CommentCardData, settings: CommentCardSettings): string {
  const parts: string[] = []

  if (settings.showRepliesCount) {
    parts.push(`
      <div class="flex items-center gap-1.5 text-sm hover:text-primary transition-colors cursor-pointer">
        ${commentIcon}
        <span>${data.children}</span>
      </div>
    `)
  }

  if (settings.showVotes) {
    parts.push(`
      <div class="flex items-center gap-1.5 text-sm hover:text-success transition-colors cursor-pointer">
        ${voteIcon}
        <span>${data.votesCount}</span>
      </div>
    `)
  }

  if (settings.showPayout && data.payout > 0) {
    parts.push(`
      <div class="flex items-center gap-1.5 text-sm">
        ${payoutIcon}
        <span>$${data.payout.toFixed(2)}</span>
      </div>
    `)
  }

  // View link removed - entire card is now clickable

  if (parts.length === 0) return ''

  return `<div class="flex items-center gap-6 mt-3 text-text-muted">${parts.join('')}</div>`
}

/**
 * Render comment card content (without article wrapper)
 */
export function renderCommentCardContent(
  data: CommentCardData,
  settings: CommentCardSettings
): string {
  const replyContextHtml = renderReplyContext(data, settings)
  const avatarHtml = renderAvatar(data, settings)
  const authorInfoHtml = renderAuthorInfo(data, settings)
  const processedBody = processCommentBody(data.body, settings.maxLength)
  const actionBarHtml = renderActionBar(data, settings)

  return `
    <div style="padding: ${settings.padding}px;">
      ${replyContextHtml}
      <div class="flex gap-3">
        ${avatarHtml}
        <div class="flex-1 min-w-0">
          ${authorInfoHtml}
          <div class="mt-2 text-text whitespace-pre-wrap break-words leading-relaxed">
            ${processedBody}
          </div>
          ${actionBarHtml}
        </div>
      </div>
    </div>
  `
}

/**
 * Render complete comment card (with article wrapper)
 * Entire card is wrapped in anchor for full clickability
 */
export function renderCommentCard(
  data: CommentCardData,
  settings: CommentCardSettings,
  layout: 'list' | 'grid' | 'masonry' = 'list'
): string {
  const baseClasses = layout === 'list'
    ? ''
    : 'bg-bg-card rounded-xl border border-border'

  const contentHtml = renderCommentCardContent(data, settings)

  return `<a href="${data.url}" class="comment-card-link block no-underline"><article class="${baseClasses}">${contentHtml}</article></a>`
}
