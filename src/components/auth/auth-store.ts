import { createSignal } from 'solid-js'

export interface AuthUser {
  username: string
  privateKey: string
  keyType: 'posting' | 'active'
}

// Session storage key
const SESSION_KEY = 'hbauth-session'

// Create signals for auth state
const [currentUser, setCurrentUser] = createSignal<AuthUser | null>(null)
const [isAuthenticated, setIsAuthenticated] = createSignal(false)

// Initialize from session storage (if available)
function initFromSession() {
  if (typeof sessionStorage === 'undefined') return

  const session = sessionStorage.getItem(SESSION_KEY)
  if (session) {
    try {
      const user = JSON.parse(session) as AuthUser
      setCurrentUser(user)
      setIsAuthenticated(true)
    } catch {
      sessionStorage.removeItem(SESSION_KEY)
    }
  }
}

// Call init on module load (browser only)
if (typeof window !== 'undefined') {
  initFromSession()
}

// Login - store user in session
export function login(user: AuthUser) {
  setCurrentUser(user)
  setIsAuthenticated(true)

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
  }
}

// Logout - clear session
export function logout() {
  setCurrentUser(null)
  setIsAuthenticated(false)

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

// Export getters
export function getUser() {
  return currentUser()
}

export function getIsAuthenticated() {
  return isAuthenticated()
}

// Export signals for reactive use in components
export { currentUser, isAuthenticated }
