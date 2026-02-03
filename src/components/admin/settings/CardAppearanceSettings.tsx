// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For, createMemo } from 'solid-js'
import { settings, updateSettings } from '../store'
import { Slider } from '../../ui'
import { collectAllElementIds, postCardElementLabels, type CardLayout } from '../types/index'
import { CardLayoutEditor } from '../editors/CardLayoutEditor'
import { PostCard, samplePosts } from '../previews/PostCardPreview'

// All available post card element IDs (avatar removed)
const POST_CARD_ELEMENT_IDS = ['thumbnail', 'title', 'summary', 'date', 'votes', 'comments', 'payout', 'tags']

// Extended labels for individual elements
const extendedPostCardElementLabels: Record<string, string> = {
  ...postCardElementLabels,
  date: 'Date',
  votes: 'Votes',
  comments: 'Comments',
  payout: 'Payout',
}

// ============================================
// Card Appearance Settings Section
// ============================================

export function CardAppearanceSettings() {
  const handleLayoutUpdate = (layout: CardLayout) => {
    updateSettings({ postCardLayout: layout })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Post Card Appearance</h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="space-y-6">
          <CardLayoutSection />

          {/* Card Layout Editor - Drag & Drop */}
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
              Card Elements Layout
            </h3>
            <p class="text-xs text-text-muted mb-4">
              Drag elements between sections. Each section can be horizontal or vertical.
            </p>
            <CardLayoutEditor
              layout={settings.postCardLayout}
              elementLabels={extendedPostCardElementLabels}
              allElementIds={POST_CARD_ELEMENT_IDS}
              onUpdate={handleLayoutUpdate}
            />
          </div>

          {/* Additional Settings for enabled elements */}
          <AdditionalSettings />
        </div>

        {/* Live Preview */}
        <PostCardPreviewSection />
      </div>
    </div>
  )
}

// ============================================
// Card Layout Section
// ============================================

function CardLayoutSection() {
  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">Card Settings</h3>

      <div class="grid grid-cols-2 gap-4">
        <Slider
          label="Thumbnail:"
          unit="px"
          min={32}
          max={400}
          value={settings.thumbnailSizePx}
          onChange={(val) => updateSettings({ thumbnailSizePx: val })}
        />

        <Slider
          label="Padding:"
          unit="px"
          min={0}
          max={64}
          value={settings.cardPaddingPx}
          onChange={(val) => updateSettings({ cardPaddingPx: val })}
        />

        <Slider
          label="Border radius:"
          unit="px"
          min={0}
          max={48}
          value={settings.cardBorderRadiusPx}
          onChange={(val) => updateSettings({ cardBorderRadiusPx: val })}
        />

        <Slider
          label="Title:"
          unit="px"
          min={12}
          max={48}
          value={settings.titleSizePx}
          onChange={(val) => updateSettings({ titleSizePx: val })}
        />
      </div>
    </div>
  )
}

// ============================================
// Additional Settings (based on enabled elements)
// ============================================

function AdditionalSettings() {
  // Check if element is in any section (recursively)
  const isElementUsed = (id: string) => {
    return collectAllElementIds(settings.postCardLayout).includes(id)
  }

  return (
    <div class="space-y-4">
      <Show when={isElementUsed('summary')}>
        <Slider
          label="Summary length:"
          unit=" chars"
          min={50}
          max={500}
          value={settings.summaryMaxLength}
          onChange={(val) => updateSettings({ summaryMaxLength: val })}
        />
      </Show>

      <Show when={isElementUsed('tags')}>
        <Slider
          label="Max tags:"
          min={1}
          max={10}
          value={settings.maxTags}
          onChange={(val) => updateSettings({ maxTags: val })}
        />
      </Show>
    </div>
  )
}

// ============================================
// Live Preview Component - Uses shared PostCard
// ============================================

function PostCardPreviewSection() {
  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview (hover to test)</p>
      <PostCard post={samplePosts[0]} />
    </div>
  )
}
