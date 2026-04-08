// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, createEffect, For, Show } from "solid-js";
import {
  fetch_user_subscriptions,
  type CommunitySubscription,
} from "../../../../lib/queries";

interface CommunitySelectorProps {
  username?: string;
  selected: string;
  onChange: (community: string) => void;
}

const MY_BLOG_VALUE = "";

export function CommunitySelector(props: CommunitySelectorProps) {
  const [subscriptions, set_subscriptions] = createSignal<CommunitySubscription[]>([]);
  const [is_loading, set_is_loading] = createSignal(false);
  const [error, set_error] = createSignal<string | null>(null);

  createEffect(() => {
    const username = props.username;
    if (!username) {
      set_subscriptions([]);
      return;
    }

    set_is_loading(true);
    set_error(null);

    fetch_user_subscriptions(username)
      .then((result) => set_subscriptions(result))
      .catch(() => set_error("Failed to load communities"))
      .finally(() => set_is_loading(false));
  });

  return (
    <div>
      <label class="block text-sm font-medium text-text mb-1.5" for="community-select">
        Publish to
      </label>
      <select
        id="community-select"
        value={props.selected}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        disabled={is_loading()}
        class="w-full px-4 py-2.5 bg-bg-secondary border border-border rounded-lg text-text
          text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all
          disabled:opacity-50"
      >
        <option value={MY_BLOG_VALUE}>My Blog</option>
        <Show when={is_loading()}>
          <option disabled>Loading communities...</option>
        </Show>
        <Show when={!is_loading()}>
          <For each={subscriptions()}>
            {(sub) => (
              <option value={sub.community}>
                {sub.title} ({sub.community})
              </option>
            )}
          </For>
        </Show>
      </select>
      <Show when={error()}>
        <p class="mt-1 text-xs text-error">{error()}</p>
      </Show>
      <p class="mt-1 text-xs text-text-muted">
        Choose a community or publish to your personal blog.
      </p>
    </div>
  );
}
