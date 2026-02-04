// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Animation utilities for scroll and hover effects
 * Shared by PostCard components in both FullPreview and BlogContent
 */

/**
 * Get initial scroll animation style based on animation type
 * @param type - Animation type: 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip' | 'none'
 * @returns CSS style object with opacity and transform properties
 */
export function get_initial_scroll_style(type: string): Record<string, string> {
  const base: Record<string, string> = { opacity: '0' }
  switch (type) {
    case 'fade':
      return base
    case 'slide-up':
      return { ...base, transform: 'translateY(20px)' }
    case 'slide-left':
      return { ...base, transform: 'translateX(-20px)' }
    case 'zoom':
      return { ...base, transform: 'scale(0.9)' }
    case 'flip':
      return { ...base, transform: 'perspective(600px) rotateX(-10deg)' }
    default:
      return {}
  }
}

/**
 * Get visible scroll animation style (final state)
 * @returns CSS style object with opacity and transform reset
 */
export function get_visible_scroll_style(): Record<string, string> {
  return { opacity: '1', transform: 'none' }
}
