import { For, Show, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { Input } from '../ui'
import { settings, updateSettings } from './store'
import type { SocialIntegration, SocialPlatform } from './types'
import { platformInfos, defaultSocialIntegration } from './types'

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
    <svg class={props.class} style={props.style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.858-.712 2.05-1.169 3.453-1.324 1.039-.114 2.107-.1 3.18.042.022-.652-.053-1.26-.223-1.799-.357-1.132-1.136-1.707-2.313-1.707h-.033c-.747.005-1.363.253-1.833.737l-1.455-1.408c.837-.864 1.96-1.328 3.252-1.346h.048c1.906 0 3.34.758 4.134 2.19.466.838.702 1.88.702 3.1v.092c1.37.821 2.327 1.918 2.745 3.266.567 1.833.392 4.282-1.679 6.312-1.838 1.8-4.17 2.619-7.345 2.644zm-.091-5.985c1.158-.063 1.876-.452 2.26-.933.39-.485.662-1.21.759-2.153-.94-.158-1.925-.212-2.928-.16-.975.05-1.756.306-2.263.73-.474.397-.629.823-.606 1.237.035.634.511 1.279 2.778 1.279z" />
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
// Helper to save integration to store
// ============================================

function saveIntegration(tabId: string, integration: SocialIntegration) {
  const newTabs = settings.navigationTabs.map((tab) =>
    tab.id === tabId ? { ...tab, integration } : tab
  )
  updateSettings({ navigationTabs: newTabs })
}

function removeIntegration(tabId: string) {
  const newTabs = settings.navigationTabs.map((tab) =>
    tab.id === tabId ? { ...tab, integration: undefined } : tab
  )
  updateSettings({ navigationTabs: newTabs })
}

// ============================================
// Social Integration Form (Universal for all platforms)
// ============================================

interface SocialIntegrationConfigProps {
  platform: SocialPlatform
  tabId: string
}

export function SocialIntegrationConfig(props: SocialIntegrationConfigProps) {
  const platformInfo = platformInfos[props.platform]

  // Get initial integration from store
  const getInitialIntegration = (): SocialIntegration => {
    const tab = settings.navigationTabs.find((t) => t.id === props.tabId)
    if (tab?.integration && tab.integration.platform === props.platform) {
      return tab.integration
    }
    return defaultSocialIntegration(props.platform)
  }

  // Local form state
  const [form, setForm] = createStore<SocialIntegration>(getInitialIntegration())
  const [newEmbedUrl, setNewEmbedUrl] = createSignal('')

  const save = () => saveIntegration(props.tabId, { ...form })

  const addEmbedUrl = () => {
    const url = newEmbedUrl().trim()
    if (url && !form.embedUrls.includes(url)) {
      setForm('embedUrls', [...form.embedUrls, url])
      setNewEmbedUrl('')
      save()
    }
  }

  const removeEmbedUrl = (index: number) => {
    setForm('embedUrls', form.embedUrls.filter((_, i) => i !== index))
    save()
  }

  const handleRemove = () => {
    removeIntegration(props.tabId)
  }

  return (
    <div class="p-4 bg-bg-secondary rounded-b-lg border-x border-b border-border">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg" style={{ background: `${platformInfo.color}20` }}>
            <PlatformIcon platform={props.platform} class="w-5 h-5" style={{ color: platformInfo.color }} />
          </div>
          <div>
            <h4 class="font-medium text-text">{platformInfo.name}</h4>
            <p class="text-xs text-text-muted">{platformInfo.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          class="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
          title="Usun konfiguracje"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        {/* Profile URL */}
        <div>
          <Input
            label="Link do profilu"
            placeholder={platformInfo.profilePlaceholder}
            value={form.profileUrl}
            onInput={(e) => setForm('profileUrl', e.currentTarget.value)}
            onBlur={save}
          />
          <p class="text-xs text-text-muted mt-1">
            Link do Twojego profilu {platformInfo.name}. Bedzie wyswietlany jako przycisk w zakladce.
          </p>
        </div>

        {/* Embed URLs */}
        <div>
          <label class="block text-sm font-medium text-text mb-2">
            Posty/filmy do embedowania
          </label>

          {/* Existing embed URLs */}
          <Show when={form.embedUrls.length > 0}>
            <div class="space-y-2 mb-3">
              <For each={form.embedUrls}>
                {(url, index) => (
                  <div class="flex items-center gap-2 p-2 bg-bg rounded-lg border border-border">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-text truncate">{url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmbedUrl(index())}
                      class="p-1 text-text-muted hover:text-error hover:bg-error/10 rounded transition-colors flex-shrink-0"
                      title="Usun"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* Add new embed URL */}
          <div class="flex gap-2">
            <div class="flex-1">
              <input
                type="url"
                placeholder={platformInfo.embedPlaceholder}
                value={newEmbedUrl()}
                onInput={(e) => setNewEmbedUrl(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addEmbedUrl()
                  }
                }}
                class="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="button"
              onClick={addEmbedUrl}
              disabled={!newEmbedUrl().trim()}
              class="px-3 py-2 text-sm font-medium bg-primary text-primary-text rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Dodaj
            </button>
          </div>
          <p class="text-xs text-text-muted mt-1">
            Wklej linki do konkretnych postow lub filmow. Beda wyswietlane jako embedy na stronie.
          </p>
        </div>

        {/* Preview info */}
        <Show when={form.embedUrls.length > 0}>
          <div class="flex items-start gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
            <svg class="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div class="text-sm">
              <p class="font-medium text-success">Skonfigurowano {form.embedUrls.length} embed{form.embedUrls.length === 1 ? '' : form.embedUrls.length < 5 ? 'y' : 'ow'}</p>
              <p class="text-text-muted mt-0.5">
                Posty beda wyswietlane w zakladce {platformInfo.name} na Twoim blogu.
              </p>
            </div>
          </div>
        </Show>

        {/* Help info */}
        <div class="flex items-start gap-2 p-3 bg-info/10 rounded-lg border border-info/20">
          <svg class="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-sm">
            <p class="font-medium text-info">Jak znalezc link do posta?</p>
            <p class="text-text-muted mt-0.5">
              Wejdz w post na {platformInfo.name}, kliknij "Udostepnij" lub "Kopiuj link" i wklej tutaj.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
