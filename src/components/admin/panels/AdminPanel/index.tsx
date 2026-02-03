// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createEffect, createSignal, Show, onMount, onCleanup, ErrorBoundary, on } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { Toast, showToast, Button } from '../../../ui'
import { currentUser, isAuthenticated, login, logout, needsReauth, type AuthUser } from '../../../auth'
import { TemplateSelector } from '../../editors/TemplateSelector'
import { LayoutEditor } from '../../editors/LayoutEditor'
import { SiteSettings } from '../../settings/SiteSettings'
import { PostsLayoutSettings } from '../../settings/PostsLayoutSettings'
import { CardAppearanceSettings } from '../../settings/CardAppearanceSettings'
import { AuthorProfileSettings } from '../../settings/AuthorProfileSettings'
import { CommentSettings } from '../../settings/CommentSettings'
import { NavigationSettings } from '../../settings/NavigationSettings'
import { FullPreview } from '../FullPreview/index'
import type { SettingsData } from '../../types/index'
import {
  queryClient,
  useSettingsQuery,
  syncSettingsToStore,
  setCurrentUsername,
  getLastFetchError,
  updateSettings,
} from '../../queries'
import { setHasUnsavedChanges, getHasUnsavedChanges } from '../../store'
import { LoginModal } from './LoginModal'
import { JsonPreviewModal } from './JsonPreviewModal'
import { BottomBar } from './BottomBar'
import { handle_broadcast_to_hive, handle_preview_json } from './handlers'

interface AdminPanelContentProps {
  initialSettings?: SettingsData | null
  ownerUsername?: string
}

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
  const [showMobileMenu, setShowMobileMenu] = createSignal(false)

  const isOwner = () => {
    const user = currentUser()
    if (!user || !props.ownerUsername) return false
    return user.username.toLowerCase() === props.ownerUsername.toLowerCase()
  }

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (getHasUnsavedChanges()) {
      e.preventDefault()
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
      return e.returnValue
    }
  }

  onMount(() => {
    if (props.initialSettings) {
      const settings_with_username = {
        ...props.initialSettings,
        hiveUsername: props.initialSettings.hiveUsername || props.ownerUsername || '',
      }
      syncSettingsToStore(settings_with_username, true)
    } else if (props.ownerUsername) {
      updateSettings({ hiveUsername: props.ownerUsername })
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onCleanup(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  createEffect(on(() => settingsQuery.data, (data) => {
    if (data) {
      syncSettingsToStore(data, true)
    }
  }))

  const handleLoginSuccess = async (user: AuthUser) => {
    login(user)
    setShowLoginModal(false)
    setReauthSession(null)
    showToast(`Welcome, @${user.username}!`, 'success')
    setCurrentUsername(user.username)
    await queryClient.invalidateQueries({ queryKey: ['settings'] })
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
    handle_broadcast_to_hive(currentUser(), setIsBroadcasting, setShowLoginModal)
  }

  const handlePreviewJsonClick = async () => {
    await handle_preview_json(
      props.ownerUsername,
      setIsLoadingDiff,
      setShowJsonPreview,
      setDiffViewMode,
      setJsonNewContent,
      setJsonOldContent,
      setJsonPreviewContent,
      setJsonDiff
    )
  }

  return (
    <ErrorBoundary fallback={(err) => (
      <div class="p-8 text-center">
        <h2 class="text-xl font-bold text-error mb-4">Something went wrong</h2>
        <p class="text-muted mb-4">{err.message}</p>
        <button
          onClick={() => window.location.reload()}
          class="px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors"
        >
          Reload page
        </button>
      </div>
    )}>
      <Toast />
      <FullPreview open={showPreview} onClose={() => setShowPreview(false)} />

      <JsonPreviewModal
        show={showJsonPreview()}
        is_loading={isLoadingDiff()}
        diff_view_mode={diffViewMode()}
        json_old_content={jsonOldContent()}
        json_new_content={jsonNewContent()}
        json_diff={jsonDiff()}
        onClose={() => setShowJsonPreview(false)}
        onChangeDiffMode={setDiffViewMode}
      />

      <LoginModal
        show={showLoginModal()}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

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

      {/* Main Admin Panel Content */}
      <Show when={!settingsQuery.isLoading}>
        <TemplateSelector />
        <LayoutEditor />
        <NavigationSettings />
        <SiteSettings />
        <AuthorProfileSettings />
        <PostsLayoutSettings />
        <CardAppearanceSettings />
        <CommentSettings />

        <div class="h-24" />

        <BottomBar
          is_owner={isOwner()}
          is_authenticated={isAuthenticated()}
          is_broadcasting={isBroadcasting()}
          owner_username={props.ownerUsername}
          show_mobile_menu={showMobileMenu()}
          on_save_click={handleSaveClick}
          on_preview_json={handlePreviewJsonClick}
          on_full_preview={() => setShowPreview(true)}
          on_toggle_mobile_menu={() => setShowMobileMenu(!showMobileMenu())}
        />
      </Show>
    </ErrorBoundary>
  )
}

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
