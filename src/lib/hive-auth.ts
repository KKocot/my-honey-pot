// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

export { is_valid_hive_username } from "../components/auth/constants";

export const USERNAME_STORAGE_KEY = "hive-signer-username";

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
