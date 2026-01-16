import { createEffect, createSignal, Show, onMount } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { Toast, showToast, Button } from '../ui'
import { HBAuthLogin, currentUser, isAuthenticated, login, logout, type AuthUser } from '../auth'
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

interface AdminPanelContentProps {
  initialSettings?: SettingsData | null
}

// ============================================
// Admin Panel Content (uses hooks)
// ============================================

function AdminPanelContent(props: AdminPanelContentProps) {
  const settingsQuery = useSettingsQuery()
  const [showPreview, setShowPreview] = createSignal(false)
  const [isBroadcasting, setIsBroadcasting] = createSignal(false)

  // Apply initial settings from SSR on mount (before query runs)
  onMount(() => {
    if (props.initialSettings) {
      console.log('Admin: Applying initial settings from SSR')
      syncSettingsToStore(props.initialSettings, true)
    }
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
    showToast(`Welcome, @${user.username}! Loading your config from Hive...`, 'success')

    // Set username for Hive config loading and refetch settings
    setCurrentUsername(user.username)
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings })
  }

  const handleLogout = () => {
    logout()
    setCurrentUsername(null)
    showToast('Logged out successfully', 'success')
  }

  const handleBroadcastToHive = async () => {
    const user = currentUser()
    if (!user) {
      showToast('Please login first', 'error')
      return
    }

    setIsBroadcasting(true)
    try {
      const result = await broadcastConfigToHive(settings, user.username, user.privateKey)
      if (result.success && result.permlink) {
        const action = result.isUpdate ? 'Updated' : 'Published'
        const url = getConfigUrlSync(user.username, result.permlink)
        showToast(`${action} config on Hive! View at: ${url}`, 'success')
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

      {/* Login Screen */}
      <Show when={!isAuthenticated()}>
        <div class="min-h-[60vh] flex flex-col items-center justify-center">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-2">Admin Login</h2>
            <p class="text-muted">Sign in with your Hive account to access admin panel</p>
          </div>
          <HBAuthLogin onSuccess={handleLoginSuccess} />
        </div>
      </Show>

      {/* Authenticated Content */}
      <Show when={isAuthenticated()}>
        {/* User Header Bar */}
        <div class="flex items-center justify-between bg-card border border-border rounded-lg p-4 mb-6">
          <div class="flex items-center gap-3">
            <img
              src={`https://images.hive.blog/u/${currentUser()?.username}/avatar`}
              alt={currentUser()?.username}
              class="w-10 h-10 rounded-full"
            />
            <div>
              <p class="font-medium text-foreground">@{currentUser()?.username}</p>
              <p class="text-xs text-muted">{currentUser()?.keyType} key</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </span>
          </Button>
        </div>

        <Show when={settingsQuery.isLoading}>
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span class="ml-3 text-text-muted">Loading settings...</span>
          </div>
        </Show>

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

          {/* Fixed Save Button */}
          <div class="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-sm border-t border-border p-4 z-50">
            <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
              {/* RC Warning */}
              <div class="flex items-center gap-2 text-sm text-text-muted">
                <svg class="w-4 h-4 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Saving config to Hive costs Resource Credits (RC).
                </span>
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
                <Button
                  variant="accent"
                  size="lg"
                  loading={isBroadcasting()}
                  onClick={handleBroadcastToHive}
                >
                  <span class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save Config on Hive
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </>
  )
}

// ============================================
// Main Admin Panel Component with Provider
// ============================================

interface AdminPanelProps {
  initialSettings?: SettingsData | null
}

export function AdminPanel(props: AdminPanelProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanelContent initialSettings={props.initialSettings} />
    </QueryClientProvider>
  )
}
