// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { safe_url } from '../shared/formatters'
import { get_server_env } from './config'

// Runtime env first (hive-blog-service injects PUBLIC_SITE_URL per container); the static
// import.meta.env.PUBLIC_* access is the build-time value Vite inlines.
function read_site_url_env(): string {
  return get_server_env('PUBLIC_SITE_URL', import.meta.env.PUBLIC_SITE_URL ?? '')
}

/** Configured public origin (keeps a base path, no trailing slash), or '' when unset/invalid. */
export function get_site_base(): string {
  const valid = safe_url(read_site_url_env())
  if (!valid) return ''
  const parsed = new URL(valid)
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, '')}`
}

// Feed pagination is cursor-based (tab/start_author/start_permlink); cursor pages are
// unstable listings, so every variant canonicalizes to the bare path.
/** Canonical URL for a request: configured site base + request path, query and hash dropped. */
export function build_canonical_url(request_url: URL, site_base: string = get_site_base()): string {
  const base = site_base || request_url.origin
  return `${base}${request_url.pathname}`
}
