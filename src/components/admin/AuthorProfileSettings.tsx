import { Show, createMemo } from 'solid-js'
import { settings, updateSettings } from './store'
import { authorProfileLayoutOptions } from './types'
import { Select, Checkbox, Slider } from '../ui'

// ============================================
// Author Profile Settings Section
// ============================================

export function AuthorProfileSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Author Profile Settings</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <Select
            label="Profile Layout"
            options={authorProfileLayoutOptions}
            value={settings.authorProfileLayout}
            onChange={(e) =>
              updateSettings({
                authorProfileLayout: e.currentTarget.value as 'horizontal' | 'vertical',
              })
            }
          />

          <Slider
            label="Avatar size:"
            unit="px"
            min={32}
            max={128}
            value={settings.authorAvatarSizePx}
            onInput={(e) => updateSettings({ authorAvatarSizePx: parseInt(e.currentTarget.value) })}
          />

          <div class="border-t border-border pt-4 mt-4">
            <p class="text-sm font-medium text-text-muted mb-3">Profile Information</p>
            <div class="grid grid-cols-2 gap-3">
              <Checkbox
                label="Cover Image"
                checked={settings.showAuthorCoverImage}
                onChange={(e) => updateSettings({ showAuthorCoverImage: e.currentTarget.checked })}
              />
              <Checkbox
                label="About / Bio"
                checked={settings.showAuthorAbout}
                onChange={(e) => updateSettings({ showAuthorAbout: e.currentTarget.checked })}
              />
              <Checkbox
                label="Location"
                checked={settings.showAuthorLocation}
                onChange={(e) => updateSettings({ showAuthorLocation: e.currentTarget.checked })}
              />
              <Checkbox
                label="Website"
                checked={settings.showAuthorWebsite}
                onChange={(e) => updateSettings({ showAuthorWebsite: e.currentTarget.checked })}
              />
              <Checkbox
                label="Join Date"
                checked={settings.showAuthorJoinDate}
                onChange={(e) => updateSettings({ showAuthorJoinDate: e.currentTarget.checked })}
              />
              <Checkbox
                label="Reputation"
                checked={settings.showAuthorReputation}
                onChange={(e) => updateSettings({ showAuthorReputation: e.currentTarget.checked })}
              />
            </div>
          </div>

          <div class="border-t border-border pt-4">
            <p class="text-sm font-medium text-text-muted mb-3">Social Stats</p>
            <div class="grid grid-cols-2 gap-3">
              <Checkbox
                label="Followers"
                checked={settings.showAuthorFollowers}
                onChange={(e) => updateSettings({ showAuthorFollowers: e.currentTarget.checked })}
              />
              <Checkbox
                label="Following"
                checked={settings.showAuthorFollowing}
                onChange={(e) => updateSettings({ showAuthorFollowing: e.currentTarget.checked })}
              />
              <Checkbox
                label="Post Count"
                checked={settings.showPostCount}
                onChange={(e) => updateSettings({ showPostCount: e.currentTarget.checked })}
              />
              <Checkbox
                label="HP Earned"
                checked={settings.showAuthorRewards}
                onChange={(e) => updateSettings({ showAuthorRewards: e.currentTarget.checked })}
              />
            </div>
          </div>

          <div class="border-t border-border pt-4">
            <p class="text-sm font-medium text-text-muted mb-3">Financial Info</p>
            <div class="grid grid-cols-2 gap-3">
              <Checkbox
                label="Voting Power"
                checked={settings.showAuthorVotingPower}
                onChange={(e) => updateSettings({ showAuthorVotingPower: e.currentTarget.checked })}
              />
              <Checkbox
                label="HIVE Balance"
                checked={settings.showAuthorHiveBalance}
                onChange={(e) => updateSettings({ showAuthorHiveBalance: e.currentTarget.checked })}
              />
              <Checkbox
                label="HBD Balance"
                checked={settings.showAuthorHbdBalance}
                onChange={(e) => updateSettings({ showAuthorHbdBalance: e.currentTarget.checked })}
              />
            </div>
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
  const isVertical = createMemo(() => settings.authorProfileLayout === 'vertical')
  const username = () => settings.hiveUsername || 'username'

  // Mock data for preview
  const mockData = {
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

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div class="bg-bg-card rounded-xl border border-border overflow-hidden">
        {/* Cover Image */}
        <Show when={settings.showAuthorCoverImage}>
          <div
            class="h-20 md:h-24 bg-cover bg-center bg-gradient-to-r from-primary/30 to-accent/30"
            style={`background-image: url('${mockData.coverImage}');`}
          />
        </Show>

        <div
          class={`p-4 ${settings.showAuthorCoverImage ? '-mt-8' : ''}`}
        >
          <div
            class={
              isVertical()
                ? 'flex flex-col items-center text-center'
                : 'flex items-start gap-3'
            }
          >
            {/* Avatar */}
            <img
              src={`https://images.hive.blog/u/${username()}/avatar`}
              alt={username()}
              style={{
                width: `${settings.authorAvatarSizePx}px`,
                height: `${settings.authorAvatarSizePx}px`,
              }}
              class={`rounded-full border-2 border-bg-card ${isVertical() ? 'mb-2' : ''} ${settings.showAuthorCoverImage ? 'ring-2 ring-border' : ''}`}
              onError={(e) => {
                e.currentTarget.src = '/hive-logo.png'
              }}
            />

            <div class={isVertical() ? '' : 'flex-1 min-w-0'}>
              {/* Display Name & Username */}
              <div class={isVertical() ? 'mb-1' : ''}>
                <h2 class={`font-bold text-text ${isVertical() ? 'text-base' : 'text-lg'}`}>
                  {username()}
                </h2>
                <p class="text-text-muted text-sm">@{username()}</p>
              </div>

              {/* Reputation Badge */}
              <Show when={settings.showAuthorReputation}>
                <span class="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full mt-1">
                  Rep: {mockData.reputation}
                </span>
              </Show>

              {/* About/Bio */}
              <Show when={settings.showAuthorAbout}>
                <p class={`text-text-muted text-xs mt-2 ${isVertical() ? '' : 'line-clamp-2'}`}>
                  {mockData.about}
                </p>
              </Show>

              {/* Location & Website */}
              <Show when={settings.showAuthorLocation || settings.showAuthorWebsite}>
                <div
                  class={`flex flex-wrap gap-2 text-xs text-text-muted mt-2 ${isVertical() ? 'justify-center' : ''}`}
                >
                  <Show when={settings.showAuthorLocation}>
                    <span class="flex items-center gap-1">
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
                  </Show>
                  <Show when={settings.showAuthorWebsite}>
                    <span class="flex items-center gap-1 text-primary">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      gtg.openhive.network
                    </span>
                  </Show>
                </div>
              </Show>

              {/* Join Date */}
              <Show when={settings.showAuthorJoinDate}>
                <p class="text-xs text-text-muted mt-2">
                  <span class="inline-flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Joined {mockData.joinDate}
                  </span>
                </p>
              </Show>
            </div>
          </div>

          {/* Stats Grid */}
          <Show
            when={
              settings.showAuthorFollowers ||
              settings.showAuthorFollowing ||
              settings.showPostCount ||
              settings.showAuthorRewards
            }
          >
            <div
              class={`grid gap-2 mt-3 pt-3 border-t border-border ${isVertical() ? 'grid-cols-2' : 'grid-cols-4'}`}
            >
              <Show when={settings.showAuthorFollowers}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-sm font-bold text-text">12.5K</p>
                  <p class="text-xs text-text-muted">Followers</p>
                </div>
              </Show>
              <Show when={settings.showAuthorFollowing}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-sm font-bold text-text">340</p>
                  <p class="text-xs text-text-muted">Following</p>
                </div>
              </Show>
              <Show when={settings.showPostCount}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-sm font-bold text-text">1.2K</p>
                  <p class="text-xs text-text-muted">Posts</p>
                </div>
              </Show>
              <Show when={settings.showAuthorRewards}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-sm font-bold text-success">567.9K</p>
                  <p class="text-xs text-text-muted">HP Earned</p>
                </div>
              </Show>
            </div>
          </Show>

          {/* Financial Stats */}
          <Show
            when={
              settings.showAuthorVotingPower ||
              settings.showAuthorHiveBalance ||
              settings.showAuthorHbdBalance
            }
          >
            <div
              class={`grid gap-2 mt-2 pt-2 border-t border-border/50 ${isVertical() ? 'grid-cols-2' : 'grid-cols-3'}`}
            >
              <Show when={settings.showAuthorVotingPower}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-xs font-semibold text-text">{mockData.votingPower.toFixed(1)}%</p>
                  <p class="text-xs text-text-muted">Voting Power</p>
                </div>
              </Show>
              <Show when={settings.showAuthorHiveBalance}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-xs font-semibold text-text">{mockData.hiveBalance.toFixed(3)}</p>
                  <p class="text-xs text-text-muted">HIVE</p>
                </div>
              </Show>
              <Show when={settings.showAuthorHbdBalance}>
                <div class={isVertical() ? 'text-center' : ''}>
                  <p class="text-xs font-semibold text-text">{mockData.hbdBalance.toFixed(3)}</p>
                  <p class="text-xs text-text-muted">HBD</p>
                </div>
              </Show>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
