import { For } from 'solid-js'
import { settings, updateSettings } from './store'
import { authorProfileElementLabels, type CardLayout } from './types'
import { Slider } from '../ui'
import { CardLayoutEditor } from './CardLayoutEditor'

// All available author profile element IDs
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
  'hpEarned',
  'votingPower',
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

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Author Profile Settings</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <Slider
            label="Avatar size:"
            unit="px"
            min={32}
            max={128}
            value={settings.authorAvatarSizePx}
            onInput={(e) => updateSettings({ authorAvatarSizePx: parseInt(e.currentTarget.value) })}
          />

          {/* Card Layout Editor - Drag & Drop */}
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
              Profile Elements Layout
            </h3>
            <p class="text-xs text-text-muted mb-4">
              Drag elements between sections. Each section can be horizontal or vertical.
            </p>
            <CardLayoutEditor
              layout={settings.authorProfileLayout2}
              elementLabels={authorProfileElementLabels}
              allElementIds={AUTHOR_PROFILE_ELEMENT_IDS}
              onUpdate={handleLayoutUpdate}
            />
          </div>
        </div>

        {/* Live Preview */}
        <AuthorProfilePreview />
      </div>
    </div>
  )
}

// ============================================
// Author Profile Preview Component
// ============================================

function AuthorProfilePreview() {
  const username = () => settings.hiveUsername || 'username'

  // Mock data for preview
  const mockData = {
    displayName: 'Hive User',
    about: 'Hive witness and blockchain enthusiast. Building the decentralized future.',
    location: 'Poland',
    website: 'https://hive.blog',
    coverImage: '',
    reputation: 78,
    followers: 12500,
    following: 340,
    postCount: 1234,
    hpEarned: 567890,
    votingPower: 85.5,
    hiveBalance: 1234.567,
    hbdBalance: 890.123,
    joinDate: 'Mar 2016',
  }

  // Render element by ID
  const renderElement = (id: string) => {
    switch (id) {
      case 'coverImage':
        return (
          <div
            class="h-16 bg-cover bg-center bg-gradient-to-r from-primary/30 to-accent/30 rounded-t-lg -mx-4 -mt-4 mb-2"
            style={`background-image: url('${mockData.coverImage}');`}
          />
        )

      case 'avatar':
        return (
          <img
            src={`https://images.hive.blog/u/${username()}/avatar`}
            alt={username()}
            style={{
              width: `${settings.authorAvatarSizePx}px`,
              height: `${settings.authorAvatarSizePx}px`,
            }}
            class="rounded-full border-2 border-bg-card ring-2 ring-border flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = '/hive-logo.png'
            }}
          />
        )

      case 'username':
        return (
          <div>
            <p class="font-bold text-text text-sm">@{username()}</p>
          </div>
        )

      case 'displayName':
        return (
          <h2 class="font-bold text-text text-base">{mockData.displayName}</h2>
        )

      case 'reputation':
        return (
          <span class="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Rep: {mockData.reputation}
          </span>
        )

      case 'about':
        return (
          <p class="text-text-muted text-xs line-clamp-2">{mockData.about}</p>
        )

      case 'location':
        return (
          <span class="flex items-center gap-1 text-xs text-text-muted">
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
            {mockData.location}
          </span>
        )

      case 'website':
        return (
          <span class="flex items-center gap-1 text-xs text-primary">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            hive.blog
          </span>
        )

      case 'joinDate':
        return (
          <span class="flex items-center gap-1 text-xs text-text-muted">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {mockData.joinDate}
          </span>
        )

      case 'followers':
        return (
          <div class="text-center">
            <p class="text-xs font-bold text-text">12.5K</p>
            <p class="text-xs text-text-muted">Followers</p>
          </div>
        )

      case 'following':
        return (
          <div class="text-center">
            <p class="text-xs font-bold text-text">340</p>
            <p class="text-xs text-text-muted">Following</p>
          </div>
        )

      case 'postCount':
        return (
          <div class="text-center">
            <p class="text-xs font-bold text-text">1.2K</p>
            <p class="text-xs text-text-muted">Posts</p>
          </div>
        )

      case 'hpEarned':
        return (
          <div class="text-center">
            <p class="text-xs font-bold text-success">567.9K</p>
            <p class="text-xs text-text-muted">HP Earned</p>
          </div>
        )

      case 'votingPower':
        return (
          <div class="text-center">
            <p class="text-xs font-semibold text-text">{mockData.votingPower.toFixed(1)}%</p>
            <p class="text-xs text-text-muted">Voting Power</p>
          </div>
        )

      case 'hiveBalance':
        return (
          <div class="text-center">
            <p class="text-xs font-semibold text-text">{mockData.hiveBalance.toFixed(3)}</p>
            <p class="text-xs text-text-muted">HIVE</p>
          </div>
        )

      case 'hbdBalance':
        return (
          <div class="text-center">
            <p class="text-xs font-semibold text-text">{mockData.hbdBalance.toFixed(3)}</p>
            <p class="text-xs text-text-muted">HBD</p>
          </div>
        )

      default:
        return null
    }
  }

  // Render a section with its orientation
  const renderSection = (section: { id: string; orientation: 'horizontal' | 'vertical'; elements: string[] }) => {
    if (section.elements.length === 0) return null

    return (
      <div
        class={`
          ${section.orientation === 'horizontal' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-1'}
        `}
      >
        <For each={section.elements}>{(elementId) => renderElement(elementId)}</For>
      </div>
    )
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div class="bg-bg-card rounded-xl border border-border overflow-hidden p-4">
        <div class="space-y-2">
          <For each={settings.authorProfileLayout2.sections}>
            {(section) => renderSection(section)}
          </For>
        </div>
      </div>
    </div>
  )
}
