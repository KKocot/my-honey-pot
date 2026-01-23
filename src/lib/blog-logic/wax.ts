import {
  createHiveChain,
  type TWaxExtended,
  type TWaxRestExtended
} from "@hiveio/wax";
import HafbeExtendedData from "@hiveio/wax-api-hafbe";
import WaxExtendedData from "@hiveio/wax-api-jsonrpc";
import { HIVE_API_ENDPOINTS } from "../config";

export type WaxExtendedChain = TWaxExtended<typeof WaxExtendedData, TWaxRestExtended<typeof HafbeExtendedData>>;

// Chain state management - use null instead of undefined to avoid type casting
let chainPromise: Promise<WaxExtendedChain> | null = null;
let currentEndpointIndex = 0;
// Version counter to detect stale chains after reset
let chainVersion = 0;

async function createChainWithFallback(): Promise<WaxExtendedChain> {
  const endpoints = [...HIVE_API_ENDPOINTS];
  let lastError: Error | null = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpointIndex = (currentEndpointIndex + i) % endpoints.length;
    const endpoint = endpoints[endpointIndex];

    try {
      const hiveChain = await createHiveChain({ apiEndpoint: endpoint });
      const extendedChain = hiveChain.extend(WaxExtendedData).extendRest(HafbeExtendedData);

      // Update current endpoint index for next time (prefer working endpoint)
      currentEndpointIndex = endpointIndex;

      return extendedChain;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Failed to connect to any Hive API endpoint');
}

/**
 * Get or create the Wax chain instance.
 * Thread-safe: multiple concurrent calls will share the same promise.
 */
export const getWax = (): Promise<WaxExtendedChain> => {
  if (!chainPromise) {
    chainPromise = createChainWithFallback();
  }
  return chainPromise;
};

/**
 * Reset chain to force reconnection (useful after timeout errors).
 * Thread-safe: increments version to invalidate any pending operations.
 */
export const resetWax = (): void => {
  // Increment version to signal that old chain is stale
  chainVersion++;
  // Clear the promise so next getWax() creates a new chain
  chainPromise = null;
  // Try next endpoint
  currentEndpointIndex = (currentEndpointIndex + 1) % HIVE_API_ENDPOINTS.length;
};

/**
 * Get current chain version (useful for detecting stale operations).
 */
export const getChainVersion = (): number => chainVersion;

