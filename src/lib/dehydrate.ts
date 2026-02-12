// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { dehydrate, type QueryClient } from "@tanstack/solid-query";

/**
 * Dehydrates TanStack QueryClient state to a JSON string safe for SSR transfer.
 * Handles bigint serialization and circular references.
 */
export function dehydrate_to_json(query_client: QueryClient): string {
  const raw_state = dehydrate(query_client);
  const seen = new WeakSet();
  return JSON.stringify(raw_state, (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  });
}
