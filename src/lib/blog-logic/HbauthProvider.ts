import type { TAccountName, IOnlineSignatureProvider, ITransaction } from "@hiveio/wax";
import type { OnlineClient, AuthStatus, AuthUser } from "@hiveio/hb-auth";
import type { IAuthenticationProvider, ILoginSession } from "./interfaces";
import { getOnlineClient } from "../hbauth-service";

// ============================================================================
// Types
// ============================================================================

export type KeyType = "posting" | "active";

export interface HbauthLoginOptions {
  /** Password to unlock the stored key */
  password: string;
  /** Which key type to use for signing */
  keyType: KeyType;
}

// ============================================================================
// HbauthSession - Implements ILoginSession
// ============================================================================

/**
 * Represents an authenticated session using Hbauth
 */
export class HbauthSession implements ILoginSession {
  public readonly authenticatedAccount: TAccountName;
  public readonly sessionId: string;
  public readonly keyType: KeyType;

  private authClient: OnlineClient;

  constructor(
    account: TAccountName,
    sessionId: string,
    keyType: KeyType,
    authClient: OnlineClient
  ) {
    this.authenticatedAccount = account;
    this.sessionId = sessionId;
    this.keyType = keyType;
    this.authClient = authClient;
  }

  /**
   * Logout and clear the session
   */
  public async logout(): Promise<void> {
    try {
      await this.authClient.logout(this.authenticatedAccount);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }
}

// ============================================================================
// HbauthSignatureProvider - Implements IOnlineSignatureProvider
// ============================================================================

/**
 * Signature provider that uses Hbauth for signing transactions
 * This bridges Hbauth with WAX's transaction signing interface
 */
export class HbauthSignatureProvider implements IOnlineSignatureProvider {
  private authClient: OnlineClient;
  private username: string;
  private keyType: KeyType;

  constructor(authClient: OnlineClient, username: string, keyType: KeyType) {
    this.authClient = authClient;
    this.username = username;
    this.keyType = keyType;
  }

  /**
   * Sign a transaction using Hbauth
   */
  public async signTransaction(transaction: ITransaction): Promise<void> {
    // Get the transaction digest/sigDigest from the transaction
    const sigDigest = transaction.sigDigest;

    // Sign using Hbauth
    const signature = await this.authClient.sign(
      this.username,
      sigDigest,
      this.keyType
    );

    // Add signature to transaction
    transaction.addSignature(signature);
  }
}

// ============================================================================
// HbauthProvider - Implements IAuthenticationProvider
// ============================================================================

/**
 * Authentication provider using Hbauth for Hive blockchain authentication
 */
export class HbauthProvider implements IAuthenticationProvider {
  private authClient: OnlineClient | null = null;

  /**
   * Get or initialize the Hbauth client
   */
  private async getClient(): Promise<OnlineClient> {
    if (!this.authClient) {
      this.authClient = await getOnlineClient();
    }
    return this.authClient;
  }

  /**
   * Check if a user has a key registered in Hbauth
   */
  public async hasStoredKey(account: TAccountName, keyType: KeyType): Promise<boolean> {
    const client = await this.getClient();
    const user = await client.getRegisteredUserByUsername(account);
    if (!user) return false;

    // Check if the requested key type is registered
    return user.registeredKeyTypes.includes(keyType);
  }

  /**
   * Register a new key in Hbauth
   * User must provide their private key (will be encrypted and stored locally)
   */
  public async registerKey(
    account: TAccountName,
    password: string,
    privateKey: string,
    keyType: KeyType
  ): Promise<AuthStatus> {
    const client = await this.getClient();
    return client.register(account, password, privateKey, keyType);
  }

  /**
   * Login using Hbauth
   *
   * @param account - Hive username
   * @param _signatureProvider - Not used directly; Hbauth handles signing internally
   * @param _directLogin - If true, expects key to be already registered
   * @param _sessionTimeout - Session timeout in milliseconds
   * @returns Login session
   */
  public async login(
    _account: TAccountName,
    _signatureProvider: IOnlineSignatureProvider,
    _directLogin: boolean,
    _sessionTimeout: number
  ): Promise<ILoginSession> {
    // For Hbauth, we need password-based authentication
    // The signatureProvider parameter is not used as Hbauth manages keys internally
    throw new Error(
      "Use loginWithPassword() instead of login() for Hbauth authentication"
    );
  }

  /**
   * Login with password (Hbauth-specific method)
   * This unlocks the locally stored key and creates a session
   */
  public async loginWithPassword(
    account: TAccountName,
    password: string,
    keyType: KeyType
  ): Promise<HbauthSession> {
    const client = await this.getClient();

    // Authenticate (unlock the key)
    const authStatus = await client.authenticate(account, password, keyType);

    if (!authStatus.ok) {
      throw authStatus.error || new Error("Authentication failed");
    }

    // Generate a session ID
    const sessionId = `hbauth_${account}_${Date.now()}`;

    return new HbauthSession(account, sessionId, keyType, client);
  }

  /**
   * Create a signature provider for signing transactions
   * Use this after successful login
   */
  public async createSignatureProvider(
    account: TAccountName,
    keyType: KeyType
  ): Promise<HbauthSignatureProvider> {
    const client = await this.getClient();
    return new HbauthSignatureProvider(client, account, keyType);
  }

  /**
   * Sign a challenge message for login verification
   * This is used for server-side session creation
   */
  public async signChallenge(
    account: TAccountName,
    challenge: string,
    keyType: KeyType
  ): Promise<string> {
    const client = await this.getClient();
    return client.sign(account, challenge, keyType);
  }

  /**
   * Get list of registered users in Hbauth
   */
  public async getRegisteredUsers(): Promise<AuthUser[]> {
    const client = await this.getClient();
    return client.getRegisteredUsers();
  }

  /**
   * Get a registered user by username
   */
  public async getRegisteredUser(account: TAccountName): Promise<AuthUser | null> {
    const client = await this.getClient();
    return client.getRegisteredUserByUsername(account);
  }

  /**
   * Check if user is currently authenticated (key unlocked)
   */
  public async isAuthenticated(account: TAccountName): Promise<boolean> {
    const client = await this.getClient();
    const user = await client.getRegisteredUserByUsername(account);
    return user?.unlocked === true;
  }

  /**
   * Lock all sessions (but keep keys registered)
   */
  public async lock(): Promise<void> {
    const client = await this.getClient();
    await client.lock();
  }

  /**
   * Logout a specific user
   */
  public async logout(account: TAccountName): Promise<void> {
    const client = await this.getClient();
    await client.logout(account);
  }

  /**
   * Logout all users
   */
  public async logoutAll(): Promise<void> {
    const client = await this.getClient();
    await client.logoutAll();
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

let hbauthProviderInstance: HbauthProvider | null = null;

/**
 * Get the singleton HbauthProvider instance
 */
export function getHbauthProvider(): HbauthProvider {
  if (!hbauthProviderInstance) {
    hbauthProviderInstance = new HbauthProvider();
  }
  return hbauthProviderInstance;
}
