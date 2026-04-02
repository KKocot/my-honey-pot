// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

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

// ============================================
// Harmonious palette generation
// ============================================

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hsl_to_hex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.max(0, Math.min(255, Math.round(255 * color)))
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function relative_luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const linearize = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

function contrast_ratio(hex1: string, hex2: string): number {
  const l1 = relative_luminance(hex1)
  const l2 = relative_luminance(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function adjust_lightness_for_contrast(
  fg_h: number,
  fg_s: number,
  fg_l: number,
  bg_hex: string,
  min_ratio: number,
  direction: 1 | -1,
): string {
  let l = fg_l
  for (let i = 0; i < 15; i++) {
    const hex = hsl_to_hex(fg_h, fg_s, l)
    if (contrast_ratio(hex, bg_hex) >= min_ratio) return hex
    l = clamp(l + direction * 3, 0, 100)
  }
  return hsl_to_hex(fg_h, fg_s, l)
}

function pick_primary_text(primary_hex: string): string {
  const white_ratio = contrast_ratio(primary_hex, '#ffffff')
  const black_ratio = contrast_ratio(primary_hex, '#000000')
  return white_ratio >= black_ratio ? '#ffffff' : '#000000'
}

type HarmonyScheme = 'analogous' | 'split-complementary' | 'triadic'

function pick_harmony(): HarmonyScheme {
  const r = Math.random()
  if (r < 0.5) return 'analogous'
  if (r < 0.75) return 'split-complementary'
  return 'triadic'
}

function accent_hue_offset(scheme: HarmonyScheme): number {
  switch (scheme) {
    case 'analogous':
      return 30
    case 'split-complementary':
      return 150
    case 'triadic':
      return 120
  }
}

export function generate_harmonious_colors(): ThemeColors {
  const baseHue = rand(0, 360)
  const scheme = pick_harmony()
  const accentHue = (baseHue + accent_hue_offset(scheme)) % 360
  const primaryHue = baseHue
  const isDark = Math.random() < 0.5

  const baseSat = rand(70, 90)
  const mod = (offset: number) => clamp(baseSat + offset, 0, 100)

  if (isDark) {
    const bgL = rand(5, 12)
    const bgS = rand(15, 40)
    const bgHex = hsl_to_hex(baseHue, bgS, bgL)
    const bgSecL = clamp(bgL + rand(5, 8), 0, 100)
    const bgSecHex = hsl_to_hex(baseHue, rand(15, 35), bgSecL)
    const bgCardL = clamp(bgL + rand(7, 12), 0, 100)
    const bgCardHex = hsl_to_hex(baseHue, rand(15, 35), bgCardL)

    const textS = rand(10, 30)
    const textL = rand(85, 96)
    const textHex = adjust_lightness_for_contrast(baseHue, textS, textL, bgHex, 4.5, 1)
    const textMutedL = rand(60, 75)
    const textMutedHex = adjust_lightness_for_contrast(baseHue, rand(10, 25), textMutedL, bgHex, 4.5, 1)

    const primaryL = rand(50, 65)
    const primaryHex = adjust_lightness_for_contrast(primaryHue, mod(-10), primaryL, bgHex, 3, 1)
    const primaryHoverL = clamp(primaryL + rand(8, 10), 0, 100)
    const primaryHoverHex = hsl_to_hex(primaryHue, mod(-5), primaryHoverL)
    const primaryTextHex = pick_primary_text(primaryHex)

    const accentL = rand(55, 70)
    const accentHex = hsl_to_hex(accentHue, mod(-10), accentL)

    const borderHex = hsl_to_hex(baseHue, rand(10, 25), rand(20, 32))

    const successHex = hsl_to_hex(rand(130, 145), rand(55, 75), rand(55, 65))
    const errorHex = hsl_to_hex(rand(0, 10), rand(65, 85), rand(60, 70))
    const warningHex = hsl_to_hex(rand(35, 45), rand(80, 100), rand(60, 70))
    const infoHex = hsl_to_hex(rand(185, 195), rand(75, 100), rand(55, 65))

    // Final WCAG validation pass
    const darkColors: ThemeColors = {
      bg: bgHex,
      bgSecondary: bgSecHex,
      bgCard: bgCardHex,
      text: textHex,
      textMuted: textMutedHex,
      primary: primaryHex,
      primaryHover: primaryHoverHex,
      primaryText: primaryTextHex,
      accent: accentHex,
      border: borderHex,
      success: successHex,
      error: errorHex,
      warning: warningHex,
      info: infoHex,
    }

    if (contrast_ratio(darkColors.text, darkColors.bgCard) < 4.5) {
      darkColors.text = adjust_lightness_for_contrast(baseHue, textS, textL, darkColors.bgCard, 4.5, 1)
    }
    if (contrast_ratio(darkColors.primaryText, darkColors.primary) < 4.5) {
      darkColors.primaryText = pick_primary_text(darkColors.primary)
    }

    return darkColors
  }

  // Light theme
  const bgL = rand(93, 97)
  const bgS = rand(10, 30)
  const bgHex = hsl_to_hex(baseHue, bgS, bgL)
  const bgSecL = clamp(bgL - rand(5, 8), 0, 100)
  const bgSecHex = hsl_to_hex(baseHue, rand(10, 25), bgSecL)
  const bgCardHex = Math.random() < 0.5 ? '#ffffff' : hsl_to_hex(baseHue, 0, clamp(bgL + 3, 0, 100))

  const textS = rand(50, 100)
  const textL = rand(8, 15)
  const textHex = adjust_lightness_for_contrast(baseHue, textS, textL, bgHex, 4.5, -1)
  const textMutedL = rand(30, 45)
  const textMutedHex = adjust_lightness_for_contrast(baseHue, rand(20, 40), textMutedL, bgHex, 4.5, -1)

  const primaryL = rand(45, 60)
  const primaryHex = adjust_lightness_for_contrast(primaryHue, mod(0), primaryL, bgHex, 3, -1)
  const primaryHoverL = clamp(primaryL - 10, 0, 100)
  const primaryHoverHex = hsl_to_hex(primaryHue, mod(5), primaryHoverL)
  const primaryTextHex = pick_primary_text(primaryHex)

  const accentL = rand(50, 65)
  const accentHex = hsl_to_hex(accentHue, mod(-10), accentL)

  const borderHex = hsl_to_hex(baseHue, rand(15, 30), rand(80, 88))

  const successHex = hsl_to_hex(rand(130, 145), rand(60, 80), rand(40, 55))
  const errorHex = hsl_to_hex(rand(0, 10), rand(70, 90), rand(55, 65))
  const warningHex = hsl_to_hex(rand(35, 45), rand(85, 100), rand(50, 60))
  const infoHex = hsl_to_hex(rand(185, 195), rand(80, 100), rand(40, 55))

  // Final WCAG validation pass
  const colors: ThemeColors = {
    bg: bgHex,
    bgSecondary: bgSecHex,
    bgCard: bgCardHex,
    text: textHex,
    textMuted: textMutedHex,
    primary: primaryHex,
    primaryHover: primaryHoverHex,
    primaryText: primaryTextHex,
    accent: accentHex,
    border: borderHex,
    success: successHex,
    error: errorHex,
    warning: warningHex,
    info: infoHex,
  }

  if (contrast_ratio(colors.text, colors.bgCard) < 4.5) {
    colors.text = adjust_lightness_for_contrast(baseHue, textS, textL, colors.bgCard, 4.5, -1)
  }
  if (contrast_ratio(colors.primaryText, colors.primary) < 4.5) {
    colors.primaryText = pick_primary_text(colors.primary)
  }

  return colors
}
