/**
 * Footer render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 */

import type { FooterData, FooterSettings } from './types'
import { DEFAULT_FOOTER_DATA, DEFAULT_FOOTER_SETTINGS } from './types'
import { escape_html } from '../../formatters'

function escape_url(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '#'
    return escape_html(parsed.href)
  } catch {
    return '#'
  }
}

/**
 * Render footer as HTML string
 */
export function renderFooter(
  data?: FooterData,
  settings?: FooterSettings
): string {
  const footer_data = data ?? DEFAULT_FOOTER_DATA
  const footer_settings = settings ?? DEFAULT_FOOTER_SETTINGS

  const author_url = escape_url(footer_data.author_url)
  const author_name = escape_html(footer_data.author_name)
  const kofi_url = escape_url(footer_data.kofi_url)
  const kofi_image_url = escape_url(footer_data.kofi_image_url)
  const platform_name = escape_html(footer_data.platform_name)
  const extra_class = escape_html(footer_settings.extra_class)

  return `<footer class="text-center py-6 text-text-muted text-sm border-t border-border mt-6 ${extra_class}">
  <div class="flex items-center justify-center gap-3 flex-wrap">
    <span>Built by <a href="${author_url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-hover transition-colors font-medium">${author_name}</a></span>
    <span class="text-border">|</span>
    <a href="${kofi_url}" target="_blank" rel="noopener noreferrer" class="inline-flex hover:opacity-90 transition-opacity" aria-label="Support on Ko-fi">
      <img src="${kofi_image_url}" alt="Buy Me a Coffee at ko-fi.com" height="24" width="120" loading="lazy" />
    </a>
    <span class="text-border">|</span>
    <span>Powered by ${platform_name}</span>
  </div>
</footer>`
}
