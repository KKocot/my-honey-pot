import {
  createHiveChain,
  type TWaxExtended,
  type TWaxRestExtended
} from "@hiveio/wax";
import HafbeExtendedData from "@hiveio/wax-api-hafbe";
import WaxExtendedData from "@hiveio/wax-api-jsonrpc";
import { HIVE_API_ENDPOINTS } from "../config";

export type WaxExtendedChain = TWaxExtended<typeof WaxExtendedData, TWaxRestExtended<typeof HafbeExtendedData>>;

let chain: Promise<WaxExtendedChain>;
let currentEndpointIndex = 0;

async function createChainWithFallback(): Promise<WaxExtendedChain> {
  const endpoints = [...HIVE_API_ENDPOINTS];
  let lastError: Error | null = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpointIndex = (currentEndpointIndex + i) % endpoints.length;
    const endpoint = endpoints[endpointIndex];

    try {
      console.log(`Connecting to Hive API: ${endpoint}`)
      const hiveChain = await createHiveChain({ apiEndpoint: endpoint });
      const extendedChain = hiveChain.extend(WaxExtendedData).extendRest(HafbeExtendedData);

      // Update current endpoint index for next time (prefer working endpoint)
      currentEndpointIndex = endpointIndex;
      console.log(`Connected to Hive API: ${endpoint}`)

      return extendedChain;
    } catch (error) {
      console.warn(`Failed to connect to ${endpoint}:`, error instanceof Error ? error.message : error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error('Failed to connect to any Hive API endpoint');
}

export const getWax = () => {
  if (!chain) {
    chain = createChainWithFallback();
  }
  return chain;
};

// Reset chain to force reconnection (useful after timeout errors)
export const resetWax = () => {
  chain = undefined as unknown as Promise<WaxExtendedChain>;
  // Try next endpoint
  currentEndpointIndex = (currentEndpointIndex + 1) % HIVE_API_ENDPOINTS.length;
};

// Helper to execute API calls with automatic retry on timeout
export async function withRetry<T>(
  fn: (chain: WaxExtendedChain) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const waxChain = await getWax();
      return await fn(waxChain);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isTimeout = lastError.message.includes('timeout') || lastError.message.includes('Timeout');

      if (isTimeout && attempt < maxRetries - 1) {
        console.warn(`API request timed out (attempt ${attempt + 1}/${maxRetries}), switching endpoint...`);
        resetWax();
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (!isTimeout) {
        // Non-timeout error, don't retry
        throw lastError;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}
