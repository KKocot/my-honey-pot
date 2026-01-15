import { Input } from '../ui'
import { settings, updateSettings, isInDemoMode } from './store'

// ============================================
// User Switcher Component
// ============================================

export function UserSwitcher() {
  const handleInput = (e: Event) => {
    const value = (e.currentTarget as HTMLInputElement).value.replace('@', '')
    updateSettings({ hiveUsername: value })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-primary">Hive User</h2>
        {isInDemoMode() && (
          <span class="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
            Demo Mode
          </span>
        )}
      </div>

      <p class="text-sm text-text-muted mb-4">
        Enter a Hive username to display their blog. Save settings to apply changes.
      </p>

      <div class="flex gap-3">
        <div class="flex-1">
          <Input
            type="text"
            placeholder="Enter Hive username (e.g., blocktrades)"
            value={settings.hiveUsername || ''}
            onInput={handleInput}
          />
        </div>
      </div>

      {settings.hiveUsername && (
        <div class="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
          <p class="text-sm text-primary">
            Selected user: <strong>@{settings.hiveUsername}</strong>
          </p>
          <p class="text-xs text-text-muted mt-1">
            Click "Save All Settings" to apply this change.
          </p>
        </div>
      )}
    </div>
  )
}
