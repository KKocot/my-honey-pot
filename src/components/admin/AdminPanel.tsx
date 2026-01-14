import { createEffect, Show } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { Toast, showToast, Button } from '../ui'
import { UserSwitcher } from './UserSwitcher'
import { LayoutEditor } from './LayoutEditor'
import { SiteSettings } from './SiteSettings'
import { PostsLayoutSettings } from './PostsLayoutSettings'
import { CardAppearanceSettings } from './CardAppearanceSettings'
import { AuthorProfileSettings } from './AuthorProfileSettings'
import { CommentSettings } from './CommentSettings'
import {
  queryClient,
  useSettingsQuery,
  useSaveSettingsMutation,
  syncSettingsToStore,
  settings,
} from './queries'

// ============================================
// Admin Panel Content (uses hooks)
// ============================================

function AdminPanelContent() {
  const settingsQuery = useSettingsQuery()
  const saveMutation = useSaveSettingsMutation()

  // Sync query data to store when it changes
  createEffect(() => {
    const data = settingsQuery.data
    if (data) {
      syncSettingsToStore(data)
    }
  })

  const handleSave = async () => {
    saveMutation.mutate(settings, {
      onSuccess: (success) => {
        if (success) {
          showToast('Settings saved successfully!', 'success')
        } else {
          showToast('Error saving settings', 'error')
        }
      },
      onError: () => {
        showToast('Error saving settings', 'error')
      },
    })
  }

  return (
    <>
      <Toast />

      <Show when={settingsQuery.isLoading}>
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span class="ml-3 text-text-muted">Loading settings...</span>
        </div>
      </Show>

      <Show when={settingsQuery.isError}>
        <div class="bg-error/10 border border-error rounded-lg p-4 mb-6">
          <p class="text-error">Error loading settings. Using default values.</p>
        </div>
      </Show>

      <Show when={!settingsQuery.isLoading}>
        <UserSwitcher />
        <LayoutEditor />
        <SiteSettings />
        <AuthorProfileSettings />
        <PostsLayoutSettings />
        <CardAppearanceSettings />
        <CommentSettings />

        <div class="flex justify-end">
          <Button
            variant="accent"
            size="lg"
            loading={saveMutation.isPending}
            onClick={handleSave}
          >
            Save All Settings
          </Button>
        </div>
      </Show>
    </>
  )
}

// ============================================
// Main Admin Panel Component with Provider
// ============================================

export function AdminPanel() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanelContent />
    </QueryClientProvider>
  )
}
