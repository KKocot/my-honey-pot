// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Broadcast a new post (top-level comment) to the Hive blockchain.
 * Uses BlogPostOperation from @hiveio/wax which natively handles
 * comment_options (beneficiaries, percentHbd, maxAcceptedPayout).
 */

import { BlogPostOperation, ECommentFormat } from "@hiveio/wax";
import { get_broadcast_chain } from "../../../../lib/broadcast-chain";
import { sign_transaction } from "../../../../lib/transaction-signer";
import { with_retry } from "../../../../lib/retry";

// --- Types ---

export type RewardType = "50_50" | "power_up" | "decline";

export interface Beneficiary {
  account: string;
  weight: number; // percentage, e.g. 5 = 5%
}

export interface PostData {
  title: string;
  body: string;
  tags: string[];
  community?: string;
  summary?: string;
  reward_type: RewardType;
  beneficiaries: Beneficiary[];
}

export interface BroadcastResult {
  success: boolean;
  tx_id?: string;
  permlink?: string;
  error?: string;
}

// --- Helpers ---

/**
 * Generate a URL-safe permlink from a post title.
 * Lowercase, replace spaces/special chars with hyphens, append timestamp for uniqueness.
 */
export function slugify_title(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const timestamp = Date.now().toString(36);
  const base = slug.slice(0, 200) || "post";
  return `${base}-${timestamp}`;
}

/**
 * Extract image URLs from markdown body for json_metadata.
 * Matches common markdown image syntax and raw URLs ending in image extensions.
 */
function extract_images(body: string): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Markdown images: ![alt](url)
  const md_regex = /!\[[^\]]*]\(([^)]+)\)/g;
  let match = md_regex.exec(body);
  while (match) {
    const url = match[1].trim();
    if (url && !seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
    match = md_regex.exec(body);
  }

  // Raw image URLs (http(s)://....(jpg|png|gif|webp|jpeg))
  const url_regex =
    /https?:\/\/[^\s<>"'()]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s<>"'()]*)?/gi;
  match = url_regex.exec(body);
  while (match) {
    const url = match[0].trim();
    if (!seen.has(url)) {
      seen.add(url);
      images.push(url);
    }
    match = url_regex.exec(body);
  }

  return images;
}

// --- Main Broadcast Function ---

/**
 * Broadcast a new blog post to the Hive blockchain.
 *
 * Uses BlogPostOperation which automatically creates both the comment operation
 * and the comment_options operation (for beneficiaries, reward settings) in one go.
 *
 * Signs with the user's posting key (Keychain, WIF, or HB-Auth)
 * and broadcasts with retry logic.
 */
export async function broadcast_post(
  post: PostData,
  username: string,
  private_key: string,
): Promise<BroadcastResult> {
  try {
    const chain = await get_broadcast_chain();

    const permlink = slugify_title(post.title);
    const images = extract_images(post.body);

    // Resolve reward settings
    let percent_hbd = 10000; // default: 50/50
    let max_accepted_payout: number | undefined;

    if (post.reward_type === "power_up") {
      percent_hbd = 0;
    } else if (post.reward_type === "decline") {
      max_accepted_payout = 0;
    }

    // Build beneficiaries sorted alphabetically (Hive protocol requirement)
    const valid_beneficiaries = post.beneficiaries
      .filter((b) => b.account.trim() && b.weight > 0)
      .sort((a, b) => a.account.localeCompare(b.account))
      .map((b) => ({
        account: b.account.trim().toLowerCase(),
        weight: Math.round(b.weight * 100), // percentage to basis points (5% -> 500)
      }));

    // Create transaction
    const tx = await chain.createTransaction();

    // BlogPostOperation handles both comment + comment_options natively.
    // Setting beneficiaries, percentHbd, maxAcceptedPayout on IArticle/ICommentData
    // automatically generates the comment_options operation during finalize.
    tx.pushOperation(
      new BlogPostOperation({
        category: post.community || post.tags[0],
        author: username,
        permlink,
        title: post.title,
        body: post.body,
        jsonMetadata: {
          tags: post.tags,
          app: "my-honey-pot/1.0",
          format: "markdown",
          ...(images.length > 0 ? { image: images } : {}),
          ...(post.summary?.trim() ? { description: post.summary.trim() } : {}),
        },
        tags: post.tags,
        description: post.summary?.trim(),
        images,
        format: ECommentFormat.MARKDOWN,
        percentHbd: percent_hbd,
        ...(max_accepted_payout !== undefined
          ? { maxAcceptedPayout: max_accepted_payout }
          : {}),
        ...(valid_beneficiaries.length > 0
          ? { beneficiaries: valid_beneficiaries }
          : {}),
      }),
    );

    // Sign transaction (Keychain / WIF / HB-Auth)
    await sign_transaction(tx, username, private_key);

    // Broadcast with retry (max 3 attempts, 1s initial delay, exponential backoff)
    await with_retry(async () => await chain.broadcast(tx), 3, 1000);

    return {
      success: true,
      tx_id: tx.id,
      permlink,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[broadcast-post] Failed:", err.message);
    }

    let error_message =
      error instanceof Error ? error.message : "Unknown error";

    // User-friendly error messages
    if (
      error_message.includes("not_enough_rc") ||
      error_message.includes("RC mana")
    ) {
      error_message =
        "Not enough Resource Credits (RC). Please wait for RC to regenerate or power up more HIVE.";
    }

    if (
      error_message.includes("Not authorized") ||
      error_message.includes("not unlocked")
    ) {
      error_message = "Session expired. Please login again.";
    }

    if (error_message.includes("STEEM_MIN_REPLY_INTERVAL")) {
      error_message =
        "You are posting too quickly. Please wait a few seconds and try again.";
    }

    return {
      success: false,
      error: error_message,
    };
  }
}
