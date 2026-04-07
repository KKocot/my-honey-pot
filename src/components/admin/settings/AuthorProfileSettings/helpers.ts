// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { CardLayout, CardSection, CardSectionChild } from '../../types/index'
import { ELEMENT_GROUPS } from './presets'

// ============================================
// Layout element check helpers
// ============================================

// Helper to check if element is in layout (recursive)
export function isElementInLayout(layout: CardLayout | undefined | null, elementId: string): boolean {
  if (!layout?.sections) return true // If no layout, assume element is present (don't disable)

  const checkChildren = (children: CardSectionChild[]): boolean => {
    for (const child of children) {
      if (child.type === 'element' && child.id === elementId) {
        return true
      }
      if (child.type === 'section' && child.section.children) {
        if (checkChildren(child.section.children)) {
          return true
        }
      }
    }
    return false
  }

  for (const section of layout.sections) {
    if (section.children && checkChildren(section.children)) {
      return true
    }
  }
  return false
}

// Check if any of the given elements are in layout
export function areAnyElementsInLayout(layout: CardLayout | undefined | null, elementIds: string[]): boolean {
  if (!layout?.sections) return true // If no layout, assume elements are present
  return elementIds.some(id => isElementInLayout(layout, id))
}

// ============================================
// Layout manipulation helpers
// ============================================

// Remove an element from layout recursively. Prunes empty sections.
export function removeElementFromLayout(layout: CardLayout, elementId: string): CardLayout {
  const filter_children = (children: CardSectionChild[]): CardSectionChild[] => {
    const result: CardSectionChild[] = []
    for (const child of children) {
      if (child.type === 'element') {
        if (child.id !== elementId) {
          result.push(child)
        }
      } else if (child.type === 'section') {
        const filtered = filter_children(child.section.children)
        // Only keep section if it still has children
        if (filtered.length > 0) {
          result.push({
            type: 'section',
            section: { ...child.section, children: filtered },
          })
        }
      }
    }
    return result
  }

  const sections: CardSection[] = []
  for (const section of layout.sections) {
    const filtered = filter_children(section.children)
    // Only keep top-level section if it still has children
    if (filtered.length > 0) {
      sections.push({ ...section, children: filtered })
    }
  }

  return { sections }
}

// Add an element to layout based on its group hint.
// Finds a section that already contains elements from the same group,
// or creates a new section at the end.
export function addElementToLayout(layout: CardLayout, elementId: string, groupHint: string): CardLayout {
  // If element already exists, return unchanged
  if (isElementInLayout(layout, elementId)) {
    return layout
  }

  // Find which element IDs belong to the same group
  const group = ELEMENT_GROUPS.find(g => g.id === groupHint)
  const sibling_set = new Set<string>(group ? [...group.elements] : [])

  // Check if any top-level section contains a sibling element
  const has_sibling = (children: CardSectionChild[]): boolean => {
    for (const child of children) {
      if (child.type === 'element' && sibling_set.has(child.id)) return true
      if (child.type === 'section' && has_sibling(child.section.children)) return true
    }
    return false
  }

  // Try to add to an existing section with siblings
  for (let i = 0; i < layout.sections.length; i++) {
    if (has_sibling(layout.sections[i].children)) {
      const updated_sections = layout.sections.map((section, idx) => {
        if (idx === i) {
          return {
            ...section,
            children: [...section.children, { type: 'element' as const, id: elementId }],
          }
        }
        return section
      })
      return { sections: updated_sections }
    }
  }

  // No matching section found — create new section at the end.
  // Find highest numeric suffix among existing section IDs for stable naming.
  const existing_nums = layout.sections
    .map(s => parseInt(s.id.replace(/^sec-/, ''), 10))
    .filter(n => !isNaN(n))
  const next_num = existing_nums.length > 0 ? Math.max(...existing_nums) + 1 : 1
  const new_section_id = `sec-${next_num}`
  const new_section: CardSection = {
    id: new_section_id,
    orientation: 'horizontal',
    children: [{ type: 'element', id: elementId }],
  }

  return { sections: [...layout.sections, new_section] }
}
