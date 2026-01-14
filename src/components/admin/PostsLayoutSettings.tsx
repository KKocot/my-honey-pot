import { For, Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { Slider } from '../ui'

// ============================================
// Posts Layout Settings Section
// ============================================

const layoutOptions = [
  { value: 'list', label: 'Lista' },
  { value: 'grid', label: 'Grid' },
  { value: 'masonry', label: 'Masonry' },
] as const

export function PostsLayoutSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Układ postów</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text mb-2">Typ układu</label>
            <div class="flex gap-4">
              <For each={layoutOptions}>
                {(option) => (
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="postsLayout"
                      value={option.value}
                      checked={settings.postsLayout === option.value}
                      onChange={() => updateSettings({ postsLayout: option.value })}
                      class="w-5 h-5 text-primary focus:ring-primary"
                    />
                    <span class="text-sm text-text">{option.label}</span>
                  </label>
                )}
              </For>
            </div>
          </div>

          <Show when={settings.postsLayout !== 'list'}>
            <Slider
              label="Liczba kolumn:"
              min={1}
              max={4}
              value={settings.gridColumns}
              onInput={(e) => updateSettings({ gridColumns: parseInt(e.currentTarget.value) })}
            />
          </Show>

          <Slider
            label="Odstęp między kartami:"
            unit="px"
            min={0}
            max={64}
            value={settings.cardGapPx}
            onInput={(e) => updateSettings({ cardGapPx: parseInt(e.currentTarget.value) })}
          />
        </div>

        {/* Preview */}
        <PostsLayoutPreview />
      </div>
    </div>
  )
}

// ============================================
// Preview Component
// ============================================

function PostsLayoutPreview() {
  const getGridStyle = () => {
    const gap = settings.cardGapPx
    const columns = settings.gridColumns

    if (settings.postsLayout === 'list') {
      return `display: flex; flex-direction: column; gap: ${gap}px;`
    }
    if (settings.postsLayout === 'grid') {
      return `display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px;`
    }
    return `column-count: ${columns}; column-gap: ${gap}px;`
  }

  const getMasonryItemStyle = () => {
    if (settings.postsLayout === 'masonry') {
      return `margin-bottom: ${settings.cardGapPx}px; break-inside: avoid;`
    }
    return ''
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-2 uppercase tracking-wide">Podgląd układu</p>
      <div class="min-h-[200px]" style={getGridStyle()}>
        <For each={Array(6).fill(null)}>
          {(_, i) => (
            <div
              class="bg-bg-secondary rounded p-3 text-xs text-text-muted"
              style={getMasonryItemStyle()}
            >
              Post {i() + 1}
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
