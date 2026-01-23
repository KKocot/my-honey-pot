import { For, Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { Input } from '../ui'
import type { NavigationTab } from './types'

// ============================================
// Navigation Tabs Settings Section
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

  // Add custom tab
  const addCustomTab = () => {
    const newTab: NavigationTab = {
      id: `custom-${Date.now()}`,
      label: 'New Tab',
      enabled: true,
      showCount: false,
      href: '',
    }
    updateSettings({ navigationTabs: [...settings.navigationTabs, newTab] })
  }

  // Built-in tab IDs that cannot be removed
  const BUILT_IN_TAB_IDS = ['posts', 'threads', 'comments']

  // Remove tab (only custom tabs)
  const removeTab = (tabId: string) => {
    if (BUILT_IN_TAB_IDS.includes(tabId)) return // Can't remove built-in tabs
    updateSettings({ navigationTabs: settings.navigationTabs.filter((t) => t.id !== tabId) })
  }

  // Check if tab is built-in
  const isBuiltIn = (tabId: string) => {
    return BUILT_IN_TAB_IDS.includes(tabId)
  }

  // Check if URL is external (starts with http:// or https://)
  const isExternalUrl = (url: string | undefined) => {
    if (!url) return false
    return url.startsWith('http://') || url.startsWith('https://')
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
                <div class="bg-bg rounded-lg border border-border overflow-hidden">
                  <div class="flex items-center gap-2 p-3">
                    {/* Reorder buttons */}
                    <div class="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveTabUp(index())}
                        disabled={index() === 0}
                        class="p-0.5 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTabDown(index())}
                        disabled={index() === settings.navigationTabs.length - 1}
                        class="p-0.5 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Enable toggle */}
                    <input
                      type="checkbox"
                      checked={tab.enabled}
                      onChange={(e) => updateTab(tab.id, { enabled: e.currentTarget.checked })}
                      disabled={tab.id === 'threads'}
                      class={`w-4 h-4 rounded border-border text-primary focus:ring-primary ${tab.id === 'threads' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    />

                    {/* Tab info */}
                    <div class="flex-1 min-w-0">
                      <Show
                        when={!isBuiltIn(tab.id)}
                        fallback={
                          <div class="flex items-center gap-2">
                            <span class={`font-medium ${tab.enabled ? 'text-text' : 'text-text-muted'}`}>
                              {tab.label}
                            </span>
                            <Show when={tab.id === 'threads'}>
                              <span class="text-[10px] px-1.5 py-0.5 bg-warning/20 text-warning rounded">
                                Work in Progress
                              </span>
                            </Show>
                          </div>
                        }
                      >
                        <Input
                          value={tab.label}
                          placeholder="Tab label"
                          onInput={(e) => updateTab(tab.id, { label: e.currentTarget.value })}
                        />
                      </Show>
                    </div>


                    {/* URL input for custom tabs */}
                    <Show when={!isBuiltIn(tab.id)}>
                      <div class="flex items-center gap-1">
                        <Input
                          value={tab.href || ''}
                          placeholder="URL"
                          onInput={(e) => updateTab(tab.id, { href: e.currentTarget.value })}
                          class="w-32 text-xs"
                        />
                        <Show when={isExternalUrl(tab.href)}>
                          <svg class="w-3.5 h-3.5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="External link">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Show>
                      </div>
                    </Show>

                    {/* Remove button (custom tabs only) */}
                    <Show when={!isBuiltIn(tab.id)}>
                      <button
                        type="button"
                        onClick={() => removeTab(tab.id)}
                        class="p-1 text-error hover:bg-error/10 rounded"
                        title="Remove tab"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </Show>
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* Add custom tab button */}
          <button
            type="button"
            onClick={addCustomTab}
            class="w-full flex items-center justify-center gap-2 p-2 text-sm text-primary border-2 border-dashed border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Tab
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
                          <Show when={isExternalUrl(tab.href)}>
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
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
