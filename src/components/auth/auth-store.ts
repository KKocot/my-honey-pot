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

/**
 * Single session length for the app and HB-Auth (ADR 6ac5e13663221e857a3ba929):
 * absolute from login, not extended by activity.
 */
export const SESSION_TIMEOUT_MS = 20 * 60 * 1000;

const SESSION_CHECK_INTERVAL_MS = 15 * 1000;

const [currentUser, setCurrentUser] = createSignal<AuthUser | null>(null);
const [isAuthenticated, setIsAuthenticated] = createSignal(false);

let session_deadline = 0;
let check_interval: ReturnType<typeof setInterval> | null = null;
let expiry_timer: ReturnType<typeof setTimeout> | null = null;
let hbauth_check_in_flight = false;
// Bumped on login/logout so a slow restore never overrides a newer auth action
let auth_generation = 0;

async function is_hbauth_session_active(username: string): Promise<boolean> {
  const { getOnlineClient } = await import("../../lib/hbauth-service");
  const client = await getOnlineClient();
  const users = await client.getRegisteredUsers();
  const lower = username.toLowerCase();
  return users.some((u) => u.username.toLowerCase() === lower && u.unlocked);
}

async function end_hbauth_session(username: string): Promise<void> {
  try {
    const { getOnlineClient } = await import("../../lib/hbauth-service");
    const client = await getOnlineClient();
    await client.logout(username);
  } catch (err) {
    console.error("Failed to end HB-Auth session:", err);
  }
}

async function sync_with_hbauth(): Promise<void> {
  const user = currentUser();
  if (!user || user.loginType !== "hbauth" || hbauth_check_in_flight) return;

  hbauth_check_in_flight = true;
  try {
    const active = await is_hbauth_session_active(user.username);
    if (!active && currentUser() === user) logout();
  } catch {
    // HB-Auth unreachable: the app deadline still bounds the session
  } finally {
    hbauth_check_in_flight = false;
  }
}

async function watch_hbauth_session_end(): Promise<void> {
  try {
    const { getOnlineClient } = await import("../../lib/hbauth-service");
    const client = await getOnlineClient();
    await client.setSessionEndCallback(sync_with_hbauth);
  } catch {
    // Polling in check_session covers HB-Auth expiry without the callback
  }
}

function check_session() {
  const user = currentUser();
  if (!user) return;

  if (Date.now() >= session_deadline) {
    logout();
    return;
  }

  if (user.loginType === "hbauth") void sync_with_hbauth();
}

function start_session(user: AuthUser, deadline: number) {
  setCurrentUser(user);
  setIsAuthenticated(true);
  session_deadline = deadline;

  stop_session_checker();
  check_interval = setInterval(check_session, SESSION_CHECK_INTERVAL_MS);
  expiry_timer = setTimeout(check_session, Math.max(0, deadline - Date.now()));

  if (user.loginType === "hbauth") void watch_hbauth_session_end();
}

function stop_session_checker() {
  if (check_interval) {
    clearInterval(check_interval);
    check_interval = null;
  }
  if (expiry_timer) {
    clearTimeout(expiry_timer);
    expiry_timer = null;
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
    const { username, keyType, loginType } = stored;
    return { username, keyType, loginType };
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

  const deadline = Date.now() + SESSION_TIMEOUT_MS;
  auth_generation++;

  // Persist session metadata to localStorage (NEVER the private key)
  persist_session(user.username, user.loginType, user.keyType, deadline);

  start_session(user, deadline);
}

/** Ends the app session; for HB-Auth users also ends the HB-Auth session. */
export function logout() {
  const user = currentUser();
  auth_generation++;

  setCurrentUser(null);
  setIsAuthenticated(false);
  stop_session_checker();
  session_deadline = 0;

  clear_persisted_session();

  if (user?.loginType === "hbauth") void end_hbauth_session(user.username);
}

/**
 * Restore session from localStorage on app startup.
 * Migrates legacy sessionStorage data, then attempts auto-restore
 * based on the persisted login type.
 *
 * - any type past the deadline persisted at login: logged out (reload never extends a session)
 * - keychain: auto-restore once the extension injects itself (bounded wait)
 * - hbauth: auto-restore only while the HB-Auth session is still unlocked
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

  const { username, loginType, keyType, expiresAt } = session;

  if (loginType !== "wif" && Date.now() >= expiresAt) {
    clear_persisted_session();
    if (loginType === "hbauth") await end_hbauth_session(username);
    return;
  }

  // Step 3: Attempt auto-restore based on login type
  if (loginType === "keychain") {
    const generation = auth_generation;
    // Dynamic import to avoid pulling KeychainProvider into SSR
    const { wait_for_keychain } = await import("./KeychainLogin");
    const available = await wait_for_keychain();

    if (generation !== auth_generation) return;

    if (available && Date.now() < expiresAt) {
      start_session({
        username,
        privateKey: KEYCHAIN_MANAGED_MARKER,
        keyType,
        loginType: "keychain",
      }, expiresAt);
    } else {
      clear_persisted_session();
    }
    return;
  }

  if (loginType === "hbauth") {
    const generation = auth_generation;
    try {
      // Locked wallet = HB-Auth session expired; keep persisted metadata so needsReauth() prompts
      const active = await is_hbauth_session_active(username);
      const { HBAUTH_MANAGED_MARKER } = await import("../../lib/wif-signer");

      if (generation !== auth_generation || !active) return;

      if (Date.now() >= expiresAt) {
        clear_persisted_session();
        await end_hbauth_session(username);
        return;
      }

      start_session({
        username,
        privateKey: HBAUTH_MANAGED_MARKER,
        keyType,
        loginType: "hbauth",
      }, expiresAt);
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
    stop_session_checker();
  });
}
