import { For, Show, createSignal } from 'solid-js'
import { Input } from '../ui'
import { settings, updateSettings } from './store'
import type { SocialLink, SocialPlatform } from './types'
import { platformInfos } from './types'

// ============================================
// Social Platform Icons
// ============================================

function InstagramIcon(props: { class?: string; style?: any }) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function XIcon(props: { class?: string; style?: any }) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YouTubeIcon(props: { class?: string; style?: any }) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function TikTokIcon(props: { class?: string; style?: any }) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

function ThreadsIcon(props: { class?: string; style?: any }) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 16 16" fill="currentColor">
      <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161" />
    </svg>
  )
}

function FacebookIcon(props: { class?: string; style?: any }) {
  return (
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function PlatformIcon(props: { platform: SocialPlatform; class?: string; style?: any }) {
  const icons: Record<SocialPlatform, (p: { class?: string; style?: any }) => any> = {
    instagram: InstagramIcon,
    x: XIcon,
    youtube: YouTubeIcon,
    tiktok: TikTokIcon,
    threads: ThreadsIcon,
    facebook: FacebookIcon,
  }
  const Icon = icons[props.platform]
  return <Icon class={props.class} style={props.style} />
}

// ============================================
// All available social platforms
// ============================================

const ALL_PLATFORMS: SocialPlatform[] = ['instagram', 'x', 'youtube', 'tiktok', 'threads', 'facebook']

// ============================================
// Social Links Settings Component
// ============================================

export function SocialLinksSettings() {
  const [newPlatform, setNewPlatform] = createSignal<SocialPlatform | ''>('')

  // Get existing platforms
  const existingPlatforms = () => (settings.socialLinks || []).map(l => l.platform)

  // Available platforms (not yet added)
  const availablePlatforms = () => ALL_PLATFORMS.filter(p => !existingPlatforms().includes(p))

  // Update a specific link
  const updateLink = (platform: SocialPlatform, url: string) => {
    const newLinks = (settings.socialLinks || []).map(link =>
      link.platform === platform ? { ...link, url } : link
    )
    updateSettings({ socialLinks: newLinks })
  }

  // Add new social link
  const addLink = (platform: SocialPlatform) => {
    const newLink: SocialLink = { platform, url: '' }
    updateSettings({ socialLinks: [...(settings.socialLinks || []), newLink] })
    setNewPlatform('')
  }

  // Remove social link
  const removeLink = (platform: SocialPlatform) => {
    updateSettings({ socialLinks: (settings.socialLinks || []).filter(l => l.platform !== platform) })
  }

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-medium text-text">Social Media Links</h3>
          <p class="text-sm text-text-muted">
            Add links to your social media profiles. They will be displayed in your author profile.
          </p>
        </div>
      </div>

      {/* Existing social links */}
      <div class="space-y-3">
        <For each={settings.socialLinks || []}>
          {(link) => {
            const info = platformInfos[link.platform]
            return (
              <div class="flex items-center gap-3 p-3 bg-bg rounded-lg border border-border">
                {/* Platform icon */}
                <div
                  class="p-2 rounded-lg flex-shrink-0"
                  style={{ background: info.color }}
                >
                  <PlatformIcon
                    platform={link.platform}
                    class="w-5 h-5"
                    style={{ color: '#ffffff' }}
                  />
                </div>

                {/* Platform name and input */}
                <div class="flex-1 min-w-0">
                  <label class="block text-sm font-medium text-text mb-1">
                    {info.name}
                  </label>
                  <Input
                    placeholder={info.profilePlaceholder}
                    value={link.url}
                    onInput={(e) => updateLink(link.platform, e.currentTarget.value)}
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeLink(link.platform)}
                  class="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors flex-shrink-0"
                  title="Remove"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          }}
        </For>
      </div>

      {/* Add new link */}
      <Show when={availablePlatforms().length > 0}>
        <div class="flex items-center gap-3 p-3 bg-bg-secondary/50 rounded-lg border-2 border-dashed border-border">
          <select
            value={newPlatform()}
            onChange={(e) => setNewPlatform(e.currentTarget.value as SocialPlatform | '')}
            class="flex-1 px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Select platform...</option>
            <For each={availablePlatforms()}>
              {(platform) => (
                <option value={platform}>{platformInfos[platform].name}</option>
              )}
            </For>
          </select>
          <button
            type="button"
            onClick={() => newPlatform() && addLink(newPlatform() as SocialPlatform)}
            disabled={!newPlatform()}
            class="px-4 py-2 text-sm font-medium bg-primary text-primary-text rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </Show>

      {/* Preview */}
      <Show when={(settings.socialLinks || []).filter(l => l.url).length > 0}>
        <div class="pt-4 border-t border-border">
          <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>
          <div class="flex flex-wrap gap-2">
            <For each={(settings.socialLinks || []).filter(l => l.url)}>
              {(link) => {
                const info = platformInfos[link.platform]
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: info.color }}
                    title={info.name}
                  >
                    <PlatformIcon
                      platform={link.platform}
                      class="w-5 h-5"
                      style={{ color: '#ffffff' }}
                    />
                  </a>
                )
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
