// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from 'solid-js'
import type { CardLayout, CardSection } from '../../types/index'
import { collectAllElementIds } from '../../types/index'
import { SectionNode } from './SectionNode'
import { updateSectionAtPath } from './helpers'

// ============================================
// Button-based Card Layout Editor
// Supports nested sections with move up/down buttons
// ============================================

interface CardLayoutEditorProps {
  layout: CardLayout
  elementLabels: Record<string, string>
  allElementIds: string[]
  onUpdate: (layout: CardLayout) => void
}

export function CardLayoutEditor(props: CardLayoutEditorProps) {
  // Get elements not in any section
  const unusedElements = () => {
    const usedIds = new Set(collectAllElementIds(props.layout))
    return props.allElementIds.filter((id) => !usedIds.has(id))
  }

  // ============================================
  // Section operations
  // ============================================

  const removeAtPath = (path: number[]): void => {
    if (path.length === 1) {
      props.onUpdate({
        sections: props.layout.sections.filter((_, i) => i !== path[0]),
      })
      return
    }

    const parentPath = path.slice(0, -1)
    const childIndex = path[path.length - 1]

    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, parentPath, (section) => ({
        ...section,
        children: section.children.filter((_, i) => i !== childIndex),
      })),
    })
  }

  const addTopLevelSection = () => {
    const newSection: CardSection = {
      id: `sec-${Date.now()}`,
      orientation: 'horizontal',
      children: [],
    }
    props.onUpdate({
      sections: [...props.layout.sections, newSection],
    })
  }

  const addSubsection = (parentPath: number[]) => {
    const newSection: CardSection = {
      id: `sec-${Date.now()}`,
      orientation: 'horizontal',
      children: [],
    }
    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, parentPath, (section) => ({
        ...section,
        children: [...section.children, { type: 'section', section: newSection }],
      })),
    })
  }

  const addElementToSection = (parentPath: number[], elementId: string) => {
    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, parentPath, (section) => ({
        ...section,
        children: [...section.children, { type: 'element', id: elementId }],
      })),
    })
  }

  const toggleOrientation = (path: number[]) => {
    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, path, (section) => ({
        ...section,
        orientation: section.orientation === 'horizontal' ? 'vertical' : 'horizontal',
      })),
    })
  }

  const moveTopLevelSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= props.layout.sections.length) return

    const sections = [...props.layout.sections]
    ;[sections[index], sections[newIndex]] = [sections[newIndex], sections[index]]
    props.onUpdate({ sections })
  }

  const moveChild = (parentPath: number[], childIndex: number, direction: 'up' | 'down') => {
    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, parentPath, (section) => {
        const newIndex = direction === 'up' ? childIndex - 1 : childIndex + 1
        if (newIndex < 0 || newIndex >= section.children.length) return section

        const children = [...section.children]
        ;[children[childIndex], children[newIndex]] = [children[newIndex], children[childIndex]]
        return { ...section, children }
      }),
    })
  }

  // ============================================
  // Main render
  // ============================================

  return (
    <div class="space-y-4">
      {/* Top-level sections */}
      <div class="space-y-2">
        <For each={props.layout.sections}>
          {(section, sectionIndex) => (
            <SectionNode
              section={section}
              path={[sectionIndex()]}
              depth={0}
              index={sectionIndex()}
              totalSiblings={props.layout.sections.length}
              elementLabels={props.elementLabels}
              unusedElements={unusedElements()}
              onMoveUp={() => moveTopLevelSection(sectionIndex(), 'up')}
              onMoveDown={() => moveTopLevelSection(sectionIndex(), 'down')}
              onToggleOrientation={toggleOrientation}
              onAddSubsection={addSubsection}
              onRemoveSection={removeAtPath}
              onMoveChild={moveChild}
              onRemoveChild={removeAtPath}
              onAddElement={addElementToSection}
            />
          )}
        </For>
      </div>

      {/* Add section button */}
      <button
        type="button"
        onClick={addTopLevelSection}
        class="w-full py-2 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <PlusIcon />
        <span class="text-sm font-medium">Add Section</span>
      </button>

      {/* Unused elements info */}
      <Show when={unusedElements().length > 0}>
        <div class="mt-4 pt-4 border-t border-border">
          <p class="text-xs text-text-muted uppercase tracking-wide mb-2">
            Available Elements ({unusedElements().length})
          </p>
          <div class="flex flex-wrap gap-1">
            <For each={unusedElements()}>
              {(elementId) => (
                <span class="px-2 py-1 rounded text-xs bg-bg-secondary text-text-muted">
                  {props.elementLabels[elementId] || elementId}
                </span>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  )
}
