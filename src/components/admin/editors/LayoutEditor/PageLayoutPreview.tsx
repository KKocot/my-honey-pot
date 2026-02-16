// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from 'solid-js'
import { settings } from '../../store'
import {
  pageElementLabels,
  getPageElementColor,
  type PageLayoutSection,
  type PageSlotPosition,
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
// Page Layout Preview with Mock Content
// ============================================

export function PageLayoutPreview() {
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
      case 'navigation':
        return <MockNavigation compact={isCompact} />
      case 'authorProfile':
        return <MockAuthorProfile compact={isCompact} />
      case 'communityProfile':
        return <MockCommunityProfile compact={isCompact} />
      case 'communitySidebar':
        return <MockCommunitySidebar compact={isCompact} />
      case 'posts':
        return <MockPosts compact={isCompact} />
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

  // Reusable preview content renderer
  const renderPreviewContent = (isMobile: boolean) => (
    <>
      {/* Top slot - full width */}
      <Show when={slotHasElements('top')}>
        <div class="border-b border-border p-1.5 bg-bg-secondary/50">
          <div class="text-[6px] text-text-muted mb-0.5 uppercase tracking-wider opacity-60">Header</div>
          <For each={getSectionsInSlot('top')}>
            {(section) => renderSection(section, true)}
          </For>
        </div>
      </Show>

      {/* Middle area */}
      <Show when={hasMiddleArea()}>
        <div class={isMobile ? 'flex flex-col min-h-[150px]' : 'flex flex-row min-h-[200px]'}>
          {/* Left Sidebar */}
          <Show when={hasLeftSidebar()}>
            <div class={`${isMobile ? 'w-full border-b' : 'w-1/4 border-r'} border-border p-1.5 bg-bg-secondary/30`}>
              <div class="text-[6px] text-text-muted mb-0.5 uppercase tracking-wider opacity-60">
                Left Sidebar
              </div>
              <For each={getSectionsInSlot('sidebar-left')}>
                {(section) => renderSection(section, true)}
              </For>
            </div>
          </Show>

          {/* Right Sidebar - on mobile appears after left sidebar, on desktop is on right */}
          <Show when={hasRightSidebar()}>
            <div class={`${isMobile ? 'w-full border-b' : 'w-1/4 border-l order-last'} border-border p-1.5 bg-bg-secondary/30`}>
              <div class="text-[6px] text-text-muted mb-0.5 uppercase tracking-wider opacity-60">
                Right Sidebar
              </div>
              <For each={getSectionsInSlot('sidebar-right')}>
                {(section) => renderSection(section, true)}
              </For>
            </div>
          </Show>

          {/* Main Content */}
          <Show when={hasMain()}>
            <div class={`flex-1 p-1.5 ${isMobile ? 'order-last' : ''}`}>
              <For each={getSectionsInSlot('main')}>
                {(section) => renderSection(section, true)}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      {/* Bottom slot */}
      <Show when={slotHasElements('bottom')}>
        <div class="border-t border-border p-1.5 bg-bg-secondary/50">
          <div class="text-[6px] text-text-muted mb-0.5 uppercase tracking-wider opacity-60">Footer</div>
          <For each={getSectionsInSlot('bottom')}>
            {(section) => renderSection(section, true)}
          </For>
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
          {renderPreviewContent(false)}
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
          {renderPreviewContent(true)}
        </div>
      </div>

      {/* Responsive behavior info */}
      <div class="mt-3 p-2 bg-bg-secondary/50 rounded-lg border border-border">
        <p class="text-[9px] text-text-muted">
          <span class="font-medium text-text">Mobile behavior:</span> Both sidebars stack above the main content.
        </p>
      </div>
    </div>
  )
}
