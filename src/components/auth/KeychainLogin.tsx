// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, onMount } from "solid-js";
import KeychainProvider from "@hiveio/wax-signers-keychain";

import { KEYCHAIN_MANAGED_MARKER, is_valid_hive_username } from "./constants";
import { ErrorIcon, SpinnerIcon, KeychainIcon, WarningIcon } from "./icons";
import {
  verify_posting_signature,
  type PostingVerificationFailure,
} from "../../lib/verify-posting-signature";

interface KeychainResponse {
  success: boolean;
  error?: string;
  message?: string;
  result?: unknown;
  publicKey?: string;
}

declare global {
  interface Window {
    hive_keychain?: {
      requestSignBuffer: (
        username: string,
        message: string,
        key_type: string,
        callback: (response: KeychainResponse) => void
      ) => void;
    };
  }
}

interface KeychainLoginProps {
  onSuccess?: (user: {
    username: string;
    privateKey: string;
    keyType: "posting" | "active";
    loginType: "keychain";
  }) => void;
  onError?: (error: Error) => void;
  class?: string;
}

const KEYCHAIN_TIMEOUT_MS = 60_000;
const KEYCHAIN_DETECT_TIMEOUT_MS = 1_500;
const KEYCHAIN_DETECT_INTERVAL_MS = 100;

const VERIFICATION_ERRORS: Record<PostingVerificationFailure, string> = {
  account_not_found: "Account not found on the Hive blockchain.",
  invalid_signature: "Keychain returned an invalid signature. Please try again.",
  public_key_mismatch: "Keychain signature does not match the reported key.",
  key_not_in_posting_authority:
    "The signing key is not a posting key of this account. Use your posting key.",
  insufficient_key_weight:
    "This account's posting authority requires multiple signatures, which is not supported.",
};

type KeychainStatus = "checking" | "available" | "missing";

export function has_keychain(): boolean {
  return (
    typeof window === "object" &&
    KeychainProvider.isExtensionInstalled()
  );
}

/** The extension injects window.hive_keychain asynchronously, so a single check right after load can miss it. */
export async function wait_for_keychain(
  timeout_ms = KEYCHAIN_DETECT_TIMEOUT_MS
): Promise<boolean> {
  const deadline = Date.now() + timeout_ms;
  while (!has_keychain()) {
    if (Date.now() >= deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, KEYCHAIN_DETECT_INTERVAL_MS));
  }
  return true;
}

export function KeychainLogin(props: KeychainLoginProps) {
  const [username, setUsername] = createSignal("");
  const [is_loading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [keychain_status, setKeychainStatus] = createSignal<KeychainStatus>("checking");

  let username_ref: HTMLInputElement | undefined;

  onMount(async () => {
    const available = await wait_for_keychain();
    setKeychainStatus(available ? "available" : "missing");
    if (available) username_ref?.focus();
  });

  function is_submit_disabled(): boolean {
    return !username().trim() || is_loading();
  }

  async function handle_keychain_login() {
    if (is_loading()) return;

    const user = username().trim().toLowerCase();

    if (!user) {
      setError("Please enter your username");
      return;
    }

    if (!is_valid_hive_username(user)) {
      setError(
        "Invalid username format. Must be 3-16 characters: lowercase letters, digits, hyphens and dots."
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    if (!(await wait_for_keychain())) {
      setIsLoading(false);
      setKeychainStatus("missing");
      return;
    }

    const message = `my-honey-pot login ${user} ${Date.now()} ${crypto.randomUUID()}`;

    try {
      const keychain_promise = new Promise<KeychainResponse>(
        (resolve, reject) => {
          const keychain = window.hive_keychain;
          if (!keychain) {
            reject(new Error("Hive Keychain extension not available"));
            return;
          }
          keychain.requestSignBuffer(
            user,
            message,
            "Posting",
            (result: KeychainResponse) => {
              resolve(result);
            }
          );
        }
      );

      let timeout_id: ReturnType<typeof setTimeout> | undefined;
      const timeout_promise = new Promise<never>((_, reject) => {
        timeout_id = setTimeout(
          () => reject(new Error("Keychain did not respond. Please try again.")),
          KEYCHAIN_TIMEOUT_MS
        );
      });

      let response: KeychainResponse;
      try {
        response = await Promise.race([keychain_promise, timeout_promise]);
      } finally {
        clearTimeout(timeout_id);
      }

      if (!response.success) {
        throw new Error(response.error ?? "Keychain verification was cancelled");
      }

      if (typeof response.result !== "string" || !response.result) {
        throw new Error("Keychain returned no signature. Please try again.");
      }

      const signature = response.result;
      const verification = await verify_posting_signature({
        username: user,
        message,
        signature,
        public_key: response.publicKey,
      }).catch((network_error: unknown) => {
        throw new Error(
          "Could not reach the Hive API to verify your posting key. Please try again.",
          { cause: network_error }
        );
      });

      if (!verification.ok) {
        throw new Error(VERIFICATION_ERRORS[verification.reason]);
      }

      props.onSuccess?.({
        username: user,
        privateKey: KEYCHAIN_MANAGED_MARKER,
        keyType: "posting",
        loginType: "keychain",
      });
    } catch (err) {
      const login_error =
        err instanceof Error ? err : new Error("Keychain login failed");

      if (login_error.message.includes("cancel")) {
        setError("Login cancelled by user");
      } else if (login_error.message.includes("locked")) {
        setError("Keychain is locked. Please unlock it and try again.");
      } else {
        setError(login_error.message);
      }

      props.onError?.(login_error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div class={`w-full max-w-sm ${props.class ?? ""}`}>
      <Show when={keychain_status() === "checking"}>
        <div class="flex items-center gap-2 text-sm text-text-muted" role="status">
          <SpinnerIcon class="h-4 w-4 animate-spin" />
          Detecting Hive Keychain...
        </div>
      </Show>
      <Show
        when={keychain_status() === "available"}
        fallback={
          <Show when={keychain_status() === "missing"}>
            <div class="rounded-lg border border-warning/20 bg-warning/5 p-4" role="alert">
              <div class="flex items-start gap-3">
                <WarningIcon class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-warning">
                    Hive Keychain not detected
                  </p>
                  <p class="text-xs text-text-muted mt-1">
                    Install the{" "}
                    <a
                      href="https://hive-keychain.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-accent underline"
                    >
                      Hive Keychain
                    </a>{" "}
                    browser extension to use this login method.
                  </p>
                </div>
              </div>
            </div>
          </Show>
        }
      >
        <div class="space-y-4">
          {/* Username */}
          <div>
            <label for="keychain-username" class="block text-sm font-medium mb-1.5 text-text">
              Username
            </label>
            <input
              id="keychain-username"
              ref={username_ref}
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value.toLowerCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handle_keychain_login();
                }
              }}
              placeholder="Enter your username"
              class="w-full px-3 py-2.5 rounded-lg border border-border bg-bg-card text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Error Message */}
          <Show when={error()}>
            <div class="flex items-center gap-2 text-sm text-error">
              <ErrorIcon class="h-4 w-4 flex-shrink-0" />
              {error()}
            </div>
          </Show>

          {/* Submit Button */}
          <button
            onClick={() => handle_keychain_login()}
            disabled={is_submit_disabled()}
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-primary-text font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {is_loading() ? (
              <SpinnerIcon class="h-5 w-5 animate-spin" />
            ) : (
              <>
                <KeychainIcon class="h-5 w-5" />
                Login with Keychain
              </>
            )}
          </button>

          {/* Info note */}
          <div class="rounded-lg border border-info/20 bg-info/5 p-3">
            <p class="text-xs text-info">
              <strong>Secure:</strong> Keychain signs transactions locally. Your
              private key never leaves the extension.
            </p>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default KeychainLogin;
