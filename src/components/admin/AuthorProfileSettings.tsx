import { For, Show, createMemo } from 'solid-js'
import { settings, updateSettings } from './store'
import { authorProfileElementLabels, platformInfos, type CardLayout, type CardSection, type CardSectionChild } from './types'
import { Slider } from '../ui'
import { CardLayoutEditor } from './CardLayoutEditor'
import { SocialLinksSettings, PlatformIcon } from './SocialLinksSettings'
import {
  useHivePreviewQuery,
  formatCompactNumber,
  formatJoinDate,
  calculateEffectiveHivePower,
} from './queries'
import {
  parseFormattedAsset,
} from '../../lib/blog-logic'

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

// Helper to check if element is in layout (recursive)
function isElementInLayout(layout: CardLayout | undefined | null, elementId: string): boolean {
  if (!layout?.sections) return true // If no layout, assume element is present (don't disable)

  const checkChildren = (children: CardSectionChild[]): boolean => {
    for (const child of children) {
      if (child.type === 'element' && child.id === elementId) {
        return true
      }
      if (child.type === 'section' && child.section.children) {
        if (checkChildren(child.section.children)) {
          return true
        }
      }
    }
    return false
  }

  for (const section of layout.sections) {
    if (section.children && checkChildren(section.children)) {
      return true
    }
  }
  return false
}

// Check if any of the given elements are in layout
function areAnyElementsInLayout(layout: CardLayout | undefined | null, elementIds: string[]): boolean {
  if (!layout?.sections) return true // If no layout, assume elements are present
  return elementIds.some(id => isElementInLayout(layout, id))
}

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
              onInput={(e) => updateSettings({ authorAvatarSizePx: parseInt(e.currentTarget.value) })}
              disabled={!hasAvatar()}
            />
            <Slider
              label="Cover height:"
              unit="px"
              min={48}
              max={200}
              value={settings.authorCoverHeightPx ?? 64}
              onInput={(e) => updateSettings({ authorCoverHeightPx: parseInt(e.currentTarget.value) })}
              disabled={!hasCover()}
            />
            <Slider
              label="Username size:"
              unit="px"
              min={12}
              max={24}
              value={settings.authorUsernameSizePx ?? 14}
              onInput={(e) => updateSettings({ authorUsernameSizePx: parseInt(e.currentTarget.value) })}
              disabled={!hasUsername()}
            />
            <Slider
              label="Display name size:"
              unit="px"
              min={14}
              max={32}
              value={settings.authorDisplayNameSizePx ?? 18}
              onInput={(e) => updateSettings({ authorDisplayNameSizePx: parseInt(e.currentTarget.value) })}
              disabled={!hasDisplayName()}
            />
            <Slider
              label="About text size:"
              unit="px"
              min={10}
              max={18}
              value={settings.authorAboutSizePx ?? 14}
              onInput={(e) => updateSettings({ authorAboutSizePx: parseInt(e.currentTarget.value) })}
              disabled={!hasAbout()}
            />
            <Slider
              label="Stats size:"
              unit="px"
              min={10}
              max={20}
              value={settings.authorStatsSizePx ?? 14}
              onInput={(e) => updateSettings({ authorStatsSizePx: parseInt(e.currentTarget.value) })}
              disabled={!hasStats()}
            />
            <Slider
              label="Meta text size:"
              unit="px"
              min={10}
              max={16}
              value={settings.authorMetaSizePx ?? 12}
              onInput={(e) => updateSettings({ authorMetaSizePx: parseInt(e.currentTarget.value) })}
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
// Uses real Hive data or mock data for preview
// ============================================

function AuthorProfilePreview() {
  const username = () => settings.hiveUsername || 'sample_user'

  // Fetch real Hive data (only if username is set)
  const hiveQuery = useHivePreviewQuery(
    () => settings.hiveUsername,
    () => 1,
    () => !!settings.hiveUsername
  )

  const isLoading = () => hiveQuery.isLoading && !!settings.hiveUsername

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
        followers: profile.stats.followers,
        following: profile.stats.following,
        postCount: profile.postCount,
        hivePower,
        hiveBalance: dbAccount ? parseFormattedAsset(dbAccount.balance) : 0,
        hbdBalance: dbAccount ? parseFormattedAsset(dbAccount.hbdBalance) : 0,
        joinDate: formatJoinDate(profile.created),
      }
    }
    // Return mock data when no real data
    return MOCK_PROFILE_DATA
  })

  // Render element by ID - always has data (real or mock)
  const renderElement = (id: string) => {
    const pd = profileData()
    const coverHeight = settings.authorCoverHeightPx ?? 64
    const avatarSize = settings.authorAvatarSizePx ?? 64
    const usernameSize = settings.authorUsernameSizePx ?? 14
    const displayNameSize = settings.authorDisplayNameSizePx ?? 18
    const aboutSize = settings.authorAboutSizePx ?? 14
    const statsSize = settings.authorStatsSizePx ?? 14
    const metaSize = settings.authorMetaSizePx ?? 12

    switch (id) {
      case 'coverImage':
        return (
          <Show when={pd.coverImage} fallback={
            <div class="bg-gradient-to-r from-primary/30 to-accent/30 rounded-lg w-full" style={{ height: `${coverHeight}px` }} />
          }>
            <div
              class="bg-cover bg-center rounded-lg w-full"
              style={`height: ${coverHeight}px; background-image: url('https://images.hive.blog/640x0/${pd.coverImage}');`}
            />
          </Show>
        )

      case 'avatar':
        return (
          <img
            src={settings.hiveUsername ? `https://images.hive.blog/u/${settings.hiveUsername}/avatar` : '/hive-logo.png'}
            alt={username()}
            style={{ width: `${avatarSize}px`, height: `${avatarSize}px` }}
            class="rounded-full border-2 border-bg-card ring-2 ring-border flex-shrink-0"
            onError={(e) => { e.currentTarget.src = '/hive-logo.png' }}
          />
        )

      case 'username':
        return (
          <p class="font-bold text-text" style={{ 'font-size': `${usernameSize}px` }}>@{username()}</p>
        )

      case 'displayName':
        return (
          <h2 class="font-bold text-text" style={{ 'font-size': `${displayNameSize}px` }}>{pd.displayName}</h2>
        )

      case 'reputation':
        return (
          <span class="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Rep: {pd.reputation}
          </span>
        )

      case 'about':
        return (
          <Show when={pd.about}>
            <p class="text-text-muted line-clamp-2" style={{ 'font-size': `${aboutSize}px` }}>{pd.about}</p>
          </Show>
        )

      case 'location':
        const locationSize = settings.authorMetaSizePx ?? 12
        return (
          <Show when={pd.location}>
            <span class="flex items-center gap-1 text-text-muted" style={{ 'font-size': `${locationSize}px` }}>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {pd.location}
            </span>
          </Show>
        )

      case 'website':
        const websiteSize = settings.authorMetaSizePx ?? 12
        return (
          <Show when={pd.website}>
            <a
              href={pd.website}
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-primary hover:underline"
              style={{ 'font-size': `${websiteSize}px` }}
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {pd.website.replace(/^https?:\/\//, '')}
            </a>
          </Show>
        )

      case 'joinDate':
        const joinDateSize = settings.authorMetaSizePx ?? 12
        return (
          <span class="flex items-center gap-1 text-text-muted" style={{ 'font-size': `${joinDateSize}px` }}>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {pd.joinDate}
          </span>
        )

      case 'followers':
        const followersSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-bold text-text" style={{ 'font-size': `${followersSize}px` }}>{formatCompactNumber(pd.followers)}</p>
            <p class="text-xs text-text-muted">Followers</p>
          </div>
        )

      case 'following':
        const followingSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-bold text-text" style={{ 'font-size': `${followingSize}px` }}>{formatCompactNumber(pd.following)}</p>
            <p class="text-xs text-text-muted">Following</p>
          </div>
        )

      case 'postCount':
        const postCountSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-bold text-text" style={{ 'font-size': `${postCountSize}px` }}>{formatCompactNumber(pd.postCount)}</p>
            <p class="text-xs text-text-muted">Posts</p>
          </div>
        )

      case 'hivePower':
        const hivePowerSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-bold text-text" style={{ 'font-size': `${hivePowerSize}px` }}>{formatCompactNumber(pd.hivePower)}</p>
            <p class="text-xs text-text-muted">Hive Power</p>
          </div>
        )

      case 'hpEarned':
        // Show Hive Power (same as Denser) - pd.hivePower is already effective HP
        const hpEarnedSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-bold text-success" style={{ 'font-size': `${hpEarnedSize}px` }}>
              {formatCompactNumber(pd.hivePower)}
            </p>
            <p class="text-xs text-text-muted">HP</p>
          </div>
        )

      case 'votingPower':
        // Voting power requires manabar calculation which needs additional API call
        // For now showing placeholder - full implementation would use Account.getManabars()
        const votingPowerSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-semibold text-text" style={{ 'font-size': `${votingPowerSize}px` }}>--</p>
            <p class="text-xs text-text-muted">Voting Power</p>
          </div>
        )

      case 'hiveBalance':
        const hiveBalanceSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-semibold text-text" style={{ 'font-size': `${hiveBalanceSize}px` }}>{pd.hiveBalance.toFixed(3)}</p>
            <p class="text-xs text-text-muted">HIVE</p>
          </div>
        )

      case 'hbdBalance':
        const hbdBalanceSize = settings.authorStatsSizePx ?? 14
        return (
          <div class="text-center">
            <p class="font-semibold text-text" style={{ 'font-size': `${hbdBalanceSize}px` }}>{pd.hbdBalance.toFixed(3)}</p>
            <p class="text-xs text-text-muted">HBD</p>
          </div>
        )

      default:
        return null
    }
  }

  // Render a child (element or nested section)
  const renderChild = (child: CardSectionChild): ReturnType<typeof renderElement> => {
    if (child.type === 'element') {
      return renderElement(child.id)
    } else {
      // Nested section - recursive render
      return renderSection(child.section)
    }
  }

  // Check if section contains a full-width element (like coverImage)
  const hasFullWidthElement = (section: CardSection): boolean => {
    return section.children?.some(child =>
      child.type === 'element' && child.id === 'coverImage'
    ) ?? false
  }

  // Render a section with its orientation (recursive)
  const renderSection = (section: CardSection): ReturnType<typeof renderElement> => {
    if (!section.children || section.children.length === 0) return null

    // Full-width sections (like coverImage) need special treatment
    const isFullWidth = hasFullWidthElement(section)

    return (
      <div
        class={`
          ${isFullWidth
            ? 'w-full'
            : section.orientation === 'horizontal'
              ? 'flex flex-wrap items-center gap-2'
              : 'flex flex-col gap-1'
          }
        `}
      >
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
        {/* Always render sections - getSections() provides fallback */}
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
