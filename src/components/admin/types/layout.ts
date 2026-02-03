// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Layout Types
// ============================================

// Old layout section (kept for backwards compatibility)
export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

// ============================================
// Page Layout System (section-based drag & drop)
// ============================================

/**
 * Page slot positions define the main layout areas.
 * - top: Above the main content (header area)
 * - sidebar-left: Left sidebar
 * - main: Primary content area
 * - sidebar-right: Right sidebar
 * - bottom: Below the main content (footer area)
 */
export type PageSlotPosition = 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'

/**
 * Page section with slot placement, orientation, and element list.
 * Sections can be reordered within their slot and contain multiple elements.
 */
export interface PageLayoutSection {
  id: string
  slot: PageSlotPosition
  orientation: 'horizontal' | 'vertical'
  elements: string[] // page element IDs
  active: boolean // whether this section is visible in preview/output
}

/**
 * Page layout configuration with all sections.
 * Supports drag-and-drop reordering in the admin panel.
 */
export interface PageLayout {
  sections: PageLayoutSection[]
}


// ============================================
// Recursive nested sections system
// ============================================

/**
 * Child of a card section - can be either a simple element or a nested section.
 * This enables arbitrary nesting depth for complex card layouts.
 */
export type CardSectionChild =
  | { type: 'element'; id: string }
  | { type: 'section'; section: CardSection }

/**
 * Card section with orientation and recursive children.
 * Sections can contain elements or nested sections, allowing flexible layouts.
 */
export interface CardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  children: CardSectionChild[]
}

/**
 * Card layout with multiple top-level sections.
 * Used for post cards, comment cards, and author profile layouts.
 */
export interface CardLayout {
  sections: CardSection[]
}

// Legacy section format (for backwards compatibility)
export interface LegacyCardSection {
  id: string
  orientation: 'horizontal' | 'vertical'
  elements: string[]
}

// Migrate legacy layout to new format
export function migrateCardSection(section: CardSection | LegacyCardSection): CardSection {
  // If already has children array, it's new format
  if ('children' in section && Array.isArray(section.children)) {
    return section as CardSection
  }
  // Convert elements array to children array
  const legacySection = section as LegacyCardSection
  return {
    id: legacySection.id,
    orientation: legacySection.orientation,
    children: (legacySection.elements || []).map((elementId) => ({
      type: 'element' as const,
      id: elementId,
    })),
  }
}

// Migrate entire layout
export function migrateCardLayout(layout: CardLayout | undefined | null): CardLayout | null {
  // Return null if layout is invalid - caller should use defaults
  if (!layout || !layout.sections || !Array.isArray(layout.sections)) {
    return null
  }
  return {
    sections: layout.sections.map(migrateCardSection),
  }
}

// Helper to collect all element IDs from a section (recursively)
export function collectElementIds(section: CardSection): string[] {
  const ids: string[] = []
  for (const child of section.children) {
    if (child.type === 'element') {
      ids.push(child.id)
    } else {
      ids.push(...collectElementIds(child.section))
    }
  }
  return ids
}

// Helper to collect all element IDs from a layout
export function collectAllElementIds(layout: CardLayout): string[] {
  const ids: string[] = []
  for (const section of layout.sections) {
    ids.push(...collectElementIds(section))
  }
  return ids
}

// Card hover effect options
export const cardHoverEffectOptions = [
  { value: 'none', label: 'None' },
  { value: 'shadow', label: 'Shadow' },
  { value: 'lift', label: 'Lift (scale + shadow)' },
  { value: 'scale', label: 'Scale only' },
  { value: 'glow', label: 'Glow' },
]

// Card hover shadow options
export const cardHoverShadowOptions = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
  { value: '2xl', label: '2X Large' },
]

// Scroll animation type options
export const scrollAnimationTypeOptions = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-left', label: 'Slide from Left' },
  { value: 'zoom', label: 'Zoom In' },
  { value: 'flip', label: 'Flip' },
]

// Labels for post card elements
export const postCardElementLabels: Record<string, string> = {
  thumbnail: 'Thumbnail',
  avatar: 'Author Avatar',
  title: 'Title',
  summary: 'Summary',
  meta: 'Meta (date, votes, comments, payout)',
  tags: 'Tags',
}

// Labels for comment card elements
export const commentCardElementLabels: Record<string, string> = {
  replyContext: 'Reply Context',
  avatar: 'Avatar',
  author: 'Author',
  timestamp: 'Timestamp',
  body: 'Comment Body',
  actionBar: 'Action Bar (replies, votes, payout)',
}

// Labels for author profile elements
export const authorProfileElementLabels: Record<string, string> = {
  coverImage: 'Cover Image',
  avatar: 'Avatar',
  username: 'Username',
  displayName: 'Display Name',
  reputation: 'Reputation',
  about: 'About / Bio',
  location: 'Location',
  website: 'Website',
  joinDate: 'Join Date',
  followers: 'Followers',
  following: 'Following',
  postCount: 'Post Count',
  hivePower: 'Hive Power',
  hpEarned: 'HP',
  votingPower: 'Voting Power',
  hiveBalance: 'HIVE Balance',
  hbdBalance: 'HBD Balance',
}

// Labels for page elements
export const pageElementLabels: Record<string, string> = {
  header: 'Header',
  navigation: 'Navigation Tabs',
  authorProfile: 'Author Profile',
  posts: 'Posts List',
  footer: 'Footer',
}

// Colors for page elements - unified color for consistent look
export const pageElementColors: Record<string, string> = {
  header: 'bg-accent text-white',
  navigation: 'bg-accent text-white',
  authorProfile: 'bg-accent text-white',
  posts: 'bg-accent text-white',
  footer: 'bg-accent text-white',
}

// Default fallback color for page elements
export const pageElementColor = 'bg-accent text-white'

// Helper to get color for a page element
export function getPageElementColor(elementId: string): string {
  return pageElementColors[elementId] || pageElementColor
}

// Slot labels
export const slotLabels: Record<string, string> = {
  top: 'Top (Header Area)',
  'sidebar-left': 'Left Sidebar',
  main: 'Main Content',
  'sidebar-right': 'Right Sidebar',
  bottom: 'Bottom (Footer Area)',
}

// All available page element IDs
export const ALL_PAGE_ELEMENT_IDS = [
  'header',
  'navigation',
  'authorProfile',
  'posts',
  'footer',
]
