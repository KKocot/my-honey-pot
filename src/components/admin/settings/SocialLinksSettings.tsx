// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, Show, createSignal, createEffect, type JSX } from 'solid-js'
import { settings, updateSettingsImmediate } from '../store'
import type { SocialLink, SocialPlatform } from '../types/index'
import { platformInfos, extract_username_from_url, is_valid_username } from '../types/index'
import { createLocalInput } from '../hooks'
import { get_domain_from_url, is_valid_url_for_favicon } from '../../../shared/utils/url_helpers'

// ============================================
// Constants
// ============================================

// Approximate character width for base URL text at text-sm
const CHAR_WIDTH_PX = 7
// Matches input px-4 (1rem = 16px)
const BASE_PADDING_PX = 16

const VALIDATION_ERRORS = {
  INVALID_URL: 'Invalid URL format. Must start with http:// or https://',
  INVALID_USERNAME: 'Invalid username. Cannot contain URLs, spaces, or path traversal (..)',
} as const

// ============================================
// Social Platform Icons
// ============================================

interface IconProps {
  class?: string
  style?: JSX.CSSProperties
}

function InstagramIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function XIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YouTubeIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

function ThreadsIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161" />
    </svg>
  )
}

function FacebookIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function CustomLinkIcon(props: IconProps) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

export function PlatformIcon(props: { platform: SocialPlatform } & IconProps) {
  const icons: Record<SocialPlatform, (p: IconProps) => JSX.Element> = {
    instagram: InstagramIcon,
    x: XIcon,
    youtube: YouTubeIcon,
    tiktok: TikTokIcon,
    threads: ThreadsIcon,
    facebook: FacebookIcon,
    custom: CustomLinkIcon,
  }
  const Icon = icons[props.platform]
  return <Icon class={props.class} style={props.style} />
}

// ============================================
// All available social platforms
// ============================================

const ALL_PLATFORMS = Object.keys(platformInfos) as SocialPlatform[]

// ============================================
// Username Auto-extraction Helper
// ============================================

/**
 * Auto-extract username if user pastes full URL
 */
const auto_extract_username = (input: string, platform: SocialPlatform): string => {
  const trimmed = input.trim()

  // If it looks like a URL, try to extract username
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('www.')) {
    return extract_username_from_url(trimmed, platform)
  }

  // Remove @ prefix if present
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
}

// ============================================
// Inline Edit Panel for a single social link
// ============================================

interface EditPanelProps {
  link: SocialLink
  onUpdate: (id: string, username: string) => boolean
  onRemove: (id: string) => void
  onClose: () => void
}

function EditPanel(props: EditPanelProps) {
  const info = () => platformInfos[props.link.platform]
  const is_custom = () => props.link.platform === 'custom'

  const current_value = () => props.link.username || props.link.url || ''

  const [localUsername, setLocalUsername, commitUsername] = createLocalInput(
    current_value,
    (val) => props.onUpdate(props.link.id, val)
  )

  const [validationError, setValidationError] = createSignal<string>('')

  const handleInput = (e: InputEvent) => {
    const input = (e.currentTarget as HTMLInputElement).value
    const processed = auto_extract_username(input, props.link.platform)
    setLocalUsername(processed)
    setValidationError('')
  }

  const validate = () => {
    const val = localUsername()
    if (val && !is_valid_username(val, props.link.platform)) {
      if (props.link.platform === 'custom') {
        setValidationError(VALIDATION_ERRORS.INVALID_URL)
      } else {
        setValidationError(VALIDATION_ERRORS.INVALID_USERNAME)
      }
    }
  }

  return (
    <div class="flex items-start gap-3 p-3 bg-bg rounded-lg border border-border animate-fade-in">
      {/* Platform icon */}
      <div
        class="rounded-lg flex-shrink-0 p-2 mt-1"
        style={{ background: info().color }}
      >
        <PlatformIcon platform={props.link.platform} class="w-5 h-5 text-white" />
      </div>

      {/* Input area */}
      <div class="flex-1 min-w-0">
        <label class="block text-sm font-medium text-text mb-1">
          {info().name}
        </label>
        <div class="relative">
          <Show when={!is_custom() && info().baseUrl}>
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none">
              {info().baseUrl?.replace('https://', '')}
            </div>
          </Show>
          <input
            type="text"
            placeholder={info().profilePlaceholder}
            value={localUsername()}
            onInput={handleInput}
            onBlur={validate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commitUsername()
                props.onClose()
              }
            }}
            autofocus
            class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
            classList={{
              'border-error': !!validationError()
            }}
            style={{
              'padding-left': !is_custom() && info().baseUrl ? `${(info().baseUrl!.replace('https://', '').length * CHAR_WIDTH_PX) + BASE_PADDING_PX}px` : '1rem'
            }}
          />
        </div>
        <Show when={!is_custom()}>
          <p class="text-xs text-text-muted mt-1">Enter username only</p>
        </Show>
        <Show when={validationError()}>
          <p class="text-xs text-error mt-1">{validationError()}</p>
        </Show>
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={() => {
          commitUsername()
          props.onClose()
        }}
        class="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors flex-shrink-0 mt-1"
        title="Confirm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => {
          props.onRemove(props.link.id)
          props.onClose()
        }}
        class="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors flex-shrink-0 mt-1"
        title="Remove"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ============================================
// Social Links Settings Component
// ============================================

export function SocialLinksSettings() {
  const [editing_id, set_editing_id] = createSignal<string | null>(null)
  const [adding, set_adding] = createSignal(false)
  let dropdown_ref: HTMLDivElement | undefined

  // Add backward compatibility for old data without id
  const links_with_ids = () => {
    let counter = 0
    return (settings.socialLinks || []).map(link => ({
      ...link,
      id: link.id || (crypto.randomUUID?.() ?? `legacy-${Date.now()}-${counter++}`)
    }))
  }

  // Update a specific link. Returns false if validation fails (triggers rollback in createLocalInput).
  const updateLink = (id: string, username: string): boolean => {
    const trimmed = username.trim()

    // Find link to get its platform for validation
    const link = links_with_ids().find(l => l.id === id)
    if (!link) return false

    if (trimmed && !is_valid_username(trimmed, link.platform)) {
      return false
    }

    const newLinks = links_with_ids().map(link =>
      link.id === id ? { ...link, username: trimmed } : link
    )
    updateSettingsImmediate({ socialLinks: newLinks })
    return true
  }

  // Add new social link
  const addLink = (platform: SocialPlatform) => {
    const new_id = crypto.randomUUID?.() ?? Date.now().toString()
    const newLink: SocialLink = {
      id: new_id,
      platform,
      username: ''
    }
    updateSettingsImmediate({ socialLinks: [...links_with_ids(), newLink] })
    set_adding(false)
    // Auto-open edit for the new (empty) link
    set_editing_id(new_id)
  }

  // Remove social link
  const removeLink = (id: string) => {
    updateSettingsImmediate({ socialLinks: links_with_ids().filter(l => l.id !== id) })
  }

  // Close dropdown when clicking outside
  const handle_click_outside = (e: MouseEvent) => {
    if (adding() && dropdown_ref && !dropdown_ref.contains(e.target as Node)) {
      set_adding(false)
    }
  }

  createEffect(() => {
    if (adding()) {
      document.addEventListener('mousedown', handle_click_outside)
    } else {
      document.removeEventListener('mousedown', handle_click_outside)
    }
  })

  return (
    <div class="space-y-3">
      <div>
        <h3 class="text-lg font-medium text-text">Social Media Links</h3>
        <p class="text-sm text-text-muted">
          Click an icon to edit. Use + to add new links.
        </p>
      </div>

      {/* Icon row */}
      <div class="flex flex-wrap items-center gap-2">
        <For each={links_with_ids()}>
          {(link) => {
            const info = platformInfos[link.platform]
            const is_active = () => editing_id() === link.id
            const has_value = () => !!(link.username || link.url)
            const is_custom_link = () => link.platform === 'custom'
            const display_value = () => link.username || link.url || ''
            const [favicon_ok, set_favicon_ok] = createSignal(true)

            createEffect(() => {
              display_value()
              set_favicon_ok(true)
            })

            const show_favicon = () =>
              is_custom_link() && is_valid_url_for_favicon(display_value()) && favicon_ok()

            return (
              <button
                type="button"
                onClick={() => set_editing_id(is_active() ? null : link.id)}
                class="rounded-lg transition-all cursor-pointer overflow-hidden"
                classList={{
                  'ring-2 ring-accent scale-110': is_active(),
                  'opacity-50': !has_value() && !is_active(),
                  'hover:opacity-80': has_value(),
                  'p-2': !show_favicon(),
                }}
                style={{
                  background: !show_favicon() ? info.color : 'transparent',
                }}
                title={`${info.name}${has_value() ? ': ' + display_value() : ' (empty)'}`}
              >
                <Show
                  when={!is_custom_link()}
                  fallback={
                    <Show
                      when={show_favicon()}
                      fallback={
                        <CustomLinkIcon class="w-8 h-8 text-white" />
                      }
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(get_domain_from_url(display_value()))}&sz=64`}
                        alt="Site favicon"
                        class="w-12 h-12 rounded-lg"
                        onLoad={(e) => {
                          if (e.currentTarget.naturalWidth <= 2 || e.currentTarget.naturalHeight <= 2) {
                            set_favicon_ok(false)
                          }
                        }}
                        onError={() => set_favicon_ok(false)}
                      />
                    </Show>
                  }
                >
                  <PlatformIcon platform={link.platform} class="w-8 h-8 text-white" />
                </Show>
              </button>
            )
          }}
        </For>

        {/* Add button (+) */}
        <div class="relative" ref={dropdown_ref}>
          <button
            type="button"
            onClick={() => set_adding(!adding())}
            class="w-12 h-12 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
            title="Add social link"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Platform dropdown */}
          <Show when={adding()}>
            <div class="absolute left-0 top-14 z-50 bg-bg-card border border-border rounded-lg shadow-lg p-2 min-w-[180px]">
              <p class="text-xs text-text-muted mb-2 px-1">Add platform:</p>
              <div class="space-y-1 max-h-[240px] overflow-y-auto">
                <For each={ALL_PLATFORMS}>
                  {(platform) => {
                    const info = platformInfos[platform]
                    return (
                      <button
                        type="button"
                        onClick={() => addLink(platform)}
                        class="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors hover:bg-primary hover:text-primary-text"
                      >
                        <div
                          class="rounded p-1 flex-shrink-0"
                          style={{ background: info.color }}
                        >
                          <PlatformIcon platform={platform} class="w-4 h-4 text-white" />
                        </div>
                        <span class="text-text">{info.name}</span>
                      </button>
                    )
                  }}
                </For>
              </div>
            </div>
          </Show>
        </div>
      </div>

      {/* Inline edit panel for selected link */}
      <Show when={editing_id()}>
        {(id) => {
          const link = () => links_with_ids().find(l => l.id === id())
          return (
            <Show when={link()}>
              {(l) => (
                <EditPanel
                  link={l()}
                  onUpdate={updateLink}
                  onRemove={removeLink}
                  onClose={() => set_editing_id(null)}
                />
              )}
            </Show>
          )
        }}
      </Show>
    </div>
  )
}
