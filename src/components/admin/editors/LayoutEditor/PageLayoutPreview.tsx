// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from 'solid-js'
import { settings } from '../../store'
import {
  type LayoutElementId,
  hasLeftSidebar,
  hasRightSidebar,
  getActiveContainerElements,
  pageElementLabels,
} from '../../types/index'
import {
  MockHeader,
  MockAuthorProfile,
  MockPosts,
  MockNavigation,
  MockFooter,
  MockCommunityProfile,
  MockCommunitySidebar,
} from './MockComponents'

// ============================================
// Page Layout Preview (container-based v3)
// ============================================

/** Map container element ID to its mock component */
function renderContainerElement(elementId: LayoutElementId, compact: boolean) {
  switch (elementId) {
    case 'header':
      return <MockHeader compact={compact} />
    case 'authorProfile':
      return <MockAuthorProfile compact={compact} />
    case 'communityProfile':
      return <MockCommunityProfile compact={compact} />
    case 'communitySidebar':
      return <MockCommunitySidebar compact={compact} />
    case 'footer':
      return <MockFooter compact={compact} />
    default:
      return (
        <div class="px-2 py-1 rounded text-xs font-medium bg-bg-secondary text-text-muted">
          {pageElementLabels[elementId] || elementId}
        </div>
      )
  }
}

export function PageLayoutPreview() {
  const cfg = () => settings.pageLayoutConfig

  // Derive active elements per container
  const topElements = () => getActiveContainerElements(cfg().containers.top)
  const leftElements = () =>
    hasLeftSidebar(cfg().template)
      ? getActiveContainerElements(cfg().containers.sidebarLeft)
      : []
  const rightElements = () =>
    hasRightSidebar(cfg().template)
      ? getActiveContainerElements(cfg().containers.sidebarRight)
      : []
  const bottomElements = () => getActiveContainerElements(cfg().containers.bottom)

  const showTop = () => topElements().length > 0
  const showLeftSidebar = () => leftElements().length > 0
  const showRightSidebar = () => rightElements().length > 0
  const showBottom = () => bottomElements().length > 0

  /** Render elements horizontally (for top/bottom containers) */
  const renderHorizontalContainer = (elements: LayoutElementId[], label: string) => (
    <div>
      <div class="text-[6px] text-text-muted mb-0.5 uppercase tracking-wider opacity-60">
        {label}
      </div>
      <div class="flex flex-row gap-1 flex-wrap">
        <For each={elements}>{(id) => renderContainerElement(id, true)}</For>
      </div>
    </div>
  )

  /** Render elements vertically (for sidebar containers) */
  const renderVerticalContainer = (elements: LayoutElementId[], label: string) => (
    <div>
      <div class="text-[6px] text-text-muted mb-0.5 uppercase tracking-wider opacity-60">
        {label}
      </div>
      <div class="flex flex-col gap-1">
        <For each={elements}>{(id) => renderContainerElement(id, true)}</For>
      </div>
    </div>
  )

  // Desktop preview layout
  const renderDesktop = () => (
    <>
      {/* Top container - full width, horizontal */}
      <Show when={showTop()}>
        <div class="border-b border-border p-1.5 bg-bg-secondary/50">
          {renderHorizontalContainer(topElements(), 'Top')}
        </div>
      </Show>

      {/* Middle area: sidebars + main */}
      <div class="flex flex-row min-h-[200px]">
        {/* Left Sidebar */}
        <Show when={showLeftSidebar()}>
          <div class="w-1/4 border-r border-border p-1.5 bg-bg-secondary/30">
            {renderVerticalContainer(leftElements(), 'Left Sidebar')}
          </div>
        </Show>

        {/* Main Content - always rendered */}
        <div class="flex-1 p-1.5">
          <div class="flex flex-col gap-1">
            <MockNavigation compact />
            <MockPosts compact />
          </div>
        </div>

        {/* Right Sidebar */}
        <Show when={showRightSidebar()}>
          <div class="w-1/4 border-l border-border p-1.5 bg-bg-secondary/30">
            {renderVerticalContainer(rightElements(), 'Right Sidebar')}
          </div>
        </Show>
      </div>

      {/* Bottom container - full width, horizontal */}
      <Show when={showBottom()}>
        <div class="border-t border-border p-1.5 bg-bg-secondary/50">
          {renderHorizontalContainer(bottomElements(), 'Bottom')}
        </div>
      </Show>
    </>
  )

  // Mobile preview layout - sidebars stack above main
  const renderMobile = () => (
    <>
      {/* Top container */}
      <Show when={showTop()}>
        <div class="border-b border-border p-1.5 bg-bg-secondary/50">
          {renderHorizontalContainer(topElements(), 'Top')}
        </div>
      </Show>

      {/* Left Sidebar stacked */}
      <Show when={showLeftSidebar()}>
        <div class="border-b border-border p-1.5 bg-bg-secondary/30">
          {renderVerticalContainer(leftElements(), 'Left Sidebar')}
        </div>
      </Show>

      {/* Right Sidebar stacked */}
      <Show when={showRightSidebar()}>
        <div class="border-b border-border p-1.5 bg-bg-secondary/30">
          {renderVerticalContainer(rightElements(), 'Right Sidebar')}
        </div>
      </Show>

      {/* Main Content */}
      <div class="p-1.5">
        <div class="flex flex-col gap-1">
          <MockNavigation compact />
          <MockPosts compact />
        </div>
      </div>

      {/* Bottom container */}
      <Show when={showBottom()}>
        <div class="border-t border-border p-1.5 bg-bg-secondary/50">
          {renderHorizontalContainer(bottomElements(), 'Bottom')}
        </div>
      </Show>
    </>
  )

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted uppercase tracking-wide mb-3">Preview (scaled)</p>

      {/* Desktop Preview */}
      <div class="mb-4">
        <div class="flex items-center justify-center mb-2">
          <span class="px-2 py-0.5 text-[9px] rounded bg-bg-secondary border border-border text-text-muted">
            Desktop
          </span>
        </div>
        <div class="border-2 border-dashed border-border rounded-lg overflow-hidden bg-bg-card min-h-[200px]">
          {renderDesktop()}
        </div>
      </div>

      {/* Mobile Preview */}
      <div>
        <div class="flex items-center justify-center mb-2">
          <span class="px-2 py-0.5 text-[9px] rounded bg-primary/20 text-primary border border-primary/30">
            Mobile
          </span>
        </div>
        <div class="border-2 border-dashed border-border rounded-lg overflow-hidden bg-bg-card min-h-[200px] max-w-[200px] mx-auto">
          {renderMobile()}
        </div>
      </div>

      {/* Responsive behavior info */}
      <div class="mt-3 p-2 bg-bg-secondary/50 rounded-lg border border-border">
        <p class="text-[9px] text-text-muted">
          <span class="font-medium text-text">Mobile behavior:</span> Sidebars stack above the main content. Top and bottom containers span full width.
        </p>
      </div>
    </div>
  )
}
