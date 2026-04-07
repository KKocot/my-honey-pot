// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, For } from 'solid-js'
import { settings, updateSettings } from '../store'
import { Slider } from '../../ui'
import { LayoutPreview } from '../previews/PostCardPreview'
import { createLocalNumericInput } from '../hooks'
import { POSTS_PER_PAGE_MIN, POSTS_PER_PAGE_MAX, MAX_PINNED_POSTS } from '../types/settings'

// ============================================
// Posts Layout Settings Section
// ============================================

const layoutOptions = [
  { value: 'list', label: 'List', icon: ListIcon },
  { value: 'grid', label: 'Grid', icon: GridIcon },
  { value: 'masonry', label: 'Masonry', icon: MasonryIcon },
] as const

export function PostsLayoutSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Posts Layout</h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="space-y-6">
          {/* Pinned Posts - first section */}
          <PinnedPostsSection />

          {/* Layout Type Selection */}
          <div>
            <label class="block text-sm font-medium text-text mb-3">Layout Type</label>
            <div class="grid grid-cols-3 gap-3">
              <For each={layoutOptions}>
                {(option) => (
                  <button
                    type="button"
                    onClick={() => updateSettings({ postsLayout: option.value })}
                    class={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                      ${settings.postsLayout === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50 text-text-muted hover:text-text'
                      }
                    `}
                  >
                    <option.icon />
                    <span class="text-sm font-medium">{option.label}</span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Grid/Masonry specific settings */}
          <Show when={settings.postsLayout !== 'list'}>
            <div class="space-y-4">
              <Slider
                label="Number of columns:"
                min={1}
                max={4}
                value={settings.gridColumns}
                onChange={(val) => updateSettings({ gridColumns: val })}
              />

              <div class="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg text-xs text-text-muted">
                <InfoIcon />
                <span>
                  In grid/masonry mode, cards automatically switch to vertical orientation
                </span>
              </div>
            </div>
          </Show>

          {/* Gap setting */}
          <Slider
            label="Gap between cards:"
            unit="px"
            min={0}
            max={64}
            value={settings.cardGapPx}
            onChange={(val) => updateSettings({ cardGapPx: val })}
          />

          {/* Posts per page */}
          <PostsPerPageInput />
        </div>

        {/* Unified Preview - shows actual cards in layout */}
        <LayoutPreview postCount={4} maxHeight="100%" pinnedPermlinks={settings.pinnedPostPermlinks ?? []} />
      </div>

    </div>
  )
}

// ============================================
// Posts Per Page Input with local state
// ============================================

function PostsPerPageInput() {
  const [localValue, setLocalValue, commitValue] = createLocalNumericInput(
    () => settings.postsPerPage ?? 20,
    (val) => updateSettings({ postsPerPage: val }),
    { min: POSTS_PER_PAGE_MIN, max: POSTS_PER_PAGE_MAX, fallback: POSTS_PER_PAGE_MIN }
  )

  return (
    <div>
      <label class="block text-sm font-medium text-text mb-1">Posts per page</label>
      <input
        type="number"
        min={POSTS_PER_PAGE_MIN}
        max={POSTS_PER_PAGE_MAX}
        value={localValue()}
        onInput={(e) => setLocalValue(Number(e.currentTarget.value) || POSTS_PER_PAGE_MIN)}
        onBlur={commitValue}
        class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

// ============================================
// Pinned Posts Section
// ============================================

const PERMLINK_REGEX = /^[a-z0-9._-]+$/

function PinnedPostsSection() {
  const [inputValue, setInputValue] = createSignal('')
  const [error, setError] = createSignal('')

  const pinned = () => settings.pinnedPostPermlinks ?? []

  const handleAdd = () => {
    const value = inputValue().trim()
    setError('')

    if (!value) return

    if (!PERMLINK_REGEX.test(value)) {
      setError('Invalid format. Use only lowercase letters, numbers, dots, underscores and hyphens.')
      return
    }

    if (pinned().includes(value)) {
      setError('This permlink is already pinned.')
      return
    }

    updateSettings({ pinnedPostPermlinks: [...pinned(), value] })
    setInputValue('')
  }

  const handleRemove = (permlink: string) => {
    updateSettings({
      pinnedPostPermlinks: pinned().filter((p) => p !== permlink),
    })
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <h3 class="text-sm font-medium text-text mb-3">Pinned Posts</h3>

      <Show when={pinned().length < MAX_PINNED_POSTS}>
        <div class="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="post-permlink"
            value={inputValue()}
            onInput={(e) => {
              setInputValue(e.currentTarget.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
            class="flex-1 px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={handleAdd}
            class="px-4 py-2 bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </Show>

      <Show when={error()}>
        <p class="text-error text-sm mb-3">{error()}</p>
      </Show>

      <Show when={pinned().length > 0}>
        <div class="space-y-2 mb-3">
          <For each={pinned()}>
            {(permlink) => (
              <div class="flex items-center justify-between gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
                <span class="text-sm text-text font-mono truncate">{permlink}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(permlink)}
                  aria-label={`Remove pinned post ${permlink}`}
                  class="text-text-muted hover:text-error transition-colors flex-shrink-0"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="flex items-center gap-2 p-3 bg-bg-secondary rounded-lg text-xs text-text-muted">
        <InfoIcon />
        <span>
          Pinned posts appear at the top of your blog. Enter the permlink (the part of URL after your username).
        </span>
      </div>
    </div>
  )
}

// ============================================
// Icons
// ============================================

function ListIcon() {
  return (
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  )
}

function MasonryIcon() {
  return (
    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4h6v8H4zM14 4h6v5h-6zM14 13h6v7h-6zM4 16h6v4H4z" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
