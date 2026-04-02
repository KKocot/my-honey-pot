// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Header utilities - data transformation functions
 */

import type { HeaderData } from './types'

/**
 * Create normalized header data
 */
export function createHeaderData(site_name: string, site_description: string): HeaderData {
  return {
    site_name,
    site_description,
  }
}
