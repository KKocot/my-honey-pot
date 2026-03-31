// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Shared transaction signing logic.
 * Detects signing method (Keychain, WIF, HB-Auth) based on the privateKey marker
 * and signs the transaction accordingly.
 */

import KeychainProvider from "@hiveio/wax-signers-keychain";
import { getOnlineClient } from "./hbauth-service";
import { is_raw_wif, sign_with_wif } from "./wif-signer";
import { KEYCHAIN_MANAGED_MARKER } from "../components/auth/constants";

interface SignableTransaction {
  sigDigest: string;
  addSignature(signature: unknown): void;
}

interface KeychainSignableTransaction extends SignableTransaction {
  // KeychainProvider.signTransaction accepts the full tx object
}

/**
 * Sign a transaction using the appropriate method based on the private key value.
 *
 * - KEYCHAIN_MANAGED_MARKER: delegates to Hive Keychain extension
 * - Raw WIF string: signs via in-memory beekeeper
 * - Otherwise: assumes HB-Auth managed key in IndexedDB
 */
export async function sign_transaction(
  tx: KeychainSignableTransaction,
  username: string,
  private_key: string
): Promise<void> {
  if (private_key === KEYCHAIN_MANAGED_MARKER) {
    const provider = KeychainProvider.for(username, "posting");
    await provider.signTransaction(tx);
    return;
  }

  if (is_raw_wif(private_key)) {
    const digest = tx.sigDigest;
    const signature = await sign_with_wif(private_key, digest);
    tx.addSignature(signature);
    return;
  }

  // HB-Auth signing (production mode -- key managed in IndexedDB)
  const auth_client = await getOnlineClient();
  const registered_user =
    await auth_client.getRegisteredUserByUsername(username);
  if (!registered_user) {
    throw new Error("User not registered in HB-Auth. Please login first.");
  }
  if (!registered_user.unlocked) {
    throw new Error(
      "Wallet is locked. Please unlock with your password first."
    );
  }
  const digest = tx.sigDigest;
  const signature = await auth_client.sign(username, digest, "posting");
  tx.addSignature(signature);
}
