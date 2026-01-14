import { Show } from 'solid-js'
import { settings, updateSettings } from './store'
import { themeOptions } from './types'
import { Input, Select, Checkbox, Slider } from '../ui'

// ============================================
// Site Settings Section
// ============================================

export function SiteSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Site Settings</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <Select
            label="Color Theme"
            options={themeOptions}
            value={settings.siteTheme}
            onChange={(e) => {
              updateSettings({ siteTheme: e.currentTarget.value as typeof settings.siteTheme })
              document.documentElement.setAttribute('data-theme', e.currentTarget.value)
            }}
          />

          <Input
            label="Site Name"
            value={settings.siteName}
            onInput={(e) => updateSettings({ siteName: e.currentTarget.value })}
          />

          <div>
            <label class="block text-sm font-medium text-text mb-1">Site Description</label>
            <textarea
              rows={2}
              class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              value={settings.siteDescription}
              onInput={(e) => updateSettings({ siteDescription: e.currentTarget.value })}
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Posts per page"
              min={5}
              max={50}
              value={settings.postsPerPage}
              onInput={(e) => updateSettings({ postsPerPage: parseInt(e.currentTarget.value) })}
            />
            <Input
              type="number"
              label="Sidebar width (px)"
              min={200}
              max={400}
              value={settings.sidebarWidthPx}
              onInput={(e) => updateSettings({ sidebarWidthPx: parseInt(e.currentTarget.value) })}
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <Checkbox
              label="Page Header"
              checked={settings.showHeader}
              onChange={(e) => updateSettings({ showHeader: e.currentTarget.checked })}
            />
            <Checkbox
              label="Author Profile"
              checked={settings.showAuthorProfile}
              onChange={(e) => updateSettings({ showAuthorProfile: e.currentTarget.checked })}
            />
            <Checkbox
              label="Post Count"
              checked={settings.showPostCount}
              onChange={(e) => updateSettings({ showPostCount: e.currentTarget.checked })}
            />
            <Checkbox
              label="Author Rewards"
              checked={settings.showAuthorRewards}
              onChange={(e) => updateSettings({ showAuthorRewards: e.currentTarget.checked })}
            />
          </div>

          <Slider
            label="Avatar size:"
            unit="px"
            min={32}
            max={128}
            value={settings.authorAvatarSizePx}
            onInput={(e) => updateSettings({ authorAvatarSizePx: parseInt(e.currentTarget.value) })}
          />
        </div>

        {/* Preview */}
        <SiteSettingsPreview />
      </div>
    </div>
  )
}

// ============================================
// Preview Component
// ============================================

function SiteSettingsPreview() {
  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-2 uppercase tracking-wide">Preview</p>
      <div class="border-b-2 border-border pb-4 mb-4">
        <h1 class="text-2xl font-bold text-text">
          {settings.siteName || 'Hive Blog'}
        </h1>
        <p class="text-text-muted mt-1 text-sm">
          {settings.siteDescription || 'Posts from Hive blockchain'}
        </p>
      </div>

      <Show when={settings.showAuthorProfile}>
        <div class="bg-bg-card rounded-xl p-4 border border-border">
          <div class="flex items-center gap-4">
            <img
              src="https://images.hive.blog/u/gtg/avatar"
              alt="avatar"
              class="rounded-full border-2 border-border"
              style={{ width: `${settings.authorAvatarSizePx}px`, height: `${settings.authorAvatarSizePx}px` }}
              onError={(e) => { e.currentTarget.src = '/hive-logo.png' }}
            />
            <div>
              <h2 class="text-lg font-semibold text-text">@gtg</h2>
              <div class="text-text-muted text-sm space-x-4 mt-1">
                <Show when={settings.showPostCount}>
                  <span>1234 posts</span>
                </Show>
                <Show when={settings.showAuthorRewards}>
                  <span>5678 HP earned</span>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}
