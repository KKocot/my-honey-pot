// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, ErrorBoundary, onMount } from "solid-js";
import {
  currentUser,
  isAuthenticated,
  login,
  logout,
  needsReauth,
  restore_session,
  type AuthUser,
} from "../../../auth";
import { Toast, showToast } from "../../../ui";
import { LoginModal } from "../AdminPanel/LoginModal";
import { PostEditor } from "./PostEditor";
import { broadcast_post, type PostData } from "./broadcast-post";
import { hive_avatar_url } from "../../../../lib/config";

/**
 * SubmitPanel -- main panel for creating and publishing new posts to Hive.
 * Handles authentication, post editing, and broadcast flow.
 */
export function SubmitPanel(props: { hiveUsername?: string }) {
  const [show_login_modal, set_show_login_modal] = createSignal(false);
  const [is_submitting, set_is_submitting] = createSignal(false);
  const [reauth_session, set_reauth_session] = createSignal(needsReauth());
  const [published_url, set_published_url] = createSignal<string | null>(null);

  onMount(async () => {
    await restore_session();
    // Check for existing session that needs re-authentication
    const session = needsReauth();
    if (session) {
      set_reauth_session(session);
    }
  });

  function handle_login_success(user: AuthUser) {
    login(user);
    set_show_login_modal(false);
    set_reauth_session(null);
    showToast(`Welcome, @${user.username}!`, "success");
  }

  function handle_logout() {
    logout();
    showToast("Logged out successfully", "success");
  }

  async function handle_submit(post: PostData) {
    const user = currentUser();
    if (!user) {
      set_show_login_modal(true);
      return;
    }

    set_is_submitting(true);
    set_published_url(null);

    try {
      const result = await broadcast_post(post, user.username, user.privateKey);

      if (result.success && result.permlink) {
        const url = `https://peakd.com/@${user.username}/${result.permlink}`;
        set_published_url(url);
        showToast("Post published successfully!", "success");

        // Clear the draft after successful publish (both user-specific and anonymous)
        try {
          localStorage.removeItem(`mhp-post-draft-${user.username}`);
          localStorage.removeItem("mhp-post-draft-_anonymous");
        } catch {
          // ignore
        }
      } else {
        showToast(`Failed: ${result.error}`, "error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Error: ${message}`, "error");
    } finally {
      set_is_submitting(false);
    }
  }

  return (
    <ErrorBoundary
      fallback={(err) => (
        <div class="p-8 text-center">
          <h2 class="text-xl font-bold text-error mb-4">Something went wrong</h2>
          <p class="text-text-muted mb-4">{err.message}</p>
          <button
            onClick={() => window.location.reload()}
            class="px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors"
          >
            Reload page
          </button>
        </div>
      )}
    >
      <Toast />

      <LoginModal
        show={show_login_modal()}
        onClose={() => set_show_login_modal(false)}
        onSuccess={handle_login_success}
      />

      {/* Header */}
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">New Post</h1>
          <p class="text-sm text-text-muted mt-0.5">
            Write and publish a new blog post to the Hive blockchain
          </p>
        </div>

        <Show when={isAuthenticated()}>
          <div class="flex items-center gap-3">
            <img
              src={hive_avatar_url(currentUser()?.username ?? "")}
              alt={currentUser()?.username}
              class="w-6 h-6 rounded-full"
            />
            <span class="text-sm text-text">@{currentUser()?.username}</span>
            <button
              onClick={handle_logout}
              class="text-text-muted hover:text-text text-sm hover:bg-bg-secondary px-2 py-1 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </Show>
      </div>

      {/* Session expired banner */}
      <Show when={reauth_session()}>
        <div class="bg-warning/10 border border-warning rounded-lg p-4 mb-6">
          <div class="flex items-center gap-3">
            <svg
              class="w-5 h-5 text-warning flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div class="flex-1">
              <p class="text-sm text-warning font-medium">
                Session expired for @{reauth_session()?.username}
              </p>
              <p class="text-xs text-warning/70 mt-0.5">
                Please enter your password again to continue. Your private key is
                never stored in browser storage for security.
              </p>
            </div>
            <button
              onClick={() => set_show_login_modal(true)}
              class="px-3 py-1.5 bg-warning text-white text-sm font-medium rounded-lg hover:bg-warning/90 transition-colors"
            >
              Unlock
            </button>
          </div>
        </div>
      </Show>

      {/* Published success banner */}
      <Show when={published_url()}>
        <div class="bg-success/10 border border-success/30 rounded-xl p-6 mb-6">
          <div class="flex items-start gap-4">
            <svg
              class="w-6 h-6 text-success flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-success mb-1">
                Post Published!
              </h3>
              <p class="text-sm text-text-muted mb-3">
                Your post has been broadcast to the Hive blockchain. It may take a few
                seconds to appear on all frontends.
              </p>
              <a
                href={published_url()!}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors"
              >
                View on PeakD
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Show>

      {/* Post Editor Card */}
      <div class="bg-bg-card rounded-xl p-6 border border-border">
        <PostEditor
          username={currentUser()?.username}
          hive_username={props.hiveUsername}
          is_submitting={is_submitting()}
          onSubmit={handle_submit}
        />
      </div>
    </ErrorBoundary>
  );
}
