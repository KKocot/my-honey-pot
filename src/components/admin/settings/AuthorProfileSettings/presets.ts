// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { collectAllElementIds, type CardLayout } from '../../types/index'
import type { SettingsData } from '../../types/settings'

// ============================================
// Author Profile Preset Types
// ============================================

export interface AuthorProfilePreset {
  id: string
  label: string
  description: string
  layout: CardLayout
  sizes: Partial<Pick<SettingsData,
    'authorAvatarSizePx' | 'authorCoverHeightPx' | 'authorUsernameSizePx' |
    'authorDisplayNameSizePx' | 'authorAboutSizePx' | 'authorReputationSizePx' |
    'authorStatsSizePx' | 'authorMetaSizePx'
  >>
}

// ============================================
// Element Groups for Visibility Checkboxes
// ============================================

export const ELEMENT_GROUPS = [
  { id: 'identity', label: 'Identity', elements: ['coverImage', 'avatar', 'displayName', 'username', 'reputation'] },
  { id: 'description', label: 'Description', elements: ['about'] },
  { id: 'meta', label: 'Meta', elements: ['location', 'website', 'joinDate'] },
  { id: 'stats', label: 'Stats', elements: ['followers', 'following', 'postCount', 'hivePower', 'hpEarned', 'votingPower', 'hiveBalance', 'hbdBalance'] },
] as const

// ============================================
// Preset Definitions
// ============================================

export const AUTHOR_PROFILE_PRESETS: AuthorProfilePreset[] = [
  {
    id: 'compact',
    label: 'Compact',
    description: 'Single-line horizontal with avatar, username and reputation',
    layout: {
      sections: [
        { id: 'sec-1', orientation: 'horizontal', children: [
          { type: 'element', id: 'avatar' },
          { type: 'element', id: 'username' },
          { type: 'element', id: 'reputation' },
        ]},
        { id: 'sec-2', orientation: 'horizontal', children: [
          { type: 'element', id: 'followers' },
          { type: 'element', id: 'following' },
          { type: 'element', id: 'postCount' },
        ]},
      ],
    },
    sizes: {
      authorAvatarSizePx: 40,
      authorUsernameSizePx: 12,
      authorReputationSizePx: 10,
      authorStatsSizePx: 12,
    },
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Default card layout with cover, identity and stats',
    layout: {
      sections: [
        { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
        { id: 'sec-2', orientation: 'horizontal', children: [
          { type: 'element', id: 'avatar' },
          { type: 'element', id: 'username' },
          { type: 'element', id: 'reputation' },
        ]},
        { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
        { id: 'sec-4', orientation: 'horizontal', children: [
          { type: 'element', id: 'location' },
          { type: 'element', id: 'website' },
          { type: 'element', id: 'joinDate' },
        ]},
        { id: 'sec-5', orientation: 'horizontal', children: [
          { type: 'element', id: 'followers' },
          { type: 'element', id: 'following' },
          { type: 'element', id: 'postCount' },
          { type: 'element', id: 'hpEarned' },
        ]},
        { id: 'sec-6', orientation: 'horizontal', children: [
          { type: 'element', id: 'votingPower' },
          { type: 'element', id: 'hiveBalance' },
          { type: 'element', id: 'hbdBalance' },
        ]},
      ],
    },
    sizes: {
      authorAvatarSizePx: 64,
      authorCoverHeightPx: 64,
      authorUsernameSizePx: 14,
      authorDisplayNameSizePx: 18,
      authorAboutSizePx: 14,
      authorReputationSizePx: 12,
      authorStatsSizePx: 14,
      authorMetaSizePx: 12,
    },
  },
  {
    id: 'stats-heavy',
    label: 'Stats Heavy',
    description: 'Emphasis on statistics with larger cover and detailed numbers',
    layout: {
      sections: [
        { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
        { id: 'sec-2', orientation: 'horizontal', children: [
          { type: 'element', id: 'avatar' },
          { type: 'element', id: 'displayName' },
          { type: 'element', id: 'reputation' },
        ]},
        { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
        { id: 'sec-4', orientation: 'horizontal', children: [
          { type: 'element', id: 'followers' },
          { type: 'element', id: 'following' },
          { type: 'element', id: 'postCount' },
        ]},
        { id: 'sec-5', orientation: 'horizontal', children: [
          { type: 'element', id: 'hivePower' },
          { type: 'element', id: 'hpEarned' },
        ]},
        { id: 'sec-6', orientation: 'horizontal', children: [
          { type: 'element', id: 'hiveBalance' },
          { type: 'element', id: 'hbdBalance' },
          { type: 'element', id: 'votingPower' },
        ]},
      ],
    },
    sizes: {
      authorAvatarSizePx: 72,
      authorCoverHeightPx: 120,
      authorDisplayNameSizePx: 20,
      authorAboutSizePx: 14,
      authorReputationSizePx: 12,
      authorStatsSizePx: 16,
    },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Just avatar, username and bio, nothing else',
    layout: {
      sections: [
        { id: 'sec-1', orientation: 'horizontal', children: [
          { type: 'element', id: 'avatar' },
          { type: 'element', id: 'username' },
        ]},
        { id: 'sec-2', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
      ],
    },
    sizes: {
      authorAvatarSizePx: 48,
      authorUsernameSizePx: 13,
      authorAboutSizePx: 12,
    },
  },
  {
    id: 'full',
    label: 'Full',
    description: 'All 16 elements enabled with large cover and sizes',
    layout: {
      sections: [
        { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
        { id: 'sec-2', orientation: 'horizontal', children: [
          { type: 'element', id: 'avatar' },
          { type: 'element', id: 'displayName' },
          { type: 'element', id: 'username' },
          { type: 'element', id: 'reputation' },
        ]},
        { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
        { id: 'sec-4', orientation: 'horizontal', children: [
          { type: 'element', id: 'location' },
          { type: 'element', id: 'website' },
          { type: 'element', id: 'joinDate' },
        ]},
        { id: 'sec-5', orientation: 'horizontal', children: [
          { type: 'element', id: 'followers' },
          { type: 'element', id: 'following' },
          { type: 'element', id: 'postCount' },
        ]},
        { id: 'sec-6', orientation: 'horizontal', children: [
          { type: 'element', id: 'hivePower' },
          { type: 'element', id: 'hpEarned' },
        ]},
        { id: 'sec-7', orientation: 'horizontal', children: [
          { type: 'element', id: 'votingPower' },
          { type: 'element', id: 'hiveBalance' },
          { type: 'element', id: 'hbdBalance' },
        ]},
      ],
    },
    sizes: {
      authorAvatarSizePx: 96,
      authorCoverHeightPx: 160,
      authorUsernameSizePx: 16,
      authorDisplayNameSizePx: 24,
      authorAboutSizePx: 16,
      authorReputationSizePx: 14,
      authorStatsSizePx: 16,
      authorMetaSizePx: 14,
    },
  },
]

// ============================================
// Preset Detection
// ============================================

// Compare two sets for equality
function sets_equal(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false
  for (const item of a) {
    if (!b.has(item)) return false
  }
  return true
}

// Compare size values between current settings and preset sizes
function sizes_match(
  current: Record<string, unknown>,
  preset_sizes: AuthorProfilePreset['sizes']
): boolean {
  const entries = Object.entries(preset_sizes)
  for (const [key, value] of entries) {
    if (current[key] !== value) return false
  }
  return true
}

// Detect which preset matches the current layout and sizes, or 'custom'.
// Preset matching compares element sets (not section structure or order).
// A layout with the same elements in a different arrangement still matches.
// This is intentional — presets define "what to show", not "how to arrange".
export function detectActivePreset(
  layout: CardLayout,
  sizes: Record<string, unknown>
): string {
  const current_ids = new Set(collectAllElementIds(layout))

  for (const preset of AUTHOR_PROFILE_PRESETS) {
    const preset_ids = new Set(collectAllElementIds(preset.layout))
    if (sets_equal(current_ids, preset_ids) && sizes_match(sizes, preset.sizes)) {
      return preset.id
    }
  }
  return 'custom'
}
