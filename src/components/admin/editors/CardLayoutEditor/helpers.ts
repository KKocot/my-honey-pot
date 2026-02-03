// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { CardSection, CardSectionChild } from '../../types/index'

// ============================================
// Deep update helpers (pure functions)
// ============================================

export function updateSectionAtPath(
  sections: CardSection[],
  path: number[],
  updater: (section: CardSection) => CardSection
): CardSection[] {
  if (path.length === 0) return sections

  const [index, ...rest] = path
  return sections.map((section, i) => {
    if (i !== index) return section
    if (rest.length === 0) {
      return updater(section)
    }
    return {
      ...section,
      children: updateChildrenAtPath(section.children, rest, updater),
    }
  })
}

export function updateChildrenAtPath(
  children: CardSectionChild[],
  path: number[],
  updater: (section: CardSection) => CardSection
): CardSectionChild[] {
  if (path.length === 0) return children

  const [index, ...rest] = path
  return children.map((child, i) => {
    if (i !== index) return child
    if (child.type !== 'section') return child
    if (rest.length === 0) {
      return { type: 'section', section: updater(child.section) }
    }
    return {
      type: 'section',
      section: {
        ...child.section,
        children: updateChildrenAtPath(child.section.children, rest, updater),
      },
    }
  })
}
