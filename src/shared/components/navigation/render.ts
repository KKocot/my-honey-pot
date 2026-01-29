/**
 * Navigation render functions - HTML output for both Astro and SolidJS
 */

import type { NavigationItem, NavigationSettings } from './types'
import { buildNavigationItems } from './utils'

/**
 * Render a single navigation item
 * Note: Count badges are disabled - navigation shows only labels
 */
export function renderNavigationItem(item: NavigationItem, isActive: boolean): string {
  const baseClasses = 'relative px-4 py-3 text-sm font-medium transition-colors'
  const activeIndicator = isActive
    ? '<span class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></span>'
    : ''

  // Disabled item (like Threads WIP)
  if (item.disabled) {
    return `
      <div
        class="${baseClasses} text-text-muted/50 cursor-not-allowed group"
        data-tab="${item.id}"
        title="${item.tooltip || ''}"
      >
        <span class="flex items-center gap-2">
          ${item.label}
        </span>
        ${item.tooltip ? `
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-bg-card border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            ${item.tooltip}
          </span>
        ` : ''}
      </div>
    `
  }

  // Internal link
  return `
    <a
      href="${item.href}"
      class="${baseClasses} hover:bg-bg-card/50 ${isActive ? 'text-text' : 'text-text-muted hover:text-text'}"
      data-tab="${item.id}"
    >
      <span class="flex items-center gap-2">
        ${item.label}
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
