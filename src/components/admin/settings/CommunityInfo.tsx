// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createResource, Show, For, createSignal } from "solid-js";
import {
  fetch_community,
  fetch_subscribers,
  fetch_community_roles,
} from "../../../lib/queries";
import type {
  HiveCommunity,
  CommunityTeamMember,
  CommunitySubscriber,
} from "../../../lib/types/community";

// ============================================
// Community Info Panel (read-only)
// ============================================

interface CommunityInfoProps {
  community_name: string;
}

/** Map role string to a human-readable badge color class */
function role_badge_class(role: string): string {
  switch (role) {
    case "owner":
      return "bg-error/20 text-error";
    case "admin":
      return "bg-warning/20 text-warning";
    case "mod":
      return "bg-primary/20 text-primary";
    case "member":
      return "bg-success/20 text-success";
    case "guest":
      return "bg-bg-secondary text-text-muted";
    case "muted":
      return "bg-error/10 text-error/60";
    default:
      return "bg-bg-secondary text-text-muted";
  }
}

export function CommunityInfo(props: CommunityInfoProps) {
  const [show_subscribers, set_show_subscribers] = createSignal(false);

  // Fetch community data
  const [community] = createResource(
    () => props.community_name,
    (name) => fetch_community(name)
  );

  // Fetch roles (always loaded -- usually small list)
  const [roles] = createResource(
    () => props.community_name,
    (name) => fetch_community_roles(name)
  );

  // Fetch subscribers only when expanded
  const [subscribers] = createResource(
    () => (show_subscribers() ? props.community_name : undefined),
    (name) => {
      if (!name) return Promise.resolve([]);
      return fetch_subscribers(name);
    }
  );

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Community Info</h2>

      {/* Loading */}
      <Show when={community.loading}>
        <div class="flex items-center gap-3 py-4">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <span class="text-text-muted text-sm">
            Loading community data...
          </span>
        </div>
      </Show>

      {/* Error */}
      <Show when={community.error}>
        <div class="p-4 bg-error/10 border border-error rounded-lg text-error text-sm">
          Failed to load community data. Please try refreshing the page.
        </div>
      </Show>

      {/* Community Stats */}
      <Show when={community()}>
        {(data) => (
          <>
            {/* Stats grid */}
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Subscribers"
                value={data().subscribers}
              />
              <StatCard
                label="Authors"
                value={data().num_authors}
              />
              <StatCard
                label="Pending Posts"
                value={data().num_pending}
              />
              <StatCard
                label="Pending Payout"
                value={`$${data().sum_pending.toFixed(2)}`}
              />
            </div>

            {/* Created date */}
            <p class="text-xs text-text-muted mb-6">
              Created: {new Date(data().created_at).toLocaleDateString()}
            </p>
          </>
        )}
      </Show>

      {/* Team / Roles table */}
      <div class="mb-6">
        <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
          Team & Roles
        </h3>

        <Show when={roles.loading}>
          <div class="flex items-center gap-2 py-2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <span class="text-text-muted text-sm">Loading roles...</span>
          </div>
        </Show>

        <Show when={roles()}>
          {(role_list) => (
            <Show
              when={role_list().length > 0}
              fallback={
                <p class="text-sm text-text-muted">No roles assigned.</p>
              }
            >
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-border">
                      <th class="text-left py-2 pr-4 text-text-muted font-medium">
                        Username
                      </th>
                      <th class="text-left py-2 pr-4 text-text-muted font-medium">
                        Role
                      </th>
                      <th class="text-left py-2 text-text-muted font-medium">
                        Title
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={role_list()}>
                      {(member) => (
                        <RoleRow member={member} />
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
            </Show>
          )}
        </Show>
      </div>

      {/* Subscribers (expandable) */}
      <div>
        <button
          type="button"
          onClick={() => set_show_subscribers(!show_subscribers())}
          class="flex items-center gap-2 text-sm font-medium text-text-muted uppercase tracking-wide hover:text-text transition-colors"
        >
          <svg
            class="w-4 h-4 transition-transform"
            classList={{ "rotate-90": show_subscribers() }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Subscribers
          <Show when={community()}>
            <span class="text-text-muted font-normal">
              ({community()?.subscribers})
            </span>
          </Show>
        </button>

        <Show when={show_subscribers()}>
          <div class="mt-3">
            <Show when={subscribers.loading}>
              <div class="flex items-center gap-2 py-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                <span class="text-text-muted text-sm">
                  Loading subscribers...
                </span>
              </div>
            </Show>

            <Show when={subscribers()}>
              {(sub_list) => (
                <Show
                  when={sub_list().length > 0}
                  fallback={
                    <p class="text-sm text-text-muted">
                      No subscribers yet.
                    </p>
                  }
                >
                  <div class="max-h-64 overflow-y-auto border border-border rounded-lg">
                    <table class="w-full text-sm">
                      <thead class="sticky top-0 bg-bg-card">
                        <tr class="border-b border-border">
                          <th class="text-left py-2 px-3 text-text-muted font-medium">
                            Username
                          </th>
                          <th class="text-left py-2 px-3 text-text-muted font-medium">
                            Role
                          </th>
                          <th class="text-left py-2 px-3 text-text-muted font-medium">
                            Title
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={sub_list()}>
                          {(sub) => (
                            <SubscriberRow subscriber={sub} />
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
              )}
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function StatCard(props: { label: string; value: string | number }) {
  return (
    <div class="bg-bg rounded-lg border border-border p-3 text-center">
      <p class="text-2xl font-bold text-text">{props.value}</p>
      <p class="text-xs text-text-muted mt-1">{props.label}</p>
    </div>
  );
}

function RoleRow(props: { member: CommunityTeamMember }) {
  // CommunityTeamMember is a tuple: [username, role, title]
  const username = () => props.member[0] ?? "";
  const role = () => props.member[1] ?? "";
  const title = () => props.member[2] ?? "";

  return (
    <tr class="border-b border-border/50 last:border-0">
      <td class="py-2 pr-4">
        <a
          href={`https://peakd.com/@${username()}`}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:text-primary-hover transition-colors"
        >
          @{username()}
        </a>
      </td>
      <td class="py-2 pr-4">
        <span
          class={`inline-block px-2 py-0.5 text-xs font-medium rounded ${role_badge_class(role())}`}
        >
          {role()}
        </span>
      </td>
      <td class="py-2 text-text-muted">{title()}</td>
    </tr>
  );
}

function SubscriberRow(props: { subscriber: CommunitySubscriber }) {
  // CommunitySubscriber is a tuple: [username, role, title, ...]
  const username = () => props.subscriber[0] ?? "";
  const role = () => props.subscriber[1] ?? "";
  const title = () => props.subscriber[2] ?? "";

  return (
    <tr class="border-b border-border/50 last:border-0">
      <td class="py-1.5 px-3">
        <a
          href={`https://peakd.com/@${username()}`}
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary hover:text-primary-hover transition-colors text-xs"
        >
          @{username()}
        </a>
      </td>
      <td class="py-1.5 px-3">
        <Show when={role()}>
          <span
            class={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${role_badge_class(role())}`}
          >
            {role()}
          </span>
        </Show>
      </td>
      <td class="py-1.5 px-3 text-text-muted text-xs">{title()}</td>
    </tr>
  );
}
