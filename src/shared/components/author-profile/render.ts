// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * AuthorProfile render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 */

import type { AuthorProfileData, AuthorProfileSettings } from './types'
import type { CardSection, CardSectionChild } from '../../../components/home/types'
import { formatCompactNumber, normalizeUrl, getDisplayUrl } from '../../formatters'
import { locationIcon, websiteIcon, calendarIcon, getSocialIcon, platformColors } from '../../icons'
import { build_social_url } from '../../../components/admin/types/social'
import type { SocialLink } from '../../../components/admin/types/social'
import { get_domain_from_url, is_valid_url_for_favicon, escape_html_attr } from '../../utils/url_helpers'

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
 * @returns Sanitized HTML string (uses escape_html for all user content)
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
 * @returns Sanitized HTML string (URLs validated, no user-provided HTML)
 */
export function renderSocialLinks(socialLinks: AuthorProfileSettings['socialLinks']): string {
  const validLinks = socialLinks.filter(l => l.username || l.url)
  if (validLinks.length === 0) return ''

  const linksHtml = validLinks.map(link => {
    const url = build_social_url(link)
    if (!url) return ''

    const is_custom = link.platform === 'custom'
    const display_value = link.username || link.url || ''
    const has_favicon = is_custom && is_valid_url_for_favicon(display_value)

    const color = platformColors[link.platform] || '#6B7280'
    const bgStyle = has_favicon ? 'transparent' : color

    let iconHtml: string
    if (is_custom && has_favicon) {
      const domain = get_domain_from_url(display_value)
      const safe_domain = encodeURIComponent(domain)
      const fallbackSvg = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="white" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`
      const fallbackDataUri = `data:image/svg+xml,${encodeURIComponent(fallbackSvg)}`
      iconHtml = `<img src="https://www.google.com/s2/favicons?domain=${safe_domain}&sz=64" alt="" class="w-7 h-7 rounded" onload="if(!this.dataset.fallbackApplied&&(this.naturalWidth<=2||this.naturalHeight<=2)){this.dataset.fallbackApplied='1';this.src='${fallbackDataUri}';this.parentElement.style.background='${color}';this.parentElement.classList.remove('p-1');this.parentElement.classList.add('p-2')}" onerror="if(!this.dataset.fallbackApplied){this.dataset.fallbackApplied='1';this.src='${fallbackDataUri}';this.parentElement.style.background='${color}';this.parentElement.classList.remove('p-1');this.parentElement.classList.add('p-2')}" />`
    } else if (is_custom) {
      iconHtml = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="white" stroke="white"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>`
    } else {
      iconHtml = getSocialIcon(link.platform)
    }

    const dataAttr = is_custom ? ` data-custom-link="${escape_html_attr(url)}"` : ''
    const paddingClass = has_favicon ? 'p-1' : 'p-2'

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="${paddingClass} rounded-lg transition-opacity hover:opacity-80 overflow-hidden" style="background: ${bgStyle};" title="${link.platform}"${dataAttr}>${iconHtml}</a>`
  }).filter(html => html.length > 0).join('')

  if (!linksHtml) return ''

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
