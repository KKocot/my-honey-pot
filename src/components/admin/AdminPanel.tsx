import { createEffect, createSignal, Show, onMount, onCleanup } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { Toast, showToast, Button } from '../ui'
import { HBAuthLogin, currentUser, isAuthenticated, login, logout, needsReauth, type AuthUser } from '../auth'
import { broadcastConfigToHive, getConfigUrlSync } from './hive-broadcast'
import { TemplateSelector } from './TemplateSelector'
import { UserSwitcher } from './UserSwitcher'
import { LayoutEditor } from './LayoutEditor'
import { SiteSettings } from './SiteSettings'
import { PostsLayoutSettings } from './PostsLayoutSettings'
import { CardAppearanceSettings } from './CardAppearanceSettings'
import { AuthorProfileSettings } from './AuthorProfileSettings'
import { CommentSettings } from './CommentSettings'
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

  // Check if logged in user is the blog owner (can save changes)
  const isOwner = () => {
    const user = currentUser()
    if (!user || !props.ownerUsername) return false
    return user.username.toLowerCase() === props.ownerUsername.toLowerCase()
  }

  // Apply initial settings from SSR on mount (before query runs)
  onMount(() => {
    if (props.initialSettings) {
      console.log('Admin: Applying initial settings from SSR')
      syncSettingsToStore(props.initialSettings, true)
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
      const result = await broadcastConfigToHive(settings, user.username, user.privateKey)
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

  return (
    <>
      <Toast />
      <FullPreview open={showPreview} onClose={() => setShowPreview(false)} />

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
