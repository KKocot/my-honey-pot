// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { CommunityOperation } from "@hiveio/wax";
import { configureEndpoints, getWax } from "@hiveio/workerbee/blog-logic";
import { HIVE_API_ENDPOINTS } from "../../lib/config";
import { getOnlineClient } from "../../lib/hbauth-service";
import { with_retry } from "../../lib/retry";

// Configure workerbee to use our custom Hive API endpoints
configureEndpoints(HIVE_API_ENDPOINTS);

// ============================================
// Community Props Update
// ============================================

export interface CommunityPropsUpdate {
  title: string;
  about: string;
  description: string;
  flag_text: string;
  lang: string;
  is_nsfw: boolean;
}

export interface BroadcastResult {
  success: boolean;
  error?: string;
}

// ============================================
// Shared broadcast helper
// ============================================

/**
 * Verify HB-Auth session, build transaction, sign and broadcast.
 * Extracts the repeated auth check + sign + broadcast + error handling
 * pattern shared by all community broadcast functions.
 */
async function broadcast_community_operation(
  username: string,
  build_operation: (op: CommunityOperation) => CommunityOperation,
  context_label: string
): Promise<BroadcastResult> {
  try {
    const chain = await getWax();
    const auth_client = await getOnlineClient();

    // Verify user is authenticated with HB-Auth
    const registered_user =
      await auth_client.getRegisteredUserByUsername(username);
    if (!registered_user) {
      throw new Error(
        "User not registered in HB-Auth. Please login first."
      );
    }

    if (!registered_user.unlocked) {
      throw new Error(
        "Wallet is locked. Please unlock with your password first."
      );
    }

    // Create transaction
    const tx = await chain.createTransaction();

    // Build and push the community operation
    tx.pushOperation(
      build_operation(new CommunityOperation()).authorize(username)
    );

    // Sign with HB-Auth (key never leaves IndexedDB)
    const digest = tx.sigDigest;
    const signature = await auth_client.sign(username, digest, "posting");
    tx.addSignature(signature);

    // Broadcast with retry logic
    await with_retry(async () => await chain.broadcast(tx), 3, 1000);

    return { success: true };
  } catch (error) {
    if (import.meta.env.DEV)
      console.error(`Failed to broadcast ${context_label}:`, error);

    let error_message =
      error instanceof Error ? error.message : "Unknown error";

    // Check for RC (Resource Credits) error
    if (
      error_message.includes("not_enough_rc") ||
      error_message.includes("RC mana")
    ) {
      error_message =
        "Not enough Resource Credits (RC). Please wait for RC to regenerate or power up more HIVE.";
    }

    // Check for HB-Auth errors
    if (
      error_message.includes("Not authorized") ||
      error_message.includes("not unlocked")
    ) {
      error_message = "Session expired. Please login again.";
    }

    // Check for permission errors
    if (
      error_message.includes("missing required posting authority") ||
      error_message.includes("not authorized")
    ) {
      error_message =
        "You do not have permission to perform this action. Only mods, admins and owners can moderate.";
    }

    return { success: false, error: error_message };
  }
}

// ============================================
// Community Props Update
// ============================================

/**
 * Broadcast community props update to Hive blockchain.
 * Uses CommunityOperation from @hiveio/wax SDK with HB-Auth signing.
 *
 * The user must be an admin or owner of the community.
 * Signing is done with the posting key via HB-Auth (key never leaves IndexedDB).
 */
export async function broadcast_update_community(
  community_name: string,
  admin_username: string,
  props: CommunityPropsUpdate
): Promise<BroadcastResult> {
  return broadcast_community_operation(
    admin_username,
    (op) =>
      op.updateProps(community_name, {
        title: props.title,
        about: props.about,
        description: props.description,
        flag_text: props.flag_text,
        lang: props.lang,
        is_nsfw: props.is_nsfw,
      }),
    "community props update"
  );
}

// ============================================
// Post Moderation: Pin / Unpin
// ============================================

/** Pin a post to the top of the community page */
export async function broadcast_pin_post(
  community: string,
  username: string,
  author: string,
  permlink: string
): Promise<BroadcastResult> {
  return broadcast_community_operation(
    username,
    (op) => op.pinPost(community, author, permlink),
    "pin post"
  );
}

/** Unpin a post from the community page */
export async function broadcast_unpin_post(
  community: string,
  username: string,
  author: string,
  permlink: string
): Promise<BroadcastResult> {
  return broadcast_community_operation(
    username,
    (op) => op.unpinPost(community, author, permlink),
    "unpin post"
  );
}

// ============================================
// Post Moderation: Mute / Unmute
// ============================================

/** Mute (gray out) a post in the community */
export async function broadcast_mute_post(
  community: string,
  username: string,
  author: string,
  permlink: string,
  notes: string
): Promise<BroadcastResult> {
  return broadcast_community_operation(
    username,
    (op) => op.mutePost(community, author, permlink, notes),
    "mute post"
  );
}

/** Unmute a previously muted post in the community */
export async function broadcast_unmute_post(
  community: string,
  username: string,
  author: string,
  permlink: string,
  notes: string
): Promise<BroadcastResult> {
  return broadcast_community_operation(
    username,
    (op) => op.unmutePost(community, author, permlink, notes),
    "unmute post"
  );
}
