// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Navigation render functions - HTML output for both Astro and SolidJS
 */

import type { NavigationItem, NavigationSettings } from './types'
import { buildNavigationItems } from './utils'
import { escape_html } from '../../formatters'

/**
 * Render a single navigation item
 * Note: Count badges are disabled - navigation shows only labels
 */
export function renderNavigationItem(item: NavigationItem, isActive: boolean): string {
  const baseClasses = 'relative px-4 py-3 text-sm font-medium transition-colors'
  const activeIndicator = isActive
    ? '<span class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></span>'
    : ''

  const safe_id = escape_html(item.id)
  const safe_label = escape_html(item.label)
  const safe_tooltip = item.tooltip ? escape_html(item.tooltip) : ''

  // Disabled item (like Threads WIP)
  if (item.disabled) {
    return `
      <div
        class="${baseClasses} text-text-muted/50 cursor-not-allowed group"
        data-tab="${safe_id}"
        ${safe_tooltip ? `title="${safe_tooltip}"` : ''}
      >
        <span class="flex items-center gap-2">
          ${safe_label}
        </span>
        ${safe_tooltip ? `
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-bg-card border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ${safe_tooltip}
          </span>
        ` : ''}
      </div>
    `
  }

  // Internal link
  const safe_href = escape_html(item.href)
  return `
    <a
      href="${safe_href}"
      class="${baseClasses} hover:bg-bg-card/50 ${isActive ? 'text-text' : 'text-text-muted hover:text-text'}"
      data-tab="${safe_id}"
    >
      <span class="flex items-center gap-2">
        ${safe_label}
      </span>
      ${activeIndicator}
    </a>
  `
}

/**
 * Get navigation item class names
 */
export function getNavigationItemClasses(isActive: boolean): string {
  const baseClasses = 'relative px-4 py-3 text-sm font-medium transition-colors'
  return `${baseClasses} ${isActive ? 'text-text' : 'text-text-muted hover:text-text'}`
}

/**
 * Render full navigation bar
 */
export function renderNavigation(settings: NavigationSettings): string {
  const items = buildNavigationItems(settings)

  const itemsHtml = items
    .map(item => renderNavigationItem(item, item.id === settings.activeTab))
    .join('')

  return `
    <nav class="border-b border-border mb-6">
      <div class="flex flex-wrap">
        ${itemsHtml}
      </div>
    </nav>
  `
}

/**
 * Render navigation items only (for preview with custom wrapper)
 */
export function renderNavigationItems(settings: NavigationSettings): string {
  const items = buildNavigationItems(settings)

  return items
    .map(item => renderNavigationItem(item, item.id === settings.activeTab))
    .join('')
}

/**
 * Render a single navigation button (for client-side SolidJS usage)
 * Buttons have data-tab attribute for event delegation
 */
export function renderNavigationButton(item: NavigationItem, isActive: boolean): string {
  const baseClasses = 'relative px-4 py-3 text-sm font-medium transition-colors hover:bg-bg-card/50'

  const safe_id = escape_html(item.id)
  const safe_label = escape_html(item.label)
  const safe_tooltip = item.tooltip ? escape_html(item.tooltip) : ''

  if (item.disabled) {
    return `
      <button type="button" disabled
        class="${baseClasses} text-text-muted/50 cursor-not-allowed group"
        data-tab="${safe_id}"
        ${safe_tooltip ? `title="${safe_tooltip}"` : ''}
      >
        <span class="flex items-center gap-2">${safe_label}</span>
        ${safe_tooltip ? `<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-bg-card border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">${safe_tooltip}</span>` : ''}
      </button>
    `
  }

  return `
    <button type="button"
      class="${baseClasses} ${isActive ? 'text-text' : 'text-text-muted hover:text-text'}"
      data-tab="${safe_id}"
    >
      <span class="flex items-center gap-2">${safe_label}</span>
      ${isActive ? '<span class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></span>' : ''}
    </button>
  `
}

/**
 * Render navigation as buttons (for client-side SolidJS usage)
 * Buttons have data-tab attribute for event delegation
 */
export function renderNavigationButtons(settings: NavigationSettings): string {
  const items = buildNavigationItems(settings)
  const itemsHtml = items
    .map(item => renderNavigationButton(item, item.id === settings.activeTab))
    .join('')

  return `
    <nav class="border-b border-border mb-6">
      <div class="flex flex-wrap">${itemsHtml}</div>
    </nav>
  `
}
