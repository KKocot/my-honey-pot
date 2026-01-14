import { Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { Select, Checkbox, Slider } from '../ui'
import { cardLayoutOptions, thumbnailPositionOptions } from './types'
import { LayoutPreview } from './PostCardPreview'

// ============================================
// Card Appearance Settings Section
// ============================================

export function CardAppearanceSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Wygląd karty posta</h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="space-y-6">
          <CardLayoutSection />
          <CardVisibilitySection />
        </div>

        {/* Unified Preview - shows cards in actual layout */}
        <LayoutPreview postCount={3} maxHeight="450px" />
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
      <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">Układ karty</h3>

      <div class="grid grid-cols-2 gap-4">
        <Select
          label="Orientacja (lista)"
          options={cardLayoutOptions}
          value={settings.cardLayout}
          onChange={(e) => updateSettings({ cardLayout: e.currentTarget.value as 'horizontal' | 'vertical' })}
        />

        <Show when={settings.cardLayout === 'horizontal' && settings.postsLayout === 'list'}>
          <Select
            label="Pozycja miniaturki"
            options={thumbnailPositionOptions}
            value={settings.thumbnailPosition}
            onChange={(e) => updateSettings({ thumbnailPosition: e.currentTarget.value as 'left' | 'right' })}
          />
        </Show>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <Slider
          label="Miniaturka:"
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
          label="Zaokrąglenie:"
          unit="px"
          min={0}
          max={48}
          value={settings.cardBorderRadiusPx}
          onInput={(e) => updateSettings({ cardBorderRadiusPx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Tytuł:"
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
      <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">Widoczność elementów</h3>

      <div class="grid grid-cols-2 gap-3">
        <Checkbox
          label="Miniaturka"
          checked={settings.showThumbnail}
          onChange={(e) => updateSettings({ showThumbnail: e.currentTarget.checked })}
        />
        <Checkbox
          label="Streszczenie"
          checked={settings.showSummary}
          onChange={(e) => updateSettings({ showSummary: e.currentTarget.checked })}
        />
        <Checkbox
          label="Data"
          checked={settings.showDate}
          onChange={(e) => updateSettings({ showDate: e.currentTarget.checked })}
        />
        <Checkbox
          label="Głosy"
          checked={settings.showVotes}
          onChange={(e) => updateSettings({ showVotes: e.currentTarget.checked })}
        />
        <Checkbox
          label="Komentarze"
          checked={settings.showComments}
          onChange={(e) => updateSettings({ showComments: e.currentTarget.checked })}
        />
        <Checkbox
          label="Payout"
          checked={settings.showPayout}
          onChange={(e) => updateSettings({ showPayout: e.currentTarget.checked })}
        />
        <Checkbox
          label="Tagi"
          checked={settings.showTags}
          onChange={(e) => updateSettings({ showTags: e.currentTarget.checked })}
        />
        <Checkbox
          label="Ramka karty"
          checked={settings.cardBorder}
          onChange={(e) => updateSettings({ cardBorder: e.currentTarget.checked })}
        />
      </div>

      <Show when={settings.showSummary}>
        <Slider
          label="Długość streszczenia:"
          unit=" znaków"
          min={50}
          max={500}
          value={settings.summaryMaxLength}
          onInput={(e) => updateSettings({ summaryMaxLength: parseInt(e.currentTarget.value) })}
        />
      </Show>

      <Show when={settings.showTags}>
        <Slider
          label="Maksymalna liczba tagów:"
          min={1}
          max={10}
          value={settings.maxTags}
          onInput={(e) => updateSettings({ maxTags: parseInt(e.currentTarget.value) })}
        />
      </Show>
    </div>
  )
}
