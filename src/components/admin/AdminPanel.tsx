import { createEffect, createSignal, Show, For, onMount, onCleanup } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { Toast, showToast, Button } from '../ui'
import { HBAuthLogin, currentUser, isAuthenticated, login, logout, needsReauth, type AuthUser } from '../auth'
import { broadcastConfigToHive, getConfigUrlSync, loadConfigFromHive } from './hive-broadcast'
import { TemplateSelector } from './TemplateSelector'
import { UserSwitcher } from './UserSwitcher'
import { LayoutEditor } from './LayoutEditor'
import { SiteSettings } from './SiteSettings'
import { PostsLayoutSettings } from './PostsLayoutSettings'
import { CardAppearanceSettings } from './CardAppearanceSettings'
import { AuthorProfileSettings } from './AuthorProfileSettings'
import { CommentSettings } from './CommentSettings'
import { NavigationSettings } from './NavigationSettings'
import { FullPreview } from './FullPreview'
import type { SettingsData } from './types'
import {
  queryClient,
  queryKeys,
  useSettingsQuery,
  syncSettingsToStore,
  setCurrentUsername,
  getLastFetchError,
  settings,
  updateSettings,
  getSettingsSnapshot,
} from './queries'

// Track if user has made changes since last save
let hasUnsavedChanges = false

export function setHasUnsavedChanges(value: boolean) {
  hasUnsavedChanges = value
}

export function getHasUnsavedChanges() {
  return hasUnsavedChanges
}

interface AdminPanelContentProps {
  initialSettings?: SettingsData | null
  ownerUsername?: string
}

// ============================================
// Admin Panel Content (uses hooks)
// ============================================

function AdminPanelContent(props: AdminPanelContentProps) {
  const settingsQuery = useSettingsQuery()
  const [showPreview, setShowPreview] = createSignal(false)
  const [showLoginModal, setShowLoginModal] = createSignal(false)
  const [isBroadcasting, setIsBroadcasting] = createSignal(false)
  const [reauthSession, setReauthSession] = createSignal(needsReauth())
  const [showJsonPreview, setShowJsonPreview] = createSignal(false)
  const [jsonPreviewContent, setJsonPreviewContent] = createSignal('')
  const [jsonOldContent, setJsonOldContent] = createSignal<Record<string, unknown> | null>(null)
  const [jsonNewContent, setJsonNewContent] = createSignal<Record<string, unknown> | null>(null)
  const [jsonDiff, setJsonDiff] = createSignal<Array<{ key: string; oldValue: unknown; newValue: unknown; type: 'changed' | 'added' | 'removed' }>>([])
  const [diffViewMode, setDiffViewMode] = createSignal<'diff' | 'old' | 'new'>('diff')
  const [isLoadingDiff, setIsLoadingDiff] = createSignal(false)

  // Check if logged in user is the blog owner (can save changes)
  const isOwner = () => {
    const user = currentUser()
    if (!user || !props.ownerUsername) return false
    return user.username.toLowerCase() === props.ownerUsername.toLowerCase()
  }

  // Apply initial settings from SSR on mount (before query runs)
  onMount(() => {
    if (props.initialSettings) {
      // Ensure hiveUsername is set from ownerUsername if not in config
      const settingsWithUsername = {
        ...props.initialSettings,
        hiveUsername: props.initialSettings.hiveUsername || props.ownerUsername || '',
      }
      syncSettingsToStore(settingsWithUsername, true)
    } else if (props.ownerUsername) {
      // Even without initial settings, set the username for preview
      updateSettings({ hiveUsername: props.ownerUsername })
    }

    // Warn user about unsaved changes when leaving page
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        // Modern browsers require returnValue to be set
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  })

  // Sync query data to store when it changes
  createEffect(() => {
    const data = settingsQuery.data
    if (data) {
      // Pass fromServer=true to indicate data came from query (not default init)
      syncSettingsToStore(data, true)
    }
  })

  const handleLoginSuccess = async (user: AuthUser) => {
    login(user)
    setShowLoginModal(false)
    setReauthSession(null) // Clear reauth state
    showToast(`Welcome, @${user.username}!`, 'success')

    // Set username for Hive config loading and refetch settings
    setCurrentUsername(user.username)
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings })
  }

  const handleLogout = () => {
    logout()
    setCurrentUsername(null)
    showToast('Logged out successfully', 'success')
  }

  const handleSaveClick = () => {
    if (!isAuthenticated()) {
      setShowLoginModal(true)
      return
    }
    handleBroadcastToHive()
  }

  const handleBroadcastToHive = async () => {
    const user = currentUser()
    if (!user) {
      setShowLoginModal(true)
      return
    }

    setIsBroadcasting(true)
    try {
      // Use snapshot to ensure we get a plain object for JSON serialization
      const settingsToSave = getSettingsSnapshot()
      const result = await broadcastConfigToHive(settingsToSave, user.username, user.privateKey)
      if (result.success && result.permlink) {
        const action = result.isUpdate ? 'Updated' : 'Published'
        const url = getConfigUrlSync(user.username, result.permlink)
        showToast(`${action} config on Hive! View at: ${url}`, 'success')
        // Reset unsaved changes flag after successful save
        setHasUnsavedChanges(false)
      } else {
        showToast(`Failed: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    } finally {
      setIsBroadcasting(false)
    }
  }

  // Calculate diff between two objects
  const calculateDiff = (oldObj: Record<string, unknown>, newObj: Record<string, unknown>) => {
    const diff: Array<{ key: string; oldValue: unknown; newValue: unknown; type: 'changed' | 'added' | 'removed' }> = []
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])

    for (const key of allKeys) {
      const oldVal = oldObj[key]
      const newVal = newObj[key]
      const oldStr = JSON.stringify(oldVal)
      const newStr = JSON.stringify(newVal)

      if (oldStr !== newStr) {
        if (oldVal === undefined) {
          diff.push({ key, oldValue: undefined, newValue: newVal, type: 'added' })
        } else if (newVal === undefined) {
          diff.push({ key, oldValue: oldVal, newValue: undefined, type: 'removed' })
        } else {
          diff.push({ key, oldValue: oldVal, newValue: newVal, type: 'changed' })
        }
      }
    }

    return diff.sort((a, b) => a.key.localeCompare(b.key))
  }

  // Preview JSON without sending - with diff view (available for everyone)
  const handlePreviewJson = async () => {
    // Use owner username for loading config (works for non-logged users too)
    const username = props.ownerUsername
    if (!username) return

    setIsLoadingDiff(true)
    setShowJsonPreview(true)
    setDiffViewMode('diff')

    try {
      // Get current settings
      const newSettings = getSettingsSnapshot() as Record<string, unknown>
      setJsonNewContent(newSettings)
      setJsonPreviewContent(JSON.stringify(newSettings, null, 2))

      // Load old settings from Hive
      const oldSettings = await loadConfigFromHive(username) as Record<string, unknown> | null
      setJsonOldContent(oldSettings)

      // Calculate diff
      if (oldSettings) {
        const diff = calculateDiff(oldSettings, newSettings)
        setJsonDiff(diff)
      } else {
        // No old config - all fields are "added"
        const diff = Object.keys(newSettings).map(key => ({
          key,
          oldValue: undefined,
          newValue: newSettings[key],
          type: 'added' as const
        }))
        setJsonDiff(diff)
      }
    } catch (error) {
      console.error('Failed to load old config:', error)
      showToast('Failed to load old config from Hive', 'error')
    } finally {
      setIsLoadingDiff(false)
    }
  }

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      const content = diffViewMode() === 'old'
        ? JSON.stringify(jsonOldContent(), null, 2)
        : JSON.stringify(jsonNewContent(), null, 2)
      await navigator.clipboard.writeText(content || '')
      showToast('JSON copied to clipboard!', 'success')
    } catch {
      showToast('Failed to copy JSON', 'error')
    }
  }

  return (
    <>
      <Toast />
      <FullPreview open={showPreview} onClose={() => setShowPreview(false)} />

      {/* JSON Preview Modal - Dev only for barddev */}
      <Show when={showJsonPreview()}>
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowJsonPreview(false)}>
          <div class="bg-bg-card rounded-2xl border border-border p-6 max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-lg font-bold text-text">Config Preview</h2>
                  <p class="text-xs text-text-muted">Compare current settings with saved on Hive</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                {/* View mode tabs */}
                <div class="flex bg-bg rounded-lg p-1 border border-border">
                  <button
                    onClick={() => setDiffViewMode('diff')}
                    class={`px-3 py-1 text-xs rounded-md transition-colors ${diffViewMode() === 'diff' ? 'bg-primary text-primary-text' : 'text-text-muted hover:text-text'}`}
                  >
                    Changes ({jsonDiff().length})
                  </button>
                  <button
                    onClick={() => setDiffViewMode('old')}
                    class={`px-3 py-1 text-xs rounded-md transition-colors ${diffViewMode() === 'old' ? 'bg-error/20 text-error' : 'text-text-muted hover:text-text'}`}
                  >
                    Old (Hive)
                  </button>
                  <button
                    onClick={() => setDiffViewMode('new')}
                    class={`px-3 py-1 text-xs rounded-md transition-colors ${diffViewMode() === 'new' ? 'bg-success/20 text-success' : 'text-text-muted hover:text-text'}`}
                  >
                    New (Current)
                  </button>
                </div>
                <Show when={diffViewMode() !== 'diff'}>
                  <button
                    onClick={handleCopyJson}
                    class="px-3 py-1.5 text-sm bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                </Show>
                <button
                  onClick={() => setShowJsonPreview(false)}
                  class="text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg p-1.5 transition-colors"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Loading state */}
            <Show when={isLoadingDiff()}>
              <div class="flex-1 flex items-center justify-center">
                <div class="flex items-center gap-3 text-text-muted">
                  <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading config from Hive...</span>
                </div>
              </div>
            </Show>

            {/* Content based on view mode */}
            <Show when={!isLoadingDiff()}>
              {/* Diff view */}
              <Show when={diffViewMode() === 'diff'}>
                <div class="flex-1 overflow-auto bg-bg rounded-lg border border-border">
                  <Show when={jsonDiff().length === 0}>
                    <div class="p-8 text-center text-text-muted">
                      <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p class="font-medium">No changes detected</p>
                      <p class="text-xs mt-1">Current settings match saved config on Hive</p>
                    </div>
                  </Show>
                  <Show when={jsonDiff().length > 0}>
                    <div class="divide-y divide-border">
                      <For each={jsonDiff()}>
                        {(item) => (
                          <div class="p-3">
                            <div class="flex items-center gap-2 mb-2">
                              <span class={`px-2 py-0.5 text-[10px] font-medium rounded ${
                                item.type === 'changed' ? 'bg-warning/20 text-warning' :
                                item.type === 'added' ? 'bg-success/20 text-success' :
                                'bg-error/20 text-error'
                              }`}>
                                {item.type.toUpperCase()}
                              </span>
                              <span class="font-mono text-sm font-semibold text-text">{item.key}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                              <div class="bg-error/5 rounded p-2 border border-error/20">
                                <p class="text-[10px] uppercase text-error/70 mb-1 font-medium">Old (Hive)</p>
                                <pre class="font-mono text-error/90 whitespace-pre-wrap break-all">
                                  {item.oldValue === undefined ? '(not set)' : JSON.stringify(item.oldValue, null, 2)}
                                </pre>
                              </div>
                              <div class="bg-success/5 rounded p-2 border border-success/20">
                                <p class="text-[10px] uppercase text-success/70 mb-1 font-medium">New (Current)</p>
                                <pre class="font-mono text-success/90 whitespace-pre-wrap break-all">
                                  {item.newValue === undefined ? '(removed)' : JSON.stringify(item.newValue, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>

              {/* Old JSON view */}
              <Show when={diffViewMode() === 'old'}>
                <div class="flex-1 overflow-auto bg-bg rounded-lg border border-error/30">
                  <Show when={!jsonOldContent()}>
                    <div class="p-8 text-center text-text-muted">
                      <p>No config saved on Hive yet</p>
                    </div>
                  </Show>
                  <Show when={jsonOldContent()}>
                    <pre class="p-4 text-xs text-text font-mono whitespace-pre overflow-x-auto">
                      {JSON.stringify(jsonOldContent(), null, 2)}
                    </pre>
                  </Show>
                </div>
              </Show>

              {/* New JSON view */}
              <Show when={diffViewMode() === 'new'}>
                <div class="flex-1 overflow-auto bg-bg rounded-lg border border-success/30">
                  <pre class="p-4 text-xs text-text font-mono whitespace-pre overflow-x-auto">
                    {JSON.stringify(jsonNewContent(), null, 2)}
                  </pre>
                </div>
              </Show>
            </Show>

            {/* Footer info */}
            <div class="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-warning"></span>
                  {jsonDiff().filter(d => d.type === 'changed').length} changed
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-success"></span>
                  {jsonDiff().filter(d => d.type === 'added').length} added
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-error"></span>
                  {jsonDiff().filter(d => d.type === 'removed').length} removed
                </span>
              </div>
              <span class="text-warning">Preview only - NOT sent to Hive</span>
            </div>
          </div>
        </div>
      </Show>

      {/* Login Modal - shown when trying to save without authentication */}
      <Show when={showLoginModal()}>
        <div class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowLoginModal(false)}>
          <div class="bg-bg-card rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header with icon */}
            <div class="flex items-start justify-between mb-6">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-bold text-text">Login Required</h2>
                  <p class="text-sm text-text-muted">Hive authentication</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                class="text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg p-1.5 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <p class="text-text-muted mb-6 leading-relaxed">
              Sign in with your Hive account to save your blog configuration to the blockchain. Your settings will be stored permanently and loaded automatically.
            </p>

            {/* Login form */}
            <HBAuthLogin onSuccess={handleLoginSuccess} />
          </div>
        </div>
      </Show>

      {/* Session expired banner */}
      <Show when={reauthSession()}>
        <div class="bg-warning/10 border border-warning rounded-lg p-4 mb-4">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm text-warning font-medium">
                Session expired for @{reauthSession()?.username}
              </p>
              <p class="text-xs text-warning/70 mt-0.5">
                Please enter your password again to continue. Your private key is never stored in browser storage for security.
              </p>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              class="px-3 py-1.5 bg-warning text-white text-sm font-medium rounded-lg hover:bg-warning/90 transition-colors"
            >
              Unlock
            </button>
          </div>
        </div>
      </Show>

      {/* Top Auth Bar */}
      <div class="flex items-center justify-end mb-4">
        <Show when={isAuthenticated()} fallback={
          <button
            onClick={() => setShowLoginModal(true)}
            class="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Login
          </button>
        }>
          <div class="flex items-center gap-3">
            <img
              src={`https://images.hive.blog/u/${currentUser()?.username}/avatar`}
              alt={currentUser()?.username}
              class="w-6 h-6 rounded-full"
            />
            <span class="text-sm text-text">@{currentUser()?.username}</span>
            <Show when={!isOwner()}>
              <span class="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded">View only</span>
            </Show>
            <Show when={isOwner()}>
              <button
                onClick={() => {
                  const snapshot = getSettingsSnapshot()
                  localStorage.setItem('hive-blog-settings', JSON.stringify(snapshot))
                  showToast('Settings saved to local storage', 'success')
                }}
                class="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Quick Save
              </button>
            </Show>
            <button
              onClick={handleLogout}
              class="text-text-muted hover:text-text text-sm hover:bg-bg-secondary px-2 py-1 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </Show>
      </div>

      {/* Loading state */}
      <Show when={settingsQuery.isLoading}>
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span class="ml-3 text-text-muted">Loading settings...</span>
        </div>
      </Show>

      {/* Error state */}
      <Show when={settingsQuery.isError}>
        <div class="bg-error/10 border border-error rounded-lg p-6 mb-6">
          <div class="flex items-start gap-4">
            <svg class="w-6 h-6 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-error mb-2">Problem z połączeniem do Hive API</h3>
              <p class="text-error/80 mb-1">
                Nie udało się pobrać konfiguracji z blockchaina Hive.
              </p>
              <p class="text-sm text-error/60 mb-4">
                {getLastFetchError() || 'Nieznany błąd połączenia z API node.'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <span class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Odśwież stronę
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Show>

      {/* Main Admin Panel Content - always visible */}
      <Show when={!settingsQuery.isLoading}>
        <TemplateSelector />
        <UserSwitcher />
        <LayoutEditor />
        <NavigationSettings />
        <SiteSettings />
        <AuthorProfileSettings />
        <PostsLayoutSettings />
        <CardAppearanceSettings />
        <CommentSettings />

        {/* Spacer for fixed button */}
        <div class="h-24" />

        {/* Fixed Bottom Bar */}
        <div class="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-sm border-t border-border p-4 z-50">
          <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {/* Info message */}
            <div class="flex items-center gap-2 text-sm text-text-muted">
              <Show when={isOwner()}>
                <svg class="w-4 h-4 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Saving config to Hive costs Resource Credits (RC).</span>
              </Show>
              <Show when={isAuthenticated() && !isOwner()}>
                <svg class="w-4 h-4 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>View only mode. Login as @{props.ownerUsername} to save changes.</span>
              </Show>
            </div>
            <div class="flex gap-3 flex-shrink-0">
              {/* Preview JSON - visible for everyone */}
              <Button
                variant="secondary"
                size="lg"
                onClick={handlePreviewJson}
              >
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Preview JSON
                </span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowPreview(true)}
              >
                <span class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Full Preview
                </span>
              </Button>
              <Show when={isOwner()}>
                <Button
                  variant="accent"
                  size="lg"
                  loading={isBroadcasting()}
                  onClick={handleSaveClick}
                >
                  <span class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Config on Hive
                  </span>
                </Button>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}

// ============================================
// Main Admin Panel Component with Provider
// ============================================

interface AdminPanelProps {
  initialSettings?: SettingsData | null
  ownerUsername?: string
}

export function AdminPanel(props: AdminPanelProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanelContent initialSettings={props.initialSettings} ownerUsername={props.ownerUsername} />
    </QueryClientProvider>
  )
}
