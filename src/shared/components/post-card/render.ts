/**
 * PostCard render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 * Supports both simple flags and sections-based layout
 */

import type { PostCardData, PostCardSettings, CardSection, CardSectionChild, CardLayout } from './types'
import { getPostSummary, formatPayout } from './utils'

/**
 * Default post card layout with sections
 */
const defaultPostCardLayout: CardLayout = {
  sections: [
    { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'thumbnail' }] },
    { id: 'sec-2', orientation: 'vertical', children: [{ type: 'element', id: 'title' }, { type: 'element', id: 'summary' }] },
    { id: 'sec-3', orientation: 'horizontal', children: [{ type: 'element', id: 'date' }, { type: 'element', id: 'votes' }, { type: 'element', id: 'comments' }, { type: 'element', id: 'payout' }] },
    { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'tags' }] },
  ],
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
      if (!data.thumbnail) return ''
      if (isVertical) {
        return `<div class="rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center w-full h-40"><img src="${data.thumbnail}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'" /></div>`
      }
      return `<img src="${data.thumbnail}" alt="" style="width: ${settings.thumbnailSizePx}px; height: ${settings.thumbnailSizePx}px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" onerror="this.style.display='none'" />`

    case 'title':
      return `<h3 class="font-semibold text-text line-clamp-2 hover:text-primary transition-colors" style="font-size: ${settings.titleSizePx}px;"><a href="${href}">${data.title}</a></h3>`

    case 'summary':
      return `<p class="text-text-muted text-sm line-clamp-3">${getPostSummary(data.body, settings.summaryMaxLength)}</p>`

    case 'date':
      return `<span class="text-xs text-text-muted">${data.publishedAt.toLocaleDateString()}</span>`

    case 'votes':
      return `<span class="flex items-center gap-1 text-xs text-text-muted"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>${data.votesCount}</span>`

    case 'comments':
      return `<span class="flex items-center gap-1 text-xs text-text-muted"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>${data.commentsCount}</span>`

    case 'payout':
      return `<span class="text-xs text-success font-medium">${formatPayout(data.pendingPayout)}</span>`

    case 'tags':
      if (data.tags.length === 0) return ''
      const tagsHtml = data.tags
        .slice(0, settings.maxTags)
        .map(tag => `<span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">#${tag}</span>`)
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
  return renderSection(child.section, data, settings, isVertical, linkHref)
}

/**
 * Render a section with children
 */
function renderSection(
  section: CardSection,
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean,
  linkHref?: string
): string {
  if (!section.children || section.children.length === 0) return ''

  const childrenHtml = section.children
    .map(child => renderChild(child, data, settings, isVertical, linkHref))
    .filter(html => html.length > 0)
    .join('')

  if (childrenHtml.length === 0) return ''

  const flexClass = section.orientation === 'horizontal'
    ? 'flex flex-wrap items-center gap-2'
    : 'flex flex-col gap-1'

  return `<div class="${flexClass}">${childrenHtml}</div>`
}

/**
 * Render post card content using sections layout
 */
function renderPostCardContentWithSections(
  data: PostCardData,
  settings: PostCardSettings,
  layout: CardLayout,
  isVertical: boolean,
  linkHref?: string
): string {
  const sectionsHtml = layout.sections
    .map(section => renderSection(section, data, settings, isVertical, linkHref))
    .filter(html => html.length > 0)
    .join('')

  return `<div class="flex flex-col gap-3">${sectionsHtml}</div>`
}

/**
 * Legacy render functions for backwards compatibility
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

function renderTags(data: PostCardData, settings: PostCardSettings): string {
  if (!settings.showTags || data.tags.length === 0) return ''

  const tagsHtml = data.tags
    .slice(0, settings.maxTags)
    .map(tag => `<span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">#${tag}</span>`)
    .join('')

  return `<div class="flex flex-wrap gap-1 mt-2">${tagsHtml}</div>`
}

/**
 * Legacy render using simple flags (backwards compatible)
 */
function renderPostCardContentLegacy(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean,
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

  const href = linkHref ?? `/${data.permlink}`

  return `<div class="flex ${flexDirection} ${gapClass}">${thumbnailHtml}<div class="flex-1 min-w-0"><h3 class="font-semibold text-text line-clamp-2 hover:text-primary transition-colors" style="font-size: ${settings.titleSizePx}px;"><a href="${href}">${data.title}</a></h3>${summaryHtml}${metaHtml}${tagsHtml}</div></div>`
}

/**
 * Render post card content as HTML string (without article wrapper)
 * Supports both sections layout and legacy flags
 */
export function renderPostCardContent(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean = false,
  linkHref?: string
): string {
  // Use sections layout if provided
  if (settings.postCardLayout && settings.postCardLayout.sections && settings.postCardLayout.sections.length > 0) {
    return renderPostCardContentWithSections(data, settings, settings.postCardLayout, isVertical, linkHref)
  }

  // Fall back to legacy rendering
  return renderPostCardContentLegacy(data, settings, isVertical, linkHref)
}

/**
 * Render complete post card as HTML string (with article wrapper)
 * For static rendering in Astro - uses CSS classes for hover effects
 */
export function renderPostCard(
  data: PostCardData,
  settings: PostCardSettings,
  isVertical: boolean = false,
  linkHref?: string,
  extraStyle?: string
): string {
  const borderStyle = settings.cardBorder ? 'border: 1px solid var(--color-border);' : ''

  // Build hover effect CSS classes
  const hoverEffect = settings.cardHoverEffect || 'none'
  const hoverClass = hoverEffect !== 'none' ? `hover-${hoverEffect}` : ''
  const shadowAttr = (hoverEffect === 'shadow' || hoverEffect === 'lift') && settings.cardHoverShadow
    ? `data-shadow="${settings.cardHoverShadow}"`
    : ''

  // Build CSS variables for hover customization
  const cssVars: string[] = []
  if (settings.cardTransitionDuration) {
    cssVars.push(`--card-transition: ${settings.cardTransitionDuration}ms`)
  }
  if (settings.cardHoverScale && (hoverEffect === 'scale' || hoverEffect === 'lift')) {
    cssVars.push(`--card-hover-scale: ${settings.cardHoverScale}`)
  }
  if (settings.cardHoverBrightness && hoverEffect === 'glow') {
    cssVars.push(`--card-hover-brightness: ${settings.cardHoverBrightness}`)
  }

  const cardStyle = `padding: ${settings.cardPaddingPx}px; border-radius: ${settings.cardBorderRadiusPx}px; ${borderStyle} ${cssVars.join('; ')}${cssVars.length ? ';' : ''} ${extraStyle || ''}`

  const contentHtml = renderPostCardContent(data, settings, isVertical, linkHref)

  return `<article class="post-card bg-bg-card rounded-xl overflow-hidden cursor-pointer ${hoverClass}" ${shadowAttr} style="${cardStyle}">${contentHtml}</article>`
}

// Export helper for checking element visibility
export { isElementInLayout, collectElementIds }
