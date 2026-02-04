// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Page layout utilities
 * Framework-agnostic functions for CSS class generation
 */

import type { PageSlotPosition, SectionOrientation } from './types'

/**
 * Get CSS classes for section wrapper based on slot position
 * Used to add spacing between sections (top, bottom, sidebars)
 */
export function get_section_wrapper_class(slot: PageSlotPosition): string {
  switch (slot) {
    case 'top':
      return 'mb-6'
    case 'bottom':
      return 'mt-6'
    case 'sidebar-left':
    case 'sidebar-right':
      return 'mb-4'
    case 'main':
    default:
      return 'mb-6'
  }
}

/**
 * Get CSS classes for element wrapper based on section orientation
 * Controls how elements are laid out within a section
 */
export function get_element_wrapper_class(orientation: SectionOrientation): string {
  if (orientation === 'horizontal') {
    return 'flex-shrink-0'
  }
  return 'w-full'
}

/**
 * Get CSS classes for slot container based on position
 * Defines the layout for different page slots
 */
export function get_slot_container_class(
  slot: PageSlotPosition,
  orientation: SectionOrientation
): string {
  const base = orientation === 'horizontal'
    ? 'flex flex-wrap items-start gap-4'
    : 'flex flex-col gap-4'

  // Additional classes based on slot position can be added here if needed
  return base
}

/**
 * Check if slot is a sidebar
 */
export function is_sidebar(slot: PageSlotPosition): boolean {
  return slot === 'sidebar-left' || slot === 'sidebar-right'
}

/**
 * Check if rendering in main content area with posts view
 */
export function is_main_posts_view(slot: PageSlotPosition, active_tab: string): boolean {
  return slot === 'main' && active_tab !== 'comments'
}

/**
 * Check if rendering in main content area with comments view
 */
export function is_main_comments_view(
  slot: PageSlotPosition,
  active_tab: string,
  has_comments: boolean
): boolean {
  return slot === 'main' && active_tab === 'comments' && has_comments
}
