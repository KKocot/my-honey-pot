// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Auth session persistence helpers for localStorage.
 *
 * Stores non-sensitive session metadata (username, login type, key type)
 * in localStorage so sessions survive page refresh.
 * Private keys are NEVER persisted.
 */

import type { LoginType } from "./auth-store";

// ============================================
// Storage keys
// ============================================

const KEY_USERNAME = "mhp_username";
const KEY_LOGIN_TYPE = "mhp_login_type";
const KEY_KEY_TYPE = "mhp_key_type";

// Legacy key from old sessionStorage-based persistence
const LEGACY_SESSION_KEY = "hbauth-session";

// ============================================
// Types
// ============================================

export interface PersistedSession {
  username: string;
  loginType: LoginType;
  keyType: "posting" | "active";
}

// ============================================
// Validation
// ============================================

const VALID_LOGIN_TYPES = new Set<string>(["hbauth", "keychain", "wif"]);
const VALID_KEY_TYPES = new Set<string>(["posting", "active"]);

function is_valid_login_type(value: string): value is LoginType {
  return VALID_LOGIN_TYPES.has(value);
}

function is_valid_key_type(value: string): value is "posting" | "active" {
  return VALID_KEY_TYPES.has(value);
}

// ============================================
// Read / Write / Clear
// ============================================

/** Read persisted session from localStorage. Returns null if missing or invalid. */
export function get_persisted_session(): PersistedSession | null {
  if (typeof localStorage === "undefined") return null;

  const username = localStorage.getItem(KEY_USERNAME);
  const login_type = localStorage.getItem(KEY_LOGIN_TYPE);
  const key_type = localStorage.getItem(KEY_KEY_TYPE);

  if (
    !username ||
    !login_type ||
    !key_type ||
    !is_valid_login_type(login_type) ||
    !is_valid_key_type(key_type)
  ) {
    return null;
  }

  return { username, loginType: login_type, keyType: key_type };
}

/** Persist session metadata to localStorage. Never stores private keys. */
export function persist_session(
  username: string,
  login_type: LoginType,
  key_type: "posting" | "active",
): void {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(KEY_USERNAME, username);
  localStorage.setItem(KEY_LOGIN_TYPE, login_type);
  localStorage.setItem(KEY_KEY_TYPE, key_type);
}

/** Clear all persisted session data from localStorage. */
export function clear_persisted_session(): void {
  if (typeof localStorage === "undefined") return;

  localStorage.removeItem(KEY_USERNAME);
  localStorage.removeItem(KEY_LOGIN_TYPE);
  localStorage.removeItem(KEY_KEY_TYPE);
}

// ============================================
// Legacy migration
// ============================================

interface LegacySession {
  username: string;
  keyType: string;
  loginType: string;
}

function is_legacy_session(value: unknown): value is LegacySession {
  if (typeof value !== "object" || value === null) return false;
  if (!("username" in value) || !("keyType" in value) || !("loginType" in value))
    return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec["username"] === "string" &&
    typeof rec["keyType"] === "string" &&
    typeof rec["loginType"] === "string"
  );
}

/**
 * Migrate legacy sessionStorage data to localStorage.
 * If the old `hbauth-session` key exists in sessionStorage,
 * extract its data into the new localStorage keys and remove it.
 * Safe to call multiple times (idempotent).
 */
export function migrate_legacy_storage(): void {
  if (typeof sessionStorage === "undefined") return;

  const raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
  if (!raw) return;

  // Only migrate if we don't already have persisted data
  if (get_persisted_session()) {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      is_legacy_session(parsed) &&
      is_valid_login_type(parsed.loginType) &&
      is_valid_key_type(parsed.keyType)
    ) {
      persist_session(parsed.username, parsed.loginType, parsed.keyType);
    }
  } catch {
    // Corrupt data, ignore
  }

  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}
