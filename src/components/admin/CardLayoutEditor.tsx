import { createSignal, For, Show, onMount, onCleanup } from 'solid-js'
import type { CardLayout, CardSection, CardSectionChild } from './types/index'
import { collectAllElementIds } from './types/index'

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

// Depth colors for visual distinction
const depthColors = [
  'border-primary',
  'border-accent',
  'border-success',
  'border-warning',
  'border-info',
] as const

const depthBgColors = [
  'bg-primary/5',
  'bg-accent/5',
  'bg-success/5',
  'bg-warning/5',
  'bg-info/5',
] as const

// ============================================
// Deep update helpers (pure functions)
// ============================================

function updateSectionAtPath(
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

function updateChildrenAtPath(
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

// ============================================
// Click-outside hook
// ============================================

function useClickOutside(
  ref: () => HTMLElement | undefined,
  callback: () => void
) {
  const handleClick = (e: MouseEvent) => {
    const element = ref()
    if (element && !element.contains(e.target as Node)) {
      callback()
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleClick)
  })

  onCleanup(() => {
    document.removeEventListener('mousedown', handleClick)
  })
}

// ============================================
// Element Picker Dropdown Component
// ============================================

interface ElementPickerProps {
  unusedElements: string[]
  elementLabels: Record<string, string>
  onSelect: (elementId: string) => void
}

function ElementPicker(props: ElementPickerProps) {
  const [showPicker, setShowPicker] = createSignal(false)
  let containerRef: HTMLDivElement | undefined

  useClickOutside(
    () => containerRef,
    () => setShowPicker(false)
  )

  return (
    <div class="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker())}
        disabled={props.unusedElements.length === 0}
        class={`
          w-8 h-8 rounded border-2 border-dashed flex items-center justify-center transition-colors
          ${props.unusedElements.length === 0
            ? 'border-border/30 text-text-muted/30 cursor-not-allowed'
            : 'border-border/50 text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5'}
        `}
        title={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
        aria-label={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
      >
        <PlusIcon />
      </button>

      <Show when={showPicker() && props.unusedElements.length > 0}>
        <div class="absolute left-0 top-10 z-50 bg-bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
          <p class="text-xs text-text-muted mb-2 px-1">Add element:</p>
          <div class="space-y-1 max-h-[200px] overflow-y-auto">
            <For each={props.unusedElements}>
              {(elementId) => (
                <button
                  type="button"
                  onClick={() => {
                    props.onSelect(elementId)
                    setShowPicker(false)
                  }}
                  class="w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors bg-bg-secondary text-text hover:bg-primary hover:text-primary-text"
                >
                  {props.elementLabels[elementId] || elementId}
                </button>
              )}
            </For>
          </div>
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            class="mt-2 w-full text-xs text-text-muted hover:text-text py-1"
          >
            Cancel
          </button>
        </div>
      </Show>
    </div>
  )
}

// ============================================
// Section Node Props Interface
// ============================================

interface SectionNodeProps {
  section: CardSection
  path: number[]
  depth: number
  index: number
  totalSiblings: number
  elementLabels: Record<string, string>
  unusedElements: string[]
  onMoveUp?: () => void
  onMoveDown?: () => void
  onToggleOrientation: (path: number[]) => void
  onAddSubsection: (path: number[]) => void
  onRemoveSection: (path: number[]) => void
  onMoveChild: (parentPath: number[], childIndex: number, direction: 'up' | 'down') => void
  onRemoveChild: (path: number[]) => void
  onAddElement: (path: number[], elementId: string) => void
}

// ============================================
// Section Node Component (extracted for proper reactivity)
// ============================================

function SectionNode(props: SectionNodeProps) {
  const borderColor = depthColors[props.depth % depthColors.length]
  const bgColor = depthBgColors[props.depth % depthBgColors.length]

  return (
    <div class={`rounded-lg border-2 p-3 transition-all ${bgColor} ${borderColor}`}>
      {/* Section header */}
      <div class="flex items-center gap-2 mb-2">
        {/* Move buttons */}
        <div class="flex flex-col">
          <button
            type="button"
            onClick={props.onMoveUp}
            disabled={props.index === 0}
            class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move section up"
            aria-label="Move section up"
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            onClick={props.onMoveDown}
            disabled={props.index >= props.totalSiblings - 1}
            class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move section down"
            aria-label="Move section down"
          >
            <ChevronDownIcon />
          </button>
        </div>

        {/* Section label with depth indicator */}
        <span class="text-xs font-medium text-text-muted">
          Section {props.depth > 0 ? `(depth ${props.depth})` : ''}
        </span>

        {/* Orientation toggle */}
        <button
          type="button"
          onClick={() => props.onToggleOrientation(props.path)}
          class={`
            flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
            ${props.section.orientation === 'horizontal'
              ? 'bg-accent/20 text-accent'
              : 'bg-primary/20 text-primary'}
          `}
          title={`Currently ${props.section.orientation}, click to toggle`}
          aria-label={`Toggle orientation (currently ${props.section.orientation})`}
        >
          {props.section.orientation === 'horizontal' ? (
            <>
              <VerticalIcon />
              <span>V</span>
            </>
          ) : (
            <>
              <HorizontalIcon />
              <span>H</span>
            </>
          )}
        </button>

        {/* Add subsection button */}
        <button
          type="button"
          onClick={() => props.onAddSubsection(props.path)}
          class="px-2 py-1 rounded text-xs font-medium bg-bg-secondary text-text-muted hover:text-text hover:bg-bg transition-colors"
          title="Add nested section"
          aria-label="Add nested section"
        >
          + Section
        </button>

        {/* Remove section */}
        <button
          type="button"
          onClick={() => props.onRemoveSection(props.path)}
          class="ml-auto p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
          title="Remove section"
          aria-label="Remove section"
        >
          <XIcon />
        </button>
      </div>

      {/* Children container */}
      <div
        class={`
          min-h-[40px] rounded border border-dashed border-border p-2
          ${props.section.orientation === 'horizontal' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}
        `}
      >
        <Show when={props.section.children.length === 0}>
          <span class="text-xs text-text-muted italic">No elements</span>
        </Show>

        <For each={props.section.children}>
          {(child, childIndex) => {
            const childPath = [...props.path, childIndex()]

            if (child.type === 'element') {
              return (
                <div class="flex items-center gap-1 px-2 py-1.5 rounded bg-bg border border-border">
                  {/* Move buttons for element */}
                  <div class={`flex ${props.section.orientation === 'horizontal' ? 'flex-col' : 'flex-row'} -ml-1`}>
                    <button
                      type="button"
                      onClick={() => props.onMoveChild(props.path, childIndex(), 'up')}
                      disabled={childIndex() === 0}
                      class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                      title={props.section.orientation === 'horizontal' ? 'Move left' : 'Move up'}
                      aria-label={props.section.orientation === 'horizontal' ? 'Move element left' : 'Move element up'}
                    >
                      {props.section.orientation === 'horizontal' ? (
                        <ChevronLeftIcon />
                      ) : (
                        <ChevronUpIcon />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => props.onMoveChild(props.path, childIndex(), 'down')}
                      disabled={childIndex() >= props.section.children.length - 1}
                      class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                      title={props.section.orientation === 'horizontal' ? 'Move right' : 'Move down'}
                      aria-label={props.section.orientation === 'horizontal' ? 'Move element right' : 'Move element down'}
                    >
                      {props.section.orientation === 'horizontal' ? (
                        <ChevronRightIcon />
                      ) : (
                        <ChevronDownIcon />
                      )}
                    </button>
                  </div>

                  <span class="text-sm text-text">{props.elementLabels[child.id] || child.id}</span>

                  <button
                    type="button"
                    onClick={() => props.onRemoveChild(childPath)}
                    class="ml-1 p-0.5 rounded text-text-muted hover:text-error hover:bg-error/10"
                    title="Remove element"
                    aria-label="Remove element"
                  >
                    <XIcon class="w-3 h-3" />
                  </button>
                </div>
              )
            } else {
              // Nested section - recursive call
              return (
                <SectionNode
                  section={child.section}
                  path={childPath}
                  depth={props.depth + 1}
                  index={childIndex()}
                  totalSiblings={props.section.children.length}
                  elementLabels={props.elementLabels}
                  unusedElements={props.unusedElements}
                  onMoveUp={() => props.onMoveChild(props.path, childIndex(), 'up')}
                  onMoveDown={() => props.onMoveChild(props.path, childIndex(), 'down')}
                  onToggleOrientation={props.onToggleOrientation}
                  onAddSubsection={props.onAddSubsection}
                  onRemoveSection={props.onRemoveSection}
                  onMoveChild={props.onMoveChild}
                  onRemoveChild={props.onRemoveChild}
                  onAddElement={props.onAddElement}
                />
              )
            }
          }}
        </For>

        {/* Add element button */}
        <ElementPicker
          unusedElements={props.unusedElements}
          elementLabels={props.elementLabels}
          onSelect={(elementId) => props.onAddElement(props.path, elementId)}
        />
      </div>
    </div>
  )
}

// ============================================
// Main Editor Component
// ============================================

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

// ============================================
// Icons
// ============================================

function HorizontalIcon() {
  // Three boxes in a row (horizontal layout)
  return (
    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="8" width="5" height="8" rx="1" />
      <rect x="9" y="8" width="5" height="8" rx="1" />
      <rect x="16" y="8" width="5" height="8" rx="1" />
    </svg>
  )
}

function VerticalIcon() {
  // Three boxes stacked (vertical layout)
  return (
    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="2" width="12" height="5" rx="1" />
      <rect x="6" y="9" width="12" height="5" rx="1" />
      <rect x="6" y="16" width="12" height="5" rx="1" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function XIcon(props: { class?: string }) {
  return (
    <svg class={props.class || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  )
}
