// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

export const KEYCHAIN_MANAGED_MARKER = "__KEYCHAIN_MANAGED__";

export function is_valid_hive_username(name: string): boolean {
  return /^[a-z][a-z0-9\-]{2,15}$/.test(name);
}
