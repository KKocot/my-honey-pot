// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, onMount } from "solid-js";
import {
  currentUser,
  login,
  logout,
  restore_session,
  type AuthUser,
} from "./auth-store";
import { hive_avatar_url } from "../../lib/config";

type LoginModalComponent = typeof import("./LoginModal").LoginModal;

interface AuthControlsProps {
  ownerUsername: string;
}

const control_class =
  "flex items-center gap-1.5 rounded-lg bg-bg-secondary border border-border px-2.5 py-1.5 text-xs text-text-muted hover:text-text transition-colors cursor-pointer";

export default function AuthControls(props: AuthControlsProps) {
  const [modal, set_modal] = createSignal<LoginModalComponent | null>(null);
  const [show_modal, set_show_modal] = createSignal(false);
  const [loading_modal, set_loading_modal] = createSignal(false);
  const [load_failed, set_load_failed] = createSignal(false);

  // restore_session reads localStorage first; wax/HB-Auth are imported only when a session is persisted
  onMount(() => {
    void restore_session();
  });

  const is_owner = () => {
    const user = currentUser();
    return (
      !!user &&
      !!props.ownerUsername &&
      user.username.toLowerCase() === props.ownerUsername.toLowerCase()
    );
  };

  // Guarded instead of `disabled`: disabling the focused button blurs it, so LoginModal could not restore focus on close
  async function open_login() {
    if (loading_modal()) return;
    if (!modal()) {
      set_loading_modal(true);
      set_load_failed(false);
      try {
        const mod = await import("./LoginModal");
        set_modal(() => mod.LoginModal);
      } catch (error) {
        console.error("AuthControls: failed to load login modal:", error);
        set_load_failed(true);
        return;
      } finally {
        set_loading_modal(false);
      }
    }
    set_show_modal(true);
  }

  function handle_login_success(user: AuthUser) {
    login(user);
    set_show_modal(false);
  }

  return (
    <>
      <Show
        when={currentUser()}
        fallback={
          <div class="flex items-center gap-2">
          <button
            type="button"
            onClick={open_login}
            aria-busy={loading_modal()}
            class={`${control_class} aria-busy:opacity-60 aria-busy:cursor-wait`}
            aria-label="Login with Hive"
          >
            <svg
              class="size-3.5 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6" />
              <path d="M9.5 5 13 8l-3.5 3" />
              <line x1="13" y1="8" x2="6" y2="8" />
            </svg>
            <span>Login</span>
          </button>
          <Show when={load_failed()}>
            <span role="alert" class="rounded-lg bg-bg-secondary border border-border px-2.5 py-1.5 text-xs text-error">
              Login unavailable, try again
            </span>
          </Show>
          </div>
        }
      >
        {(user) => (
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="flex items-center gap-1.5 rounded-lg bg-bg-secondary border border-border px-2 py-1 text-xs text-text"
              title={`Logged in as @${user().username}`}
            >
              <span class="sr-only">Logged in as @{user().username}</span>
              <img
                src={hive_avatar_url(user().username, "small")}
                alt=""
                class="size-5 rounded-full"
                loading="lazy"
              />
              <span class="hidden sm:inline max-w-32 truncate" aria-hidden="true">
                @{user().username}
              </span>
            </span>
            <Show when={is_owner()}>
              <a href="/admin" class={control_class}>
                Admin
              </a>
              <a href="/admin/submit" class={control_class}>
                New post
              </a>
            </Show>
            <button type="button" onClick={logout} class={control_class}>
              Logout
            </button>
          </div>
        )}
      </Show>

      <Show when={modal()}>
        {(Modal) => {
          const LoginModal = Modal();
          return (
            <LoginModal
              show={show_modal()}
              onClose={() => set_show_modal(false)}
              onSuccess={handle_login_success}
              description="Sign in with your Hive account. The blog owner gets quick links to settings and the post editor."
            />
          );
        }}
      </Show>
    </>
  );
}
