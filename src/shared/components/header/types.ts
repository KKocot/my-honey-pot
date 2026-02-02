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
