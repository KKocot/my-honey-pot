// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For, type Accessor } from 'solid-js'
import { showToast } from '../../../ui'

interface JsonPreviewModalProps {
  show: boolean
  is_loading: boolean
  diff_view_mode: 'diff' | 'old' | 'new'
  json_old_content: Record<string, unknown> | null
  json_new_content: Record<string, unknown> | null
  json_diff: Array<{ key: string; oldValue: unknown; newValue: unknown; type: 'changed' | 'added' | 'removed' }>
  onClose: () => void
  onChangeDiffMode: (mode: 'diff' | 'old' | 'new') => void
}

export function JsonPreviewModal(props: JsonPreviewModalProps) {
  const handle_copy_json = async () => {
    try {
      const content = props.diff_view_mode === 'old'
        ? JSON.stringify(props.json_old_content, null, 2)
        : JSON.stringify(props.json_new_content, null, 2)
      await navigator.clipboard.writeText(content || '')
      showToast('JSON copied to clipboard!', 'success')
    } catch {
      showToast('Failed to copy JSON', 'error')
    }
  }

  return (
    <Show when={props.show}>
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={props.onClose}
      >
        <div
          class="bg-bg-card rounded-2xl border border-border p-6 max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-bold text-text">Config Preview</h2>
                <p class="text-xs text-text-muted">Compare current settings with saved on Hive</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              {/* View mode tabs */}
              <div class="flex bg-bg rounded-lg p-1 border border-border">
                <button
                  onClick={() => props.onChangeDiffMode('diff')}
                  class={`px-3 py-1 text-xs rounded-md transition-colors ${props.diff_view_mode === 'diff' ? 'bg-primary text-primary-text' : 'text-text-muted hover:text-text'}`}
                >
                  Changes ({props.json_diff.length})
                </button>
                <button
                  onClick={() => props.onChangeDiffMode('old')}
                  class={`px-3 py-1 text-xs rounded-md transition-colors ${props.diff_view_mode === 'old' ? 'bg-error/20 text-error' : 'text-text-muted hover:text-text'}`}
                >
                  Old (Hive)
                </button>
                <button
                  onClick={() => props.onChangeDiffMode('new')}
                  class={`px-3 py-1 text-xs rounded-md transition-colors ${props.diff_view_mode === 'new' ? 'bg-success/20 text-success' : 'text-text-muted hover:text-text'}`}
                >
                  New (Current)
                </button>
              </div>
              <Show when={props.diff_view_mode !== 'diff'}>
                <button
                  onClick={handle_copy_json}
                  class="px-3 py-1.5 text-sm bg-primary text-primary-text rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </Show>
              <button
                onClick={props.onClose}
                class="text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg p-1.5 transition-colors"
                aria-label="Close config preview"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading state */}
          <Show when={props.is_loading}>
            <div class="flex-1 flex items-center justify-center">
              <div class="flex items-center gap-3 text-text-muted">
                <div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading config from Hive...</span>
              </div>
            </div>
          </Show>

          {/* Content based on view mode */}
          <Show when={!props.is_loading}>
            {/* Diff view */}
            <Show when={props.diff_view_mode === 'diff'}>
              <div class="flex-1 overflow-auto bg-bg rounded-lg border border-border">
                <Show when={props.json_diff.length === 0}>
                  <div class="p-8 text-center text-text-muted">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="font-medium">No changes detected</p>
                    <p class="text-xs mt-1">Current settings match saved config on Hive</p>
                  </div>
                </Show>
                <Show when={props.json_diff.length > 0}>
                  <div class="divide-y divide-border">
                    <For each={props.json_diff}>
                      {(item) => (
                        <div class="p-3">
                          <div class="flex items-center gap-2 mb-2">
                            <span class={`px-2 py-0.5 text-[10px] font-medium rounded ${
                              item.type === 'changed' ? 'bg-warning/20 text-warning' :
                              item.type === 'added' ? 'bg-success/20 text-success' :
                              'bg-error/20 text-error'
                            }`}>
                              {item.type.toUpperCase()}
                            </span>
                            <span class="font-mono text-sm font-semibold text-text">{item.key}</span>
                          </div>
                          <div class="grid grid-cols-2 gap-2 text-xs">
                            <div class="bg-error/5 rounded p-2 border border-error/20">
                              <p class="text-[10px] uppercase text-error/70 mb-1 font-medium">Old (Hive)</p>
                              <pre class="font-mono text-error/90 whitespace-pre-wrap break-all">
                                {item.oldValue === undefined ? '(not set)' : JSON.stringify(item.oldValue, null, 2)}
                              </pre>
                            </div>
                            <div class="bg-success/5 rounded p-2 border border-success/20">
                              <p class="text-[10px] uppercase text-success/70 mb-1 font-medium">New (Current)</p>
                              <pre class="font-mono text-success/90 whitespace-pre-wrap break-all">
                                {item.newValue === undefined ? '(removed)' : JSON.stringify(item.newValue, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </Show>

            {/* Old JSON view */}
            <Show when={props.diff_view_mode === 'old'}>
              <div class="flex-1 overflow-auto bg-bg rounded-lg border border-error/30">
                <Show when={!props.json_old_content}>
                  <div class="p-8 text-center text-text-muted">
                    <p>No config saved on Hive yet</p>
                  </div>
                </Show>
                <Show when={props.json_old_content}>
                  <pre class="p-4 text-xs text-text font-mono whitespace-pre overflow-x-auto">
                    {JSON.stringify(props.json_old_content, null, 2)}
                  </pre>
                </Show>
              </div>
            </Show>

            {/* New JSON view */}
            <Show when={props.diff_view_mode === 'new'}>
              <div class="flex-1 overflow-auto bg-bg rounded-lg border border-success/30">
                <pre class="p-4 text-xs text-text font-mono whitespace-pre overflow-x-auto">
                  {JSON.stringify(props.json_new_content, null, 2)}
                </pre>
              </div>
            </Show>
          </Show>

          {/* Footer info */}
          <div class="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-warning"></span>
                {props.json_diff.filter(d => d.type === 'changed').length} changed
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-success"></span>
                {props.json_diff.filter(d => d.type === 'added').length} added
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-error"></span>
                {props.json_diff.filter(d => d.type === 'removed').length} removed
              </span>
            </div>
            <span class="text-warning">Preview only - NOT sent to Hive</span>
          </div>
        </div>
      </div>
    </Show>
  )
}
