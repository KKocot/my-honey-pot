// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Page layout shared component
 * Single source of truth for page layout CSS utilities
 */

export type { PageSlotPosition, SectionOrientation } from './types'

export {
  get_section_wrapper_class,
  get_element_wrapper_class,
  get_slot_container_class,
  is_sidebar,
  is_main_posts_view,
  is_main_comments_view,
} from './utils'
