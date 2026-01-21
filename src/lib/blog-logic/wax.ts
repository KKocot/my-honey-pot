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

