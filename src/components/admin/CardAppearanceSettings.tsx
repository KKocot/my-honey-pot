import { Show, For, createMemo } from 'solid-js'
import { settings, updateSettings } from './store'
import { Select, Slider } from '../ui'
import { cardLayoutOptions, thumbnailPositionOptions, collectAllElementIds, postCardElementLabels, type CardLayout } from './types'
import { CardLayoutEditor } from './CardLayoutEditor'
import { PostCard, samplePosts } from './PostCardPreview'

// All available post card element IDs
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
        <Select
          label="Orientation (list)"
          options={cardLayoutOptions}
          value={settings.cardLayout}
          onChange={(e) => updateSettings({ cardLayout: e.currentTarget.value as 'horizontal' | 'vertical' })}
        />

        <Show when={settings.cardLayout === 'horizontal' && settings.postsLayout === 'list'}>
          <Select
            label="Thumbnail position"
            options={thumbnailPositionOptions}
            value={settings.thumbnailPosition}
            onChange={(e) => updateSettings({ thumbnailPosition: e.currentTarget.value as 'left' | 'right' })}
          />
        </Show>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <Slider
          label="Thumbnail:"
          unit="px"
          min={32}
          max={400}
          value={settings.thumbnailSizePx}
          onInput={(e) => updateSettings({ thumbnailSizePx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Padding:"
          unit="px"
          min={0}
          max={64}
          value={settings.cardPaddingPx}
          onInput={(e) => updateSettings({ cardPaddingPx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Border radius:"
          unit="px"
          min={0}
          max={48}
          value={settings.cardBorderRadiusPx}
          onInput={(e) => updateSettings({ cardBorderRadiusPx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Title:"
          unit="px"
          min={12}
          max={48}
          value={settings.titleSizePx}
          onInput={(e) => updateSettings({ titleSizePx: parseInt(e.currentTarget.value) })}
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
          onInput={(e) => updateSettings({ summaryMaxLength: parseInt(e.currentTarget.value) })}
        />
      </Show>

      <Show when={isElementUsed('tags')}>
        <Slider
          label="Max tags:"
          min={1}
          max={10}
          value={settings.maxTags}
          onInput={(e) => updateSettings({ maxTags: parseInt(e.currentTarget.value) })}
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
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>
      <PostCard post={samplePosts[0]} />
    </div>
  )
}
