import { createEffect, createSignal, Show } from 'solid-js'
import { QueryClientProvider } from '@tanstack/solid-query'
import { Toast, showToast, Button } from '../ui'
import { UserSwitcher } from './UserSwitcher'
import { LayoutEditor } from './LayoutEditor'
import { SiteSettings } from './SiteSettings'
import { PostsLayoutSettings } from './PostsLayoutSettings'
import { CardAppearanceSettings } from './CardAppearanceSettings'
import { AuthorProfileSettings } from './AuthorProfileSettings'
import { CommentSettings } from './CommentSettings'
import { FullPreview } from './FullPreview'
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
  const [showPreview, setShowPreview] = createSignal(false)

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
      <FullPreview open={showPreview} onClose={() => setShowPreview(false)} />

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

        {/* Spacer for fixed button */}
        <div class="h-20" />

        {/* Fixed Save Button */}
        <div class="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-sm border-t border-border p-4 z-50">
          <div class="max-w-4xl mx-auto flex justify-end gap-3">
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
              loading={saveMutation.isPending}
              onClick={handleSave}
            >
              Save All Settings
            </Button>
          </div>
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
