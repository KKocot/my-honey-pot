// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { escape_html } from '../formatters/html'

export const get_domain_from_url = (url: string): string => {
  try {
    const full_url = url.startsWith('http') ? url : `https://${url}`
    return new URL(full_url).hostname
  } catch {
    return ''
  }
}

export const is_valid_url_for_favicon = (url: string): boolean => {
  try {
    const full_url = url.startsWith('http') ? url : `https://${url}`
    const parsed = new URL(full_url)
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.')
  } catch {
    return false
  }
}

export const escape_html_attr = escape_html
