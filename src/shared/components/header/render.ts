/**
 * Header render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 */

import type { HeaderData, HeaderSettings } from './types'

function escape_html(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Render main header - card style (top slot, FullPreview)
 */
export function renderHeader(data: HeaderData, settings: HeaderSettings): string {
  const site_name = escape_html(data.site_name)
  const site_description = escape_html(data.site_description)
  const max_width = settings.max_width_px

  return `<header class="bg-bg-card rounded-xl shadow-sm border border-border p-6 mb-6" style="max-width: ${max_width}px; margin-left: auto; margin-right: auto;">
  <h1 class="text-2xl font-bold text-text">${site_name}</h1>
  <p class="text-text-muted mt-1">${site_description}</p>
</header>`
}

/**
 * Render compact header - sidebar variant (smaller text)
 */
export function renderHeaderCompact(data: HeaderData): string {
  const site_name = escape_html(data.site_name)
  const site_description = escape_html(data.site_description)

  return `<div class="pb-4 border-b border-border">
  <h1 class="text-xl font-bold text-text">${site_name}</h1>
  <p class="text-text-muted mt-1 text-sm">${site_description}</p>
</div>`
}

/**
 * Render bottom header - bottom slot variant
 */
export function renderHeaderBottom(data: HeaderData): string {
  const site_name = escape_html(data.site_name)
  const site_description = escape_html(data.site_description)

  return `<div class="pt-4 border-t border-border">
  <h1 class="text-2xl font-bold text-text">${site_name}</h1>
  <p class="text-text-muted mt-1">${site_description}</p>
</div>`
}
