import type { CardLayout, CardSectionChild } from '../../types/index'

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
