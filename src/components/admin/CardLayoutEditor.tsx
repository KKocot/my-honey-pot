import { createSignal, For, Show } from 'solid-js'
import type { CardLayout, CardSection, CardSectionChild } from './types'
import { collectAllElementIds } from './types'

// ============================================
// Recursive Section-based Drag & Drop Card Layout Editor
// Supports unlimited nesting depth
// ============================================

interface CardLayoutEditorProps {
  layout: CardLayout
  elementLabels: Record<string, string>
  allElementIds: string[]
  onUpdate: (layout: CardLayout) => void
}

// Depth colors for visual distinction
const depthColors = [
  'border-primary',
  'border-accent',
  'border-success',
  'border-warning',
  'border-info',
]

const depthBgColors = [
  'bg-primary/5',
  'bg-accent/5',
  'bg-success/5',
  'bg-warning/5',
  'bg-info/5',
]

export function CardLayoutEditor(props: CardLayoutEditorProps) {
  const [draggedItem, setDraggedItem] = createSignal<{
    type: 'element' | 'section'
    id: string
    path: number[] // path to the item in the tree
  } | null>(null)
  const [dragOverZone, setDragOverZone] = createSignal<{
    path: number[]
    position: 'before' | 'after' | 'inside'
  } | null>(null)

  // Get elements not in any section
  const unusedElements = () => {
    const usedIds = new Set(collectAllElementIds(props.layout))
    return props.allElementIds.filter((id) => !usedIds.has(id))
  }

  // ============================================
  // Deep update helpers
  // ============================================

  // Update a section at a given path
  const updateSectionAtPath = (
    sections: CardSection[],
    path: number[],
    updater: (section: CardSection) => CardSection
  ): CardSection[] => {
    if (path.length === 0) return sections

    const [index, ...rest] = path
    return sections.map((section, i) => {
      if (i !== index) return section
      if (rest.length === 0) {
        return updater(section)
      }
      // Navigate deeper into nested sections
      return {
        ...section,
        children: updateChildrenAtPath(section.children, rest, updater),
      }
    })
  }

  const updateChildrenAtPath = (
    children: CardSectionChild[],
    path: number[],
    updater: (section: CardSection) => CardSection
  ): CardSectionChild[] => {
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

  // Remove item at path
  const removeAtPath = (path: number[]): void => {
    if (path.length === 1) {
      // Top-level section
      props.onUpdate({
        sections: props.layout.sections.filter((_, i) => i !== path[0]),
      })
      return
    }

    // Nested item
    const parentPath = path.slice(0, -1)
    const childIndex = path[path.length - 1]

    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, parentPath, (section) => ({
        ...section,
        children: section.children.filter((_, i) => i !== childIndex),
      })),
    })
  }

  // Insert item at path
  const insertAtPath = (path: number[], item: CardSectionChild, position: 'before' | 'after' | 'inside'): void => {
    if (position === 'inside') {
      // Insert as child of section at path
      props.onUpdate({
        sections: updateSectionAtPath(props.layout.sections, path, (section) => ({
          ...section,
          children: [...section.children, item],
        })),
      })
      return
    }

    const parentPath = path.slice(0, -1)
    const targetIndex = path[path.length - 1]
    const insertIndex = position === 'before' ? targetIndex : targetIndex + 1

    if (parentPath.length === 0) {
      // Inserting at top level
      if (item.type === 'section') {
        const newSections = [...props.layout.sections]
        newSections.splice(insertIndex, 0, item.section)
        props.onUpdate({ sections: newSections })
      }
      return
    }

    // Inserting in nested section
    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, parentPath, (section) => {
        const newChildren = [...section.children]
        newChildren.splice(insertIndex, 0, item)
        return { ...section, children: newChildren }
      }),
    })
  }

  // ============================================
  // Section operations
  // ============================================

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

  const toggleOrientation = (path: number[]) => {
    props.onUpdate({
      sections: updateSectionAtPath(props.layout.sections, path, (section) => ({
        ...section,
        orientation: section.orientation === 'horizontal' ? 'vertical' : 'horizontal',
      })),
    })
  }

  const removeSection = (path: number[]) => {
    removeAtPath(path)
  }

  // ============================================
  // Drag handlers
  // ============================================

  const handleDragStart = (e: DragEvent, type: 'element' | 'section', id: string, path: number[]) => {
    setDraggedItem({ type, id, path })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', `${type}:${id}:${path.join(',')}`)
    }
  }

  const handleDragOver = (e: DragEvent, path: number[], position: 'before' | 'after' | 'inside') => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedItem()) {
      setDragOverZone({ path, position })
    }
  }

  const handleDragLeave = () => {
    setDragOverZone(null)
  }

  const handleDrop = (e: DragEvent, targetPath: number[], position: 'before' | 'after' | 'inside') => {
    e.preventDefault()
    e.stopPropagation()

    const dragged = draggedItem()
    if (!dragged) return

    // Remove from old position first
    if (dragged.path.length > 0) {
      removeAtPath(dragged.path)
    }

    // Build the item to insert
    let item: CardSectionChild
    if (dragged.type === 'element') {
      item = { type: 'element', id: dragged.id }
    } else {
      // Find the section at the old path
      // Since we already removed it, we need to store it before removal
      // For now, just create a new empty section
      item = {
        type: 'section',
        section: { id: dragged.id, orientation: 'horizontal', children: [] },
      }
    }

    // Insert at new position
    insertAtPath(targetPath, item, position)

    setDraggedItem(null)
    setDragOverZone(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverZone(null)
  }

  // Handle drop from unused elements pool
  const handleUnusedElementDragStart = (e: DragEvent, elementId: string) => {
    setDraggedItem({ type: 'element', id: elementId, path: [] })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', `element:${elementId}:unused`)
    }
  }

  // ============================================
  // Recursive Section Renderer
  // ============================================

  const SectionNode = (nodeProps: {
    section: CardSection
    path: number[]
    depth: number
  }) => {
    const borderColor = depthColors[nodeProps.depth % depthColors.length]
    const bgColor = depthBgColors[nodeProps.depth % depthBgColors.length]

    return (
      <div
        class={`
          rounded-lg border-2 p-3 transition-all ${bgColor}
          ${draggedItem()?.id === nodeProps.section.id ? 'opacity-50' : ''}
          ${borderColor}
        `}
        onDragOver={(e) => handleDragOver(e, nodeProps.path, 'inside')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, nodeProps.path, 'inside')}
      >
        {/* Section header */}
        <div class="flex items-center gap-2 mb-2">
          {/* Drag handle */}
          <div
            draggable={true}
            onDragStart={(e) => handleDragStart(e, 'section', nodeProps.section.id, nodeProps.path)}
            onDragEnd={handleDragEnd}
            class="cursor-grab active:cursor-grabbing text-text-muted hover:text-text"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
            </svg>
          </div>

          {/* Section label with depth indicator */}
          <span class="text-xs font-medium text-text-muted">
            Section {nodeProps.depth > 0 ? `(depth ${nodeProps.depth})` : ''}
          </span>

          {/* Orientation toggle */}
          <button
            type="button"
            onClick={() => toggleOrientation(nodeProps.path)}
            class={`
              flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
              ${nodeProps.section.orientation === 'horizontal'
                ? 'bg-primary/20 text-primary'
                : 'bg-accent/20 text-accent'}
            `}
            title={`Click to switch to ${nodeProps.section.orientation === 'horizontal' ? 'vertical' : 'horizontal'}`}
          >
            {nodeProps.section.orientation === 'horizontal' ? (
              <>
                <HorizontalIcon />
                <span>H</span>
              </>
            ) : (
              <>
                <VerticalIcon />
                <span>V</span>
              </>
            )}
          </button>

          {/* Add subsection button */}
          <button
            type="button"
            onClick={() => addSubsection(nodeProps.path)}
            class="px-2 py-1 rounded text-xs font-medium bg-bg-secondary text-text-muted hover:text-text hover:bg-bg transition-colors"
            title="Add nested section"
          >
            + Section
          </button>

          {/* Remove section */}
          <button
            type="button"
            onClick={() => removeSection(nodeProps.path)}
            class="ml-auto p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
            title="Remove section"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Children container */}
        <div
          class={`
            min-h-[40px] rounded border border-dashed border-border p-2
            ${nodeProps.section.orientation === 'horizontal' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}
          `}
        >
          <Show when={nodeProps.section.children.length === 0}>
            <span class="text-xs text-text-muted italic">Drop elements or sections here</span>
          </Show>

          <For each={nodeProps.section.children}>
            {(child, childIndex) => {
              const childPath = [...nodeProps.path, childIndex()]

              if (child.type === 'element') {
                return (
                  <div
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, 'element', child.id, childPath)}
                    onDragOver={(e) => handleDragOver(e, childPath, 'before')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, childPath, 'before')}
                    onDragEnd={handleDragEnd}
                    class={`
                      flex items-center gap-1 px-2 py-1.5 rounded bg-bg border border-border
                      cursor-grab active:cursor-grabbing transition-all
                      ${draggedItem()?.id === child.id ? 'opacity-50 border-primary' : ''}
                      ${dragOverZone()?.path.join(',') === childPath.join(',') ? 'border-primary border-2' : ''}
                    `}
                  >
                    <span class="text-sm text-text">{props.elementLabels[child.id] || child.id}</span>
                    <button
                      type="button"
                      onClick={() => removeAtPath(childPath)}
                      class="ml-1 p-0.5 rounded text-text-muted hover:text-error hover:bg-error/10"
                      title="Remove element"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              } else {
                // Nested section - recursive call
                return (
                  <SectionNode
                    section={child.section}
                    path={childPath}
                    depth={nodeProps.depth + 1}
                  />
                )
              }
            }}
          </For>

          {/* Drop zone at end */}
          <Show when={nodeProps.section.children.length > 0}>
            <div
              class={`
                w-8 h-8 rounded border-2 border-dashed border-border flex items-center justify-center
                ${draggedItem() ? 'border-primary/50 bg-primary/5' : ''}
              `}
              onDragOver={(e) => handleDragOver(e, [...nodeProps.path, nodeProps.section.children.length], 'before')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, [...nodeProps.path, nodeProps.section.children.length], 'before')}
            >
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </Show>
        </div>
      </div>
    )
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
            <SectionNode section={section} path={[sectionIndex()]} depth={0} />
          )}
        </For>
      </div>

      {/* Add section button */}
      <button
        type="button"
        onClick={addTopLevelSection}
        class="w-full py-2 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span class="text-sm font-medium">Add Section</span>
      </button>

      {/* Unused elements pool */}
      <Show when={unusedElements().length > 0}>
        <div class="mt-4 pt-4 border-t border-border">
          <p class="text-xs text-text-muted uppercase tracking-wide mb-2">Available Elements</p>
          <div class="flex flex-wrap gap-2">
            <For each={unusedElements()}>
              {(elementId) => (
                <div
                  draggable={true}
                  onDragStart={(e) => handleUnusedElementDragStart(e, elementId)}
                  onDragEnd={handleDragEnd}
                  class={`
                    flex items-center gap-1 px-2 py-1.5 rounded bg-bg-secondary border border-border
                    cursor-grab active:cursor-grabbing transition-all hover:border-primary
                    ${draggedItem()?.id === elementId ? 'opacity-50 border-primary' : ''}
                  `}
                >
                  <span class="text-sm text-text-muted">{props.elementLabels[elementId] || elementId}</span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}

// ============================================
// Icons
// ============================================

function HorizontalIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
    </svg>
  )
}

function VerticalIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16" />
    </svg>
  )
}
