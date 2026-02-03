// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, For, Show } from 'solid-js'
import { useClickOutside } from '../../hooks/use_click_outside'

// ============================================
// Element Picker Dropdown Component
// ============================================

interface ElementPickerProps {
  unusedElements: string[]
  elementLabels: Record<string, string>
  onSelect: (elementId: string) => void
}

export function ElementPicker(props: ElementPickerProps) {
  const [showPicker, setShowPicker] = createSignal(false)
  let containerRef: HTMLDivElement | undefined

  useClickOutside(
    () => containerRef,
    () => setShowPicker(false)
  )

  return (
    <div class="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker())}
        disabled={props.unusedElements.length === 0}
        class={`
          w-8 h-8 rounded border-2 border-dashed flex items-center justify-center transition-colors
          ${props.unusedElements.length === 0
            ? 'border-border/30 text-text-muted/30 cursor-not-allowed'
            : 'border-border/50 text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5'}
        `}
        title={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
        aria-label={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
      >
        <PlusIcon />
      </button>

      <Show when={showPicker() && props.unusedElements.length > 0}>
        <div class="absolute left-0 top-10 z-50 bg-bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
          <p class="text-xs text-text-muted mb-2 px-1">Add element:</p>
          <div class="space-y-1 max-h-[200px] overflow-y-auto">
            <For each={props.unusedElements}>
              {(elementId) => (
                <button
                  type="button"
                  onClick={() => {
                    props.onSelect(elementId)
                    setShowPicker(false)
                  }}
                  class="w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors bg-bg-secondary text-text hover:bg-primary hover:text-primary-text"
                >
                  {props.elementLabels[elementId] || elementId}
                </button>
              )}
            </For>
          </div>
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            class="mt-2 w-full text-xs text-text-muted hover:text-text py-1"
          >
            Cancel
          </button>
        </div>
      </Show>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  )
}
