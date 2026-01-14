import { createSignal, For, Show } from 'solid-js'
import type { CardLayout, CardSection } from './types'

// ============================================
// Section-based Drag & Drop Card Layout Editor
// Like shadcn-drag-and-drop with sections and orientation
// ============================================

interface CardLayoutEditorProps {
  layout: CardLayout
  elementLabels: Record<string, string>
  allElementIds: string[]
  onUpdate: (layout: CardLayout) => void
}

export function CardLayoutEditor(props: CardLayoutEditorProps) {
  const [draggedElement, setDraggedElement] = createSignal<{ elementId: string; fromSectionId: string } | null>(null)
  const [draggedSection, setDraggedSection] = createSignal<string | null>(null)
  const [dragOverSection, setDragOverSection] = createSignal<string | null>(null)
  const [dragOverElementZone, setDragOverElementZone] = createSignal<{ sectionId: string; index: number } | null>(null)

  // Get elements not in any section
  const unusedElements = () => {
    const usedIds = new Set(props.layout.sections.flatMap((s) => s.elements))
    return props.allElementIds.filter((id) => !usedIds.has(id))
  }

  // ============================================
  // Section operations
  // ============================================

  const addSection = () => {
    const newSection: CardSection = {
      id: `sec-${Date.now()}`,
      orientation: 'horizontal',
      elements: [],
    }
    props.onUpdate({
      sections: [...props.layout.sections, newSection],
    })
  }

  const removeSection = (sectionId: string) => {
    props.onUpdate({
      sections: props.layout.sections.filter((s) => s.id !== sectionId),
    })
  }

  const toggleOrientation = (sectionId: string) => {
    props.onUpdate({
      sections: props.layout.sections.map((s) =>
        s.id === sectionId
          ? { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
          : s
      ),
    })
  }

  // ============================================
  // Element drag handlers
  // ============================================

  const handleElementDragStart = (e: DragEvent, elementId: string, fromSectionId: string) => {
    setDraggedElement({ elementId, fromSectionId })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', `element:${elementId}:${fromSectionId}`)
    }
  }

  const handleElementDragOver = (e: DragEvent, sectionId: string, index: number) => {
    e.preventDefault()
    if (draggedElement()) {
      setDragOverElementZone({ sectionId, index })
    }
  }

  const handleElementDrop = (e: DragEvent, targetSectionId: string, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const dragged = draggedElement()
    if (!dragged) return

    const { elementId, fromSectionId } = dragged

    // Build new sections
    const newSections = props.layout.sections.map((section) => {
      if (section.id === fromSectionId && fromSectionId !== targetSectionId) {
        // Remove from source section
        return { ...section, elements: section.elements.filter((id) => id !== elementId) }
      }
      if (section.id === targetSectionId) {
        // Add to target section
        const newElements = section.elements.filter((id) => id !== elementId)
        newElements.splice(targetIndex, 0, elementId)
        return { ...section, elements: newElements }
      }
      return section
    })

    props.onUpdate({ sections: newSections })
    setDraggedElement(null)
    setDragOverElementZone(null)
  }

  const handleElementDragEnd = () => {
    setDraggedElement(null)
    setDragOverElementZone(null)
  }

  // ============================================
  // Unused element drag (from pool)
  // ============================================

  const handleUnusedElementDragStart = (e: DragEvent, elementId: string) => {
    setDraggedElement({ elementId, fromSectionId: '__unused__' })
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', `element:${elementId}:__unused__`)
    }
  }

  const handleDropOnSection = (e: DragEvent, sectionId: string) => {
    e.preventDefault()
    const dragged = draggedElement()
    if (!dragged) return

    const { elementId, fromSectionId } = dragged

    if (fromSectionId === '__unused__') {
      // Add from unused pool
      const newSections = props.layout.sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, elements: [...section.elements, elementId] }
        }
        return section
      })
      props.onUpdate({ sections: newSections })
    }

    setDraggedElement(null)
    setDragOverElementZone(null)
    setDragOverSection(null)
  }

  // ============================================
  // Section drag handlers
  // ============================================

  const handleSectionDragStart = (e: DragEvent, sectionId: string) => {
    setDraggedSection(sectionId)
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', `section:${sectionId}`)
    }
  }

  const handleSectionDragOver = (e: DragEvent, sectionId: string) => {
    e.preventDefault()
    if (draggedSection() && draggedSection() !== sectionId) {
      setDragOverSection(sectionId)
    }
  }

  const handleSectionDrop = (e: DragEvent, targetSectionId: string) => {
    e.preventDefault()
    const sourceId = draggedSection()
    if (!sourceId || sourceId === targetSectionId) {
      setDraggedSection(null)
      setDragOverSection(null)
      return
    }

    const sections = [...props.layout.sections]
    const sourceIndex = sections.findIndex((s) => s.id === sourceId)
    const targetIndex = sections.findIndex((s) => s.id === targetSectionId)

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [removed] = sections.splice(sourceIndex, 1)
      sections.splice(targetIndex, 0, removed)
      props.onUpdate({ sections })
    }

    setDraggedSection(null)
    setDragOverSection(null)
  }

  const handleSectionDragEnd = () => {
    setDraggedSection(null)
    setDragOverSection(null)
  }

  // ============================================
  // Remove element (back to unused pool)
  // ============================================

  const removeElement = (sectionId: string, elementId: string) => {
    props.onUpdate({
      sections: props.layout.sections.map((section) =>
        section.id === sectionId
          ? { ...section, elements: section.elements.filter((id) => id !== elementId) }
          : section
      ),
    })
  }

  return (
    <div class="space-y-4">
      {/* Sections */}
      <div class="space-y-2">
        <For each={props.layout.sections}>
          {(section, sectionIndex) => (
            <div
              draggable={true}
              onDragStart={(e) => handleSectionDragStart(e, section.id)}
              onDragOver={(e) => handleSectionDragOver(e, section.id)}
              onDrop={(e) => {
                if (draggedSection()) {
                  handleSectionDrop(e, section.id)
                } else {
                  handleDropOnSection(e, section.id)
                }
              }}
              onDragEnd={handleSectionDragEnd}
              class={`
                rounded-lg border-2 p-3 transition-all bg-bg-card
                ${draggedSection() === section.id ? 'opacity-50 border-primary' : ''}
                ${dragOverSection() === section.id ? 'border-primary border-dashed bg-primary/5' : 'border-border'}
              `}
            >
              {/* Section header */}
              <div class="flex items-center gap-2 mb-2">
                {/* Drag handle */}
                <div class="cursor-grab active:cursor-grabbing text-text-muted hover:text-text">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Section number */}
                <span class="text-xs font-medium text-text-muted">Section {sectionIndex() + 1}</span>

                {/* Orientation toggle */}
                <button
                  type="button"
                  onClick={() => toggleOrientation(section.id)}
                  class={`
                    flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                    ${section.orientation === 'horizontal'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-accent/20 text-accent'}
                  `}
                  title={`Click to switch to ${section.orientation === 'horizontal' ? 'vertical' : 'horizontal'}`}
                >
                  {section.orientation === 'horizontal' ? (
                    <>
                      <HorizontalIcon />
                      <span>Horizontal</span>
                    </>
                  ) : (
                    <>
                      <VerticalIcon />
                      <span>Vertical</span>
                    </>
                  )}
                </button>

                {/* Remove section */}
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  class="ml-auto p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                  title="Remove section"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Elements container */}
              <div
                class={`
                  min-h-[40px] rounded border border-dashed border-border p-2
                  ${section.orientation === 'horizontal' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}
                `}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (draggedElement()) {
                    setDragOverSection(section.id)
                  }
                }}
                onDragLeave={() => setDragOverSection(null)}
                onDrop={(e) => handleDropOnSection(e, section.id)}
              >
                <Show when={section.elements.length === 0}>
                  <span class="text-xs text-text-muted italic">Drop elements here</span>
                </Show>

                <For each={section.elements}>
                  {(elementId, elementIndex) => (
                    <div
                      draggable={true}
                      onDragStart={(e) => handleElementDragStart(e, elementId, section.id)}
                      onDragOver={(e) => handleElementDragOver(e, section.id, elementIndex())}
                      onDrop={(e) => handleElementDrop(e, section.id, elementIndex())}
                      onDragEnd={handleElementDragEnd}
                      class={`
                        flex items-center gap-1 px-2 py-1.5 rounded bg-bg border border-border
                        cursor-grab active:cursor-grabbing transition-all
                        ${draggedElement()?.elementId === elementId ? 'opacity-50 border-primary' : ''}
                        ${dragOverElementZone()?.sectionId === section.id && dragOverElementZone()?.index === elementIndex()
                          ? 'border-primary border-2'
                          : ''}
                      `}
                    >
                      <span class="text-sm text-text">{props.elementLabels[elementId] || elementId}</span>
                      <button
                        type="button"
                        onClick={() => removeElement(section.id, elementId)}
                        class="ml-1 p-0.5 rounded text-text-muted hover:text-error hover:bg-error/10"
                        title="Remove element"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </For>

                {/* Drop zone at end */}
                <Show when={section.elements.length > 0}>
                  <div
                    class={`
                      w-8 h-8 rounded border-2 border-dashed border-border flex items-center justify-center
                      ${draggedElement() ? 'border-primary/50 bg-primary/5' : ''}
                    `}
                    onDragOver={(e) => {
                      e.preventDefault()
                      handleElementDragOver(e, section.id, section.elements.length)
                    }}
                    onDrop={(e) => handleElementDrop(e, section.id, section.elements.length)}
                  >
                    <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Add section button */}
      <button
        type="button"
        onClick={addSection}
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
                  onDragEnd={handleElementDragEnd}
                  class={`
                    flex items-center gap-1 px-2 py-1.5 rounded bg-bg-secondary border border-border
                    cursor-grab active:cursor-grabbing transition-all hover:border-primary
                    ${draggedElement()?.elementId === elementId ? 'opacity-50 border-primary' : ''}
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
