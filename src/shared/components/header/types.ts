// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Header types - shared between Astro and SolidJS
 */

export interface HeaderData {
  site_name: string
  site_description: string
}

export interface HeaderSettings {
  max_width_px: number
}

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  max_width_px: 1280,
}
