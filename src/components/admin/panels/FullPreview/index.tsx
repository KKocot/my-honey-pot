import { Show, For, createMemo, createSignal, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'
import { settings } from '../../store'
import { useHivePreviewQuery } from '../../queries'
import { SectionRenderer } from './SectionRenderer'

// ============================================
// Full Preview Dialog Component
// Shows live preview with real Hive data
// ============================================

interface FullPreviewProps {
  open: Accessor<boolean>
  onClose: () => void
}

export function FullPreview(props: FullPreviewProps) {
  // Active tab state for navigation routing
  const [activeTab, setActiveTab] = createSignal('posts')

  // Use TanStack Query for data fetching with caching
  const hiveQuery = useHivePreviewQuery(
    () => settings.hiveUsername,
    () => settings.postsPerPage || 20,
    props.open
  )

  // Derive data and loading state from query
  const data = () => hiveQuery.data ?? null
  const loading = () => hiveQuery.isLoading

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  // Reactive memos for each slot - these track changes to settings.pageLayout
  const topSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'top' && s.active !== false && s.elements.length > 0)
  })

  const mainSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'main' && s.active !== false && s.elements.length > 0)
  })

  const bottomSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'bottom' && s.active !== false && s.elements.length > 0)
  })

  const leftSidebarSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'sidebar-left' && s.active !== false && s.elements.length > 0)
  })

  const rightSidebarSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'sidebar-right' && s.active !== false && s.elements.length > 0)
  })

  const hasLeftSidebar = createMemo(() => leftSidebarSections().length > 0)
  const hasRightSidebar = createMemo(() => rightSidebarSections().length > 0)

  return (
    <Show when={props.open()}>
      <Portal>
        {/* Full screen backdrop */}
        <div
          class="fixed inset-0 z-50 bg-bg overflow-auto"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={props.onClose}
            class="fixed top-4 right-4 z-50 p-2 rounded-lg bg-bg-card border border-border shadow-lg
              text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Preview info badge */}
          <div class="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-primary text-primary-text text-sm font-medium shadow-lg">
            Preview Mode - @{settings.hiveUsername || 'no user'}
          </div>

          {/* Loading state */}
          <Show when={loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="flex items-center gap-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span class="text-text-muted">Loading preview data...</span>
              </div>
            </div>
          </Show>

          {/* No username */}
          <Show when={!settings.hiveUsername && !loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <p class="text-text text-lg">No Hive username configured</p>
                <p class="text-text-muted mt-1">Enter a username in User Switcher to see preview</p>
              </div>
            </div>
          </Show>

          {/* Error/No data state */}
          <Show when={settings.hiveUsername && !data() && !loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <p class="text-text text-lg">Failed to load data for @{settings.hiveUsername}</p>
                <p class="text-text-muted mt-1">Check if the username exists or try again later</p>
              </div>
            </div>
          </Show>

          {/* Main content */}
          <Show when={data() && !loading()}>
            <div class="max-w-7xl mx-auto px-4 py-16">
              {/* Top slot - full width on all screens */}
              <For each={topSections()}>
                {(section) => (
                  <div class="mb-6">
                    <SectionRenderer
                      section={section}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      data={data}
                    />
                  </div>
                )}
              </For>

              {/* Main area with optional sidebars - responsive layout */}
              <Show when={hasLeftSidebar() || hasRightSidebar()}>
                {/* Uses sidebar-layout CSS class from global.css */}
                <div class="sidebar-layout">
                  {/* Left Sidebar */}
                  <Show when={hasLeftSidebar()}>
                    <aside
                      class="sidebar-left"
                      style={`--sidebar-width: ${settings.sidebarWidthPx || 280}px;`}
                    >
                      <For each={leftSidebarSections()}>
                        {(section) => (
                          <div class="mb-4">
                            <SectionRenderer
                              section={section}
                              inSidebar={true}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              data={data}
                            />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Right Sidebar */}
                  <Show when={hasRightSidebar()}>
                    <aside
                      class="sidebar-right"
                      style={`--sidebar-width: ${settings.sidebarWidthPx || 280}px;`}
                    >
                      <For each={rightSidebarSections()}>
                        {(section) => (
                          <div class="mb-4">
                            <SectionRenderer
                              section={section}
                              inSidebar={true}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              data={data}
                            />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Main Content */}
                  <main class="main-content">
                    <For each={mainSections()}>
                      {(section) => (
                        <div class="mb-6">
                          <SectionRenderer
                            section={section}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            data={data}
                          />
                        </div>
                      )}
                    </For>
                  </main>
                </div>
              </Show>

              {/* No sidebars - render main directly */}
              <Show when={!hasLeftSidebar() && !hasRightSidebar()}>
                <For each={mainSections()}>
                  {(section) => (
                    <div class="mb-6">
                      <SectionRenderer
                        section={section}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        data={data}
                      />
                    </div>
                  )}
                </For>
              </Show>

              {/* Bottom slot - full width on all screens */}
              <For each={bottomSections()}>
                {(section) => (
                  <div class="mt-6">
                    <SectionRenderer
                      section={section}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      data={data}
                    />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Portal>
    </Show>
  )
}
