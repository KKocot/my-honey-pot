import {
  createHiveChain,
  type TWaxExtended,
  type TWaxRestExtended
} from "@hiveio/wax";
import HafbeExtendedData from "@hiveio/wax-api-hafbe";
import WaxExtendedData from "@hiveio/wax-api-jsonrpc";
import { HIVE_API_ENDPOINTS } from "../config";

export type WaxExtendedChain = TWaxExtended<typeof WaxExtendedData, TWaxRestExtended<typeof HafbeExtendedData>>;

/**
 * Manages Wax chain instances with endpoint fallback and reconnection logic.
 * Encapsulates all mutable state within a class instance.
 */
class WaxChainManager {
  private chain_promise: Promise<WaxExtendedChain> | null = null;
  private current_endpoint_index = 0;
  private chain_version = 0;
  private last_reset_time = 0;
  private readonly RESET_COOLDOWN_MS = 1000;

  /**
   * Creates a new chain instance with automatic endpoint fallback.
   */
  private async create_chain_with_fallback(): Promise<WaxExtendedChain> {
    const endpoints = [...HIVE_API_ENDPOINTS];
    let last_error: Error | null = null;

    for (let i = 0; i < endpoints.length; i++) {
      const endpoint_index = (this.current_endpoint_index + i) % endpoints.length;
      const endpoint = endpoints[endpoint_index];

      try {
        const hive_chain = await createHiveChain({ apiEndpoint: endpoint });
        const extended_chain = hive_chain.extend(WaxExtendedData).extendRest(HafbeExtendedData);

        // Update current endpoint index for next time (prefer working endpoint)
        this.current_endpoint_index = endpoint_index;

        return extended_chain;
      } catch (error) {
        last_error = error instanceof Error ? error : new Error(String(error));
      }
    }

    throw last_error || new Error('Failed to connect to any Hive API endpoint');
  }

  /**
   * Get or create the Wax chain instance.
   * Thread-safe: multiple concurrent calls will share the same promise.
   */
  public get_chain(): Promise<WaxExtendedChain> {
    if (!this.chain_promise) {
      this.chain_promise = this.create_chain_with_fallback();
    }
    return this.chain_promise;
  }

  /**
   * Reset chain to force reconnection (useful after timeout errors).
   * Thread-safe: increments version to invalidate any pending operations.
   * Rate-limited to prevent abuse.
   */
  public reset(): void {
    const now = Date.now();
    if (now - this.last_reset_time < this.RESET_COOLDOWN_MS) {
        return;
    }
    this.last_reset_time = now;

    // Increment version to signal that old chain is stale
    this.chain_version++;
    // Clear the promise so next get_chain() creates a new chain
    this.chain_promise = null;
    // Try next endpoint
    this.current_endpoint_index = (this.current_endpoint_index + 1) % HIVE_API_ENDPOINTS.length;
  }

  /**
   * Get current chain version (useful for detecting stale operations).
   */
  public get_chain_version(): number {
    return this.chain_version;
  }
}

// Export singleton instance
export const wax_chain_manager = new WaxChainManager();

// Backward-compatible exports
export const getWax = (): Promise<WaxExtendedChain> => wax_chain_manager.get_chain();
export const resetWax = (): void => wax_chain_manager.reset();
export const getChainVersion = (): number => wax_chain_manager.get_chain_version();

