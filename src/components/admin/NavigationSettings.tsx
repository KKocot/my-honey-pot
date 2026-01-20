import { For, Show, createSignal } from 'solid-js'
import { settings, updateSettings } from './store'
import { Input } from '../ui'
import type { NavigationTab, SocialPlatform } from './types'
import { SocialIntegrationConfig, PlatformIcon } from './SocialIntegrationConfig'
import { platformInfos } from './types'

// ============================================
// Navigation Tabs Settings Section
// ============================================

// Social platform IDs that support integration
const SOCIAL_PLATFORM_IDS: SocialPlatform[] = ['instagram', 'x', 'youtube', 'tiktok', 'threads', 'facebook']

// Check if a tab ID corresponds to a social platform
const isSocialPlatform = (tabId: string): tabId is SocialPlatform => {
  return SOCIAL_PLATFORM_IDS.includes(tabId as SocialPlatform)
}

export function NavigationSettings() {
  // Track which tab's config is expanded
  const [expandedTab, setExpandedTab] = createSignal<string | null>(null)

  // Update a specific tab
  const updateTab = (tabId: string, updates: Partial<NavigationTab>) => {
    const newTabs = settings.navigationTabs.map((tab) =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    )
    updateSettings({ navigationTabs: newTabs })
  }

  // Toggle expand/collapse for a tab's config
  const toggleExpand = (tabId: string) => {
    setExpandedTab(expandedTab() === tabId ? null : tabId)
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
      external: false,
    }
    updateSettings({ navigationTabs: [...settings.navigationTabs, newTab] })
  }

  // Built-in tab IDs that cannot be removed
  const BUILT_IN_TAB_IDS = ['posts', 'threads', 'comments', 'instagram', 'x', 'youtube', 'tiktok', 'facebook']

  // Remove tab (only custom tabs)
  const removeTab = (tabId: string) => {
    if (BUILT_IN_TAB_IDS.includes(tabId)) return // Can't remove built-in tabs
    updateSettings({ navigationTabs: settings.navigationTabs.filter((t) => t.id !== tabId) })
  }

  // Check if tab is built-in
  const isBuiltIn = (tabId: string) => {
    return BUILT_IN_TAB_IDS.includes(tabId)
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
                      class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />

                    {/* Social platform icon */}
                    <Show when={isSocialPlatform(tab.id)}>
                      <div
                        class="p-1.5 rounded"
                        style={{ background: `${platformInfos[tab.id as SocialPlatform].color}20` }}
                      >
                        <PlatformIcon
                          platform={tab.id as SocialPlatform}
                          class="w-4 h-4"
                          style={{ color: platformInfos[tab.id as SocialPlatform].color }}
                        />
                      </div>
                    </Show>

                    {/* Tab info */}
                    <div class="flex-1 min-w-0">
                      <Show
                        when={!isBuiltIn(tab.id)}
                        fallback={
                          <div class="flex items-center gap-2">
                            <span class={`font-medium ${tab.enabled ? 'text-text' : 'text-text-muted'}`}>
                              {tab.label}
                            </span>
                            <Show when={!isSocialPlatform(tab.id)}>
                              <span class="text-[10px] px-1.5 py-0.5 bg-bg-secondary text-text-muted rounded">
                                Built-in
                              </span>
                            </Show>
                            <Show when={isSocialPlatform(tab.id) && tab.integration}>
                              <span class="text-[10px] px-1.5 py-0.5 bg-success/20 text-success rounded">
                                Configured
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

                    {/* Show count toggle (for posts/comments) */}
                    <Show when={tab.id === 'posts' || tab.id === 'comments'}>
                      <label class="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tab.showCount}
                          onChange={(e) => updateTab(tab.id, { showCount: e.currentTarget.checked })}
                          class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        Count
                      </label>
                    </Show>

                    {/* Configure button for social platforms */}
                    <Show when={isSocialPlatform(tab.id)}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(tab.id)}
                        class={`
                          flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors
                          ${expandedTab() === tab.id
                            ? 'bg-primary text-primary-text'
                            : 'bg-bg-secondary text-text-muted hover:text-text hover:bg-bg-secondary/80'
                          }
                        `}
                        title="Configure integration"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {expandedTab() === tab.id ? 'Close' : 'Configure'}
                      </button>
                    </Show>

                    {/* External link for custom tabs */}
                    <Show when={!isBuiltIn(tab.id)}>
                      <label class="flex items-center gap-1 text-xs text-text-muted whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tab.external || false}
                          onChange={(e) => updateTab(tab.id, { external: e.currentTarget.checked })}
                          class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        External
                      </label>
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

                  {/* Expanded integration config */}
                  <Show when={isSocialPlatform(tab.id) && expandedTab() === tab.id}>
                    <SocialIntegrationConfig
                      platform={tab.id as SocialPlatform}
                      tabId={tab.id}
                    />
                  </Show>
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

          {/* Info about social integrations */}
          <div class="pt-4 border-t border-border">
            <div class="flex items-start gap-2 p-3 bg-info/10 rounded-lg border border-info/20">
              <svg class="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-info font-medium">Social Media Integrations</p>
                <p class="text-xs text-text-muted mt-1">
                  Click <strong>Configure</strong> on Instagram, X, YouTube, TikTok, Threads or Facebook tabs to set up API integration and display your posts from these platforms.
                </p>
              </div>
            </div>
          </div>
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
                          <Show when={tab.showCount && (tab.id === 'posts' || tab.id === 'comments')}>
                            <span
                              class={`
                                text-[10px] px-1 py-0.5 rounded-full
                                ${isFirst() ? 'bg-primary/10 text-primary' : 'bg-bg-secondary text-text-muted'}
                              `}
                            >
                              {tab.id === 'posts' ? '42' : '128'}
                            </span>
                          </Show>
                          <Show when={tab.external}>
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
