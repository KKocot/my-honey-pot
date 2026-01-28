import { createSignal, Show, onMount } from 'solid-js'
import { getOnlineClient } from '../../lib/hbauth-service'
import type { OnlineClient, AuthUser as HBAuthUser } from '@hiveio/hb-auth'

interface HBAuthLoginProps {
  onSuccess?: (user: { username: string; privateKey: string; keyType: 'posting' | 'active' }) => void
  onError?: (error: Error) => void
  onLogout?: () => void
  class?: string
}

/**
 * HB-Auth Login Component
 * Uses official @hiveio/hb-auth for key storage (IndexedDB via Web Worker)
 * No custom localStorage encryption - HB-Auth handles it internally
 */
export function HBAuthLogin(props: HBAuthLoginProps) {
  const [mode, setMode] = createSignal<'login' | 'register'>('login')
  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [privateKey, setPrivateKey] = createSignal('')
  const keyType = 'posting' as const
  const [showPassword, setShowPassword] = createSignal(false)
  const [showKey, setShowKey] = createSignal(false)
  const [isLoading, setIsLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [storedUsers, setStoredUsers] = createSignal<HBAuthUser[]>([])
  const [authClient, setAuthClient] = createSignal<OnlineClient | null>(null)

  // Initialize HB-Auth client and load registered users
  onMount(async () => {
    try {
      const client = await getOnlineClient()
      setAuthClient(client)
      const users = await client.getRegisteredUsers()
      setStoredUsers(users)

      // Auto-select first user if available
      if (users.length > 0) {
        setUsername(users[0].username)
      }
    } catch (err) {
      console.error('Failed to initialize HB-Auth client:', err)
    }
  })

  // Check if user has stored key and switch to login mode
  const checkStoredKey = () => {
    const user = username().trim().toLowerCase()
    const found = storedUsers().find(u => u.username.toLowerCase() === user)
    if (found) {
      setMode('login')
    }
  }

  // Validate WIF format (basic check)
  const isValidWIF = (wif: string): boolean => {
    return wif.startsWith('5') && wif.length === 51
  }

  /**
   * Login - authenticate with HB-Auth (unlock stored key)
   */
  async function handleLogin() {
    const user = username().trim().toLowerCase()
    const pass = password()

    if (!user || !pass) {
      setError('Please fill in all fields')
      return
    }

    const client = authClient()
    if (!client) {
      setError('Auth client not initialized')
      return
    }

    // Check if user exists in HB-Auth storage
    const storedUser = storedUsers().find(u => u.username.toLowerCase() === user)
    if (!storedUser) {
      setError('No key stored for this user. Please register first.')
      setMode('register')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Authenticate with HB-Auth (unlocks the key)
      const authStatus = await client.authenticate(user, pass, keyType)

      if (!authStatus.ok) {
        throw new Error('Authentication failed')
      }

      // For onSuccess callback, we need to sign something to get key working
      // HB-Auth doesn't expose the raw private key - it signs internally
      // We'll pass a placeholder and use HB-Auth for actual signing in broadcast
      props.onSuccess?.({
        username: user,
        privateKey: '__HBAUTH_MANAGED__', // Marker that key is managed by HB-Auth
        keyType
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed')

      // Handle common HB-Auth errors
      if (error.message.includes('Not authorized') || error.message.includes('Authentication failed')) {
        setError('Invalid password')
      } else if (error.message.includes('User is already logged in')) {
        // Already logged in is OK
        props.onSuccess?.({
          username: user,
          privateKey: '__HBAUTH_MANAGED__',
          keyType
        })
        return
      } else {
        setError(error.message)
      }
      props.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Register - store new key in HB-Auth
   */
  async function handleRegister() {
    const user = username().trim().toLowerCase()
    const pass = password()
    const key = privateKey().trim()

    if (!user || !pass || !key) {
      setError('Please fill in all fields')
      return
    }

    if (!isValidWIF(key)) {
      setError('Invalid WIF format. Private keys start with 5 and are 51 characters')
      return
    }

    const client = authClient()
    if (!client) {
      setError('Auth client not initialized')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Register key with HB-Auth (stores encrypted in IndexedDB)
      await client.register(user, pass, key, keyType)

      // Refresh stored users list
      const users = await client.getRegisteredUsers()
      setStoredUsers(users)

      setPrivateKey('')
      setError(null)

      // Auto-login after successful registration
      const authStatus = await client.authenticate(user, pass, keyType)
      if (authStatus.ok) {
        props.onSuccess?.({
          username: user,
          privateKey: '__HBAUTH_MANAGED__',
          keyType
        })
      } else {
        // Fallback to login mode if auto-login fails
        setMode('login')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Registration failed')
      setError(error.message)
      props.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout user from HB-Auth session and remove from quick access list
   */
  async function handleRemoveKey(user: string) {
    if (!confirm(`Logout and remove @${user} from quick access list?`)) return

    const client = authClient()
    if (!client) return

    try {
      // Logout user from HB-Auth (removes session, not the stored key)
      await client.logout(user)

      // Refresh stored users list
      const users = await client.getRegisteredUsers()
      setStoredUsers(users)

      // Clear form if removing current user
      if (username() === user) {
        setUsername('')
        setPassword('')
      }
    } catch (err) {
      console.error('Failed to logout user:', err)
      setError('Failed to logout user')
    }
  }

  return (
    <div class={`w-full max-w-sm ${props.class || ''}`}>
      {/* Mode Toggle */}
      <div class="flex rounded-xl bg-bg-secondary border border-border p-1 mb-6">
        <button
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          class={`flex-1 rounded-lg py-2.5 px-4 text-sm font-medium transition-all ${
            mode() === 'login'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-muted hover:text-text hover:bg-bg-card'
          }`}
        >
          Login
        </button>
        <button
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          class={`flex-1 rounded-lg py-2.5 px-4 text-sm font-medium transition-all ${
            mode() === 'register'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-muted hover:text-text hover:bg-bg-card'
          }`}
        >
          Register Key
        </button>
      </div>

      <div class="space-y-4">
        {/* Stored Users Quick Select */}
        <Show when={storedUsers().length > 0 && mode() === 'login'}>
          <div>
            <label class="block text-sm font-medium mb-1.5 text-foreground">Stored Accounts</label>
            <div class="flex flex-wrap gap-2">
              {storedUsers().map((user) => (
                <div class="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
                  <button
                    onClick={() => setUsername(user.username)}
                    class={`text-sm ${username() === user.username ? 'text-accent font-medium' : 'text-foreground'}`}
                  >
                    @{user.username}
                  </button>
                  <button
                    onClick={() => handleRemoveKey(user.username)}
                    class="text-muted hover:text-error ml-1"
                    title="Logout from quick access"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Show>

        {/* Username */}
        <div>
          <label class="block text-sm font-medium mb-1.5 text-foreground">Username</label>
          <input
            type="text"
            value={username()}
            onInput={(e) => {
              setUsername(e.currentTarget.value.toLowerCase())
              checkStoredKey()
            }}
            placeholder="Enter your username"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Password */}
        <div>
          <label class="block text-sm font-medium mb-1.5 text-foreground">
            {mode() === 'register' ? 'Create Password' : 'Password'}
          </label>
          <div class="relative">
            <input
              type={showPassword() ? 'text' : 'password'}
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && mode() === 'login') {
                  e.preventDefault()
                  handleLogin()
                }
              }}
              placeholder="Enter password"
              class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword())}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {showPassword() ? (
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Private Key (only for register) */}
        <Show when={mode() === 'register'}>
          <div>
            <label class="block text-sm font-medium mb-1.5 text-foreground">
              Private Key (WIF)
            </label>
            <div class="relative">
              <input
                type={showKey() ? 'text' : 'password'}
                value={privateKey()}
                onInput={(e) => setPrivateKey(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleRegister()
                  }
                }}
                placeholder="5..."
                class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey())}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                {showKey() ? (
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p class="mt-1 text-xs text-muted">
              Your key will be encrypted and stored securely by HB-Auth
            </p>
          </div>

        </Show>

        {/* Error Message */}
        <Show when={error()}>
          <div class="flex items-center gap-2 text-sm text-error">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error()}
          </div>
        </Show>

        {/* Submit Button */}
        <button
          onClick={() => mode() === 'login' ? handleLogin() : handleRegister()}
          disabled={isLoading()}
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isLoading() ? (
            <svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : mode() === 'login' ? (
            <>
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Unlock Blog
            </>
          ) : (
            <>
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Save Key
            </>
          )}
        </button>

        {/* Security Note */}
        <div class="rounded-lg border border-success/20 bg-success/5 p-3">
          <p class="text-xs text-success">
            <strong>Safe Storage:</strong> Your key is encrypted by HB-Auth and stored in browser's IndexedDB. Never transmitted over the network.
          </p>
        </div>
      </div>
    </div>
  )
}

export default HBAuthLogin
