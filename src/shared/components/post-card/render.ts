/**
 * PostCard render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 * Uses sections-based layout system
 */

import type { PostCardData, PostCardSettings, CardSection, CardSectionChild, CardLayout } from './types'
import { getPostSummary, formatPayout } from './utils'

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

  return layout.sections
    .map(section => renderSection(section, data, settings, isVertical, linkHref))
    .filter(html => html.length > 0)
    .join('')
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
