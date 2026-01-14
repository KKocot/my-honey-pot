import { For, Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { Slider, Checkbox } from '../ui'
import { LayoutPreview } from './PostCardPreview'
import { postsSortOptions, commentsSortOptions } from './types'

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
                onInput={(e) => updateSettings({ gridColumns: parseInt(e.currentTarget.value) })}
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
            onInput={(e) => updateSettings({ cardGapPx: parseInt(e.currentTarget.value) })}
          />

          {/* Sorting Settings */}
          <div class="pt-4 border-t border-border">
            <h3 class="text-sm font-medium text-text mb-4 flex items-center gap-2">
              <SortIcon />
              Sorting & Filtering
            </h3>

            {/* Posts Sort Order */}
            <div class="mb-4">
              <label class="block text-sm font-medium text-text mb-2">Posts sort order</label>
              <div class="flex flex-wrap gap-2">
                <For each={postsSortOptions}>
                  {(option) => (
                    <button
                      type="button"
                      onClick={() => updateSettings({ postsSortOrder: option.value as 'blog' | 'posts' | 'payout' })}
                      class={`
                        px-3 py-1.5 rounded-md text-sm transition-all
                        ${settings.postsSortOrder === option.value
                          ? 'bg-primary text-white'
                          : 'bg-bg-secondary text-text-muted hover:bg-bg-secondary/80 hover:text-text'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  )}
                </For>
              </div>
            </div>

            {/* Include Reblogs Checkbox - only for blog sort */}
            <Show when={settings.postsSortOrder === 'blog'}>
              <div class="mb-4">
                <Checkbox
                  label="Include reblogs"
                  checked={settings.includeReblogs}
                  onChange={(e) => updateSettings({ includeReblogs: e.currentTarget.checked })}
                />
              </div>
            </Show>

            {/* Comments Sort Order */}
            <div>
              <label class="block text-sm font-medium text-text mb-2">Comments sort order</label>
              <div class="flex flex-wrap gap-2">
                <For each={commentsSortOptions}>
                  {(option) => (
                    <button
                      type="button"
                      onClick={() => updateSettings({ commentsSortOrder: option.value as 'comments' | 'replies' })}
                      class={`
                        px-3 py-1.5 rounded-md text-sm transition-all
                        ${settings.commentsSortOrder === option.value
                          ? 'bg-primary text-white'
                          : 'bg-bg-secondary text-text-muted hover:bg-bg-secondary/80 hover:text-text'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Preview - shows actual cards in layout */}
        <LayoutPreview postCount={4} maxHeight="400px" />
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

function SortIcon() {
  return (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
  )
}
