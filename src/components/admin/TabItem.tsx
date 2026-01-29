import { Show } from 'solid-js'
import type { NavigationTab } from './types/index'
import { createLocalInput } from './hooks'

// Built-in tab IDs that cannot be removed
const BUILT_IN_TAB_IDS = ['posts', 'threads', 'comments']

// Check if tab is built-in
const isBuiltIn = (tabId: string) => BUILT_IN_TAB_IDS.includes(tabId)

interface TabItemProps {
  tab: NavigationTab
  index: number
  totalCount: number
  onUpdate: (tabId: string, updates: Partial<NavigationTab>) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onRemove: (tabId: string) => void
}

export function TabItem(props: TabItemProps) {
  const [localLabel, setLocalLabel, commitLabel] = createLocalInput(
    () => props.tab.label,
    (val) => props.onUpdate(props.tab.id, { label: val })
  )
  const [localTag, setLocalTag, commitTag] = createLocalInput(
    () => props.tab.tag || '',
    (val) => props.onUpdate(props.tab.id, { tag: val })
  )

  return (
    <div class="bg-bg rounded-lg border border-border overflow-hidden">
      <div class="flex items-center gap-2 p-3">
        {/* Reorder buttons */}
        <div class="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => props.onMoveUp(props.index)}
            disabled={props.index === 0}
            class="p-0.5 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
            aria-label="Move tab up"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => props.onMoveDown(props.index)}
            disabled={props.index === props.totalCount - 1}
            class="p-0.5 text-text-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
            aria-label="Move tab down"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Enable toggle */}
        <input
          type="checkbox"
          checked={props.tab.enabled}
          onChange={(e) => props.onUpdate(props.tab.id, { enabled: e.currentTarget.checked })}
          disabled={props.tab.id === 'threads'}
          class={`w-4 h-4 rounded border-border text-primary focus:ring-primary ${props.tab.id === 'threads' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        />

        {/* Tab info */}
        <div class="flex-1 min-w-0">
          <Show
            when={!isBuiltIn(props.tab.id)}
            fallback={
              <div class="flex items-center gap-2">
                <span class={`font-medium ${props.tab.enabled ? 'text-text' : 'text-text-muted'}`}>
                  {props.tab.label}
                </span>
                <Show when={props.tab.id === 'threads'}>
                  <span class="text-[10px] px-1.5 py-0.5 bg-warning/20 text-warning rounded">
                    Work in Progress
                  </span>
                </Show>
              </div>
            }
          >
            <input
              type="text"
              value={localLabel()}
              placeholder="Tab label"
              onInput={(e) => setLocalLabel(e.currentTarget.value)}
              onBlur={commitLabel}
              class="w-full px-3 py-1.5 bg-bg border border-border rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </Show>
        </div>

        {/* Tag/Community input for custom category tabs */}
        <Show when={!isBuiltIn(props.tab.id)}>
          <div class="flex items-center gap-1">
            <span class="text-xs text-text-muted">#</span>
            <input
              type="text"
              value={localTag()}
              placeholder="tag or community"
              onInput={(e) => setLocalTag(e.currentTarget.value)}
              onBlur={commitTag}
              class={`w-36 px-2 py-1.5 bg-bg border rounded text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary ${!localTag() ? 'border-warning' : 'border-border'}`}
            />
            <Show when={!localTag()}>
              <span class="text-[10px] text-warning" title="Empty tag will match no posts">&#x26A0;</span>
            </Show>
          </div>
        </Show>

        {/* Remove button (custom tabs only) */}
        <Show when={!isBuiltIn(props.tab.id)}>
          <button
            type="button"
            onClick={() => props.onRemove(props.tab.id)}
            class="p-1 text-error hover:bg-error/10 rounded"
            title="Remove tab"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Show>
      </div>
    </div>
  )
}
