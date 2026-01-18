import { For, createSignal, Show, onMount, onCleanup } from 'solid-js'
import { settings, updateSettings } from './store'
import {
  pageElementLabels,
  getPageElementColor,
  slotLabels,
  ALL_PAGE_ELEMENT_IDS,
  type PageLayout,
  type PageLayoutSection,
  type PageSlotPosition,
} from './types'

// ============================================
// Page Layout Editor - Button-based UI
// ============================================

const SLOTS: PageSlotPosition[] = ['top', 'sidebar-left', 'main', 'sidebar-right', 'bottom']

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

export function LayoutEditor() {
  // Get sections for a specific slot
  const getSectionsInSlot = (slot: PageSlotPosition) => {
    return settings.pageLayout.sections.filter((s) => s.slot === slot)
  }

  // Get all used element IDs
  const getUsedElementIds = () => {
    return new Set(settings.pageLayout.sections.flatMap((s) => s.elements))
  }

  // Get unused elements
  const getUnusedElements = () => {
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
      active: true,
    }
    updatePageLayout({
      sections: [...settings.pageLayout.sections, newSection],
    })
  }

  const toggleSectionActive = (sectionId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((s) =>
        s.id === sectionId
          ? { ...s, active: s.active !== false ? false : true }
          : s
      ),
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

  const moveSectionUp = (slot: PageSlotPosition, sectionId: string) => {
    const sectionsInSlot = getSectionsInSlot(slot)
    const index = sectionsInSlot.findIndex((s) => s.id === sectionId)
    if (index <= 0) return

    const allSections = [...settings.pageLayout.sections]
    const globalIndex = allSections.findIndex((s) => s.id === sectionId)
    const prevInSlot = sectionsInSlot[index - 1]
    const prevGlobalIndex = allSections.findIndex((s) => s.id === prevInSlot.id)

    // Swap positions
    ;[allSections[globalIndex], allSections[prevGlobalIndex]] = [allSections[prevGlobalIndex], allSections[globalIndex]]
    updatePageLayout({ sections: allSections })
  }

  const moveSectionDown = (slot: PageSlotPosition, sectionId: string) => {
    const sectionsInSlot = getSectionsInSlot(slot)
    const index = sectionsInSlot.findIndex((s) => s.id === sectionId)
    if (index === -1 || index >= sectionsInSlot.length - 1) return

    const allSections = [...settings.pageLayout.sections]
    const globalIndex = allSections.findIndex((s) => s.id === sectionId)
    const nextInSlot = sectionsInSlot[index + 1]
    const nextGlobalIndex = allSections.findIndex((s) => s.id === nextInSlot.id)

    // Swap positions
    ;[allSections[globalIndex], allSections[nextGlobalIndex]] = [allSections[nextGlobalIndex], allSections[globalIndex]]
    updatePageLayout({ sections: allSections })
  }

  // ============================================
  // Element operations
  // ============================================

  const addElementToSection = (sectionId: string, elementId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) =>
        section.id === sectionId
          ? { ...section, elements: [...section.elements, elementId] }
          : section
      ),
    })
  }

  const removeElement = (sectionId: string, elementId: string) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) =>
        section.id === sectionId
          ? { ...section, elements: section.elements.filter((id) => id !== elementId) }
          : section
      ),
    })
  }

  const moveElementUp = (sectionId: string, elementIndex: number) => {
    if (elementIndex <= 0) return
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) => {
        if (section.id !== sectionId) return section
        const newElements = [...section.elements]
        ;[newElements[elementIndex], newElements[elementIndex - 1]] = [newElements[elementIndex - 1], newElements[elementIndex]]
        return { ...section, elements: newElements }
      }),
    })
  }

  const moveElementDown = (sectionId: string, elementIndex: number) => {
    updatePageLayout({
      sections: settings.pageLayout.sections.map((section) => {
        if (section.id !== sectionId) return section
        if (elementIndex >= section.elements.length - 1) return section
        const newElements = [...section.elements]
        ;[newElements[elementIndex], newElements[elementIndex + 1]] = [newElements[elementIndex + 1], newElements[elementIndex]]
        return { ...section, elements: newElements }
      }),
    })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-4">Page Layout Editor</h2>
      <p class="text-text-muted text-sm mb-6">
        Configure page layout by adding sections and elements to each slot.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slot-based Editor */}
        <div class="space-y-4">
          <For each={SLOTS}>
            {(slot) => (
              <SlotContainer
                slot={slot}
                sections={getSectionsInSlot(slot)}
                unusedElements={getUnusedElements()}
                onAddSection={() => addSection(slot)}
                onRemoveSection={removeSection}
                onToggleOrientation={toggleOrientation}
                onToggleSectionActive={toggleSectionActive}
                onMoveSectionUp={(sectionId) => moveSectionUp(slot, sectionId)}
                onMoveSectionDown={(sectionId) => moveSectionDown(slot, sectionId)}
                onAddElement={addElementToSection}
                onRemoveElement={removeElement}
                onMoveElementUp={moveElementUp}
                onMoveElementDown={moveElementDown}
              />
            )}
          </For>
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

function SlotContainer(props: SlotContainerProps) {
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

// ============================================
// Section Card Component
// ============================================

interface SectionCardProps {
  section: PageLayoutSection
  sectionIndex: number
  totalSections: number
  unusedElements: string[]
  onRemove: () => void
  onToggleOrientation: () => void
  onToggleActive: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddElement: (elementId: string) => void
  onRemoveElement: (elementId: string) => void
  onMoveElementUp: (index: number) => void
  onMoveElementDown: (index: number) => void
}

function SectionCard(props: SectionCardProps) {
  const [showElementPicker, setShowElementPicker] = createSignal(false)
  let pickerContainerRef: HTMLDivElement | undefined

  useClickOutside(
    () => pickerContainerRef,
    () => setShowElementPicker(false)
  )

  return (
    <div class="rounded-lg border-2 border-border p-2 bg-bg-card">
      {/* Section header */}
      <div class="flex items-center gap-2 mb-2">
        {/* Move buttons */}
        <div class="flex flex-col">
          <button
            type="button"
            onClick={props.onMoveUp}
            disabled={props.sectionIndex === 0}
            class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move section up"
          >
            <ChevronUpIcon class="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={props.onMoveDown}
            disabled={props.sectionIndex >= props.totalSections - 1}
            class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move section down"
          >
            <ChevronDownIcon class="w-3 h-3" />
          </button>
        </div>

        {/* Section number */}
        <span class="text-xs font-medium text-text-muted">Section {props.sectionIndex + 1}</span>

        {/* Active toggle */}
        <button
          type="button"
          onClick={props.onToggleActive}
          class={`
            flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors
            ${props.section.active !== false
              ? 'bg-success/20 text-success'
              : 'bg-text-muted/20 text-text-muted'}
          `}
          title={props.section.active !== false ? 'Click to hide section' : 'Click to show section'}
        >
          {props.section.active !== false ? (
            <EyeIcon class="w-3 h-3" />
          ) : (
            <EyeOffIcon class="w-3 h-3" />
          )}
        </button>

        {/* Orientation toggle */}
        <button
          type="button"
          onClick={props.onToggleOrientation}
          class={`
            flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors
            ${props.section.orientation === 'horizontal'
              ? 'bg-primary/20 text-primary'
              : 'bg-accent/20 text-accent'}
          `}
          title={`Click to switch to ${props.section.orientation === 'horizontal' ? 'vertical' : 'horizontal'}`}
        >
          {props.section.orientation === 'horizontal' ? (
            <>
              <HorizontalIcon class="w-3 h-3" />
              <span>H</span>
            </>
          ) : (
            <>
              <VerticalIcon class="w-3 h-3" />
              <span>V</span>
            </>
          )}
        </button>

        {/* Remove section */}
        <button
          type="button"
          onClick={props.onRemove}
          class="ml-auto p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
          title="Remove section"
        >
          <XIcon class="w-3 h-3" />
        </button>
      </div>

      {/* Elements container */}
      <div
        class={`
          min-h-[32px] rounded border border-dashed border-border p-1.5
          ${props.section.orientation === 'horizontal' ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-1.5'}
        `}
      >
        <Show when={props.section.elements.length === 0}>
          <span class="text-xs text-text-muted italic">No elements</span>
        </Show>

        <For each={props.section.elements}>
          {(elementId, elementIndex) => (
            <div
              class={`
                flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                ${getPageElementColor(elementId)}
              `}
            >
              {/* Move buttons for element */}
              <div class={`flex ${props.section.orientation === 'horizontal' ? 'flex-col' : 'flex-row'} -ml-1`}>
                <button
                  type="button"
                  onClick={() => props.onMoveElementUp(elementIndex())}
                  disabled={elementIndex() === 0}
                  class="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={props.section.orientation === 'horizontal' ? 'Move left' : 'Move up'}
                >
                  {props.section.orientation === 'horizontal' ? (
                    <ChevronLeftIcon class="w-2.5 h-2.5" />
                  ) : (
                    <ChevronUpIcon class="w-2.5 h-2.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => props.onMoveElementDown(elementIndex())}
                  disabled={elementIndex() >= props.section.elements.length - 1}
                  class="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={props.section.orientation === 'horizontal' ? 'Move right' : 'Move down'}
                >
                  {props.section.orientation === 'horizontal' ? (
                    <ChevronRightIcon class="w-2.5 h-2.5" />
                  ) : (
                    <ChevronDownIcon class="w-2.5 h-2.5" />
                  )}
                </button>
              </div>

              <span>{pageElementLabels[elementId] || elementId}</span>

              <button
                type="button"
                onClick={() => props.onRemoveElement(elementId)}
                class="ml-1 p-0.5 rounded hover:bg-white/20"
                title="Remove element"
              >
                <XIcon class="w-3 h-3" />
              </button>
            </div>
          )}
        </For>

        {/* Add element button */}
        <div class="relative" ref={pickerContainerRef}>
          <button
            type="button"
            onClick={() => setShowElementPicker(!showElementPicker())}
            disabled={props.unusedElements.length === 0}
            class={`
              w-6 h-6 rounded border-2 border-dashed flex items-center justify-center transition-colors
              ${props.unusedElements.length === 0
                ? 'border-border/30 text-text-muted/30 cursor-not-allowed'
                : 'border-border/50 text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5'}
            `}
            title={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
          >
            <PlusIcon class="w-3 h-3" />
          </button>

          {/* Element picker dropdown */}
          <Show when={showElementPicker() && props.unusedElements.length > 0}>
            <div class="absolute left-0 top-8 z-50 bg-bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
              <p class="text-xs text-text-muted mb-2 px-1">Add element:</p>
              <div class="space-y-1 max-h-[200px] overflow-y-auto">
                <For each={props.unusedElements}>
                  {(elementId) => (
                    <button
                      type="button"
                      onClick={() => {
                        props.onAddElement(elementId)
                        setShowElementPicker(false)
                      }}
                      class={`
                        w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors
                        ${getPageElementColor(elementId)} hover:opacity-80
                      `}
                    >
                      {pageElementLabels[elementId] || elementId}
                    </button>
                  )}
                </For>
              </div>
              <button
                type="button"
                onClick={() => setShowElementPicker(false)}
                class="mt-2 w-full text-xs text-text-muted hover:text-text py-1"
              >
                Cancel
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Page Layout Preview with Mock Content
// ============================================

function PageLayoutPreview() {
  // Only get active sections in a slot
  const getSectionsInSlot = (slot: PageSlotPosition) => {
    return settings.pageLayout.sections.filter((s) => s.slot === slot && s.active !== false)
  }

  const slotHasElements = (slot: PageSlotPosition) => {
    return getSectionsInSlot(slot).some((s) => s.elements.length > 0)
  }

  const renderElement = (elementId: string, isCompact: boolean = false) => {
    switch (elementId) {
      case 'header':
        return <MockHeader compact={isCompact} />
      case 'authorProfile':
        return <MockAuthorProfile compact={isCompact} />
      case 'posts':
        return <MockPosts compact={isCompact} />
      case 'comments':
        return <MockComments compact={isCompact} />
      case 'navigation':
        return <MockNavigation compact={isCompact} />
      case 'search':
        return <MockSearch compact={isCompact} />
      case 'tags':
        return <MockTags compact={isCompact} />
      case 'recentPosts':
        return <MockRecentPosts compact={isCompact} />
      case 'footer':
        return <MockFooter compact={isCompact} />
      default:
        return (
          <div class={`px-2 py-1 rounded text-xs font-medium ${getPageElementColor(elementId)}`}>
            {pageElementLabels[elementId] || elementId}
          </div>
        )
    }
  }

  const renderSection = (section: PageLayoutSection, isCompact: boolean = false) => {
    if (section.elements.length === 0) return null

    return (
      <div
        class={`
          ${section.orientation === 'horizontal' ? 'flex flex-wrap gap-1' : 'flex flex-col gap-1'}
        `}
      >
        <For each={section.elements}>
          {(elementId) => renderElement(elementId, isCompact)}
        </For>
      </div>
    )
  }

  const hasLeftSidebar = () => slotHasElements('sidebar-left')
  const hasRightSidebar = () => slotHasElements('sidebar-right')
  const hasMain = () => slotHasElements('main')
  const hasMiddleArea = () => hasLeftSidebar() || hasRightSidebar() || hasMain()

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-text-muted uppercase tracking-wide">Preview (scaled)</p>
        <div class="flex items-center gap-2 text-[9px] text-text-muted">
          <span class="hidden sm:inline px-1.5 py-0.5 rounded bg-bg-secondary border border-border">Desktop</span>
          <span class="sm:hidden px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">Mobile</span>
        </div>
      </div>

      <div class="border-2 border-dashed border-border rounded-lg overflow-hidden bg-bg-card min-h-[400px]">
        {/* Top slot - full width on all screens */}
        <Show when={slotHasElements('top')}>
          <div class="border-b border-border p-2 bg-bg-secondary/50">
            <div class="text-[7px] text-text-muted mb-1 uppercase tracking-wider opacity-60">Header Area</div>
            <For each={getSectionsInSlot('top')}>
              {(section) => renderSection(section, true)}
            </For>
          </div>
        </Show>

        {/* Middle area - responsive layout */}
        <Show when={hasMiddleArea()}>
          {/* Desktop: flex row | Mobile: flex column (sidebars above main) */}
          <div class="flex flex-col sm:flex-row min-h-[250px]">
            {/* Left Sidebar */}
            <Show when={hasLeftSidebar()}>
              <div class="w-full sm:w-1/4 border-b sm:border-b-0 sm:border-r border-border p-2 bg-bg-secondary/30">
                <div class="text-[7px] text-text-muted mb-1 uppercase tracking-wider opacity-60">
                  Left Sidebar <span class="sm:hidden">(mobile: above)</span>
                </div>
                <For each={getSectionsInSlot('sidebar-left')}>
                  {(section) => renderSection(section, true)}
                </For>
              </div>
            </Show>

            {/* Right Sidebar - on mobile appears after left sidebar, on desktop is on right */}
            <Show when={hasRightSidebar()}>
              <div class="w-full sm:w-1/4 border-b sm:border-b-0 sm:border-l border-border p-2 bg-bg-secondary/30 order-none sm:order-last">
                <div class="text-[7px] text-text-muted mb-1 uppercase tracking-wider opacity-60">
                  Right Sidebar <span class="sm:hidden">(mobile: above)</span>
                </div>
                <For each={getSectionsInSlot('sidebar-right')}>
                  {(section) => renderSection(section, true)}
                </For>
              </div>
            </Show>

            {/* Main Content - always in center, on mobile appears last */}
            <Show when={hasMain()}>
              <div class="flex-1 p-2 order-last sm:order-none">
                <div class="text-[7px] text-text-muted mb-1 uppercase tracking-wider opacity-60 sm:hidden">Main Content</div>
                <For each={getSectionsInSlot('main')}>
                  {(section) => renderSection(section, false)}
                </For>
              </div>
            </Show>
          </div>
        </Show>

        {/* Bottom slot - full width on all screens */}
        <Show when={slotHasElements('bottom')}>
          <div class="border-t border-border p-2 bg-bg-secondary/50">
            <div class="text-[7px] text-text-muted mb-1 uppercase tracking-wider opacity-60">Footer Area</div>
            <For each={getSectionsInSlot('bottom')}>
              {(section) => renderSection(section, true)}
            </For>
          </div>
        </Show>
      </div>

      {/* Responsive behavior info */}
      <div class="mt-3 p-2 bg-bg-secondary/50 rounded-lg border border-border">
        <p class="text-[9px] text-text-muted">
          <span class="font-medium text-text">Mobile behavior:</span> Both sidebars stack above the main content. Main content always appears last on mobile screens.
        </p>
      </div>
    </div>
  )
}

// ============================================
// Mock Preview Components
// ============================================

function MockHeader(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1.5' : 'p-2'}`}>
      <div class={`font-bold text-text ${props.compact ? 'text-xs' : 'text-sm'}`}>Hive Blog</div>
      <div class={`text-text-muted ${props.compact ? 'text-[8px]' : 'text-[10px]'}`}>Posts from Hive blockchain</div>
    </div>
  )
}

function MockAuthorProfile(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1.5' : 'p-2'}`}>
      <div class="flex items-center gap-2">
        <div class={`rounded-full bg-primary/30 flex-shrink-0 ${props.compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
        <div class="min-w-0 flex-1">
          <div class={`font-semibold text-text truncate ${props.compact ? 'text-[9px]' : 'text-xs'}`}>@username</div>
          <div class={`text-text-muted ${props.compact ? 'text-[7px]' : 'text-[9px]'}`}>Rep: 72 | Posts: 245</div>
        </div>
      </div>
      <Show when={!props.compact}>
        <div class="mt-2 flex gap-2 text-[8px]">
          <span class="text-text-muted">Followers: 1.2K</span>
          <span class="text-text-muted">Following: 350</span>
        </div>
      </Show>
    </div>
  )
}

function MockPosts(props: { compact?: boolean }) {
  const postCount = props.compact ? 2 : 3
  return (
    <div class="space-y-1">
      <For each={Array(postCount).fill(0)}>
        {(_, i) => (
          <div class={`bg-bg-card rounded border border-border flex gap-2 ${props.compact ? 'p-1' : 'p-1.5'}`}>
            <div class={`rounded bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 ${props.compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
            <div class="min-w-0 flex-1">
              <div class={`font-medium text-text line-clamp-1 ${props.compact ? 'text-[8px]' : 'text-[10px]'}`}>
                {i() === 0 ? 'Introduction to Hive Blockchain' : i() === 1 ? 'My Journey in Crypto World' : 'Tips for New Users'}
              </div>
              <div class={`text-text-muted line-clamp-1 ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>
                Lorem ipsum dolor sit amet consectetur...
              </div>
              <div class={`flex gap-2 text-text-muted mt-0.5 ${props.compact ? 'text-[5px]' : 'text-[7px]'}`}>
                <span>$12.50</span>
                <span>45 votes</span>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

function MockComments(props: { compact?: boolean }) {
  return (
    <div class="space-y-1">
      <For each={[0, 1]}>
        {(i) => (
          <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1' : 'p-1.5'}`}>
            <div class="flex items-center gap-1 mb-0.5">
              <div class={`rounded-full bg-accent/30 ${props.compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span class={`text-text font-medium ${props.compact ? 'text-[7px]' : 'text-[9px]'}`}>@user{i + 1}</span>
            </div>
            <div class={`text-text-muted line-clamp-2 ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>
              {i === 0 ? 'Great post! Thanks for sharing this.' : 'I agree with your points here.'}
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

function MockNavigation(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1' : 'p-1.5'}`}>
      <div class={`flex gap-2 ${props.compact ? 'text-[7px]' : 'text-[9px]'}`}>
        <span class="text-primary font-medium">Home</span>
        <span class="text-text-muted">Blog</span>
        <span class="text-text-muted">About</span>
        <span class="text-text-muted">Contact</span>
      </div>
    </div>
  )
}

function MockSearch(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1' : 'p-1.5'}`}>
      <div class={`flex items-center gap-1 bg-bg rounded border border-border px-1 ${props.compact ? 'py-0.5' : 'py-1'}`}>
        <SearchIcon class={`text-text-muted ${props.compact ? 'w-2 h-2' : 'w-3 h-3'}`} />
        <span class={`text-text-muted ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>Search posts...</span>
      </div>
    </div>
  )
}

function MockTags(props: { compact?: boolean }) {
  const tags = ['hive', 'crypto', 'blog', 'technology', 'life']
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1' : 'p-1.5'}`}>
      <div class={`text-text-muted mb-1 ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>Tags</div>
      <div class="flex flex-wrap gap-0.5">
        <For each={tags.slice(0, props.compact ? 3 : 5)}>
          {(tag) => (
            <span class={`bg-primary/20 text-primary rounded px-1 ${props.compact ? 'text-[5px]' : 'text-[7px]'}`}>
              #{tag}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

function MockRecentPosts(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1' : 'p-1.5'}`}>
      <div class={`text-text-muted mb-1 ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>Recent Posts</div>
      <div class="space-y-0.5">
        <For each={['First Post Title', 'Second Post', 'Third Post']}>
          {(title) => (
            <div class={`text-text truncate ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>• {title}</div>
          )}
        </For>
      </div>
    </div>
  )
}

function MockFooter(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border text-center ${props.compact ? 'p-1' : 'p-2'}`}>
      <div class={`text-text-muted ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>
        © 2024 Hive Blog | Powered by Hive Blockchain
      </div>
    </div>
  )
}

// ============================================
// Icons
// ============================================

function PlusIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function XIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function ChevronUpIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
    </svg>
  )
}

function ChevronDownIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function ChevronLeftIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function HorizontalIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16" />
    </svg>
  )
}

function VerticalIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16" />
    </svg>
  )
}

function SearchIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function EyeIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
