// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * External signer relay for Hive transactions.
 * Sends unsigned operations to the signer app (hive-signer) which handles
 * key management and signing, then polls for the result.
 *
 * Based on beeyard signer_client.ts pattern.
 */

import { HIVE_CHAIN_ID, HIVE_SIGNER_URL } from "./config";
import { get_current_endpoint } from "./node-endpoint";

// --- Constants ---

const POLL_INITIAL_INTERVAL_MS = 2000;
const POLL_MAX_INTERVAL_MS = 15000;
const POLL_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// --- Types ---

/** Key type used for signing the transaction */
export type SigningKeyType = "Posting" | "Active" | "Owner";

/** Raw Hive operation tuple: [operation_name, params] */
export type HiveOperation = [string, Record<string, unknown>];

/** Payload sent to the signer app to create a signing request */
export interface CreateRequestPayload {
  username: string;
  operation: HiveOperation;
  key_type: SigningKeyType;
  description: string;
  tx_type: string;
  query_keys: string[][];
  api_node?: string;
  chain_id?: string;
}

/** Response from POST /api/signing-request */
interface CreateResponse {
  request_id: string;
}

/** Response from GET /api/signing-result/{request_id} */
interface PollResponse {
  status: "pending" | "completed" | "expired" | "rejected";
  transaction_id?: string;
  error?: string;
}

/** Final result returned to the caller */
export interface SignerResult {
  success: boolean;
  transaction_id?: string;
  error?: string;
}

// --- Type Guards ---

/** Check if response matches CreateResponse shape */
function is_create_response(data: unknown): data is CreateResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as CreateResponse).request_id === "string"
  );
}

/** Check if response matches PollResponse shape */
function is_poll_response(data: unknown): data is PollResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as PollResponse).status === "string" &&
    ["pending", "completed", "expired", "rejected"].includes(
      (data as PollResponse).status,
    )
  );
}

// --- Helpers ---

/** Promise-based sleep */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Try to close a window/tab reference (best-effort, browsers may block this) */
function try_close_tab(tab: Window | null): void {
  try {
    if (tab && !tab.closed) {
      tab.close();
    }
  } catch {
    // Ignore -- cross-origin or already closed
  }
}

// --- Main Relay Function ---

/**
 * Send operations to the external signer app and wait for the signed result.
 *
 * Flow:
 * 1. POST operations to signer API to create a signing request
 * 2. Open the signer UI in a new tab for the user to approve
 * 3. Poll for the result with exponential backoff
 * 4. Return the transaction ID or error
 */
export async function request_external_sign(
  payload: {
    username: string;
    operation: HiveOperation;
    key_type: SigningKeyType;
    description: string;
    tx_type: string;
  },
): Promise<SignerResult> {
  const request_payload: CreateRequestPayload = {
    username: payload.username,
    operation: payload.operation,
    key_type: payload.key_type,
    description: payload.description,
    tx_type: payload.tx_type,
    query_keys: [],
    api_node: get_current_endpoint(),
    chain_id: HIVE_CHAIN_ID,
  };

  // Step 1: Create signing request
  let create_data: CreateResponse;
  try {
    const response = await fetch(
      `${HIVE_SIGNER_URL}/api/signing-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request_payload),
      },
    );

    if (!response.ok) {
      const error_text = await response.text().catch(() => "Unknown error");
      return { success: false, error: `Signer API error: ${response.status} ${error_text}` };
    }

    const data: unknown = await response.json();
    if (!is_create_response(data)) {
      return { success: false, error: "Invalid response from signer API" };
    }
    create_data = data;
  } catch (err) {
    return {
      success: false,
      error: `Failed to reach signer: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Step 2: Open signer UI in new tab
  const { request_id } = create_data;
  const signer_tab = window.open(
    `${HIVE_SIGNER_URL}/sign?request_id=${encodeURIComponent(request_id)}`,
    "_blank",
  );

  if (!signer_tab || signer_tab.closed) {
    return { success: false, error: "Could not open signer window. Please disable your popup blocker for this site and try again." };
  }

  // Step 3: Poll for result with exponential backoff
  const start_time = Date.now();
  let interval = POLL_INITIAL_INTERVAL_MS;

  while (Date.now() - start_time < POLL_TIMEOUT_MS) {
    await sleep(interval);

    try {
      const poll_response = await fetch(
        `${HIVE_SIGNER_URL}/api/signing-result/${request_id}`,
      );

      if (!poll_response.ok) {
        // Transient error, keep polling
        interval = Math.min(interval * 2, POLL_MAX_INTERVAL_MS);
        continue;
      }

      const poll_data: unknown = await poll_response.json();
      if (!is_poll_response(poll_data)) {
        interval = Math.min(interval * 2, POLL_MAX_INTERVAL_MS);
        continue;
      }

      if (poll_data.status === "completed") {
        try_close_tab(signer_tab);
        return {
          success: true,
          transaction_id: poll_data.transaction_id,
        };
      }

      if (poll_data.status === "rejected") {
        try_close_tab(signer_tab);
        return {
          success: false,
          error: poll_data.error || "User rejected the transaction",
        };
      }

      if (poll_data.status === "expired") {
        try_close_tab(signer_tab);
        return { success: false, error: "Signing request expired" };
      }

      // status === "pending" -- keep polling
      interval = Math.min(interval * 2, POLL_MAX_INTERVAL_MS);
    } catch {
      // Network error, keep polling with backoff
      interval = Math.min(interval * 2, POLL_MAX_INTERVAL_MS);
    }
  }

  // Timeout reached
  try_close_tab(signer_tab);
  return { success: false, error: "Signing request timed out after 15 minutes" };
}

// --- Convenience Functions ---

/**
 * Sign a vote operation via the external signer.
 * @param voter - Hive username casting the vote
 * @param author - Author of the post/comment being voted on
 * @param permlink - Permlink of the post/comment
 * @param weight - Vote weight (-10000 to 10000, where 10000 = 100%)
 */
export function sign_vote(
  voter: string,
  author: string,
  permlink: string,
  weight: number,
): Promise<SignerResult> {
  return request_external_sign({
    username: voter,
    operation: ["vote", { voter, author, permlink, weight }],
    key_type: "Posting",
    description: `Vote on @${author}/${permlink}`,
    tx_type: "vote",
  });
}

/**
 * Sign a comment operation via the external signer.
 * Used for both top-level posts and replies.
 * @param author - Hive username authoring the comment
 * @param permlink - Permlink for this comment
 * @param parent_author - Parent author ("" for top-level posts)
 * @param parent_permlink - Parent permlink (category tag for top-level posts)
 * @param title - Post title ("" for replies)
 * @param body - Comment/post body content
 * @param json_metadata - JSON string with metadata (tags, app, format, etc.)
 */
export function sign_comment(
  author: string,
  permlink: string,
  parent_author: string,
  parent_permlink: string,
  title: string,
  body: string,
  json_metadata: string,
): Promise<SignerResult> {
  return request_external_sign({
    username: author,
    operation: [
      "comment",
      {
        author,
        permlink,
        parent_author,
        parent_permlink,
        title,
        body,
        json_metadata,
      },
    ],
    key_type: "Posting",
    description: `Comment on @${parent_author}/${parent_permlink}`,
    tx_type: "comment",
  });
}
