// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { HIVE_API_ENDPOINT } from "./config";

/**
 * Get current API endpoint from localStorage (user-selected node) or config fallback.
 * Used by broadcast-chain, signer-relay, and hbauth-service.
 */
export function get_current_endpoint(): string {
  if (typeof window === 'object' && window.localStorage) {
    const stored = window.localStorage.getItem('hive-node-endpoint');
    if (stored) {
      try {
        return JSON.parse(stored) as string;
      } catch {
        // Ignore malformed value
      }
    }
  }
  return HIVE_API_ENDPOINT;
}
