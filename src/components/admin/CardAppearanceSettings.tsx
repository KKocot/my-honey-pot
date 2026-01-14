import { For, Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { Select, Checkbox, Slider } from '../ui'
import { cardLayoutOptions, thumbnailPositionOptions } from './types'

// ============================================
// Card Appearance Settings Section
// ============================================

export function CardAppearanceSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Wygląd karty posta</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-6">
          <CardLayoutSection />
          <CardVisibilitySection />
        </div>

        {/* Preview */}
        <CardPreview />
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
          label="Orientacja"
          options={cardLayoutOptions}
          value={settings.cardLayout}
          onChange={(e) => updateSettings({ cardLayout: e.currentTarget.value as 'horizontal' | 'vertical' })}
        />

        <Show when={settings.cardLayout === 'horizontal'}>
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

// ============================================
// Card Preview Component
// ============================================

function CardPreview() {
  const sampleTags = ['hive', 'blog', 'crypto', 'polska', 'news', 'technology', 'community', 'blockchain', 'web3', 'decentralized']

  const sampleSummary = () => {
    const fullText = 'To jest przykładowe streszczenie posta z bloga Hive. Zawiera opis treści artykułu i zachęca do przeczytania całości. Post opowiada o ciekawych tematach związanych z blockchainem, kryptowalutami i społecznością Hive. Możesz dowiedzieć się więcej klikając w tytuł posta. Tekst jest dostatecznie długi aby pokazać jak działa obcinanie.'
    return fullText.length > settings.summaryMaxLength
      ? fullText.slice(0, settings.summaryMaxLength) + '...'
      : fullText
  }

  const cardStyle = () => {
    const border = settings.cardBorder ? 'border: 1px solid var(--color-border);' : ''
    return `padding: ${settings.cardPaddingPx}px; border-radius: ${settings.cardBorderRadiusPx}px; ${border}`
  }

  const flexDirection = () => {
    if (settings.cardLayout === 'vertical') return 'flex-col'
    return settings.thumbnailPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-2 uppercase tracking-wide">Podgląd karty</p>
      <article class="bg-bg-card shadow-sm transition-all duration-300" style={cardStyle()}>
        <div class={`flex ${flexDirection()} gap-4`}>
          <Show when={settings.showThumbnail}>
            <img
              src="https://images.hive.blog/u/gtg/avatar"
              alt=""
              style={{
                width: `${settings.thumbnailSizePx}px`,
                height: `${settings.thumbnailSizePx}px`,
                'object-fit': 'cover',
                'border-radius': '8px',
                'flex-shrink': '0',
              }}
              onError={(e) => { e.currentTarget.src = '/hive-logo.png' }}
            />
          </Show>
          <div class="flex-1 min-w-0">
            <h2 class="font-semibold mb-2" style={{ 'font-size': `${settings.titleSizePx}px` }}>
              <span class="text-text hover:text-primary transition-colors cursor-pointer">
                Przykładowy tytuł posta na blogu
              </span>
            </h2>

            <Show when={settings.showSummary}>
              <p class="text-text-muted text-sm mb-3">{sampleSummary()}</p>
            </Show>

            <Show when={settings.showDate || settings.showVotes || settings.showComments || settings.showPayout}>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted mb-3">
                <Show when={settings.showDate}>
                  <span>13 sty 2026</span>
                </Show>
                <Show when={settings.showVotes}>
                  <span class="flex items-center gap-1">
                    <VoteIcon />
                    156
                  </span>
                </Show>
                <Show when={settings.showComments}>
                  <span class="flex items-center gap-1">
                    <CommentIcon />
                    24
                  </span>
                </Show>
                <Show when={settings.showPayout}>
                  <span class="text-success font-medium">$12.45</span>
                </Show>
              </div>
            </Show>

            <Show when={settings.showTags}>
              <div class="flex flex-wrap gap-2">
                <For each={sampleTags.slice(0, settings.maxTags)}>
                  {(tag) => (
                    <span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">
                      #{tag}
                    </span>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </article>
    </div>
  )
}

// ============================================
// Icons
// ============================================

function VoteIcon() {
  return (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
