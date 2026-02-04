// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, For, createMemo } from 'solid-js'
import { settings } from '../../store'
import { platformInfos, type CardSection, type CardSectionChild } from '../../types/index'
import {
  useHivePreviewQuery,
  formatCompactNumber,
  formatJoinDate,
  calculateEffectiveHivePower,
} from '../../queries'
import { parseFormattedAsset } from '@hiveio/workerbee/blog-logic'
import { PlatformIcon } from '../SocialLinksSettings'
import { ElementRenderer } from './ElementRenderer'

// ============================================
// Mock data for preview when no real data available
// ============================================

const MOCK_PROFILE_DATA = {
  displayName: 'Sample User',
  about: 'This is a sample bio for preview purposes. Your real bio will appear here.',
  location: 'Earth',
  website: 'https://hive.blog',
  coverImage: '',
  reputation: 72,
  followers: 1234,
  following: 567,
  postCount: 89,
  hivePower: 5432.10,
  hiveBalance: 123.456,
  hbdBalance: 78.901,
  joinDate: 'Jan 2020',
}

// ============================================
// Author Profile Preview Component
// ============================================

export function AuthorProfilePreview() {
  // Fetch real Hive data (only if username is set)
  const hiveQuery = useHivePreviewQuery(
    () => settings.hiveUsername,
    () => 1,
    () => !!settings.hiveUsername
  )

  const isLoading = () => hiveQuery.isLoading && !!settings.hiveUsername

  // Reactive size values
  const coverHeight = createMemo(() => settings.authorCoverHeightPx ?? 64)
  const avatarSize = createMemo(() => settings.authorAvatarSizePx ?? 64)
  const usernameSize = createMemo(() => settings.authorUsernameSizePx ?? 14)
  const displayNameSize = createMemo(() => settings.authorDisplayNameSizePx ?? 18)
  const aboutSize = createMemo(() => settings.authorAboutSizePx ?? 14)
  const reputationSize = createMemo(() => settings.authorReputationSizePx ?? 12)
  const statsSize = createMemo(() => settings.authorStatsSizePx ?? 14)
  const metaSize = createMemo(() => settings.authorMetaSizePx ?? 12)

  // Profile data - use real data if available, otherwise mock data
  const profileData = createMemo(() => {
    const d = hiveQuery.data
    if (d?.profile) {
      const profile = d.profile
      const dbAccount = d.dbAccount
      const globalProps = d.globalProps
      const profileMeta = profile.metadata

      const hivePower = dbAccount && globalProps
        ? calculateEffectiveHivePower(
            dbAccount.vestingShares,
            dbAccount.delegatedVestingShares,
            dbAccount.receivedVestingShares,
            globalProps
          )
        : 0

      return {
        displayName: profileMeta?.name || profile.name,
        about: profileMeta?.about || '',
        location: profileMeta?.location || '',
        website: profileMeta?.website || '',
        coverImage: profileMeta?.coverImage || '',
        reputation: Math.floor(profile.reputation),
        followers: formatCompactNumber(profile.stats.followers),
        following: formatCompactNumber(profile.stats.following),
        postCount: formatCompactNumber(profile.postCount),
        hivePower,
        hiveBalance: dbAccount ? parseFormattedAsset(dbAccount.balance) : 0,
        hbdBalance: dbAccount ? parseFormattedAsset(dbAccount.hbdBalance) : 0,
        joinDate: formatJoinDate(profile.created),
      }
    }
    return MOCK_PROFILE_DATA
  })

  // Check if section contains a full-width element (like coverImage)
  const hasFullWidthElement = (section: CardSection): boolean => {
    return section.children?.some(child =>
      child.type === 'element' && child.id === 'coverImage'
    ) ?? false
  }

  // Render a child (element or nested section)
  const renderChild = (child: CardSectionChild) => {
    if (child.type === 'element') {
      return (
        <ElementRenderer
          id={child.id}
          profileData={profileData()}
          avatarSize={avatarSize}
          usernameSize={usernameSize}
          displayNameSize={displayNameSize}
          aboutSize={aboutSize}
          reputationSize={reputationSize}
          statsSize={statsSize}
          metaSize={metaSize}
          coverHeight={coverHeight}
        />
      )
    } else {
      return renderSection(child.section)
    }
  }

  // Render a section with its orientation (recursive)
  const renderSection = (section: CardSection) => {
    if (!section.children || section.children.length === 0) return null

    const isFullWidth = hasFullWidthElement(section)
    const orientationClass = section.orientation === 'horizontal'
      ? 'flex flex-wrap items-center gap-2'
      : 'flex flex-col gap-1'

    return (
      <div class={`${orientationClass} ${isFullWidth ? 'w-full' : ''}`}>
        <For each={section.children}>{(child) => renderChild(child)}</For>
      </div>
    )
  }

  // Get sections - use defaults if not available
  const getSections = () => {
    const sections = settings.authorProfileLayout2?.sections
    if (sections && sections.length > 0) {
      return sections
    }
    // Fallback to default layout sections
    return [
      { id: 'sec-1', orientation: 'horizontal' as const, children: [{ type: 'element' as const, id: 'coverImage' }] },
      { id: 'sec-2', orientation: 'horizontal' as const, children: [{ type: 'element' as const, id: 'avatar' }, { type: 'element' as const, id: 'displayName' }, { type: 'element' as const, id: 'username' }, { type: 'element' as const, id: 'reputation' }] },
      { id: 'sec-3', orientation: 'vertical' as const, children: [{ type: 'element' as const, id: 'about' }] },
      { id: 'sec-4', orientation: 'horizontal' as const, children: [{ type: 'element' as const, id: 'location' }, { type: 'element' as const, id: 'website' }, { type: 'element' as const, id: 'joinDate' }] },
      { id: 'sec-5', orientation: 'horizontal' as const, children: [{ type: 'element' as const, id: 'followers' }, { type: 'element' as const, id: 'following' }, { type: 'element' as const, id: 'postCount' }, { type: 'element' as const, id: 'hivePower' }] },
    ]
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs text-text-muted uppercase tracking-wide">Preview</p>
        <Show when={isLoading()}>
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <div class="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading...
          </div>
        </Show>
        <Show when={!settings.hiveUsername}>
          <span class="text-xs text-warning">No username set</span>
        </Show>
      </div>

      <div class="bg-bg-card rounded-xl border border-border overflow-hidden p-4">
        <div class="space-y-2">
          <For each={getSections()}>
            {(section) => renderSection(section)}
          </For>
        </div>

        {/* Social Links Preview */}
        <Show when={(settings.socialLinks || []).filter(l => l.url).length > 0}>
          <div class="mt-4 pt-4 border-t border-border">
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
                        class="w-4 h-4"
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
    </div>
  )
}
