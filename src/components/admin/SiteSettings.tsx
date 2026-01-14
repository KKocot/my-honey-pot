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

      <div class="space-y-6">
        {/* Theme & Basic Info */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            placeholder="Hive Blog"
            onInput={(e) => updateSettings({ siteName: e.currentTarget.value })}
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-text mb-1">Site Description</label>
          <textarea
            rows={2}
            class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            value={settings.siteDescription}
            placeholder="Posts from Hive blockchain"
            onInput={(e) => updateSettings({ siteDescription: e.currentTarget.value })}
          />
        </div>

        {/* Layout Settings */}
        <div class="border-t border-border pt-4">
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Layout</h3>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>

        {/* Visibility Options */}
        <div class="border-t border-border pt-4">
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Visibility</h3>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>
      </div>
    </div>
  )
}
