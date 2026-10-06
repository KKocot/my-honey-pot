// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * PostCard render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 * Uses sections-based layout system
 */

import type { PostCardData, PostCardSettings, CardSection, CardSectionChild, CardLayout, PostsGridSettings } from './types'
import { getPostSummary, formatPayout } from './utils'
import { escape_html, safe_url, safe_relative_path } from '../../formatters'
import { hive_avatar_url, HIVE_BLOG_URL } from '../../../lib/config'
import { SHADOW_MAP } from '../../constants'

const HOVER_EFFECTS = ['none', 'shadow', 'lift', 'scale', 'glow'] as const
type HoverEffect = (typeof HOVER_EFFECTS)[number]

// Settings come from an on-chain Hive comment: ranges mirror the admin sliders, defaults mirror settings-schema.
function clamp_number(raw: unknown, min: number, max: number, fallback: number): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : fallback
}

function safe_hover_effect(raw: unknown): HoverEffect {
  return HOVER_EFFECTS.find((effect) => effect === raw) ?? 'none'
}

function safe_shadow(raw: unknown): string {
  return typeof raw === 'string' && Object.hasOwn(SHADOW_MAP, raw) ? raw : 'md'
}

function sanitize_card_settings(settings: PostCardSettings): PostCardSettings {
  return {
    ...settings,
    thumbnailSizePx: clamp_number(settings.thumbnailSizePx, 32, 400, 96),
    cardPaddingPx: clamp_number(settings.cardPaddingPx, 0, 64, 24),
    cardBorderRadiusPx: clamp_number(settings.cardBorderRadiusPx, 0, 48, 16),
    titleSizePx: clamp_number(settings.titleSizePx, 12, 48, 20),
    summaryMaxLength: clamp_number(settings.summaryMaxLength, 50, 500, 150),
    maxTags: Math.trunc(clamp_number(settings.maxTags, 1, 10, 5)),
  }
}

/**
 * Collect all element IDs from a section (recursively)
 */
function collectElementIds(section: CardSection): string[] {
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

/**
 * Check if element is present in any section of the layout
 */
function isElementInLayout(layout: CardLayout, elementId: string): boolean {
  for (const section of layout.sections) {
    if (collectElementIds(section).includes(elementId)) {
      return true
    }
  }
  return false
}

/**
 * Render a single element as HTML string
 */
function renderElement(
  elementId: string,
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean,
  linkHref?: string
): string {
  const href = linkHref ?? `/${data.permlink}`

  switch (elementId) {
    case 'thumbnail':
      const thumbnail = escape_html(safe_url(data.thumbnail))
      if (!thumbnail) return ''
      if (isVertical) {
        return `<div class="rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center w-full h-40"><img src="${thumbnail}" alt="" data-fallback="hide" class="w-full h-full object-cover" /></div>`
      }
      return `<img src="${thumbnail}" alt="" data-fallback="hide" style="width: ${settings.thumbnailSizePx}px; height: ${settings.thumbnailSizePx}px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" />`

    case 'avatar':
      if (!data.author) return ''
      const author = escape_html(data.author)
      const avatarUrl = escape_html(safe_url(hive_avatar_url(encodeURIComponent(data.author), "small")))
      const profile_href = escape_html(
        safe_url(`${HIVE_BLOG_URL.replace(/\/+$/, '')}/@${encodeURIComponent(data.author)}`)
      )
      const profile_attrs = profile_href ? `href="${profile_href}" target="_blank" rel="noopener noreferrer" ` : ''
      if (isVertical) {
        return `<a ${profile_attrs}class="relative z-10 flex items-center gap-2 self-start no-underline"><img src="${avatarUrl}" alt="" class="rounded-full flex-shrink-0" style="width: 24px; height: 24px;" /><span class="text-xs text-text-muted truncate">@${author}</span></a>`
      }
      return `<a ${profile_attrs}aria-label="@${author}" class="relative z-10 flex-shrink-0 no-underline"><img src="${avatarUrl}" alt="" class="rounded-full" style="width: 40px; height: 40px;" /></a>`

    case 'title':
      return `<h3 class="font-semibold text-text line-clamp-2" style="font-size: ${settings.titleSizePx}px;">${escape_html(data.title)}</h3>`

    case 'summary':
      return `<p class="text-text-muted text-sm line-clamp-3">${escape_html(getPostSummary(data.body, settings.summaryMaxLength))}</p>`

    case 'date':
      return `<span class="text-xs text-text-muted">${data.publishedAt.toLocaleDateString()}</span>`

    case 'votes':
      return `<span class="flex items-center gap-1 text-xs text-text-muted"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>${data.votesCount}</span>`

    case 'comments':
      return `<span class="flex items-center gap-1 text-xs text-text-muted"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>${data.commentsCount}</span>`

    case 'payout':
      return `<span class="text-xs text-success font-medium">${formatPayout(data.payout)}</span>`

    case 'tags':
      if (data.tags.length === 0) return ''
      const tagsHtml = data.tags
        .slice(0, settings.maxTags)
        .map(tag => `<span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">#${escape_html(tag)}</span>`)
        .join('')
      return `<div class="flex flex-wrap gap-1">${tagsHtml}</div>`

    default:
      return ''
  }
}

/**
 * Render a section child (element or nested section)
 */
function renderChild(
  child: CardSectionChild,
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean,
  linkHref?: string
): string {
  if (child.type === 'element') {
    return renderElement(child.id, data, settings, isVertical, linkHref)
  }
  // Nested sections get flex-1 min-w-0 to fill available space
  return renderSection(child.section, data, settings, isVertical, linkHref, true)
}

/**
 * Render a section with children
 */
function renderSection(
  section: CardSection,
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean,
  linkHref?: string,
  isNested: boolean = false
): string {
  if (!section.children || section.children.length === 0) return ''

  const childrenHtml = section.children
    .map(child => renderChild(child, data, settings, isVertical, linkHref))
    .filter(html => html.length > 0)
    .join('')

  if (childrenHtml.length === 0) return ''

  // Horizontal sections: no wrap, align items start for better layout
  // Nested sections: add flex-1 min-w-0 to fill available space
  const flexClass = section.orientation === 'horizontal'
    ? 'flex items-start gap-4'
    : 'flex flex-col gap-1'
  const nestedClass = isNested ? ' flex-1 min-w-0' : ''

  return `<div class="${flexClass}${nestedClass}">${childrenHtml}</div>`
}

/**
 * Render post card content as HTML string (without article wrapper)
 * Uses sections-based layout
 * @returns Sanitized HTML string (uses escape_html for all user content)
 */
export function renderPostCardContent(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean = false,
  linkHref?: string
): string {
  const layout = settings.postCardLayout
  if (!layout || !layout.sections || layout.sections.length === 0) {
    return '' // No layout defined
  }

  const safe_settings = sanitize_card_settings(settings)
  return layout.sections
    .map(section => renderSection(section, data, safe_settings, isVertical, linkHref))
    .filter(html => html.length > 0)
    .join('')
}

/**
 * Render complete post card as HTML string (with article wrapper)
 * For static rendering in Astro - uses CSS classes for hover effects
 * Card link is an overlay (not a wrapper) so nested links like the avatar stay valid HTML
 * @returns Sanitized HTML string (uses escape_html for all user content)
 */
export function renderPostCard(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean = false,
  linkHref?: string,
  extraStyle?: string
): string {
  const fallback_href = `/${encodeURIComponent(data.permlink)}`
  const external_href = linkHref ? safe_url(linkHref) : ''
  const href = escape_html(
    external_href || (linkHref ? safe_relative_path(linkHref) : '') || fallback_href
  )
  const external_attrs = external_href ? ' target="_blank" rel="noopener noreferrer"' : ''
  const borderStyle = settings.cardBorder ? 'border: 1px solid var(--color-border);' : ''
  const safe_settings = sanitize_card_settings(settings)

  // Build hover effect CSS classes
  const hoverEffect = safe_hover_effect(settings.cardHoverEffect)
  const hoverClass = hoverEffect !== 'none' ? `hover-${hoverEffect}` : ''
  const shadowAttr = (hoverEffect === 'shadow' || hoverEffect === 'lift') && settings.cardHoverShadow
    ? `data-shadow="${safe_shadow(settings.cardHoverShadow)}"`
    : ''

  // Build CSS variables for hover customization
  const cssVars: string[] = []
  if (settings.cardTransitionDuration) {
    cssVars.push(`--card-transition: ${clamp_number(settings.cardTransitionDuration, 50, 500, 200)}ms`)
  }
  if (settings.cardHoverScale && (hoverEffect === 'scale' || hoverEffect === 'lift')) {
    cssVars.push(`--card-hover-scale: ${clamp_number(settings.cardHoverScale, 1, 1.15, 1.02)}`)
  }
  if (settings.cardHoverBrightness && hoverEffect === 'glow') {
    cssVars.push(`--card-hover-brightness: ${clamp_number(settings.cardHoverBrightness, 1, 1.2, 1)}`)
  }

  const cardStyle = `padding: ${safe_settings.cardPaddingPx}px; border-radius: ${safe_settings.cardBorderRadiusPx}px; ${borderStyle} ${cssVars.join('; ')}${cssVars.length ? ';' : ''} ${escape_html(extraStyle || '')}`

  const contentHtml = renderPostCardContent(data, settings, isVertical, linkHref)

  const label = escape_html(data.title || data.permlink)
  const overlay_link = `<a href="${href}"${external_attrs} aria-label="${label}" class="post-card-link absolute inset-0 z-0 rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"></a>`

  return `<article class="post-card relative bg-bg-card rounded-xl overflow-hidden cursor-pointer ${hoverClass}" ${shadowAttr} style="${cardStyle}">${overlay_link}${contentHtml}</article>`
}

/**
 * Wrap pre-rendered card HTML strings in appropriate layout container
 */
export function renderPostsGrid(cards_html: string[], settings: PostsGridSettings): string {
  if (cards_html.length === 0) return ''

  const gap = clamp_number(settings.gap_px, 0, 64, 24)
  const columns = Math.round(clamp_number(settings.columns, 1, 4, 2))

  if (settings.layout === 'list') {
    return `<div style="display: flex; flex-direction: column; gap: ${gap}px;">${cards_html.join('')}</div>`
  }

  if (settings.layout === 'masonry') {
    const wrapped = cards_html.map(html =>
      `<div style="break-inside: avoid; margin-bottom: ${gap}px;">${html}</div>`
    ).join('')
    return `<div style="column-count: ${columns}; column-gap: ${gap}px;">${wrapped}</div>`
  }

  // grid (default)
  return `<div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px;">${cards_html.join('')}</div>`
}

// Export helper for checking element visibility
export { isElementInLayout, collectElementIds }
