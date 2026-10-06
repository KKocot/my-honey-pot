// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * HTML formatters - escape and sanitize HTML strings
 */

/**
 * Escape HTML to prevent XSS
 */
export function escape_html(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const DEFAULT_URL_PROTOCOLS = ['https:', 'http:']

/**
 * Normalize an absolute URL and allow only listed protocols; returns '' when invalid
 */
export function safe_url(raw: unknown, allowed_protocols: string[] = DEFAULT_URL_PROTOCOLS): string {
  if (typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  if (!trimmed) return ''
  try {
    const parsed = new URL(trimmed)
    return allowed_protocols.includes(parsed.protocol) ? parsed.href : ''
  } catch {
    return ''
  }
}

/**
 * Same-origin path ('/x', not '//x' or '/\x'); returns '' when not a plain relative path
 */
export function safe_relative_path(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return ''
  if (/[\u0000-\u001f\u007f]/.test(raw)) return ''
  return raw
}

/**
 * URL safe for CSS url('...'); '' when it contains characters able to break out of the token
 */
export function safe_css_url(raw: unknown): string {
  const url = safe_url(raw)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
  if (!url || /['"()\\\s]/.test(url)) return ''
  return url
}
