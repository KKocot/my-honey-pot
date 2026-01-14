import { onMount, createSignal } from 'solid-js'
import { Toast, showToast, Button } from '../ui'
import { UserSwitcher } from './UserSwitcher'
import { LayoutEditor } from './LayoutEditor'
import { SiteSettings } from './SiteSettings'
import { PostsLayoutSettings } from './PostsLayoutSettings'
import { CardAppearanceSettings } from './CardAppearanceSettings'
import { AuthorProfileSettings } from './AuthorProfileSettings'
import { CommentSettings } from './CommentSettings'
import { loadSettings, saveSettings } from './store'

// ============================================
// Main Admin Panel Component
// ============================================

export function AdminPanel() {
  const [saving, setSaving] = createSignal(false)

  onMount(() => {
    loadSettings()
  })

  const handleSave = async () => {
    setSaving(true)
    const success = await saveSettings()
    setSaving(false)

    if (success) {
      showToast('Settings saved successfully!', 'success')
    } else {
      showToast('Error saving settings', 'error')
    }
  }

  return (
    <>
      <Toast />

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
          loading={saving()}
          onClick={handleSave}
        >
          Save All Settings
        </Button>
      </div>
    </>
  )
}
