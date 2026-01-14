import { createSignal, onMount } from 'solid-js'
import { Input, Button } from '../ui'
import { getHiveUsername, setHiveUsername, loadHiveUsername, isInDemoMode } from './store'

// ============================================
// User Switcher Component
// ============================================

export function UserSwitcher() {
  const [username, setUsername] = createSignal('')
  const [loading, setLoading] = createSignal(false)

  onMount(() => {
    const stored = loadHiveUsername()
    if (stored) {
      setUsername(stored)
    }
  })

  const handleApply = () => {
    const user = username().trim().replace('@', '')
    if (user) {
      setLoading(true)
      setHiveUsername(user)
      // Redirect to homepage with the username
      window.location.href = `/?user=${user}`
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  const popularUsers = ['blocktrades', 'acidyo', 'gtg', 'arcange', 'theycallmedan']

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
        Enter a Hive username to preview their blog. Changes will be reflected on the homepage.
      </p>

      <div class="flex gap-3">
        <div class="flex-1">
          <Input
            type="text"
            placeholder="Enter Hive username (e.g., blocktrades)"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <Button
          variant="primary"
          loading={loading()}
          onClick={handleApply}
          disabled={!username().trim()}
        >
          Apply & View
        </Button>
      </div>

      <div class="mt-4">
        <p class="text-xs text-text-muted mb-2">Quick select:</p>
        <div class="flex flex-wrap gap-2">
          {popularUsers.map((user) => (
            <button
              type="button"
              onClick={() => {
                setUsername(user)
                setHiveUsername(user)
                window.location.href = `/?user=${user}`
              }}
              class="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors"
            >
              @{user}
            </button>
          ))}
        </div>
      </div>

      {getHiveUsername() && (
        <div class="mt-4 p-3 bg-success/10 rounded-lg border border-success/30">
          <p class="text-sm text-success">
            Currently viewing: <strong>@{getHiveUsername()}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
