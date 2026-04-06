// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

export const USERNAME_STORAGE_KEY = "hive-signer-username";

/** Hive username format: 3-16 chars, starts with letter, only [a-z0-9.-] */
const HIVE_USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

/** Read stored username from localStorage (best-effort) */
export function get_stored_username(): string {
  try {
    return localStorage.getItem(USERNAME_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Persist username to localStorage (best-effort) */
export function set_stored_username(username: string): void {
  try {
    localStorage.setItem(USERNAME_STORAGE_KEY, username);
  } catch {
    // SSR or storage full -- ignore
  }
}

/** Validate Hive username format */
export function is_valid_hive_username(username: string): boolean {
  return HIVE_USERNAME_RE.test(username);
}
