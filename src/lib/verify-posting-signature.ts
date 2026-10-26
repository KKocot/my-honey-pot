// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { ApiAuthority, FindAccountsRequest, FindAccountsResponse } from "@hiveio/wax";
import { get_broadcast_chain } from "./broadcast-chain";

export type PostingVerificationFailure =
  | "account_not_found"
  | "invalid_signature"
  | "public_key_mismatch"
  | "key_not_in_posting_authority"
  | "insufficient_key_weight";

export type PostingVerificationResult =
  | { ok: true; public_key: string }
  | { ok: false; reason: PostingVerificationFailure };

export interface PostingSignatureInput {
  username: string;
  message: string;
  signature: string;
  public_key?: string;
}

export interface PostingVerifierChain {
  getPublicKeyFromSignature(sigDigest: string, signature: string): string;
  api: {
    database_api: {
      find_accounts(params: FindAccountsRequest): Promise<FindAccountsResponse>;
    };
  };
}

// Compare without the address prefix (STM/TST) so the check works on mirrornet/testnet too.
function strip_prefix(public_key: string): string {
  return public_key.slice(3);
}

async function sha256_hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function recover_public_key(
  chain: PostingVerifierChain,
  digest: string,
  signature: string
): string | null {
  try {
    return chain.getPublicKeyFromSignature(digest, signature);
  } catch {
    return null;
  }
}

/**
 * Single-key login: the recovered key must be in posting.key_auths and alone meet weight_threshold.
 * account_auths are not supported (ADR 6ac5e13663221e857a3ba929).
 */
function check_posting_authority(
  posting: ApiAuthority,
  public_key: string
): PostingVerificationFailure | null {
  const key = strip_prefix(public_key);
  const key_auth = posting.key_auths.find((entry) => strip_prefix(entry[0]) === key);
  if (!key_auth) return "key_not_in_posting_authority";
  if (key_auth[1] < posting.weight_threshold) return "insufficient_key_weight";
  return null;
}

/**
 * Verifies a Keychain signBuffer signature (sha256 of the message) against the account's posting authority.
 * Network errors from the account lookup are rethrown.
 */
export async function verify_posting_signature(
  input: PostingSignatureInput,
  chain?: PostingVerifierChain
): Promise<PostingVerificationResult> {
  const active_chain: PostingVerifierChain = chain ?? (await get_broadcast_chain());

  const digest = await sha256_hex(input.message);
  const recovered_key = recover_public_key(active_chain, digest, input.signature);
  if (!recovered_key) return { ok: false, reason: "invalid_signature" };

  if (input.public_key && strip_prefix(input.public_key) !== strip_prefix(recovered_key)) {
    return { ok: false, reason: "public_key_mismatch" };
  }

  const { accounts } = await active_chain.api.database_api.find_accounts({
    accounts: [input.username],
  });
  const account = accounts.find((entry) => entry.name === input.username);
  if (!account) return { ok: false, reason: "account_not_found" };

  const failure = check_posting_authority(account.posting, recovered_key);
  if (failure) return { ok: false, reason: failure };

  return { ok: true, public_key: recovered_key };
}
