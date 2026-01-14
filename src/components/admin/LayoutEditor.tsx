import { For, createSignal, Show } from 'solid-js'
import { settings, updateSettings } from './store'
import {
  pageElementLabels,
  pageElementColors,
  slotLabels,
  ALL_PAGE_ELEMENT_IDS,
  type PageLayout,
  type PageLayoutSection,
  type PageSlotPosition,
} from './types'

// ============================================
// Page Layout Editor - Section-based Drag & Drop
// Like shadcn-drag-and-drop with slots and sections
// ============================================

const SLOTS: PageSlotPosition[] = ['top', 'sidebar-left', 'main', 'sidebar-right', 'bottom']

export function LayoutEditor() {
  const [draggedElement, setDraggedElement] = createSignal<{ elementId: string; fromSectionId: string } | null>(null)
  const [draggedSection, setDraggedSection] = createSignal<string | null>(null)
  const [dragOverSlot, setDragOverSlot] = createSignal<PageSlotPosition | null>(null)
  const [dragOverSection, setDragOverSection] = createSignal<string | null>(null)
  const [dragOverElementZone, setDragOverElementZone] = createSignal<{ sectionId: string; index: number } | null>(null)

  // Get sections for a specific slot
  const getSectionsInSlot = (slot: PageSlotPosition) => {
    return settings.pageLayout.sections.filter((s) => s.slot === slot)
  }

  // Get all used element IDs
  const getUsedElementIds = () => {
    return new Set(settings.pageLayout.sections.flatMap((s) => s.elements))
  }

  // Get unused elements
  const unusedElements = () => {
    const usedIds = getUsedElementIds()
    return ALL_PAGE_ELEMENT_IDS.filter((id) => !usedIds.has(id))
  }

  // ============================================
  // Update functions
  // ============================================

  const updatePageLayout = (layout: PageLayout) => {
    updateSettings({ pageLayout: layout })
  }

  // ============================================
  // Section operations
  // ============================================

  const addSection = (slot: PageSlotPosition) => {
    const newSection: PageLayoutSection = {
      id: `page-sec-${Date.now()}`,
      slot,
      orientation: 'horizontal',
      elements: [],
    }
    updatePageLayout({
      sections: [...settings.pageLayout.sections, newSection],
    })
  }

  const removeSection = (sectionId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.filter((s) => s.id !== sectionId),
    })
  }

  const toggleOrientation = (sectionId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((s) =>
        s.id === sectionId
          ? { ...s, orientation: s.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
          : s
      ),
    })
  }

  const changeSectionSlot = (sectionId: string, newSlot: PageSlotPosition) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((s) =>
        s.id === sectionId ? { ...s, slot: newSlot } : s
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
    const newSections = settings.pageLayout.sections.map((section) => {
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

    updatePageLayout({ sections: newSections })
    setDraggedElement(null)
    setDragOverElementZone(null)
  }

  const handleElementDragEnd = () => {
    setDraggedElement(null)
    setDragOverElementZone(null)
    setDragOverSlot(null)
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
      // Add from unused pool to the end
      const newSections = settings.pageLayout.sections.map((section) => {
        if (section.id === sectionId) {
          return { ...section, elements: [...section.elements, elementId] }
        }
        return section
      })
      updatePageLayout({ sections: newSections })
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

    const sections = [...settings.pageLayout.sections]
    const sourceIndex = sections.findIndex((s) => s.id === sourceId)
    const targetIndex = sections.findIndex((s) => s.id === targetSectionId)

    if (sourceIndex !== -1 && targetIndex !== -1) {
      const [removed] = sections.splice(sourceIndex, 1)
      sections.splice(targetIndex, 0, removed)
      updatePageLayout({ sections })
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
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) =>
        section.id === sectionId
          ? { ...section, elements: section.elements.filter((id) => id !== elementId) }
          : section
      ),
    })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-4">Page Layout Editor</h2>
      <p class="text-text-muted text-sm mb-6">
        Drag page elements between slots. Each slot can have multiple sections with different orientations.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slot-based Editor */}
        <div class="space-y-4">
          <For each={SLOTS}>
            {(slot) => (
              <SlotContainer
                slot={slot}
                sections={getSectionsInSlot(slot)}
                draggedSection={draggedSection}
                draggedElement={draggedElement}
                dragOverSection={dragOverSection}
                dragOverElementZone={dragOverElementZone}
                onAddSection={() => addSection(slot)}
                onRemoveSection={removeSection}
                onToggleOrientation={toggleOrientation}
                onSectionDragStart={handleSectionDragStart}
                onSectionDragOver={handleSectionDragOver}
                onSectionDrop={handleSectionDrop}
                onSectionDragEnd={handleSectionDragEnd}
                onElementDragStart={handleElementDragStart}
                onElementDragOver={handleElementDragOver}
                onElementDrop={handleElementDrop}
                onElementDragEnd={handleElementDragEnd}
                onDropOnSection={handleDropOnSection}
                onRemoveElement={removeElement}
              />
            )}
          </For>

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
                        flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-medium
                        cursor-grab active:cursor-grabbing transition-all hover:opacity-80
                        ${pageElementColors[elementId] || 'bg-text-muted'}
                        ${draggedElement()?.elementId === elementId ? 'opacity-50' : ''}
                      `}
                    >
                      {pageElementLabels[elementId] || elementId}
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        {/* Live Preview */}
        <PageLayoutPreview />
      </div>
    </div>
  )
}

// ============================================
// Slot Container Component
// ============================================

interface SlotContainerProps {
  slot: PageSlotPosition
  sections: PageLayoutSection[]
  draggedSection: () => string | null
  draggedElement: () => { elementId: string; fromSectionId: string } | null
  dragOverSection: () => string | null
  dragOverElementZone: () => { sectionId: string; index: number } | null
  onAddSection: () => void
  onRemoveSection: (sectionId: string) => void
  onToggleOrientation: (sectionId: string) => void
  onSectionDragStart: (e: DragEvent, sectionId: string) => void
  onSectionDragOver: (e: DragEvent, sectionId: string) => void
  onSectionDrop: (e: DragEvent, sectionId: string) => void
  onSectionDragEnd: () => void
  onElementDragStart: (e: DragEvent, elementId: string, fromSectionId: string) => void
  onElementDragOver: (e: DragEvent, sectionId: string, index: number) => void
  onElementDrop: (e: DragEvent, sectionId: string, index: number) => void
  onElementDragEnd: () => void
  onDropOnSection: (e: DragEvent, sectionId: string) => void
  onRemoveElement: (sectionId: string, elementId: string) => void
}

function SlotContainer(props: SlotContainerProps) {
  const isHorizontalSlot = () => props.slot === 'top' || props.slot === 'bottom'

  return (
    <div class="rounded-xl border border-border bg-bg p-3">
      {/* Slot header */}
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-text">{slotLabels[props.slot]}</h3>
        <button
          type="button"
          onClick={props.onAddSection}
          class="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Section
        </button>
      </div>

      {/* Sections in this slot */}
      <div class={`space-y-2 ${props.sections.length === 0 ? 'min-h-[40px]' : ''}`}>
        <Show when={props.sections.length === 0}>
          <div class="text-xs text-text-muted italic text-center py-2">
            No sections in this slot
          </div>
        </Show>

        <For each={props.sections}>
          {(section, sectionIndex) => (
            <div
              draggable={true}
              onDragStart={(e) => props.onSectionDragStart(e, section.id)}
              onDragOver={(e) => props.onSectionDragOver(e, section.id)}
              onDrop={(e) => {
                if (props.draggedSection()) {
                  props.onSectionDrop(e, section.id)
                } else {
                  props.onDropOnSection(e, section.id)
                }
              }}
              onDragEnd={props.onSectionDragEnd}
              class={`
                rounded-lg border-2 p-2 transition-all bg-bg-card
                ${props.draggedSection() === section.id ? 'opacity-50 border-primary' : ''}
                ${props.dragOverSection() === section.id ? 'border-primary border-dashed bg-primary/5' : 'border-border'}
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
                  onClick={() => props.onToggleOrientation(section.id)}
                  class={`
                    flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors
                    ${section.orientation === 'horizontal'
                      ? 'bg-primary/20 text-primary'
                      : 'bg-accent/20 text-accent'}
                  `}
                  title={`Click to switch to ${section.orientation === 'horizontal' ? 'vertical' : 'horizontal'}`}
                >
                  {section.orientation === 'horizontal' ? (
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

                {/* Remove section */}
                <button
                  type="button"
                  onClick={() => props.onRemoveSection(section.id)}
                  class="ml-auto p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                  title="Remove section"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Elements container */}
              <div
                class={`
                  min-h-[32px] rounded border border-dashed border-border p-1.5
                  ${section.orientation === 'horizontal' ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-1.5'}
                `}
                onDragOver={(e) => {
                  e.preventDefault()
                  if (props.draggedElement()) {
                    // Allow drop
                  }
                }}
                onDrop={(e) => props.onDropOnSection(e, section.id)}
              >
                <Show when={section.elements.length === 0}>
                  <span class="text-xs text-text-muted italic">Drop elements here</span>
                </Show>

                <For each={section.elements}>
                  {(elementId, elementIndex) => (
                    <div
                      draggable={true}
                      onDragStart={(e) => props.onElementDragStart(e, elementId, section.id)}
                      onDragOver={(e) => props.onElementDragOver(e, section.id, elementIndex())}
                      onDrop={(e) => props.onElementDrop(e, section.id, elementIndex())}
                      onDragEnd={props.onElementDragEnd}
                      class={`
                        flex items-center gap-1 px-2 py-1 rounded text-white text-xs font-medium
                        cursor-grab active:cursor-grabbing transition-all
                        ${pageElementColors[elementId] || 'bg-text-muted'}
                        ${props.draggedElement()?.elementId === elementId ? 'opacity-50' : ''}
                        ${props.dragOverElementZone()?.sectionId === section.id && props.dragOverElementZone()?.index === elementIndex()
                          ? 'ring-2 ring-white'
                          : ''}
                      `}
                    >
                      <span>{pageElementLabels[elementId] || elementId}</span>
                      <button
                        type="button"
                        onClick={() => props.onRemoveElement(section.id, elementId)}
                        class="ml-1 p-0.5 rounded hover:bg-white/20"
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
                      w-6 h-6 rounded border-2 border-dashed border-border/50 flex items-center justify-center
                      ${props.draggedElement() ? 'border-primary/50 bg-primary/5' : ''}
                    `}
                    onDragOver={(e) => {
                      e.preventDefault()
                      props.onElementDragOver(e, section.id, section.elements.length)
                    }}
                    onDrop={(e) => props.onElementDrop(e, section.id, section.elements.length)}
                  >
                    <svg class="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}

// ============================================
// Page Layout Preview
// ============================================

function PageLayoutPreview() {
  // Helper to get sections in a slot
  const getSectionsInSlot = (slot: PageSlotPosition) => {
    return settings.pageLayout.sections.filter((s) => s.slot === slot)
  }

  // Helper to check if slot has any elements
  const slotHasElements = (slot: PageSlotPosition) => {
    return getSectionsInSlot(slot).some((s) => s.elements.length > 0)
  }

  // Render element preview
  const renderElement = (elementId: string) => {
    return (
      <div
        class={`
          px-2 py-1 rounded text-white text-xs font-medium truncate
          ${pageElementColors[elementId] || 'bg-text-muted'}
        `}
      >
        {pageElementLabels[elementId] || elementId}
      </div>
    )
  }

  // Render section preview
  const renderSection = (section: PageLayoutSection) => {
    if (section.elements.length === 0) return null

    return (
      <div
        class={`
          ${section.orientation === 'horizontal' ? 'flex flex-wrap gap-1' : 'flex flex-col gap-1'}
        `}
      >
        <For each={section.elements}>
          {(elementId) => renderElement(elementId)}
        </For>
      </div>
    )
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div class="border-2 border-dashed border-border rounded-lg overflow-hidden bg-bg-card min-h-[300px]">
        {/* Top slot */}
        <Show when={slotHasElements('top')}>
          <div class="border-b border-dashed border-border p-2 bg-bg/50">
            <For each={getSectionsInSlot('top')}>
              {(section) => renderSection(section)}
            </For>
          </div>
        </Show>

        {/* Middle area (sidebars + main) */}
        <div class="flex min-h-[200px]">
          {/* Left sidebar */}
          <Show when={slotHasElements('sidebar-left')}>
            <div class="w-1/4 border-r border-dashed border-border p-2 bg-bg/30">
              <For each={getSectionsInSlot('sidebar-left')}>
                {(section) => renderSection(section)}
              </For>
            </div>
          </Show>

          {/* Main content */}
          <div class="flex-1 p-2">
            <Show when={slotHasElements('main')}>
              <For each={getSectionsInSlot('main')}>
                {(section) => renderSection(section)}
              </For>
            </Show>
            <Show when={!slotHasElements('main')}>
              <div class="text-xs text-text-muted text-center py-8">Main Content Area</div>
            </Show>
          </div>

          {/* Right sidebar */}
          <Show when={slotHasElements('sidebar-right')}>
            <div class="w-1/4 border-l border-dashed border-border p-2 bg-bg/30">
              <For each={getSectionsInSlot('sidebar-right')}>
                {(section) => renderSection(section)}
              </For>
            </div>
          </Show>
        </div>

        {/* Bottom slot */}
        <Show when={slotHasElements('bottom')}>
          <div class="border-t border-dashed border-border p-2 bg-bg/50">
            <For each={getSectionsInSlot('bottom')}>
              {(section) => renderSection(section)}
            </For>
          </div>
        </Show>
      </div>
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
