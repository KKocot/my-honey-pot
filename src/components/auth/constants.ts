// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

export const KEYCHAIN_MANAGED_MARKER = "__KEYCHAIN_MANAGED__";

const HIVE_ACCOUNT_SEGMENT = /^[a-z][a-z0-9-]+[a-z0-9]$/;

/** Mirrors hived `is_valid_account_name`: 3-16 chars, dot-separated segments of >=3 chars. */
export function is_valid_hive_username(name: string): boolean {
  if (name.length < 3 || name.length > 16) return false;
  return name.split(".").every((segment) => HIVE_ACCOUNT_SEGMENT.test(segment));
}
