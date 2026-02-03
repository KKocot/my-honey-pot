// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show, createSignal } from 'solid-js'
import {
  pageElementLabels,
  getPageElementColor,
  type PageLayoutSection,
} from '../../types/index'
import {
  PlusIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HorizontalIcon,
  VerticalIcon,
  EyeIcon,
  EyeOffIcon,
} from './icons'
import { useClickOutside } from '../../hooks/use_click_outside'

// ============================================
// Section Card Component
// ============================================

export interface SectionCardProps {
  section: PageLayoutSection
  sectionIndex: number
  totalSections: number
  unusedElements: string[]
  hasFooter: boolean
  onRemove: () => void
  onToggleOrientation: () => void
  onToggleActive: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddElement: (elementId: string) => void
  onRemoveElement: (elementId: string) => void
  onMoveElementUp: (index: number) => void
  onMoveElementDown: (index: number) => void
}

export function SectionCard(props: SectionCardProps) {
  const [showElementPicker, setShowElementPicker] = createSignal(false)
  let pickerContainerRef: HTMLDivElement | undefined

  useClickOutside(
    () => pickerContainerRef,
    () => setShowElementPicker(false)
  )

  return (
    <div class="rounded-lg border-2 border-border p-2 bg-bg-card">
      {/* Section header */}
      <div class="flex items-center gap-2 mb-2">
        {/* Move buttons */}
        <div class="flex flex-col">
          <button
            type="button"
            onClick={props.onMoveUp}
            disabled={props.sectionIndex === 0}
            class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move section up"
            aria-label="Move section up"
          >
            <ChevronUpIcon class="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={props.onMoveDown}
            disabled={props.sectionIndex >= props.totalSections - 1}
            class="p-0.5 rounded text-text-muted hover:text-text hover:bg-bg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move section down"
            aria-label="Move section down"
          >
            <ChevronDownIcon class="w-3 h-3" />
          </button>
        </div>

        {/* Section number */}
        <span class="text-xs font-medium text-text-muted">Section {props.sectionIndex + 1}</span>

        {/* Active toggle */}
        <Show when={!props.hasFooter}>
          <button
            type="button"
            onClick={props.onToggleActive}
            class={`
              flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors
              ${props.section.active !== false
                ? 'bg-success/20 text-success'
                : 'bg-text-muted/20 text-text-muted'}
            `}
            title={props.section.active !== false ? 'Click to hide section' : 'Click to show section'}
            aria-label={props.section.active !== false ? 'Hide section' : 'Show section'}
          >
            {props.section.active !== false ? (
              <EyeIcon class="w-3 h-3" />
            ) : (
              <EyeOffIcon class="w-3 h-3" />
            )}
          </button>
        </Show>

        {/* Orientation toggle */}
        <button
          type="button"
          onClick={props.onToggleOrientation}
          class={`
            flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors
            ${props.section.orientation === 'horizontal'
              ? 'bg-primary/20 text-primary'
              : 'bg-accent/20 text-accent'}
          `}
          title={`Click to switch to ${props.section.orientation === 'horizontal' ? 'vertical' : 'horizontal'}`}
          aria-label={`Switch to ${props.section.orientation === 'horizontal' ? 'vertical' : 'horizontal'} orientation`}
        >
          {props.section.orientation === 'horizontal' ? (
            <>
              <HorizontalIcon class="w-3 h-3" />
              <span>H</span>
            </>
          ) : (
            <>
              <VerticalIcon class="w-3 h-3" />
              <span>V</span>
            </>
          )}
        </button>

        {/* Remove section */}
        <Show when={!props.hasFooter}>
          <button
            type="button"
            onClick={props.onRemove}
            class="ml-auto p-1 rounded text-text-muted hover:text-error hover:bg-error/10 transition-colors"
            title="Remove section"
            aria-label="Remove section"
          >
            <XIcon class="w-3 h-3" />
          </button>
        </Show>
      </div>

      {/* Elements container */}
      <div
        class={`
          min-h-[32px] rounded border border-dashed border-border p-1.5
          ${props.section.orientation === 'horizontal' ? 'flex flex-wrap gap-1.5' : 'flex flex-col gap-1.5'}
        `}
      >
        <Show when={props.section.elements.length === 0}>
          <span class="text-xs text-text-muted italic">No elements</span>
        </Show>

        <For each={props.section.elements}>
          {(elementId, elementIndex) => (
            <div
              class={`
                flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                ${getPageElementColor(elementId)}
              `}
            >
              {/* Move buttons for element */}
              <div class={`flex ${props.section.orientation === 'horizontal' ? 'flex-col' : 'flex-row'} -ml-1`}>
                <button
                  type="button"
                  onClick={() => props.onMoveElementUp(elementIndex())}
                  disabled={elementIndex() === 0}
                  class="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={props.section.orientation === 'horizontal' ? 'Move left' : 'Move up'}
                  aria-label={props.section.orientation === 'horizontal' ? 'Move element left' : 'Move element up'}
                >
                  {props.section.orientation === 'horizontal' ? (
                    <ChevronLeftIcon class="w-2.5 h-2.5" />
                  ) : (
                    <ChevronUpIcon class="w-2.5 h-2.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => props.onMoveElementDown(elementIndex())}
                  disabled={elementIndex() >= props.section.elements.length - 1}
                  class="p-0.5 rounded hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={props.section.orientation === 'horizontal' ? 'Move right' : 'Move down'}
                  aria-label={props.section.orientation === 'horizontal' ? 'Move element right' : 'Move element down'}
                >
                  {props.section.orientation === 'horizontal' ? (
                    <ChevronRightIcon class="w-2.5 h-2.5" />
                  ) : (
                    <ChevronDownIcon class="w-2.5 h-2.5" />
                  )}
                </button>
              </div>

              <span>{pageElementLabels[elementId] || elementId}</span>

              <Show when={elementId !== 'footer'}>
                <button
                  type="button"
                  onClick={() => props.onRemoveElement(elementId)}
                  class="ml-1 p-0.5 rounded hover:bg-white/20"
                  title="Remove element"
                  aria-label="Remove element"
                >
                  <XIcon class="w-3 h-3" />
                </button>
              </Show>
            </div>
          )}
        </For>

        {/* Add element button */}
        <div class="relative" ref={pickerContainerRef}>
          <button
            type="button"
            onClick={() => setShowElementPicker(!showElementPicker())}
            disabled={props.unusedElements.length === 0}
            class={`
              w-6 h-6 rounded border-2 border-dashed flex items-center justify-center transition-colors
              ${props.unusedElements.length === 0
                ? 'border-border/30 text-text-muted/30 cursor-not-allowed'
                : 'border-border/50 text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5'}
            `}
            title={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
            aria-label={props.unusedElements.length === 0 ? 'All elements are used' : 'Add element'}
          >
            <PlusIcon class="w-3 h-3" />
          </button>

          {/* Element picker dropdown */}
          <Show when={showElementPicker() && props.unusedElements.length > 0}>
            <div class="absolute left-0 top-8 z-50 bg-bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px]">
              <p class="text-xs text-text-muted mb-2 px-1">Add element:</p>
              <div class="space-y-1 max-h-[200px] overflow-y-auto">
                <For each={props.unusedElements}>
                  {(elementId) => (
                    <button
                      type="button"
                      onClick={() => {
                        props.onAddElement(elementId)
                        setShowElementPicker(false)
                      }}
                      class={`
                        w-full text-left px-2 py-1.5 rounded text-xs font-medium transition-colors
                        ${getPageElementColor(elementId)} hover:opacity-80
                      `}
                    >
                      {pageElementLabels[elementId] || elementId}
                    </button>
                  )}
                </For>
              </div>
              <button
                type="button"
                onClick={() => setShowElementPicker(false)}
                class="mt-2 w-full text-xs text-text-muted hover:text-text py-1"
              >
                Cancel
              </button>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
