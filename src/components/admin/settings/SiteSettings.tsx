// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { settings, updateSettings } from '../store'
import { Slider } from '../../ui'
import { ThemeSettings } from './ThemeSettings'
import { createLocalInput } from '../hooks'

// ============================================
// Site Settings Section
// ============================================

export function SiteSettings() {
  const [localSiteName, setLocalSiteName, commitSiteName] = createLocalInput(
    () => settings.siteName,
    (val) => updateSettings({ siteName: val })
  )
  const [localSiteDescription, setLocalSiteDescription, commitSiteDescription] = createLocalInput(
    () => settings.siteDescription,
    (val) => updateSettings({ siteDescription: val })
  )

  return (
    <>
      {/* Theme Settings (separate card) */}
      <ThemeSettings />

      <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
        <h2 class="text-xl font-semibold text-primary mb-6">Site Settings</h2>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <div class="space-y-6">
            {/* Basic Info */}
            <div>
              <label class="block text-sm font-medium text-text mb-1">Site Name</label>
              <input
                type="text"
                value={localSiteName()}
                placeholder="Hive Blog"
                onInput={(e) => setLocalSiteName(e.currentTarget.value)}
                onBlur={commitSiteName}
                class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-1">Site Description</label>
              <textarea
                rows={2}
                class="w-full px-4 py-2 bg-bg border border-border rounded-lg text-text resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                value={localSiteDescription()}
                placeholder="Posts from Hive blockchain"
                onInput={(e) => setLocalSiteDescription(e.currentTarget.value)}
                onBlur={commitSiteDescription}
              />
            </div>

            {/* Header Settings */}
            <div class="border-t border-border pt-4">
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Header</h3>

              <Slider
                label="Header max width:"
                unit="px"
                min={600}
                max={1920}
                step={10}
                value={settings.headerMaxWidthPx ?? 1280}
                onChange={(val) => updateSettings({ headerMaxWidthPx: val })}
              />
            </div>
          </div>

          {/* Preview */}
          <div class="bg-bg rounded-lg p-4 border border-border">
            <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>
            <div
              class="bg-bg-card rounded-lg border border-border p-4 mx-auto transition-all"
              style={`max-width: ${Math.min(settings.headerMaxWidthPx ?? 1280, 400)}px;`}
            >
              <h1 class="text-lg font-bold text-text truncate">
                {settings.siteName || 'Hive Blog'}
              </h1>
              <p class="text-sm text-text-muted mt-1 line-clamp-2">
                {settings.siteDescription || 'Posts from Hive blockchain'}
              </p>
            </div>
            <p class="text-xs text-text-muted text-center mt-3">
              Header max width: {settings.headerMaxWidthPx ?? 1280}px
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
