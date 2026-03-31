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
import { ErrorIcon, SpinnerIcon, LockIcon, UserIcon, TrashIcon } from "./icons";
import { is_valid_hive_username } from "./constants";

interface HBAuthLoginProps {
  mode: "login" | "register";
  onSuccess?: (user: {
    username: string;
    privateKey: string;
    keyType: "posting" | "active";
    loginType: "hbauth" | "keychain" | "wif";
  }) => void;
  onError?: (error: Error) => void;
  class?: string;
}

/** Toggle button for password/key visibility. Defined at module level to avoid re-creating on each render. */
function VisibilityToggle(toggle_props: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={toggle_props.onToggle}
      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
    >
      {toggle_props.visible ? (
        <EyeOffIcon class="h-4 w-4" />
      ) : (
        <EyeIcon class="h-4 w-4" />
      )}
    </button>
  );
}

export function HBAuthLogin(props: HBAuthLoginProps) {
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

  let username_ref: HTMLInputElement | undefined;
  let password_ref: HTMLInputElement | undefined;

  onMount(async () => {
    if (IS_NOT_MAINNET) return;

    username_ref?.focus();

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

  function is_submit_disabled(): boolean {
    const user = username().trim();
    const pass = password().trim();
    if (!user || !pass) return true;
    if (props.mode === "register" && !private_key().trim()) return true;
    return is_loading();
  }

  async function handle_login() {
    const user = username().trim().toLowerCase();
    const pass = password();

    if (!user || !pass) {
      setError("Please fill in all fields");
      return;
    }

    if (!is_valid_hive_username(user)) {
      setError(
        "Invalid username format. Must be 3-16 characters: lowercase letters, digits and hyphens."
      );
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
      setError("No key stored for this user. Please switch to Register Key tab.");
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
        loginType: "hbauth",
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
          loginType: "hbauth",
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

  async function handle_register() {
    const user = username().trim().toLowerCase();
    const pass = password();
    const key = private_key().trim();

    if (!user || !pass || !key) {
      setError("Please fill in all fields");
      return;
    }

    if (!is_valid_hive_username(user)) {
      setError(
        "Invalid username format. Must be 3-16 characters: lowercase letters, digits and hyphens."
      );
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
          loginType: "hbauth",
        });
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

  function handle_submit() {
    if (props.mode === "login") {
      handle_login();
    } else {
      handle_register();
    }
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
      <div class={`w-full max-w-sm ${props.class ?? ""}`}>
        <div class="space-y-4">
          {/* Stored Users List */}
          <Show when={stored_users().length > 0 && props.mode === "login"}>
            <div>
              <label class="block text-sm font-medium mb-1.5 text-text">
                Stored Accounts
              </label>
              <div class="rounded-lg border border-border overflow-hidden">
                <For each={stored_users()}>
                  {(user) => (
                    <div
                      class={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        username() === user.username
                          ? "bg-accent/10 border-l-2 border-l-accent"
                          : "bg-bg-card hover:bg-bg-secondary border-l-2 border-l-transparent"
                      }`}
                      onClick={() => setUsername(user.username)}
                    >
                      <UserIcon class="h-4 w-4 text-text-muted flex-shrink-0" />
                      <span
                        class={`text-sm flex-1 ${
                          username() === user.username
                            ? "text-accent font-medium"
                            : "text-text"
                        }`}
                      >
                        @{user.username}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handle_remove_key(user.username);
                        }}
                        class="text-text-muted hover:text-error transition-colors p-1 rounded"
                        title="Remove from quick access"
                      >
                        <TrashIcon class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="border-t border-border" />
          </Show>

          {/* Username */}
          <div>
            <label for="hbauth-username" class="block text-sm font-medium mb-1.5 text-text">
              Username
            </label>
            <input
              id="hbauth-username"
              ref={username_ref}
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value.toLowerCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (props.mode === "register") {
                    password_ref?.focus();
                  } else {
                    handle_submit();
                  }
                }
              }}
              placeholder="Enter your username"
              class="w-full px-3 py-2.5 rounded-lg border border-border bg-bg-card text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          {/* Password */}
          <div>
            <label for="hbauth-password" class="block text-sm font-medium mb-1.5 text-text">
              {props.mode === "register" ? "Create Password" : "Password"}
            </label>
            <div class="relative">
              <input
                id="hbauth-password"
                ref={password_ref}
                type={show_password() ? "text" : "password"}
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handle_submit();
                  }
                }}
                placeholder="Enter password"
                class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-bg-card text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <VisibilityToggle
                visible={show_password()}
                onToggle={() => setShowPassword(!show_password())}
              />
            </div>
          </div>

          {/* Private Key (only for register) */}
          <Show when={props.mode === "register"}>
            <div>
              <label for="hbauth-private-key" class="block text-sm font-medium mb-1.5 text-text">
                Private Key (WIF)
              </label>
              <div class="relative">
                <input
                  id="hbauth-private-key"
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
                  class="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-bg-card text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono text-sm"
                />
                <VisibilityToggle
                  visible={show_key()}
                  onToggle={() => setShowKey(!show_key())}
                />
              </div>
              <p class="mt-1 text-xs text-text-muted">
                Your key will be encrypted and stored securely by HB-Auth
              </p>
            </div>
          </Show>

          {/* Error Message */}
          <Show when={error()}>
            <div class="flex items-center gap-2 text-sm text-error">
              <ErrorIcon class="h-4 w-4 flex-shrink-0" />
              {error()}
            </div>
          </Show>

          {/* Submit Button */}
          <button
            onClick={handle_submit}
            disabled={is_submit_disabled()}
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-primary-text font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {is_loading() ? (
              <SpinnerIcon class="h-5 w-5 animate-spin" />
            ) : props.mode === "login" ? (
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
          <div class="rounded-lg border border-info/20 bg-info/5 p-3">
            <p class="text-xs text-info">
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
