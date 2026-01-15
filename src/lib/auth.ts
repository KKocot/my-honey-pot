import { getHiveChain, getHiveAccount, type DatabaseAccount } from './hive';
import { KeyType } from './session';

// ============================================================================
// Types
// ============================================================================

/** Authority structure from Hive account */
interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

/** Login request data */
export interface LoginRequest {
  username: string;
  signature: string;
  message: string;
  keyType: KeyType;
}

/** Verification result */
export interface VerificationResult {
  valid: boolean;
  username: string;
  keyType: KeyType;
  error?: string;
}

// ============================================================================
// Signature Verification
// ============================================================================

/**
 * Verify a signature against a Hive account's public keys
 *
 * @param username - Hive username
 * @param signature - The signature to verify
 * @param message - The message that was signed
 * @param keyType - Which key type to verify against (posting or active)
 * @returns Verification result
 */
export async function verifyHiveSignature(
  username: string,
  signature: string,
  message: string,
  keyType: KeyType
): Promise<VerificationResult> {
  try {
    // Get the Hive chain instance
    const chain = await getHiveChain();

    // Get the user's account to retrieve their public keys
    const account = await getHiveAccount(username);

    if (!account) {
      return {
        valid: false,
        username,
        keyType,
        error: `Account "${username}" not found on Hive blockchain`,
      };
    }

    // Get the authority for the requested key type
    const authority = account[keyType] as Authority;

    if (!authority || !authority.key_auths || authority.key_auths.length === 0) {
      return {
        valid: false,
        username,
        keyType,
        error: `No ${keyType} keys found for account "${username}"`,
      };
    }

    // Recover the public key from the signature
    // The message needs to be hashed the same way hbauth does it
    let recoveredPubkey: string;
    try {
      recoveredPubkey = chain.getPublicKeyFromSignature(message, signature);
    } catch (err) {
      return {
        valid: false,
        username,
        keyType,
        error: 'Invalid signature format',
      };
    }

    // Check if the recovered public key matches any of the account's keys
    const accountPubkeys = authority.key_auths.map(([pubkey]) => pubkey);
    const isValid = accountPubkeys.includes(recoveredPubkey);

    if (!isValid) {
      return {
        valid: false,
        username,
        keyType,
        error: 'Signature does not match any known public key for this account',
      };
    }

    return {
      valid: true,
      username,
      keyType,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return {
      valid: false,
      username,
      keyType,
      error: `Verification failed: ${errorMessage}`,
    };
  }
}

/**
 * Get user's avatar URL from Hive
 */
export function getAvatarUrl(username: string): string {
  return `https://images.hive.blog/u/${username}/avatar`;
}

/**
 * Validate login request data
 */
export function validateLoginRequest(data: unknown): LoginRequest | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const { username, signature, message, keyType } = data as Record<string, unknown>;

  if (typeof username !== 'string' || !username.trim()) {
    return null;
  }

  if (typeof signature !== 'string' || !signature.trim()) {
    return null;
  }

  if (typeof message !== 'string') {
    return null;
  }

  if (keyType !== KeyType.posting && keyType !== KeyType.active) {
    return null;
  }

  return {
    username: username.trim().toLowerCase(),
    signature: signature.trim(),
    message,
    keyType,
  };
}
