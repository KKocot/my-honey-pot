// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, onMount } from "solid-js";
import KeychainProvider from "@hiveio/wax-signers-keychain";

import { KEYCHAIN_MANAGED_MARKER, is_valid_hive_username } from "./constants";
import { ErrorIcon, SpinnerIcon, KeychainIcon, WarningIcon } from "./icons";

interface KeychainResponse {
  success: boolean;
  error?: string;
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

export function has_keychain(): boolean {
  return (
    typeof window === "object" &&
    KeychainProvider.isExtensionInstalled()
  );
}

export function KeychainLogin(props: KeychainLoginProps) {
  const [username, setUsername] = createSignal("");
  const [is_loading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [keychain_available, setKeychainAvailable] = createSignal(false);

  let username_ref: HTMLInputElement | undefined;

  onMount(() => {
    setKeychainAvailable(has_keychain());
    username_ref?.focus();
  });

  function is_submit_disabled(): boolean {
    return !username().trim() || is_loading();
  }

  async function handle_keychain_login() {
    const user = username().trim().toLowerCase();

    if (!user) {
      setError("Please enter your username");
      return;
    }

    if (!is_valid_hive_username(user)) {
      setError(
        "Invalid username format. Must be 3-16 characters: lowercase letters, digits and hyphens."
      );
      return;
    }

    if (!has_keychain()) {
      setError(
        "Hive Keychain extension not detected. Please install it from hive-keychain.com"
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const keychain_promise = new Promise<{ success: boolean; error?: string }>(
        (resolve, reject) => {
          const keychain = window.hive_keychain;
          if (!keychain) {
            reject(new Error("Hive Keychain extension not available"));
            return;
          }
          keychain.requestSignBuffer(
            user,
            `my-honey-pot login ${Date.now()}`,
            "Posting",
            (result: { success: boolean; error?: string }) => {
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

      let response: { success: boolean; error?: string };
      try {
        response = await Promise.race([keychain_promise, timeout_promise]);
      } finally {
        clearTimeout(timeout_id);
      }

      if (!response.success) {
        throw new Error(response.error ?? "Keychain verification was cancelled");
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
      <Show
        when={keychain_available()}
        fallback={
          <div class="rounded-lg border border-warning/20 bg-warning/5 p-4">
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
