// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Direct WIF signing via @hiveio/beekeeper.
 * Used for mirrornet/testnet dev flows where HB-Auth is not available.
 * Creates an in-memory beekeeper instance, imports the WIF, signs, and cleans up.
 */

import createBeekeeper, {
  type IBeekeeperInstance,
  type TSignature,
} from "@hiveio/beekeeper";

export const HBAUTH_MANAGED_MARKER = "__HBAUTH_MANAGED__";

/** Check whether a privateKey value represents a raw WIF (not HB-Auth managed) */
export function is_raw_wif(private_key: string): boolean {
  return private_key !== HBAUTH_MANAGED_MARKER;
}

/** Validate WIF format (basic check: starts with '5', 51 chars) */
export function is_valid_wif(wif: string): boolean {
  return wif.startsWith("5") && wif.length === 51;
}

/**
 * Sign a transaction digest with a raw WIF key using beekeeper (in-memory).
 * Caller is responsible for ensuring `wif` is a valid WIF string.
 *
 * @returns hex signature string compatible with `tx.addSignature()`
 */
export async function sign_with_wif(
  wif: string,
  sig_digest: string
): Promise<TSignature> {
  let bk: IBeekeeperInstance | null = null;

  try {
    bk = await createBeekeeper({ inMemory: true });
    const session = bk.createSession(crypto.randomUUID());
    const { wallet } = await session.createWallet("wif_signer", undefined, true);
    const public_key = await wallet.importKey(wif);
    const signature = await wallet.signDigest(public_key, sig_digest);

    // Cleanup
    session.close();

    return signature;
  } finally {
    if (bk) {
      await bk.delete();
    }
  }
}
