import { Show, createMemo } from 'solid-js'
import { settings } from '../../store'

// ============================================
// Element Renderer Component
// Renders individual author profile elements
// ============================================

interface ElementRendererProps {
  id: string
  profileData: any
  avatarSize: () => number
  usernameSize: () => number
  displayNameSize: () => number
  aboutSize: () => number
  reputationSize: () => number
  statsSize: () => number
  metaSize: () => number
  coverHeight: () => number
}

export function ElementRenderer(props: ElementRendererProps) {
  const username = () => settings.hiveUsername || 'sample_user'

  return (
    <>
      <Show when={props.id === 'coverImage'}>
        <Show when={props.profileData.coverImage} fallback={
          <div class="bg-gradient-to-r from-primary/30 to-accent/30 rounded-lg w-full" style={{ height: `${props.coverHeight()}px` }} />
        }>
          <div
            class="bg-cover bg-center rounded-lg w-full"
            style={`height: ${props.coverHeight()}px; background-image: url('https://images.hive.blog/640x0/${props.profileData.coverImage}');`}
          />
        </Show>
      </Show>

      <Show when={props.id === 'avatar'}>
        <img
          src={settings.hiveUsername ? `https://images.hive.blog/u/${settings.hiveUsername}/avatar` : '/hive-logo.png'}
          alt={username()}
          style={{ width: `${props.avatarSize()}px`, height: `${props.avatarSize()}px` }}
          class="rounded-full border-2 border-bg-card ring-2 ring-border flex-shrink-0"
          onError={(e) => { e.currentTarget.src = '/hive-logo.png' }}
        />
      </Show>

      <Show when={props.id === 'username'}>
        <p class="font-bold text-text" style={{ 'font-size': `${props.usernameSize()}px` }}>@{username()}</p>
      </Show>

      <Show when={props.id === 'displayName'}>
        <h2 class="font-bold text-text" style={{ 'font-size': `${props.displayNameSize()}px` }}>{props.profileData.displayName}</h2>
      </Show>

      <Show when={props.id === 'reputation'}>
        <span class="inline-block px-2 py-0.5 font-medium bg-primary/10 text-primary rounded-full" style={{ 'font-size': `${props.reputationSize()}px` }}>
          Rep: {props.profileData.reputation}
        </span>
      </Show>

      <Show when={props.id === 'about' && props.profileData.about}>
        <p class="text-text-muted line-clamp-2" style={{ 'font-size': `${props.aboutSize()}px` }}>{props.profileData.about}</p>
      </Show>

      <Show when={props.id === 'location' && props.profileData.location}>
        <span class="flex items-center gap-1 text-text-muted" style={{ 'font-size': `${props.metaSize()}px` }}>
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
          {props.profileData.location}
        </span>
      </Show>

      <Show when={props.id === 'website' && props.profileData.website}>
        <a
          href={props.profileData.website}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-primary hover:underline"
          style={{ 'font-size': `${props.metaSize()}px` }}
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          {props.profileData.website.replace(/^https?:\/\//, '')}
        </a>
      </Show>

      <Show when={props.id === 'joinDate'}>
        <span class="flex items-center gap-1 text-text-muted" style={{ 'font-size': `${props.metaSize()}px` }}>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {props.profileData.joinDate}
        </span>
      </Show>

      <Show when={props.id === 'followers'}>
        <div class="text-center">
          <p class="font-bold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>{props.profileData.followers}</p>
          <p class="text-xs text-text-muted">Followers</p>
        </div>
      </Show>

      <Show when={props.id === 'following'}>
        <div class="text-center">
          <p class="font-bold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>{props.profileData.following}</p>
          <p class="text-xs text-text-muted">Following</p>
        </div>
      </Show>

      <Show when={props.id === 'postCount'}>
        <div class="text-center">
          <p class="font-bold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>{props.profileData.postCount}</p>
          <p class="text-xs text-text-muted">Posts</p>
        </div>
      </Show>

      <Show when={props.id === 'hivePower'}>
        <div class="text-center">
          <p class="font-bold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>{props.profileData.hivePower.toFixed(3)}</p>
          <p class="text-xs text-text-muted">Hive Power</p>
        </div>
      </Show>

      <Show when={props.id === 'hpEarned'}>
        <div class="text-center">
          <p class="font-bold text-success" style={{ 'font-size': `${props.statsSize()}px` }}>
            {props.profileData.hivePower.toFixed(3)}
          </p>
          <p class="text-xs text-text-muted">HP</p>
        </div>
      </Show>

      <Show when={props.id === 'votingPower'}>
        <div class="text-center">
          <p class="font-semibold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>--</p>
          <p class="text-xs text-text-muted">Voting Power</p>
        </div>
      </Show>

      <Show when={props.id === 'hiveBalance'}>
        <div class="text-center">
          <p class="font-semibold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>{props.profileData.hiveBalance.toFixed(3)}</p>
          <p class="text-xs text-text-muted">HIVE</p>
        </div>
      </Show>

      <Show when={props.id === 'hbdBalance'}>
        <div class="text-center">
          <p class="font-semibold text-text" style={{ 'font-size': `${props.statsSize()}px` }}>{props.profileData.hbdBalance.toFixed(3)}</p>
          <p class="text-xs text-text-muted">HBD</p>
        </div>
      </Show>
    </>
  )
}
