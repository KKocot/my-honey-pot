/**
 * AuthorProfile render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 */

import type { AuthorProfileData, AuthorProfileSettings } from './types'
import type { CardSection, CardSectionChild } from '../../../components/home/types'
import { formatCompactNumber, normalizeUrl, getDisplayUrl } from '../../formatters'
import { locationIcon, websiteIcon, calendarIcon, getSocialIcon, platformColors } from '../../icons'

/**
 * Render a single profile element as HTML string
 */
export function renderProfileElement(
  elementId: string,
  data: AuthorProfileData,
  settings: AuthorProfileSettings
): string | null {
  switch (elementId) {
    case 'coverImage':
      if (!data.coverImage) {
        return `<div class="bg-gradient-to-r from-primary/30 to-accent/30 rounded-lg w-full" style="height: ${settings.coverHeight}px;"></div>`
      }
      return `<div class="bg-cover bg-center rounded-lg w-full" style="height: ${settings.coverHeight}px; background-image: url('https://images.hive.blog/640x0/${data.coverImage}');"></div>`

    case 'avatar':
      return `<img src="${data.avatarUrl}" alt="${data.username}" style="width: ${settings.avatarSize}px; height: ${settings.avatarSize}px;" class="rounded-full border-2 border-bg-card ring-2 ring-border flex-shrink-0" onerror="this.src='/hive-logo.png'" />`

    case 'username':
      return `<p class="font-bold text-text" style="font-size: ${settings.usernameSize}px;">@${data.username}</p>`

    case 'displayName':
      return `<h2 class="font-bold text-text" style="font-size: ${settings.displayNameSize}px;">${data.displayName}</h2>`

    case 'reputation':
      return `<span class="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">Rep: ${Math.floor(data.reputation)}</span>`

    case 'about':
      if (!data.about) return null
      return `<p class="text-text-muted line-clamp-2" style="font-size: ${settings.aboutSize}px;">${data.about}</p>`

    case 'location':
      if (!data.location) return null
      return `<span class="flex items-center gap-1 text-text-muted" style="font-size: ${settings.metaSize}px;">${locationIcon}${data.location}</span>`

    case 'website':
      if (!data.website) return null
      const href = normalizeUrl(data.website)
      const displayUrl = getDisplayUrl(data.website)
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1 text-primary hover:underline" style="font-size: ${settings.metaSize}px;">${websiteIcon}${displayUrl}</a>`

    case 'joinDate':
      return `<span class="flex items-center gap-1 text-text-muted" style="font-size: ${settings.metaSize}px;">${calendarIcon}${data.joinDate}</span>`

    case 'followers':
      return `<div class="text-center"><p class="font-bold text-text" style="font-size: ${settings.statsSize}px;">${formatCompactNumber(data.followers)}</p><p class="text-xs text-text-muted">Followers</p></div>`

    case 'following':
      return `<div class="text-center"><p class="font-bold text-text" style="font-size: ${settings.statsSize}px;">${formatCompactNumber(data.following)}</p><p class="text-xs text-text-muted">Following</p></div>`

    case 'postCount':
      return `<div class="text-center"><p class="font-bold text-text" style="font-size: ${settings.statsSize}px;">${formatCompactNumber(data.postCount)}</p><p class="text-xs text-text-muted">Posts</p></div>`

    case 'hivePower':
      return `<div class="text-center"><p class="font-bold text-text" style="font-size: ${settings.statsSize}px;">${data.hivePower.toFixed(3)}</p><p class="text-xs text-text-muted">HP</p></div>`

    case 'hpEarned':
      return `<div class="text-center"><p class="font-bold text-text" style="font-size: ${settings.statsSize}px;">${data.hivePower.toFixed(3)}</p><p class="text-xs text-text-muted">HP</p></div>`

    case 'votingPower':
      const vpDisplay = data.votingPower > 0 ? `${data.votingPower.toFixed(1)}%` : '--'
      return `<div class="text-center"><p class="font-semibold text-text" style="font-size: ${settings.statsSize}px;">${vpDisplay}</p><p class="text-xs text-text-muted">Voting Power</p></div>`

    case 'hiveBalance':
      return `<div class="text-center"><p class="font-semibold text-text" style="font-size: ${settings.statsSize}px;">${data.hiveBalance.toFixed(3)}</p><p class="text-xs text-text-muted">HIVE</p></div>`

    case 'hbdBalance':
      return `<div class="text-center"><p class="font-semibold text-text" style="font-size: ${settings.statsSize}px;">${data.hbdBalance.toFixed(3)}</p><p class="text-xs text-text-muted">HBD</p></div>`

    default:
      return null
  }
}

/**
 * Check if section contains a full-width element
 */
function hasFullWidthElement(section: CardSection): boolean {
  return section.children?.some(child =>
    child.type === 'element' && child.id === 'coverImage'
  ) ?? false
}

/**
 * Render a child (element or nested section)
 */
function renderProfileChild(
  child: CardSectionChild,
  data: AuthorProfileData,
  settings: AuthorProfileSettings
): string {
  if (child.type === 'element') {
    return renderProfileElement(child.id, data, settings) || ''
  }
  return renderProfileSection(child.section, data, settings)
}

/**
 * Render a section with its orientation (recursive)
 */
export function renderProfileSection(
  section: CardSection,
  data: AuthorProfileData,
  settings: AuthorProfileSettings
): string {
  if (!section.children || section.children.length === 0) return ''

  const childrenHtml = section.children
    .map(child => renderProfileChild(child, data, settings))
    .filter(html => html.length > 0)
    .join('')

  if (!childrenHtml) return ''

  const isFullWidth = hasFullWidthElement(section)
  const flexClass = isFullWidth
    ? 'w-full'
    : section.orientation === 'horizontal'
      ? 'flex flex-wrap items-center gap-2'
      : 'flex flex-col gap-1'

  return `<div class="${flexClass}">${childrenHtml}</div>`
}

/**
 * Render all profile sections as HTML string
 */
export function renderAuthorProfileSections(
  data: AuthorProfileData,
  settings: AuthorProfileSettings
): string {
  return settings.layout.sections
    .map(section => renderProfileSection(section, data, settings))
    .join('')
}

/**
 * Render social links as HTML string
 */
export function renderSocialLinks(socialLinks: AuthorProfileSettings['socialLinks']): string {
  const validLinks = socialLinks.filter(l => l.url)
  if (validLinks.length === 0) return ''

  const linksHtml = validLinks.map(link => {
    const color = platformColors[link.platform] || '#000000'
    const iconSvg = getSocialIcon(link.platform)
    return `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="p-2 rounded-lg transition-opacity hover:opacity-80" style="background: ${color};" title="${link.platform}">${iconSvg}</a>`
  }).join('')

  return `<div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border justify-center">${linksHtml}</div>`
}

/**
 * Render complete author profile card as HTML string
 */
export function renderAuthorProfileCard(
  data: AuthorProfileData,
  settings: AuthorProfileSettings
): string {
  const sectionsHtml = renderAuthorProfileSections(data, settings)
  const socialLinksHtml = renderSocialLinks(settings.socialLinks)

  return `<div class="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden p-4"><div class="space-y-2">${sectionsHtml}</div>${socialLinksHtml}</div>`
}
