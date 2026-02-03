// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Number formatting utilities
 * Used by both Astro (SSR) and SolidJS (FullPreview) components
 */

/**
 * Format a large number with K/M suffix
 * @example 12500 -> "12.5K", 1234567 -> "1.2M"
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  }
  return num.toString()
}

/**
 * Format a number with fixed decimals and locale
 * @example 12345.678 -> "12,345.678"
 */
export function formatNumber(num: number, decimals = 3): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format a number with fixed decimals (no locale formatting)
 * @example 12345.678 -> "12345.678"
 */
export function formatFixed(num: number, decimals = 3): string {
  return num.toFixed(decimals)
}
