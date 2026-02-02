/**
 * Footer utilities - data transformation functions
 */

import type { FooterData, FooterSettings } from './types'
import { DEFAULT_FOOTER_DATA, DEFAULT_FOOTER_SETTINGS } from './types'

/**
 * Create footer data with optional overrides
 */
export function createFooterData(overrides?: Partial<FooterData>): FooterData {
  return {
    ...DEFAULT_FOOTER_DATA,
    ...overrides,
  }
}

/**
 * Create footer settings from partial settings object
 */
export function createFooterSettings(settings?: { class?: string }): FooterSettings {
  return {
    extra_class: settings?.class ?? DEFAULT_FOOTER_SETTINGS.extra_class,
  }
}
