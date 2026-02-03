import { Show, type Accessor } from 'solid-js'
import { Button } from '../../../ui'
import {
  handle_download_config,
  handle_save_local_storage,
  handle_load_local_storage,
  handle_clear_local_storage,
} from './handlers'

interface BottomBarProps {
  is_owner: boolean
  is_authenticated: boolean
  is_broadcasting: boolean
  owner_username?: string
  show_mobile_menu: boolean
  on_save_click: () => void
  on_preview_json: () => void
  on_full_preview: () => void
  on_toggle_mobile_menu: () => void
}

export function BottomBar(props: BottomBarProps) {
  return (
    <div class="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-sm border-t border-border p-3 z-50">
      <div class="max-w-4xl mx-auto">
        {/* Mobile: Hamburger + Save on Hive */}
        <div class="flex md:hidden items-center justify-between gap-2">
          <button
            onClick={props.on_toggle_mobile_menu}
            class="flex items-center gap-2 px-3 py-2 text-sm bg-bg-secondary hover:bg-bg border border-border text-text rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={props.show_mobile_menu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
            Menu
          </button>
          <div class="flex items-center gap-2">
            <button
              onClick={props.on_preview_json}
              class="flex items-center gap-1.5 px-3 py-2 text-sm bg-bg-secondary hover:bg-bg border border-border text-text rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            <button
              onClick={props.on_full_preview}
              class="flex items-center gap-1.5 px-3 py-2 text-sm bg-bg-secondary hover:bg-bg border border-border text-text rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <Show when={props.is_owner}>
              <Button
                variant="accent"
                size="sm"
                loading={props.is_broadcasting}
                onClick={props.on_save_click}
              >
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Save
                </span>
              </Button>
            </Show>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <Show when={props.show_mobile_menu}>
          <MobileMenuDropdown
            is_owner={props.is_owner}
            is_authenticated={props.is_authenticated}
            owner_username={props.owner_username}
            on_close={() => props.on_toggle_mobile_menu()}
          />
        </Show>

        {/* Desktop: Full bar */}
        <div class="hidden md:flex items-center justify-between gap-4">
          {/* Info message */}
          <div class="flex items-center gap-2 text-sm text-text-muted">
            <Show when={props.is_owner}>
              <svg class="w-4 h-4 text-warning flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Saving config to Hive costs Resource Credits (RC).</span>
            </Show>
            <Show when={props.is_authenticated && !props.is_owner}>
              <svg class="w-4 h-4 text-info flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>View only mode. Login as @{props.owner_username} to save changes.</span>
            </Show>
          </div>
          <div class="flex gap-2 flex-shrink-0 items-center">
            {/* Local storage & Download group - only for owner */}
            <Show when={props.is_owner}>
              <LocalStorageButtons />
              <div class="w-px h-8 bg-border" />
            </Show>
            {/* Preview buttons stacked */}
            <div class="flex flex-col gap-1">
              <button
                onClick={props.on_preview_json}
                class="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-bg-secondary hover:bg-bg border border-border text-text rounded transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Changes
              </button>
              <button
                onClick={props.on_full_preview}
                class="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-bg-secondary hover:bg-bg border border-border text-text rounded transition-colors"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Full Preview
              </button>
            </div>
            <Show when={props.is_owner}>
              <Button
                variant="accent"
                size="sm"
                loading={props.is_broadcasting}
                onClick={props.on_save_click}
              >
                <span class="flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Save on Hive
                </span>
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}

function LocalStorageButtons() {
  return (
    <div class="flex flex-col bg-bg-secondary/50 border border-border rounded-lg p-1.5">
      <span class="text-[10px] text-text-muted mb-1 px-1">Local Backup</span>
      <div class="flex items-center gap-1">
        <button
          onClick={handle_save_local_storage}
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-primary hover:bg-primary-hover text-primary-text rounded transition-colors"
          title="Save current settings to browser local storage"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
        </button>
        <button
          onClick={handle_load_local_storage}
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
          title="Load settings from browser local storage"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L10 8m4-4v12" />
          </svg>
          Load
        </button>
        <button
          onClick={handle_clear_local_storage}
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-error hover:bg-error/80 text-white rounded transition-colors"
          title="Clear settings from browser local storage"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
        <div class="w-px h-5 bg-border mx-0.5" />
        <button
          onClick={handle_download_config}
          class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-text hover:bg-bg border border-border rounded transition-colors"
          title="Download config as JSON file"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>
    </div>
  )
}

function MobileMenuDropdown(props: { is_owner: boolean; is_authenticated: boolean; owner_username?: string; on_close: () => void }) {
  return (
    <div class="md:hidden mt-3 p-3 bg-bg-secondary border border-border rounded-lg space-y-3">
      <Show when={props.is_owner}>
        <div class="space-y-2">
          <span class="text-xs text-text-muted font-medium">Local Backup</span>
          <div class="flex flex-wrap gap-2">
            <button
              onClick={() => {
                handle_save_local_storage()
                props.on_close()
              }}
              class="flex items-center gap-1.5 px-3 py-2 text-sm bg-primary hover:bg-primary-hover text-primary-text rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Local
            </button>
            <button
              onClick={() => {
                handle_load_local_storage()
                props.on_close()
              }}
              class="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L10 8m4-4v12" />
              </svg>
              Load Local
            </button>
            <button
              onClick={() => {
                handle_clear_local_storage()
                props.on_close()
              }}
              class="flex items-center gap-1.5 px-3 py-2 text-sm bg-error hover:bg-error/80 text-white rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Local
            </button>
          </div>
        </div>
        <div class="border-t border-border pt-3">
          <button
            onClick={() => {
              handle_download_config()
              props.on_close()
            }}
            class="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-bg border border-border rounded-lg transition-colors w-full"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </button>
        </div>
      </Show>
      <Show when={!props.is_owner && props.is_authenticated}>
        <div class="flex items-center gap-2 text-sm text-text-muted">
          <svg class="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>View only mode. Login as @{props.owner_username} to save.</span>
        </div>
      </Show>
    </div>
  )
}
