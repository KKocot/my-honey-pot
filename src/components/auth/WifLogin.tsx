// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show } from "solid-js";
import {
  EyeIcon,
  EyeOffIcon,
} from "../admin/editors/LayoutEditor/icons";
import { is_valid_wif } from "../../lib/wif-signer";

interface WifLoginProps {
  onSuccess?: (user: {
    username: string;
    privateKey: string;
    keyType: "posting" | "active";
  }) => void;
  onError?: (error: Error) => void;
  class?: string;
}

/**
 * WIF Login Component
 * Direct key login without HB-Auth - for non-mainnet networks (mirrornet/testnet)
 * Key is used for signing only, never stored.
 */
export function WifLogin(props: WifLoginProps) {
  const [username, setUsername] = createSignal("");
  const [private_key, setPrivateKey] = createSignal("");
  const key_type: "posting" | "active" = "posting";
  const [show_key, setShowKey] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  function handle_wif_login() {
    const user = username().trim().toLowerCase();
    const wif = private_key().trim();

    if (!user || !wif) {
      setError("Please fill in all fields");
      return;
    }

    if (!is_valid_wif(wif)) {
      setError(
        "Invalid WIF format. Private keys start with 5 and are 51 characters"
      );
      return;
    }

    setError(null);
    props.onSuccess?.({
      username: user,
      privateKey: wif,
      keyType: key_type,
    });
  }

  return (
    <div class={`w-full max-w-sm ${props.class || ""}`}>
      <div class="space-y-4">
        {/* Username */}
        <div>
          <label class="block text-sm font-medium mb-1.5 text-foreground">
            Username
          </label>
          <input
            type="text"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value.toLowerCase())}
            placeholder="Enter your username"
            class="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* WIF Key */}
        <div>
          <label class="block text-sm font-medium mb-1.5 text-foreground">
            Posting Key (WIF)
          </label>
          <div class="relative">
            <input
              type={show_key() ? "text" : "password"}
              value={private_key()}
              onInput={(e) => setPrivateKey(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handle_wif_login();
                }
              }}
              placeholder="5..."
              class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!show_key())}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {show_key() ? (
                <EyeOffIcon class="h-4 w-4" />
              ) : (
                <EyeIcon class="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        <Show when={error()}>
          <div class="flex items-center gap-2 text-sm text-error">
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error()}
          </div>
        </Show>

        {/* Submit */}
        <button
          onClick={() => handle_wif_login()}
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Login with WIF
        </button>

        {/* Info note */}
        <div class="rounded-lg border border-border bg-bg-secondary p-3">
          <p class="text-xs text-text-muted">
            Key used for signing only, not stored.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WifLogin;
