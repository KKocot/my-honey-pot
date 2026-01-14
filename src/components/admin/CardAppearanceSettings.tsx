import { Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { Select, Checkbox, Slider } from '../ui'
import { cardLayoutOptions, thumbnailPositionOptions } from './types'
import { SingleCardPreview } from './PostCardPreview'

// ============================================
// Card Appearance Settings Section
// ============================================

export function CardAppearanceSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Post Card Appearance</h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="space-y-6">
          <CardLayoutSection />
          <CardVisibilitySection />
        </div>

        {/* Single card preview - shows card in list mode to demonstrate orientation */}
        <SingleCardPreview maxHeight="450px" />
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
      <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">Card Layout</h3>

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
// Card Visibility Section
// ============================================

function CardVisibilitySection() {
  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">Element Visibility</h3>

      <div class="grid grid-cols-2 gap-3">
        <Checkbox
          label="Thumbnail"
          checked={settings.showThumbnail}
          onChange={(e) => updateSettings({ showThumbnail: e.currentTarget.checked })}
        />
        <Checkbox
          label="Summary"
          checked={settings.showSummary}
          onChange={(e) => updateSettings({ showSummary: e.currentTarget.checked })}
        />
        <Checkbox
          label="Date"
          checked={settings.showDate}
          onChange={(e) => updateSettings({ showDate: e.currentTarget.checked })}
        />
        <Checkbox
          label="Votes"
          checked={settings.showVotes}
          onChange={(e) => updateSettings({ showVotes: e.currentTarget.checked })}
        />
        <Checkbox
          label="Comments"
          checked={settings.showComments}
          onChange={(e) => updateSettings({ showComments: e.currentTarget.checked })}
        />
        <Checkbox
          label="Payout"
          checked={settings.showPayout}
          onChange={(e) => updateSettings({ showPayout: e.currentTarget.checked })}
        />
        <Checkbox
          label="Tags"
          checked={settings.showTags}
          onChange={(e) => updateSettings({ showTags: e.currentTarget.checked })}
        />
        <Checkbox
          label="Card border"
          checked={settings.cardBorder}
          onChange={(e) => updateSettings({ cardBorder: e.currentTarget.checked })}
        />
      </div>

      <Show when={settings.showSummary}>
        <Slider
          label="Summary length:"
          unit=" chars"
          min={50}
          max={500}
          value={settings.summaryMaxLength}
          onInput={(e) => updateSettings({ summaryMaxLength: parseInt(e.currentTarget.value) })}
        />
      </Show>

      <Show when={settings.showTags}>
        <Slider
          label="Max number of tags:"
          min={1}
          max={10}
          value={settings.maxTags}
          onInput={(e) => updateSettings({ maxTags: parseInt(e.currentTarget.value) })}
        />
      </Show>
    </div>
  )
}
