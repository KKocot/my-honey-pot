// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For, createMemo, createSignal, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'
import { settings } from '../../store'
import { useHivePreviewQuery } from '../../queries'
import { get_section_wrapper_class } from '../../../../shared/components/page-layout'
import { SectionRenderer } from '../../../../shared/components/solid/SectionRenderer'
import { hasLeftSidebar, hasRightSidebar, pageLayoutConfigToLegacy } from '../../types/index'

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

  // Fetch profile + blog posts
  const hiveQuery = useHivePreviewQuery(
    () => settings.hiveUsername,
    () => settings.postsPerPage || 20,
    () => props.open()
  )

  // Data accessors
  const data = () => hiveQuery.data ?? null
  const loading = () => hiveQuery.isLoading
  const has_data = () => !!data()

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  // Convert template config to legacy sections for SectionRenderer compatibility
  const legacySections = createMemo(() => {
    const config = settings.pageLayoutConfig
    if (!config) return { top: [], main: [], bottom: [], left: [], right: [] }
    const legacy = pageLayoutConfigToLegacy(config)
    return {
      top: legacy.sections.filter(s => s.slot === 'top'),
      main: legacy.sections.filter(s => s.slot === 'main'),
      bottom: legacy.sections.filter(s => s.slot === 'bottom'),
      left: legacy.sections.filter(s => s.slot === 'sidebar-left'),
      right: legacy.sections.filter(s => s.slot === 'sidebar-right'),
    }
  })

  const showLeftSidebar = createMemo(() => hasLeftSidebar(settings.pageLayoutConfig?.template || 'no-sidebar'))
  const showRightSidebar = createMemo(() => hasRightSidebar(settings.pageLayoutConfig?.template || 'no-sidebar'))

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
          <Show when={settings.hiveUsername && !has_data() && !loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <p class="text-text text-lg">Failed to load data for @{settings.hiveUsername}</p>
                <p class="text-text-muted mt-1">Check if the username exists or try again later</p>
              </div>
            </div>
          </Show>

          {/* Main content */}
          <Show when={has_data() && !loading()}>
            <div class="max-w-7xl mx-auto px-4 py-16">
              {/* Top slot - full width on all screens */}
              <For each={legacySections().top}>
                {(section) => (
                  <div class={get_section_wrapper_class('top')}>
                    <SectionRenderer
                      section={section}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      data={data}
                      community_title={undefined}
                      community_posts={undefined}
                      community={null}
                    />
                  </div>
                )}
              </For>

              {/* Main area with optional sidebars - responsive layout */}
              <Show when={showLeftSidebar() || showRightSidebar()}>
                {/* Uses sidebar-layout CSS class from global.css */}
                <div class="sidebar-layout">
                  {/* Left Sidebar */}
                  <Show when={showLeftSidebar()}>
                    <aside
                      class="sidebar-left"
                      style="--sidebar-width: 280px;"
                    >
                      <For each={legacySections().left}>
                        {(section) => (
                          <div class={get_section_wrapper_class('sidebar-left')}>
                            <SectionRenderer
                              section={section}
                              inSidebar={true}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              data={data}
                              community_title={community_title()}
                              community_posts={community_data()?.posts}
                              community={community_data()?.community ?? null}
                            />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Right Sidebar */}
                  <Show when={showRightSidebar()}>
                    <aside
                      class="sidebar-right"
                      style="--sidebar-width: 280px;"
                    >
                      <For each={legacySections().right}>
                        {(section) => (
                          <div class={get_section_wrapper_class('sidebar-right')}>
                            <SectionRenderer
                              section={section}
                              inSidebar={true}
                              activeTab={activeTab}
                              setActiveTab={setActiveTab}
                              data={data}
                              community_title={community_title()}
                              community_posts={community_data()?.posts}
                              community={community_data()?.community ?? null}
                            />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Main Content */}
                  <main class="main-content">
                    <For each={legacySections().main}>
                      {(section) => (
                        <div class={get_section_wrapper_class('main')}>
                          <SectionRenderer
                            section={section}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            data={data}
                            community_title={community_title()}
                            community_posts={community_data()?.posts}
                            community={community_data()?.community ?? null}
                          />
                        </div>
                      )}
                    </For>
                  </main>
                </div>
              </Show>

              {/* No sidebars - render main directly */}
              <Show when={!showLeftSidebar() && !showRightSidebar()}>
                <For each={legacySections().main}>
                  {(section) => (
                    <div class={get_section_wrapper_class('main')}>
                      <SectionRenderer
                        section={section}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        data={data}
                        community_title={community_title()}
                        community_posts={community_data()?.posts}
                        community={community_data()?.community ?? null}
                      />
                    </div>
                  )}
                </For>
              </Show>

              {/* Bottom slot - full width on all screens */}
              <For each={legacySections().bottom}>
                {(section) => (
                  <div class={get_section_wrapper_class('bottom')}>
                    <SectionRenderer
                      section={section}
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      data={data}
                      community_title={undefined}
                      community_posts={undefined}
                      community={null}
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
