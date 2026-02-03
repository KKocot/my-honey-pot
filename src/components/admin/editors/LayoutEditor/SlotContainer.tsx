import { For, Show } from 'solid-js'
import { slotLabels, type PageLayoutSection, type PageSlotPosition } from '../../types/index'
import { PlusIcon } from './icons'
import { SectionCard } from './SectionCard'

// ============================================
// Slot Container Component
// ============================================

export interface SlotContainerProps {
  slot: PageSlotPosition
  sections: PageLayoutSection[]
  unusedElements: string[]
  onAddSection: () => void
  onRemoveSection: (sectionId: string) => void
  onToggleOrientation: (sectionId: string) => void
  onToggleSectionActive: (sectionId: string) => void
  onMoveSectionUp: (sectionId: string) => void
  onMoveSectionDown: (sectionId: string) => void
  onAddElement: (sectionId: string, elementId: string) => void
  onRemoveElement: (sectionId: string, elementId: string) => void
  onMoveElementUp: (sectionId: string, elementIndex: number) => void
  onMoveElementDown: (sectionId: string, elementIndex: number) => void
}

export function SlotContainer(props: SlotContainerProps) {
  return (
    <div class="rounded-xl border border-border bg-bg p-3">
      {/* Slot header */}
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-medium text-text">{slotLabels[props.slot]}</h3>
        <button
          type="button"
          onClick={props.onAddSection}
          class="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
        >
          <PlusIcon class="w-3 h-3" />
          Add Section
        </button>
      </div>

      {/* Sections in this slot */}
      <div class="space-y-2">
        <Show when={props.sections.length === 0}>
          <div class="text-xs text-text-muted italic text-center py-4 border border-dashed border-border rounded-lg">
            No sections in this slot
          </div>
        </Show>

        <For each={props.sections}>
          {(section, sectionIndex) => (
            <SectionCard
              section={section}
              sectionIndex={sectionIndex()}
              totalSections={props.sections.length}
              unusedElements={props.unusedElements}
              onRemove={() => props.onRemoveSection(section.id)}
              onToggleOrientation={() => props.onToggleOrientation(section.id)}
              onToggleActive={() => props.onToggleSectionActive(section.id)}
              onMoveUp={() => props.onMoveSectionUp(section.id)}
              onMoveDown={() => props.onMoveSectionDown(section.id)}
              onAddElement={(elementId) => props.onAddElement(section.id, elementId)}
              hasFooter={section.elements.includes('footer')}
              onRemoveElement={(elementId) => props.onRemoveElement(section.id, elementId)}
              onMoveElementUp={(index) => props.onMoveElementUp(section.id, index)}
              onMoveElementDown={(index) => props.onMoveElementDown(section.id, index)}
            />
          )}
        </For>
      </div>
    </div>
  )
}
