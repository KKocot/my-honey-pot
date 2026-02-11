// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Applies sRGB gamma correction (linearization) to a single channel value.
 * Converts from sRGB gamma-compressed value to linear light intensity.
 * See: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function linearize(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * Detects if a hex color is dark based on relative luminance.
 * Uses sRGB linearization before computing luminance (WCAG-compliant).
 * Threshold 0.179 follows WCAG contrast ratio guidelines.
 *
 * Handles 3-char shorthand (#333) and 6-char hex (#333333).
 * Returns false (treat as light) for invalid input.
 */
export function is_dark_color(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;

  if (full.length !== 6) return false;

  const r = linearize(parseInt(full.substring(0, 2), 16) / 255);
  const g = linearize(parseInt(full.substring(2, 4), 16) / 255);
  const b = linearize(parseInt(full.substring(4, 6), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance < 0.179;
}
