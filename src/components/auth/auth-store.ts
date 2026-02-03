// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal } from 'solid-js'

export interface AuthUser {
  username: string
  privateKey: string
  keyType: 'posting' | 'active'
}

// Session storage key - only stores username, NEVER the private key
const SESSION_KEY = 'hbauth-session'

// Session timeout in milliseconds (30 minutes of inactivity)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

// Create signals for auth state
const [currentUser, setCurrentUser] = createSignal<AuthUser | null>(null)
const [isAuthenticated, setIsAuthenticated] = createSignal(false)

// Track last activity for session timeout
let lastActivityTimestamp = Date.now()
let timeoutCheckInterval: ReturnType<typeof setInterval> | null = null

// Session info stored in sessionStorage (without private key)
interface StoredSession {
  username: string
  keyType: 'posting' | 'active'
}

// Check if session has expired due to inactivity
function checkSessionTimeout() {
  const user = currentUser()
  if (!user) return

  const now = Date.now()
  if (now - lastActivityTimestamp > SESSION_TIMEOUT_MS) {
    logout()
  }
}

// Update last activity timestamp
export function updateActivity() {
  lastActivityTimestamp = Date.now()
}

// Start timeout checker
function startTimeoutChecker() {
  // Clear any existing interval first (prevent multiple intervals in HMR)
  if (timeoutCheckInterval) {
    clearInterval(timeoutCheckInterval)
    timeoutCheckInterval = null
  }

  timeoutCheckInterval = setInterval(checkSessionTimeout, 60 * 1000) // Check every minute

  // Also listen for user activity
  if (typeof window !== 'undefined') {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })
  }
}

// Stop timeout checker
function stopTimeoutChecker() {
  if (timeoutCheckInterval) {
    clearInterval(timeoutCheckInterval)
    timeoutCheckInterval = null
  }

  // Remove event listeners on cleanup
  if (typeof window !== 'undefined') {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    activityEvents.forEach((event) => {
      window.removeEventListener(event, updateActivity)
    })
  }
}

// Get stored session info (username only, no private key)
function getStoredSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null

  const session = sessionStorage.getItem(SESSION_KEY)
  if (!session) return null

  try {
    return JSON.parse(session) as StoredSession
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

// Check if user needs to re-authenticate (has stored session but no key in memory)
export function needsReauth(): StoredSession | null {
  const stored = getStoredSession()
  const user = currentUser()

  // If we have stored session but no user in memory, need reauth
  if (stored && !user) {
    return stored
  }

  return null
}

// Login - store user in memory, only username in sessionStorage
export function login(user: AuthUser) {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user object');
  }
  if (!user.username || typeof user.username !== 'string') {
    throw new Error('Invalid username');
  }
  if (!user.keyType || !['posting', 'active'].includes(user.keyType)) {
    throw new Error('Invalid keyType');
  }

  setCurrentUser(user)
  setIsAuthenticated(true)
  lastActivityTimestamp = Date.now()

  // Only store username and keyType in sessionStorage - NEVER the private key
  if (typeof sessionStorage !== 'undefined') {
    const sessionInfo: StoredSession = {
      username: user.username,
      keyType: user.keyType,
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionInfo))
  }

  startTimeoutChecker()
}

// Logout - clear session
export function logout() {
  setCurrentUser(null)
  setIsAuthenticated(false)
  stopTimeoutChecker()

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

// Export signals for reactive use in components
export { currentUser, isAuthenticated }

// Cleanup on page unload (for HMR and production)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    stopTimeoutChecker()
  })
}
