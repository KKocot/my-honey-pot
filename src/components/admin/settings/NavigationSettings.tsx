// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from 'solid-js'
import { settings, updateSettings } from '../store'
import type { NavigationTab } from '../types/index'
import { TabItem } from './TabItem'

// ============================================
// Navigation Tabs Settings Section
// ============================================

// Built-in tab IDs that cannot be removed
const BUILT_IN_TAB_IDS = ['posts', 'threads', 'comments']

// Check if tab is a category tab (has tag defined)
const isCategoryTab = (tab: NavigationTab) => {
  return !BUILT_IN_TAB_IDS.includes(tab.id) && !!tab.tag
}

// ============================================
// Main Navigation Settings Component
// ============================================

export function NavigationSettings() {
  // Update a specific tab
  const updateTab = (tabId: string, updates: Partial<NavigationTab>) => {
    const newTabs = settings.navigationTabs.map((tab) =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    )
    updateSettings({ navigationTabs: newTabs })
  }

  // Move tab up in order
  const moveTabUp = (index: number) => {
    if (index <= 0) return
    const newTabs = [...settings.navigationTabs]
    ;[newTabs[index - 1], newTabs[index]] = [newTabs[index], newTabs[index - 1]]
    updateSettings({ navigationTabs: newTabs })
  }

  // Move tab down in order
  const moveTabDown = (index: number) => {
    if (index >= settings.navigationTabs.length - 1) return
    const newTabs = [...settings.navigationTabs]
    ;[newTabs[index], newTabs[index + 1]] = [newTabs[index + 1], newTabs[index]]
    updateSettings({ navigationTabs: newTabs })
  }

  // Add custom category tab
  const addCategoryTab = () => {
    const newTab: NavigationTab = {
      id: `category-${(crypto.randomUUID?.() ?? Date.now().toString()).slice(0, 8)}`,
      label: 'Category',
      enabled: true,
      showCount: false,
      tag: '',
    }
    updateSettings({ navigationTabs: [...settings.navigationTabs, newTab] })
  }

  // Remove tab (only custom tabs)
  const removeTab = (tabId: string) => {
    if (BUILT_IN_TAB_IDS.includes(tabId)) return
    updateSettings({ navigationTabs: settings.navigationTabs.filter((t) => t.id !== tabId) })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Navigation Tabs</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tab list editor */}
        <div class="space-y-4">
          <p class="text-sm text-text-muted mb-4">
            Configure which tabs appear in the navigation bar and their order.
          </p>

          {/* Tab list */}
          <div class="space-y-2">
            <For each={settings.navigationTabs}>
              {(tab, index) => (
                <TabItem
                  tab={tab}
                  index={index()}
                  totalCount={settings.navigationTabs.length}
                  onUpdate={updateTab}
                  onMoveUp={moveTabUp}
                  onMoveDown={moveTabDown}
                  onRemove={removeTab}
                />
              )}
            </For>
          </div>

          {/* Add category tab button */}
          <button
            type="button"
            onClick={addCategoryTab}
            class="w-full flex items-center justify-center gap-2 p-2 text-sm text-primary border-2 border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Category Tab
          </button>
        </div>

        {/* Preview */}
        <div class="bg-bg rounded-lg p-4 border border-border">
          <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

          <div class="border-2 border-dashed border-border rounded-lg overflow-hidden">
            <nav class="border-b border-border">
              <div class="flex flex-wrap">
                <For each={settings.navigationTabs.filter((t) => t.enabled)}>
                  {(tab, index) => {
                    const isFirst = () => index() === 0
                    return (
                      <div
                        class={`
                          relative px-3 py-2 text-xs font-medium transition-colors
                          ${isFirst() ? 'text-text' : 'text-text-muted'}
                        `}
                      >
                        <span class="flex items-center gap-1">
                          {tab.label}
                          <Show when={isCategoryTab(tab) && tab.tag}>
                            <span class="text-[9px] px-1 py-0.5 bg-primary/20 text-primary rounded">
                              #{tab.tag}
                            </span>
                          </Show>
                        </span>
                        <Show when={isFirst()}>
                          <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                        </Show>
                      </div>
                    )
                  }}
                </For>
              </div>
            </nav>
          </div>

          <p class="text-xs text-text-muted text-center mt-3">
            {settings.navigationTabs.filter((t) => t.enabled).length} tabs visible
          </p>
        </div>
      </div>
    </div>
  )
}
