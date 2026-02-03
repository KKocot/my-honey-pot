// ============================================
// HEX Color Validation Helpers
// ============================================

/**
 * Validates HEX color format (#RRGGBB or #RGB)
 */
export const isValidHexColor = (hex: string): boolean => {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

/**
 * Normalizes HEX color (converts #RGB to #RRGGBB)
 */
export const normalizeHexColor = (hex: string): string => {
  if (!hex.startsWith('#')) hex = '#' + hex

  // Convert #RGB to #RRGGBB
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = hex[1], g = hex[2], b = hex[3]
    return `#${r}${r}${g}${g}${b}${b}`
  }

  return hex
}

// ============================================
// Get current colors helper
// ============================================

import { settings } from '../../store'
import { themePresets, type ThemeColors } from '../../types/index'

export function getCurrentColors(): ThemeColors {
  if (settings.customColors) {
    return settings.customColors
  }
  const preset = themePresets.find((p) => p.id === settings.siteTheme)
  return preset?.colors || themePresets[0].colors
}
