// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show } from 'solid-js'

// ============================================
// Mock Preview Components
// ============================================

export function MockHeader(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1.5' : 'p-2'}`}>
      <div class={`font-bold text-text ${props.compact ? 'text-xs' : 'text-sm'}`}>Hive Blog</div>
      <div class={`text-text-muted ${props.compact ? 'text-[8px]' : 'text-[10px]'}`}>Posts from Hive blockchain</div>
    </div>
  )
}

export function MockAuthorProfile(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1.5' : 'p-2'}`}>
      <div class="flex items-center gap-2">
        <div class={`rounded-full bg-primary/30 flex-shrink-0 ${props.compact ? 'w-6 h-6' : 'w-8 h-8'}`} />
        <div class="min-w-0 flex-1">
          <div class={`font-semibold text-text truncate ${props.compact ? 'text-[9px]' : 'text-xs'}`}>@username</div>
          <div class={`text-text-muted ${props.compact ? 'text-[7px]' : 'text-[9px]'}`}>Rep: 72 | Posts: 245</div>
        </div>
      </div>
      <Show when={!props.compact}>
        <div class="mt-2 flex gap-2 text-[8px]">
          <span class="text-text-muted">Followers: 1.2K</span>
          <span class="text-text-muted">Following: 350</span>
        </div>
      </Show>
    </div>
  )
}

export function MockPosts(props: { compact?: boolean }) {
  const postCount = props.compact ? 2 : 3
  return (
    <div class="space-y-1">
      <For each={Array(postCount).fill(0)}>
        {(_, i) => (
          <div class={`bg-bg-card rounded border border-border flex gap-2 ${props.compact ? 'p-1' : 'p-1.5'}`}>
            <div class={`rounded bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 ${props.compact ? 'w-8 h-8' : 'w-12 h-12'}`} />
            <div class="min-w-0 flex-1">
              <div class={`font-medium text-text line-clamp-1 ${props.compact ? 'text-[8px]' : 'text-[10px]'}`}>
                {i() === 0 ? 'Introduction to Hive Blockchain' : i() === 1 ? 'My Journey in Crypto World' : 'Tips for New Users'}
              </div>
              <div class={`text-text-muted line-clamp-1 ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>
                Lorem ipsum dolor sit amet consectetur...
              </div>
              <div class={`flex gap-2 text-text-muted mt-0.5 ${props.compact ? 'text-[5px]' : 'text-[7px]'}`}>
                <span>$12.50</span>
                <span>45 votes</span>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )
}

export function MockNavigation(props: { compact?: boolean }) {
  const navItems = ['Posts', 'Threads', 'Comments', 'Instagram', 'X', 'More']
  return (
    <div class={`bg-bg-card rounded border border-border ${props.compact ? 'p-1' : 'p-1.5'}`}>
      <div class={`flex gap-2 ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>
        <For each={navItems.slice(0, props.compact ? 3 : 6)}>
          {(item, i) => (
            <span class={i() === 0 ? 'text-primary font-medium' : 'text-text-muted'}>
              {item}
            </span>
          )}
        </For>
      </div>
    </div>
  )
}

export function MockFooter(props: { compact?: boolean }) {
  return (
    <div class={`bg-bg-card rounded border border-border text-center ${props.compact ? 'p-1' : 'p-2'}`}>
      <div class={`text-text-muted ${props.compact ? 'text-[6px]' : 'text-[8px]'}`}>
        Built by BardDev | Ko-fi | Powered by Hive
      </div>
    </div>
  )
}
