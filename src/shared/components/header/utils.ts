/**
 * Header utilities - data transformation functions
 */

import type { HeaderData, HeaderSettings } from './types'
import { DEFAULT_HEADER_SETTINGS } from './types'

/**
 * Create normalized header data
 */
export function createHeaderData(site_name: string, site_description: string): HeaderData {
  return {
    site_name,
    site_description,
  }
}

/**
 * Create header settings from partial settings object
 */
export function createHeaderSettings(settings?: {
  headerMaxWidthPx?: number
}): HeaderSettings {
  return {
    max_width_px: settings?.headerMaxWidthPx ?? DEFAULT_HEADER_SETTINGS.max_width_px,
  }
}
