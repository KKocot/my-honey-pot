// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { safe_url } from '../shared/formatters'
import { get_server_env } from './config'

export interface Branding {
  name: string
  url: string
  kofi_url: string
  editor_url: string
}

/** Server-only operator branding, read per call from runtime env; empty string = element not rendered. */
export function get_branding(): Branding {
  return {
    name: get_server_env('BRANDING_NAME'),
    url: safe_url(get_server_env('BRANDING_URL')),
    kofi_url: safe_url(get_server_env('BRANDING_KOFI_URL')),
    editor_url: safe_url(get_server_env('BRANDING_EDITOR_URL')),
  }
}
