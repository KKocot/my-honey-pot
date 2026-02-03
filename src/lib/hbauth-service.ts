import { OnlineClient, OfflineClient, type ClientOptions } from '@hiveio/hb-auth';

// ============================================================================
// Configuration
// ============================================================================

/** Default Hive API endpoint - matches the one in hive.ts */
const DEFAULT_HIVE_ENDPOINT = 'https://api.openhive.network';

/** Default session timeout in milliseconds (24 hours) */
const DEFAULT_SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

/** Hive mainnet chain ID */
const HIVE_CHAIN_ID = 'beeab0de00000000000000000000000000000000000000000000000000000000';

// ============================================================================
// Worker URL Resolution
// ============================================================================

/**
 * Get the worker URL with proper path handling
 * Worker must be served from /auth/worker.js in the public directory
 */
function getWorkerUrl(): string {
  // Server-side: return default path
  if (typeof window === 'undefined') {
    return '/auth/worker.js';
  }

  // Client-side: use relative path (Astro serves from public/)
  return '/auth/worker.js';
}

// ============================================================================
// Client Options
// ============================================================================

/**
 * Get default client options for Hbauth
 * Checks localStorage for user-selected node endpoint
 */
function getDefaultClientOptions(): ClientOptions {
  let node: string | undefined = undefined;

  // Check if user has selected a custom node in localStorage
  if (typeof window === 'object' && window.localStorage) {
    const storedNode = window.localStorage.getItem('hive-node-endpoint');
    if (storedNode) {
      try {
        node = JSON.parse(storedNode);
      } catch (err) {
        console.error('Error parsing stored hive-node-endpoint from localStorage:', err);
      }
    }
  }

  return {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    chainId: HIVE_CHAIN_ID,
    node: node || DEFAULT_HIVE_ENDPOINT,
    workerUrl: getWorkerUrl(),
  };
}

// ============================================================================
// Singleton Instances
// ============================================================================

let onlineClientPromise: Promise<OnlineClient> | undefined = undefined;
let onlineClient: OnlineClient | undefined = undefined;
let offlineClientPromise: Promise<OfflineClient> | undefined = undefined;

// Reset on HMR in dev mode
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    onlineClientPromise = undefined;
    onlineClient = undefined;
    offlineClientPromise = undefined;
  });
}

// ============================================================================
// Online Client (for browser with network access)
// ============================================================================

/**
 * Create and initialize an OnlineClient
 * This is intentionally non-async to prevent race conditions
 */
function setOnlineClient(options: Partial<ClientOptions> = {}): Promise<OnlineClient> {
  const clientOptions = {
    ...getDefaultClientOptions(),
    ...options,
  };

  const sanitized_options = {
    ...clientOptions,
    node: clientOptions.node ? '[REDACTED]' : undefined
  };
  console.info('Creating instance of HB-Auth OnlineClient with options:', sanitized_options);

  onlineClientPromise = new OnlineClient(clientOptions).initialize();

  return onlineClientPromise.then((client) => {
    onlineClient = client;
    return client;
  });
}

/**
 * Initialize the OnlineClient singleton
 * Use this to eagerly initialize the client on app startup
 */
export function initOnlineClient(): Promise<OnlineClient> {
  if (onlineClientPromise) {
    return onlineClientPromise;
  }

  return setOnlineClient();
}

/**
 * Get the OnlineClient singleton, creating it if necessary
 * This is the main entry point for authentication operations
 */
export function getOnlineClient(): Promise<OnlineClient> {
  if (onlineClientPromise) {
    return onlineClientPromise;
  }

  return setOnlineClient();
}

/**
 * Interface for the internal structure of OnlineClient
 * Used to access hiveChain.api.endpointUrl property
 */
interface OnlineClientWithHiveChain {
  hiveChain: {
    api: {
      endpointUrl: string;
    };
  };
}

/**
 * Type guard to check if an object has the hiveChain structure
 */
function hasHiveChainApi(client: unknown): client is OnlineClientWithHiveChain {
  if (typeof client !== 'object' || client === null) return false;
  if (!('hiveChain' in client)) return false;

  const hiveChain = (client as { hiveChain: unknown }).hiveChain;
  if (typeof hiveChain !== 'object' || hiveChain === null) return false;
  if (!('api' in hiveChain)) return false;

  const api = (hiveChain as { api: unknown }).api;
  return typeof api === 'object' && api !== null;
}

/**
 * Update the RPC endpoint for the OnlineClient
 * Requires the client to be initialized first
 */
export function setOnlineClientRpcEndpoint(newEndpoint: string): void {
  if (!onlineClient) {
    throw new Error('OnlineClient is not initialized yet. Call initOnlineClient() first.');
  }

  if (!hasHiveChainApi(onlineClient)) {
    throw new Error('OnlineClient does not have the expected hiveChain.api structure.');
  }

  // Update the endpoint on the underlying hive chain
  onlineClient.hiveChain.api.endpointUrl = newEndpoint;
}

// ============================================================================
// Offline Client (for signing without network)
// ============================================================================

/**
 * Create and initialize an OfflineClient
 * This is intentionally non-async to prevent race conditions
 */
function setOfflineClient(options: Partial<ClientOptions> = {}): Promise<OfflineClient> {
  const clientOptions = {
    ...getDefaultClientOptions(),
    ...options,
  };

  const sanitized_options = {
    ...clientOptions,
    node: clientOptions.node ? '[REDACTED]' : undefined
  };
  console.info('Creating instance of HB-Auth OfflineClient with options:', sanitized_options);

  offlineClientPromise = new OfflineClient(clientOptions).initialize();

  return offlineClientPromise;
}

/**
 * Get the OfflineClient singleton, creating it if necessary
 * Use this for offline signing operations
 */
export function getOfflineClient(): Promise<OfflineClient> {
  if (offlineClientPromise) {
    return offlineClientPromise;
  }

  return setOfflineClient();
}

// ============================================================================
// Type Re-exports
// ============================================================================

export type { OnlineClient, OfflineClient, ClientOptions };
