import { For, createSignal } from 'solid-js'
import { settings, updateLayoutSection, setLayoutSections } from './store'
import { sectionLabels, sectionColors, type LayoutSection } from './types'

// ============================================
// Layout Editor - Drag & Drop
// ============================================

export function LayoutEditor() {
  const [draggedId, setDraggedId] = createSignal<string | null>(null)

  const handleDragStart = (sectionId: string) => {
    setDraggedId(sectionId)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
  }

  const handleDrop = (position: LayoutSection['position']) => {
    const id = draggedId()
    if (id) {
      updateLayoutSection(id, { position, enabled: true })
    }
    setDraggedId(null)
  }

  const toggleSection = (sectionId: string) => {
    const section = settings.layoutSections.find((s) => s.id === sectionId)
    if (section) {
      updateLayoutSection(sectionId, { enabled: !section.enabled })
    }
  }

  const getSectionsInPosition = (position: LayoutSection['position']) => {
    return settings.layoutSections.filter((s) => s.enabled && s.position === position)
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Page Layout Editor</h2>
      <p class="text-text-muted text-sm mb-4">
        Drag sections to the preview to change their position. Click a section to enable/disable it.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available sections */}
        <div>
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">
            Available Sections
          </h3>
          <div class="space-y-2">
            <For each={settings.layoutSections}>
              {(section) => (
                <SectionChip
                  section={section}
                  onDragStart={() => handleDragStart(section.id)}
                  onDragEnd={handleDragEnd}
                  onToggle={() => toggleSection(section.id)}
                  dragging={draggedId() === section.id}
                />
              )}
            </For>
          </div>
        </div>

        {/* Layout preview */}
        <div class="lg:col-span-2">
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">
            Preview (drag sections here)
          </h3>
          <div class="border-2 border-dashed border-border rounded-xl overflow-hidden bg-bg min-h-[400px]">
            <DropZone
              position="top"
              label="Top (header)"
              sections={getSectionsInPosition('top')}
              onDrop={() => handleDrop('top')}
              horizontal
            />

            <div class="flex flex-1">
              <DropZone
                position="sidebar-left"
                label="Left Sidebar"
                sections={getSectionsInPosition('sidebar-left')}
                onDrop={() => handleDrop('sidebar-left')}
                class="w-1/4 border-r-2 border-dashed border-border"
              />

              <DropZone
                position="main"
                label="Main Content"
                sections={getSectionsInPosition('main')}
                onDrop={() => handleDrop('main')}
                class="flex-1"
              />

              <DropZone
                position="sidebar-right"
                label="Right Sidebar"
                sections={getSectionsInPosition('sidebar-right')}
                onDrop={() => handleDrop('sidebar-right')}
                class="w-1/4 border-l-2 border-dashed border-border"
              />
            </div>

            <DropZone
              position="bottom"
              label="Bottom (footer)"
              sections={getSectionsInPosition('bottom')}
              onDrop={() => handleDrop('bottom')}
              horizontal
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Section Chip Component
// ============================================

interface SectionChipProps {
  section: LayoutSection
  onDragStart: () => void
  onDragEnd: () => void
  onToggle: () => void
  dragging?: boolean
}

function SectionChip(props: SectionChipProps) {
  return (
    <div
      draggable={true}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      class={`
        px-4 py-2 rounded-lg text-sm font-medium cursor-grab select-none
        ${sectionColors[props.section.id]}
        ${!props.section.enabled ? 'opacity-40 line-through' : ''}
        ${props.dragging ? 'opacity-50' : ''}
      `}
    >
      {sectionLabels[props.section.id]}
      <button
        class="ml-2 opacity-70 hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          props.onToggle()
        }}
      >
        {props.section.enabled ? '✓' : '✗'}
      </button>
    </div>
  )
}

// ============================================
// Drop Zone Component
// ============================================

interface DropZoneProps {
  position: LayoutSection['position']
  label: string
  sections: LayoutSection[]
  onDrop: () => void
  horizontal?: boolean
  class?: string
}

function DropZone(props: DropZoneProps) {
  const [dragOver, setDragOver] = createSignal(false)

  return (
    <div
      class={`
        min-h-[60px] p-2 transition-colors
        ${props.horizontal ? 'border-b-2 border-dashed border-border' : 'min-h-[200px]'}
        ${dragOver() ? 'bg-primary/10 border-primary' : ''}
        ${props.class || ''}
      `}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        props.onDrop()
      }}
    >
      <p class="text-xs text-text-muted text-center uppercase">{props.label}</p>
      <div class={`mt-2 ${props.horizontal ? 'flex flex-wrap gap-2 justify-center' : 'flex flex-col gap-2'}`}>
        <For each={props.sections}>
          {(section) => (
            <div
              class={`px-3 py-1.5 rounded text-xs font-medium ${sectionColors[section.id]}`}
            >
              {sectionLabels[section.id]}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
