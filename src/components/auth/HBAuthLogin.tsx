// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, For, onMount } from "solid-js";
import { getOnlineClient } from "../../lib/hbauth-service";
import type { OnlineClient, AuthUser as HBAuthUser } from "@hiveio/hb-auth";
import { HBAUTH_MANAGED_MARKER, is_valid_wif } from "../../lib/wif-signer";
import { IS_NOT_MAINNET } from "../../lib/config";
import {
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
} from "../admin/editors/LayoutEditor/icons";
import { WifLogin } from "./WifLogin";

interface HBAuthLoginProps {
  onSuccess?: (user: {
    username: string;
    privateKey: string;
    keyType: "posting" | "active";
  }) => void;
  onError?: (error: Error) => void;
  class?: string;
}

/** Inline icon components used only in this file */
function ErrorIcon(props: { class?: string }) {
  return (
    <svg
      class={props.class}
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
  );
}

function LockIcon(props: { class?: string }) {
  return (
    <svg
      class={props.class}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

function SpinnerIcon(props: { class?: string }) {
  return (
    <svg class={props.class} fill="none" viewBox="0 0 24 24">
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * HB-Auth Login Component
 * On mainnet: uses official @hiveio/hb-auth for key storage (IndexedDB via Web Worker)
 * On non-mainnet: delegates to WifLogin for direct WIF key login
 */
export function HBAuthLogin(props: HBAuthLoginProps) {
  const [mode, setMode] = createSignal<"login" | "register">("login");
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [private_key, setPrivateKey] = createSignal("");
  const key_type: "posting" | "active" = "posting";
  const [show_password, setShowPassword] = createSignal(false);
  const [show_key, setShowKey] = createSignal(false);
  const [is_loading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [stored_users, setStoredUsers] = createSignal<HBAuthUser[]>([]);
  const [auth_client, setAuthClient] = createSignal<OnlineClient | null>(null);

  // Initialize HB-Auth client and load registered users (mainnet only)
  onMount(async () => {
    if (IS_NOT_MAINNET) return;

    try {
      const client = await getOnlineClient();
      setAuthClient(client);
      const users = await client.getRegisteredUsers();
      setStoredUsers(users);

      if (users.length > 0) {
        setUsername(users[0].username);
      }
    } catch (err) {
      console.error("Failed to initialize HB-Auth client:", err);
    }
  });

  const check_stored_key = () => {
    const user = username().trim().toLowerCase();
    const found = stored_users().find(
      (u) => u.username.toLowerCase() === user
    );
    if (found) {
      setMode("login");
    }
  };

  /** Login - authenticate with HB-Auth (unlock stored key) */
  async function handle_login() {
    const user = username().trim().toLowerCase();
    const pass = password();

    if (!user || !pass) {
      setError("Please fill in all fields");
      return;
    }

    const client = auth_client();
    if (!client) {
      setError("Auth client not initialized");
      return;
    }

    const stored_user = stored_users().find(
      (u) => u.username.toLowerCase() === user
    );
    if (!stored_user) {
      setError("No key stored for this user. Please register first.");
      setMode("register");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const auth_status = await client.authenticate(user, pass, key_type);
      if (!auth_status.ok) {
        throw new Error("Authentication failed");
      }

      props.onSuccess?.({
        username: user,
        privateKey: HBAUTH_MANAGED_MARKER,
        keyType: key_type,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Login failed");

      if (
        error.message.includes("Not authorized") ||
        error.message.includes("Authentication failed")
      ) {
        setError("Invalid password");
      } else if (error.message.includes("User is already logged in")) {
        props.onSuccess?.({
          username: user,
          privateKey: HBAUTH_MANAGED_MARKER,
          keyType: key_type,
        });
        return;
      } else {
        setError(error.message);
      }
      props.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }

  /** Register - store new key in HB-Auth */
  async function handle_register() {
    const user = username().trim().toLowerCase();
    const pass = password();
    const key = private_key().trim();

    if (!user || !pass || !key) {
      setError("Please fill in all fields");
      return;
    }

    if (!is_valid_wif(key)) {
      setError(
        "Invalid WIF format. Private keys start with 5 and are 51 characters"
      );
      return;
    }

    const client = auth_client();
    if (!client) {
      setError("Auth client not initialized");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await client.register(user, pass, key, key_type);
      const users = await client.getRegisteredUsers();
      setStoredUsers(users);
      setPrivateKey("");
      setError(null);

      const auth_status = await client.authenticate(user, pass, key_type);
      if (auth_status.ok) {
        props.onSuccess?.({
          username: user,
          privateKey: HBAUTH_MANAGED_MARKER,
          keyType: key_type,
        });
      } else {
        setMode("login");
      }
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Registration failed");
      setError(error.message);
      props.onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }

  /** Logout user from HB-Auth session and remove from quick access list */
  async function handle_remove_key(user: string) {
    if (!confirm(`Logout and remove @${user} from quick access list?`)) return;

    const client = auth_client();
    if (!client) return;

    try {
      await client.logout(user);
      const users = await client.getRegisteredUsers();
      setStoredUsers(users);

      if (username() === user) {
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error("Failed to logout user:", err);
      setError("Failed to logout user");
    }
  }

  /** Toggle button for password/key visibility */
  function VisibilityToggle(toggle_props: {
    visible: boolean;
    onToggle: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={toggle_props.onToggle}
        class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
      >
        {toggle_props.visible ? (
          <EyeOffIcon class="h-4 w-4" />
        ) : (
          <EyeIcon class="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <Show
      when={!IS_NOT_MAINNET}
      fallback={
        <WifLogin
          onSuccess={props.onSuccess}
          onError={props.onError}
          class={props.class}
        />
      }
    >
      <div class={`w-full max-w-sm ${props.class || ""}`}>
        {/* Mode Toggle - Login/Register */}
        <div class="flex rounded-xl bg-bg-secondary border border-border p-1 mb-6">
          <button
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            class={`flex-1 rounded-lg py-2.5 px-4 text-sm font-medium transition-all ${
              mode() === "login"
                ? "bg-primary text-white shadow-md"
                : "text-text-muted hover:text-text hover:bg-bg-card"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            class={`flex-1 rounded-lg py-2.5 px-4 text-sm font-medium transition-all ${
              mode() === "register"
                ? "bg-primary text-white shadow-md"
                : "text-text-muted hover:text-text hover:bg-bg-card"
            }`}
          >
            Register Key
          </button>
        </div>

        <div class="space-y-4">
          {/* Stored Users Quick Select */}
          <Show when={stored_users().length > 0 && mode() === "login"}>
            <div>
              <label class="block text-sm font-medium mb-1.5 text-foreground">
                Stored Accounts
              </label>
              <div class="flex flex-wrap gap-2">
                <For each={stored_users()}>
                  {(user) => (
                    <div class="flex items-center gap-1 bg-muted rounded-full px-3 py-1">
                      <button
                        onClick={() => setUsername(user.username)}
                        class={`text-sm ${username() === user.username ? "text-accent font-medium" : "text-foreground"}`}
                      >
                        @{user.username}
                      </button>
                      <button
                        onClick={() => handle_remove_key(user.username)}
                        class="text-muted hover:text-error ml-1"
                        title="Logout from quick access"
                      >
                        x
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Username */}
          <div>
            <label class="block text-sm font-medium mb-1.5 text-foreground">
              Username
            </label>
            <input
              type="text"
              value={username()}
              onInput={(e) => {
                setUsername(e.currentTarget.value.toLowerCase());
                check_stored_key();
              }}
              placeholder="Enter your username"
              class="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Password */}
          <div>
            <label class="block text-sm font-medium mb-1.5 text-foreground">
              {mode() === "register" ? "Create Password" : "Password"}
            </label>
            <div class="relative">
              <input
                type={show_password() ? "text" : "password"}
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && mode() === "login") {
                    e.preventDefault();
                    handle_login();
                  }
                }}
                placeholder="Enter password"
                class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <VisibilityToggle
                visible={show_password()}
                onToggle={() => setShowPassword(!show_password())}
              />
            </div>
          </div>

          {/* Private Key (only for register) */}
          <Show when={mode() === "register"}>
            <div>
              <label class="block text-sm font-medium mb-1.5 text-foreground">
                Private Key (WIF)
              </label>
              <div class="relative">
                <input
                  type={show_key() ? "text" : "password"}
                  value={private_key()}
                  onInput={(e) => setPrivateKey(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handle_register();
                    }
                  }}
                  placeholder="5..."
                  class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
                />
                <VisibilityToggle
                  visible={show_key()}
                  onToggle={() => setShowKey(!show_key())}
                />
              </div>
              <p class="mt-1 text-xs text-muted">
                Your key will be encrypted and stored securely by HB-Auth
              </p>
            </div>
          </Show>

          {/* Error Message */}
          <Show when={error()}>
            <div class="flex items-center gap-2 text-sm text-error">
              <ErrorIcon class="h-4 w-4" />
              {error()}
            </div>
          </Show>

          {/* Submit Button */}
          <button
            onClick={() =>
              mode() === "login" ? handle_login() : handle_register()
            }
            disabled={is_loading()}
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {is_loading() ? (
              <SpinnerIcon class="h-5 w-5 animate-spin" />
            ) : mode() === "login" ? (
              <>
                <LockIcon class="h-5 w-5" />
                Unlock Blog
              </>
            ) : (
              <>
                <PlusIcon class="h-5 w-5" />
                Save Key
              </>
            )}
          </button>

          {/* Security Note */}
          <div class="rounded-lg border border-success/20 bg-success/5 p-3">
            <p class="text-xs text-success">
              <strong>Safe Storage:</strong> Your key is encrypted by HB-Auth
              and stored in browser's IndexedDB. Never transmitted over the
              network.
            </p>
          </div>
        </div>
      </div>
    </Show>
  );
}

export default HBAuthLogin;
