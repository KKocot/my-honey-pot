// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createMemo } from 'solid-js'
import { settings, updateSettings } from '../../store'
import { authorProfileElementLabels, type CardLayout } from '../../types/index'
import { Slider } from '../../../ui'
import { CardLayoutEditor } from '../../editors/CardLayoutEditor'
import { SocialLinksSettings } from '../SocialLinksSettings'
import { AuthorProfilePreview } from './AuthorProfilePreview'
import { isElementInLayout, areAnyElementsInLayout } from './helpers'

// All available author profile element IDs (votingPower removed)
const AUTHOR_PROFILE_ELEMENT_IDS = [
  'coverImage',
  'avatar',
  'username',
  'displayName',
  'reputation',
  'about',
  'location',
  'website',
  'joinDate',
  'followers',
  'following',
  'postCount',
  'hivePower',
  'hpEarned',
  'hiveBalance',
  'hbdBalance',
]

// ============================================
// Author Profile Settings Section
// ============================================

export function AuthorProfileSettings() {
  const handleLayoutUpdate = (layout: CardLayout) => {
    updateSettings({ authorProfileLayout2: layout })
  }

  // Memoized checks for which elements are in the layout
  const hasAvatar = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'avatar'))
  const hasCover = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'coverImage'))
  const hasUsername = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'username'))
  const hasDisplayName = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'displayName'))
  const hasAbout = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'about'))
  const hasReputation = createMemo(() => isElementInLayout(settings.authorProfileLayout2, 'reputation'))
  const hasStats = createMemo(() => areAnyElementsInLayout(settings.authorProfileLayout2, ['followers', 'following', 'postCount', 'hivePower', 'hpEarned', 'hiveBalance', 'hbdBalance']))
  const hasMeta = createMemo(() => areAnyElementsInLayout(settings.authorProfileLayout2, ['location', 'website', 'joinDate']))

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Author Profile Settings</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
            Size Settings
          </h3>
          <p class="text-xs text-text-muted mb-2">
            Sliders are disabled when the element is not in the layout.
          </p>
          <div class="grid grid-cols-2 gap-4">
            <Slider
              label="Avatar size:"
              unit="px"
              min={32}
              max={128}
              value={settings.authorAvatarSizePx}
              onChange={(val) => updateSettings({ authorAvatarSizePx: val })}
              disabled={!hasAvatar()}
            />
            <Slider
              label="Cover height:"
              unit="px"
              min={48}
              max={200}
              value={settings.authorCoverHeightPx ?? 64}
              onChange={(val) => updateSettings({ authorCoverHeightPx: val })}
              disabled={!hasCover()}
            />
            <Slider
              label="Username size:"
              unit="px"
              min={12}
              max={24}
              value={settings.authorUsernameSizePx ?? 14}
              onChange={(val) => updateSettings({ authorUsernameSizePx: val })}
              disabled={!hasUsername()}
            />
            <Slider
              label="Display name size:"
              unit="px"
              min={14}
              max={32}
              value={settings.authorDisplayNameSizePx ?? 18}
              onChange={(val) => updateSettings({ authorDisplayNameSizePx: val })}
              disabled={!hasDisplayName()}
            />
            <Slider
              label="About text size:"
              unit="px"
              min={10}
              max={18}
              value={settings.authorAboutSizePx ?? 14}
              onChange={(val) => updateSettings({ authorAboutSizePx: val })}
              disabled={!hasAbout()}
            />
            <Slider
              label="Reputation size:"
              unit="px"
              min={10}
              max={16}
              value={settings.authorReputationSizePx ?? 12}
              onChange={(val) => updateSettings({ authorReputationSizePx: val })}
              disabled={!hasReputation()}
            />
            <Slider
              label="Stats size:"
              unit="px"
              min={10}
              max={20}
              value={settings.authorStatsSizePx ?? 14}
              onChange={(val) => updateSettings({ authorStatsSizePx: val })}
              disabled={!hasStats()}
            />
            <Slider
              label="Meta text size:"
              unit="px"
              min={10}
              max={16}
              value={settings.authorMetaSizePx ?? 12}
              onChange={(val) => updateSettings({ authorMetaSizePx: val })}
              disabled={!hasMeta()}
            />
          </div>

          {/* Card Layout Editor */}
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
              Profile Elements Layout
            </h3>
            <p class="text-xs text-text-muted mb-4">
              Use buttons to move elements and sections. Click + to add elements or nested sections.
            </p>
            <CardLayoutEditor
              layout={settings.authorProfileLayout2}
              elementLabels={authorProfileElementLabels}
              allElementIds={AUTHOR_PROFILE_ELEMENT_IDS}
              onUpdate={handleLayoutUpdate}
            />
          </div>

          {/* Social Media Links */}
          <div class="border-t border-border pt-4">
            <SocialLinksSettings />
          </div>
        </div>

        {/* Live Preview */}
        <AuthorProfilePreview />
      </div>
    </div>
  )
}
