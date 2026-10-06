// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Footer render functions - HTML string output
 * Used by both Astro (set:html) and SolidJS (innerHTML)
 */

import type { FooterData, FooterSettings } from './types'
import { DEFAULT_FOOTER_DATA, DEFAULT_FOOTER_SETTINGS } from './types'
import { escape_html, safe_url } from '../../formatters'

/**
 * Render footer as HTML string
 * @returns Sanitized HTML string (uses escape_html and safe_url for all user content)
 */
export function renderFooter(
  data?: FooterData,
  settings?: FooterSettings
): string {
  const footer_data = data ?? DEFAULT_FOOTER_DATA
  const footer_settings = settings ?? DEFAULT_FOOTER_SETTINGS

  const author_name = footer_data.author_name.trim()
  const author_url = safe_url(footer_data.author_url)
  const kofi_url = safe_url(footer_data.kofi_url)
  const kofi_image_url = safe_url(footer_data.kofi_image_url)
  const platform_name = escape_html(footer_data.platform_name)
  const extra_class = escape_html(footer_settings.extra_class)
  const custom_text = footer_data.custom_text?.trim() ?? ''

  // Join non-empty segments so disabled elements leave no dangling separators
  const segments: string[] = []

  if (custom_text) {
    segments.push(`<span>${escape_html(custom_text)}</span>`)
  } else if (author_name && author_url) {
    segments.push(`<span>Built by <a href="${escape_html(author_url)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:text-primary-hover transition-colors font-medium">${escape_html(author_name)}</a></span>`)
  } else if (author_name) {
    segments.push(`<span>Built by ${escape_html(author_name)}</span>`)
  }

  if (kofi_url && kofi_image_url) {
    segments.push(`<a href="${escape_html(kofi_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex hover:opacity-90 transition-opacity" aria-label="Support on Ko-fi">
      <img src="${escape_html(kofi_image_url)}" alt="Buy Me a Coffee at ko-fi.com" height="24" width="120" loading="lazy" />
    </a>`)
  }

  segments.push(`<span>Powered by ${platform_name}</span>`)

  const separator = '<span class="text-border">|</span>'
  const content_html = segments.join(`\n    ${separator}\n    `)

  return `<footer class="text-center py-6 text-text-muted text-sm border-t border-border mt-6 ${extra_class}">
  <div class="flex items-center justify-center gap-3 flex-wrap">
    ${content_html}
  </div>
</footer>`
}
