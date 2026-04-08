// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal } from "solid-js";
import {
  get_persisted_session,
  persist_session,
  clear_persisted_session,
  migrate_legacy_storage,
} from "./auth-persistence";
import { KEYCHAIN_MANAGED_MARKER } from "./constants";

export type LoginType = "hbauth" | "keychain" | "wif";

export interface AuthUser {
  username: string;
  privateKey: string;
  keyType: "posting" | "active";
  loginType: LoginType;
}

// Session timeout in milliseconds (30 minutes of inactivity)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Create signals for auth state
const [currentUser, setCurrentUser] = createSignal<AuthUser | null>(null);
const [isAuthenticated, setIsAuthenticated] = createSignal(false);

// Track last activity for session timeout
let lastActivityTimestamp = Date.now();
let timeoutCheckInterval: ReturnType<typeof setInterval> | null = null;

// Check if session has expired due to inactivity
function checkSessionTimeout() {
  const user = currentUser();
  if (!user) return;

  const now = Date.now();
  if (now - lastActivityTimestamp > SESSION_TIMEOUT_MS) {
    logout();
  }
}

// Update last activity timestamp
export function updateActivity() {
  lastActivityTimestamp = Date.now();
}

// Start timeout checker
let listenersAttached = false;

function startTimeoutChecker() {
  // Clear any existing interval and listeners first (prevent duplicates in HMR)
  stopTimeoutChecker();

  timeoutCheckInterval = setInterval(checkSessionTimeout, 60 * 1000); // Check every minute

  // Also listen for user activity
  if (typeof window !== "undefined" && !listenersAttached) {
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
    listenersAttached = true;
  }
}

// Stop timeout checker
function stopTimeoutChecker() {
  if (timeoutCheckInterval) {
    clearInterval(timeoutCheckInterval);
    timeoutCheckInterval = null;
  }

  // Remove event listeners on cleanup
  if (typeof window !== "undefined") {
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((event) => {
      window.removeEventListener(event, updateActivity);
    });
    listenersAttached = false;
  }
}

// Check if user needs to re-authenticate (has persisted session but no key in memory)
export function needsReauth(): {
  username: string;
  keyType: "posting" | "active";
  loginType: LoginType;
} | null {
  const stored = get_persisted_session();
  const user = currentUser();

  // If we have stored session but no user in memory, need reauth
  if (stored && !user) {
    return stored;
  }

  return null;
}

// Login - store user in memory, persist metadata to localStorage
export function login(user: AuthUser) {
  if (!user || typeof user !== "object") {
    throw new Error("Invalid user object");
  }
  if (!user.username || typeof user.username !== "string") {
    throw new Error("Invalid username");
  }
  if (!user.keyType || !["posting", "active"].includes(user.keyType)) {
    throw new Error("Invalid keyType");
  }

  setCurrentUser(user);
  setIsAuthenticated(true);
  lastActivityTimestamp = Date.now();

  // Persist session metadata to localStorage (NEVER the private key)
  persist_session(user.username, user.loginType, user.keyType);

  startTimeoutChecker();
}

// Logout - clear session
export function logout() {
  setCurrentUser(null);
  setIsAuthenticated(false);
  stopTimeoutChecker();

  clear_persisted_session();
}

/**
 * Restore session from localStorage on app startup.
 * Migrates legacy sessionStorage data, then attempts auto-restore
 * based on the persisted login type.
 *
 * - keychain: auto-restore if extension is installed
 * - hbauth: auto-restore if user has registered keys in HB-Auth (async check)
 * - wif: cannot auto-restore (key was only in memory), clears persisted session
 *
 * Safe to call multiple times — uses singleton promise guard.
 */
let restore_promise: Promise<void> | null = null;

export function restore_session(): Promise<void> {
  if (!restore_promise) {
    restore_promise = _restore_session_impl();
  }
  return restore_promise;
}

async function _restore_session_impl(): Promise<void> {
  if (typeof window === "undefined") return;

  // Step 1: Migrate legacy sessionStorage -> localStorage
  migrate_legacy_storage();

  // Step 2: Read persisted session
  const session = get_persisted_session();
  if (!session) return;

  const { username, loginType, keyType } = session;

  // Step 3: Attempt auto-restore based on login type
  if (loginType === "keychain") {
    // Dynamic import to avoid pulling KeychainProvider into SSR
    const { has_keychain } = await import("./KeychainLogin");

    if (has_keychain()) {
      setCurrentUser({
        username,
        privateKey: KEYCHAIN_MANAGED_MARKER,
        keyType,
        loginType: "keychain",
      });
      setIsAuthenticated(true);
      lastActivityTimestamp = Date.now();
      startTimeoutChecker();
    } else {
      // Extension not available -- clear persisted session
      clear_persisted_session();
    }
    return;
  }

  if (loginType === "hbauth") {
    try {
      const { getOnlineClient } = await import("../../lib/hbauth-service");
      const client = await getOnlineClient();
      const users = await client.getRegisteredUsers();
      const has_user = users.some(
        (u) => u.username.toLowerCase() === username.toLowerCase(),
      );

      if (has_user) {
        // HB-Auth has keys for this user. We can't know if the session
        // is still unlocked without attempting auth, so we set the user
        // optimistically. If the session is locked, the user will see
        // needsReauth() and must re-enter their password.
        const { HBAUTH_MANAGED_MARKER } = await import("../../lib/wif-signer");
        setCurrentUser({
          username,
          privateKey: HBAUTH_MANAGED_MARKER,
          keyType,
          loginType: "hbauth",
        });
        setIsAuthenticated(true);
        lastActivityTimestamp = Date.now();
        startTimeoutChecker();
      }
      // If user not found in HB-Auth, keep persisted session
      // so needsReauth() can show the reauth banner
    } catch {
      // HB-Auth service unavailable -- keep persisted session for needsReauth()
    }
    return;
  }

  if (loginType === "wif") {
    // WIF key was only in memory -- cannot auto-restore
    clear_persisted_session();
  }
}

// Export signals for reactive use in components
export { currentUser, isAuthenticated };

// Cleanup on page unload (for HMR and production)
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    stopTimeoutChecker();
  });
}
