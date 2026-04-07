// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, createMemo, Show, For } from 'solid-js'
import { settings, updateSettings } from '../../store'
import { authorProfileElementLabels } from '../../types/index'
import type { CardLayout } from '../../types/index'
import { Slider } from '../../../ui'
import { SocialLinksSettings } from '../SocialLinksSettings'
import { CardLayoutEditor } from '../../editors/CardLayoutEditor'
import { AuthorProfilePreview } from './AuthorProfilePreview'
import { isElementInLayout, areAnyElementsInLayout } from './helpers'
import { AUTHOR_PROFILE_PRESETS, detectActivePreset } from './presets'

// ============================================
// All author profile element IDs for CardLayoutEditor
// ============================================

const AUTHOR_PROFILE_ELEMENT_IDS = [
  'coverImage', 'avatar', 'username', 'displayName', 'reputation',
  'about', 'location', 'website', 'joinDate',
  'followers', 'following', 'postCount', 'hivePower', 'hpEarned',
  'hiveBalance', 'hbdBalance',
]

// ============================================
// Author Profile Settings Section
// ============================================

export function AuthorProfileSettings() {
  // Extract current size values for preset detection
  const current_sizes = createMemo(() => ({
    authorAvatarSizePx: settings.authorAvatarSizePx,
    authorCoverHeightPx: settings.authorCoverHeightPx,
    authorUsernameSizePx: settings.authorUsernameSizePx,
    authorDisplayNameSizePx: settings.authorDisplayNameSizePx,
    authorAboutSizePx: settings.authorAboutSizePx,
    authorReputationSizePx: settings.authorReputationSizePx,
    authorStatsSizePx: settings.authorStatsSizePx,
    authorMetaSizePx: settings.authorMetaSizePx,
  }))

  // Active preset — reactively detected from current layout + sizes
  const active_preset_id = createMemo(() =>
    detectActivePreset(settings.authorProfileLayout2, current_sizes() as Record<string, unknown>)
  )

  // Accordion states
  const [layout_open, set_layout_open] = createSignal(false)
  const [sizing_open, set_sizing_open] = createSignal(false)

  // Apply a preset
  const apply_preset = (preset: typeof AUTHOR_PROFILE_PRESETS[number]) => {
    updateSettings({ authorProfileLayout2: preset.layout, ...preset.sizes })
  }

  // CardLayoutEditor update handler
  const handleLayoutUpdate = (layout: CardLayout) => {
    updateSettings({ authorProfileLayout2: layout })
  }

  // Memoized checks for slider disabled states
  const has_avatar = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'avatar'))
  const has_cover = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'coverImage'))
  const has_username = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'username'))
  const has_display_name = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'displayName'))
  const has_about = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'about'))
  const has_reputation = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'reputation'))
  const has_stats = createMemo(() => areAnyElementsInLayout(settings.authorProfileLayout2, ['followers', 'following', 'postCount', 'hivePower', 'hpEarned', 'hiveBalance', 'hbdBalance']))
  const has_meta = createMemo(() => areAnyElementsInLayout(settings.authorProfileLayout2, ['location', 'website', 'joinDate']))

  // Handle slider change — mark as custom
  const handle_size_change = (key: string, val: number) => {
    updateSettings({ [key]: val })
  }

  return (
    <div class="bg-bg-card rounded-xl p-4 mb-4 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-4">Author Profile Settings</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="space-y-3">

          {/* Preset Gallery */}
          <div>
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
              Layout Presets
            </h3>
            <div class="flex flex-wrap gap-1.5">
              <For each={AUTHOR_PROFILE_PRESETS}>
                {(preset) => (
                  <button
                    type="button"
                    class={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      active_preset_id() === preset.id
                        ? 'ring-2 ring-accent bg-accent/10 text-accent'
                        : 'border border-border hover:border-accent/50 text-primary'
                    }`}
                    onClick={() => apply_preset(preset)}
                  >
                    {preset.label}
                  </button>
                )}
              </For>
              <Show when={active_preset_id() === 'custom'}>
                <div class="px-3 py-1.5 rounded-lg ring-2 ring-accent bg-accent/10 text-sm font-medium text-accent">
                  Custom
                </div>
              </Show>
            </div>
            <Show when={active_preset_id() !== 'custom'}>
              {(() => {
                const preset = AUTHOR_PROFILE_PRESETS.find(p => p.id === active_preset_id())
                return preset ? (
                  <p class="text-xs text-text-muted mt-1.5">{preset.description}</p>
                ) : null
              })()}
            </Show>
          </div>

          {/* Card Layout Editor (accordion) */}
          <div class="border-t border-border pt-3">
            <button
              type="button"
              class="flex items-center justify-between w-full text-left cursor-pointer"
              aria-expanded={layout_open()}
              aria-controls="author-layout-editor"
              onClick={() => set_layout_open(!layout_open())}
            >
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">
                Layout Editor
              </h3>
              <svg
                class={`w-4 h-4 text-text-muted transition-transform ${layout_open() ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Show when={layout_open()}>
              <div id="author-layout-editor" role="region" class="mt-3">
                <CardLayoutEditor
                  layout={settings.authorProfileLayout2}
                  elementLabels={authorProfileElementLabels}
                  allElementIds={AUTHOR_PROFILE_ELEMENT_IDS}
                  onUpdate={handleLayoutUpdate}
                />
              </div>
            </Show>
          </div>

          {/* Advanced Sizing Accordion */}
          <div class="border-t border-border pt-3">
            <button
              type="button"
              class="flex items-center justify-between w-full text-left cursor-pointer"
              aria-expanded={sizing_open()}
              aria-controls="author-sizing-panel"
              onClick={() => set_sizing_open(!sizing_open())}
            >
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">
                Advanced Sizing
              </h3>
              <svg
                class={`w-4 h-4 text-text-muted transition-transform ${sizing_open() ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <Show when={sizing_open()}>
              <div id="author-sizing-panel" role="region" class="mt-3">
                <p class="text-xs text-text-muted mb-2">
                  Sliders are disabled when the element is not in the layout.
                </p>
                <div class="grid grid-cols-2 gap-4">
                  <Slider
                    label="Avatar size:"
                    unit="px"
                    min={32}
                    max={128}
                    value={settings.authorAvatarSizePx}
                    onChange={(val) => handle_size_change('authorAvatarSizePx', val)}
                    disabled={!has_avatar()}
                  />
                  <Slider
                    label="Cover height:"
                    unit="px"
                    min={48}
                    max={200}
                    value={settings.authorCoverHeightPx ?? 64}
                    onChange={(val) => handle_size_change('authorCoverHeightPx', val)}
                    disabled={!has_cover()}
                  />
                  <Slider
                    label="Username size:"
                    unit="px"
                    min={12}
                    max={24}
                    value={settings.authorUsernameSizePx ?? 14}
                    onChange={(val) => handle_size_change('authorUsernameSizePx', val)}
                    disabled={!has_username()}
                  />
                  <Slider
                    label="Display name size:"
                    unit="px"
                    min={14}
                    max={32}
                    value={settings.authorDisplayNameSizePx ?? 18}
                    onChange={(val) => handle_size_change('authorDisplayNameSizePx', val)}
                    disabled={!has_display_name()}
                  />
                  <Slider
                    label="About text size:"
                    unit="px"
                    min={10}
                    max={18}
                    value={settings.authorAboutSizePx ?? 14}
                    onChange={(val) => handle_size_change('authorAboutSizePx', val)}
                    disabled={!has_about()}
                  />
                  <Slider
                    label="Reputation size:"
                    unit="px"
                    min={10}
                    max={16}
                    value={settings.authorReputationSizePx ?? 12}
                    onChange={(val) => handle_size_change('authorReputationSizePx', val)}
                    disabled={!has_reputation()}
                  />
                  <Slider
                    label="Stats size:"
                    unit="px"
                    min={10}
                    max={20}
                    value={settings.authorStatsSizePx ?? 14}
                    onChange={(val) => handle_size_change('authorStatsSizePx', val)}
                    disabled={!has_stats()}
                  />
                  <Slider
                    label="Meta text size:"
                    unit="px"
                    min={10}
                    max={16}
                    value={settings.authorMetaSizePx ?? 12}
                    onChange={(val) => handle_size_change('authorMetaSizePx', val)}
                    disabled={!has_meta()}
                  />
                </div>
              </div>
            </Show>
          </div>

          {/* Social Media Links */}
          <div class="border-t border-border pt-3">
            <SocialLinksSettings />
          </div>
        </div>

        {/* Live Preview */}
        <AuthorProfilePreview />
      </div>
    </div>
  )
}
