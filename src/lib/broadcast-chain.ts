// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createHiveChain } from "@hiveio/wax";
import { HIVE_API_ENDPOINT, HIVE_CHAIN_ID } from "./config";

/**
 * Singleton chain for broadcast operations.
 * Uses createHiveChain directly (with chainId) instead of workerbee getWax()
 * because workerbee does not propagate chainId to createHiveChain,
 * causing wrong sigDigest on mirrornet/testnet.
 */
let broadcast_chain_promise: ReturnType<typeof createHiveChain> | undefined;

export function get_broadcast_chain() {
  if (!broadcast_chain_promise) {
    broadcast_chain_promise = createHiveChain({
      apiEndpoint: HIVE_API_ENDPOINT,
      chainId: HIVE_CHAIN_ID,
    }).catch((error) => {
      // Reset on failure so next call retries instead of returning rejected promise
      broadcast_chain_promise = undefined;
      throw error;
    });
  }
  return broadcast_chain_promise;
}

// Reset singleton on HMR to prevent stale connections in dev mode
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    broadcast_chain_promise = undefined;
  });
}
