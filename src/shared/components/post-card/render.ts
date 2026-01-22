/**
 * PostCard render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 */

import type { PostCardData, PostCardSettings } from './types'
import { getPostSummary, formatPayout } from './utils'

/**
 * Render post thumbnail as HTML string
 */
function renderThumbnail(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean
): string {
  if (!settings.showThumbnail || !data.thumbnail) return ''

  if (isVertical) {
    return `<div class="rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center w-full h-40"><img src="${data.thumbnail}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'" /></div>`
  }

  return `<img src="${data.thumbnail}" alt="" style="width: ${settings.thumbnailSizePx}px; height: ${settings.thumbnailSizePx}px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" onerror="this.style.display='none'" />`
}

/**
 * Render post meta (date, votes, comments, payout) as HTML string
 */
function renderMeta(data: PostCardData, settings: PostCardSettings): string {
  const parts: string[] = []

  if (settings.showDate) {
    parts.push(`<span>${data.publishedAt.toLocaleDateString()}</span>`)
  }

  if (settings.showVotes) {
    parts.push(`<span>${data.votesCount} votes</span>`)
  }

  if (settings.showComments) {
    parts.push(`<span>${data.commentsCount} comments</span>`)
  }

  if (settings.showPayout && data.pendingPayout) {
    parts.push(`<span class="text-success">${formatPayout(data.pendingPayout)}</span>`)
  }

  if (parts.length === 0) return ''

  return `<div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">${parts.join('')}</div>`
}

/**
 * Render tags as HTML string
 */
function renderTags(data: PostCardData, settings: PostCardSettings): string {
  if (!settings.showTags || data.tags.length === 0) return ''

  const tagsHtml = data.tags
    .slice(0, settings.maxTags)
    .map(tag => `<span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">#${tag}</span>`)
    .join('')

  return `<div class="flex flex-wrap gap-1 mt-2">${tagsHtml}</div>`
}

/**
 * Render post card content as HTML string (without article wrapper)
 * Allows custom wrapper with animations in SolidJS
 */
export function renderPostCardContent(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean = false,
  linkHref?: string
): string {
  const actualIsVertical = isVertical || settings.cardLayout === 'vertical'
  const flexDirection = actualIsVertical
    ? 'flex-col'
    : settings.thumbnailPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
  const gapClass = actualIsVertical ? 'gap-3' : 'gap-4'

  const thumbnailHtml = renderThumbnail(data, settings, actualIsVertical)

  const summaryHtml = settings.showSummary
    ? `<p class="text-text-muted text-sm mt-1 line-clamp-2">${getPostSummary(data.body, settings.summaryMaxLength)}</p>`
    : ''

  const metaHtml = renderMeta(data, settings)
  const tagsHtml = renderTags(data, settings)

  // Link destination
  const href = linkHref ?? `/${data.permlink}`

  return `<div class="flex ${flexDirection} ${gapClass}">${thumbnailHtml}<div class="flex-1 min-w-0"><h3 class="font-semibold text-text line-clamp-2 hover:text-primary transition-colors" style="font-size: ${settings.titleSizePx}px;"><a href="${href}">${data.title}</a></h3>${summaryHtml}${metaHtml}${tagsHtml}</div></div>`
}

/**
 * Render complete post card as HTML string (with article wrapper)
 * For static rendering in Astro
 */
export function renderPostCard(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean = false,
  linkHref?: string,
  extraStyle?: string
): string {
  const borderStyle = settings.cardBorder ? 'border: 1px solid var(--color-border);' : ''
  const cardStyle = `padding: ${settings.cardPaddingPx}px; border-radius: ${settings.cardBorderRadiusPx}px; ${borderStyle} ${extraStyle || ''}`

  const contentHtml = renderPostCardContent(data, settings, isVertical, linkHref)

  return `<article class="bg-bg-card rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow" style="${cardStyle}">${contentHtml}</article>`
}
