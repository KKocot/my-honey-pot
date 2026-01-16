import { createSignal, createEffect, Show, For, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'
import { settings } from './store'
import { pageElementLabels, type PageSlotPosition } from './types'
import { HIVE_API_ENDPOINT } from '../../lib/config'

// ============================================
// Full Preview Dialog Component
// Shows live preview with real Hive data
// ============================================

interface FullPreviewProps {
  open: Accessor<boolean>
  onClose: () => void
}

// Hive API types (simplified for preview)
interface HivePost {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  json_metadata: { image?: string[]; tags?: string[] } | string
  active_votes: { voter: string }[]
  children: number
  pending_payout_value: string
}

interface HiveAccount {
  name: string
  reputation: number
  post_count: number
  balance: string
  savings_balance: string
  hbd_balance: string
  vesting_shares: string
  received_vesting_shares: string
  delegated_vesting_shares: string
  json_metadata: string
  posting_json_metadata: string
  created: string
}

interface HiveProfile {
  name: string
  about?: string
  location?: string
  website?: string
  cover_image?: string
  profile_image?: string
  post_count?: number
}

interface HiveFollowCount {
  follower_count: number
  following_count: number
}

interface HiveData {
  account: HiveAccount | null
  profile: HiveProfile | null
  posts: HivePost[]
  followCount: HiveFollowCount | null
}

// Fetch Hive data
async function fetchHiveData(username: string, postsPerPage: number): Promise<HiveData | null> {
  if (!username) return null

  try {
    // Fetch account, posts, and follow count in parallel
    const [accountRes, postsRes, followRes] = await Promise.all([
      fetch(HIVE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_accounts',
          params: [[username]],
          id: 1,
        }),
      }),
      fetch(HIVE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bridge.get_account_posts',
          params: { sort: 'blog', account: username, limit: postsPerPage },
          id: 2,
        }),
      }),
      fetch(HIVE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_follow_count',
          params: [username],
          id: 3,
        }),
      }),
    ])

    const [accountData, postsData, followData] = await Promise.all([
      accountRes.json(),
      postsRes.json(),
      followRes.json(),
    ])

    const account: HiveAccount | null = accountData.result?.[0] || null
    const posts: HivePost[] = postsData.result || []
    const followCount: HiveFollowCount | null = followData.result || null

    // Parse profile from account metadata
    let profile: HiveProfile | null = null
    if (account) {
      try {
        const metadata = JSON.parse(account.posting_json_metadata || account.json_metadata || '{}')
        profile = metadata.profile || null
      } catch {
        // Invalid JSON
      }
    }

    return { account, profile, posts, followCount }
  } catch {
    return null
  }
}

export function FullPreview(props: FullPreviewProps) {
  const [data, setData] = createSignal<HiveData | null>(null)
  const [loading, setLoading] = createSignal(false)

  // Fetch data when dialog opens
  createEffect(() => {
    // Track props.open() reactively - this will re-run when open changes
    const isOpen = props.open()
    if (!isOpen) {
      return
    }

    // Get current username from store
    const username = settings.hiveUsername
    const postsLimit = settings.postsPerPage || 20

    if (username) {
      setLoading(true)
      setData(null) // Clear old data
      fetchHiveData(username, postsLimit).then((result) => {
        setData(result)
        setLoading(false)
      }).catch(() => {
        setLoading(false)
      })
    }
  })

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  // Get elements in slot
  const getElementsInSlot = (slot: PageSlotPosition): string[] => {
    return settings.pageLayout.sections
      .filter(s => s.slot === slot)
      .flatMap(s => s.elements)
  }

  const hasLeftSidebar = () => getElementsInSlot('sidebar-left').length > 0
  const hasRightSidebar = () => getElementsInSlot('sidebar-right').length > 0

  // Parse post thumbnail
  const getPostThumbnail = (post: HivePost): string | null => {
    try {
      const metadata = typeof post.json_metadata === 'string'
        ? JSON.parse(post.json_metadata)
        : post.json_metadata
      const image = metadata?.image?.[0]
      if (image && image.startsWith('http')) {
        return `https://images.hive.blog/256x512/${image}`
      }
    } catch {}
    return null
  }

  // Parse post tags
  const getPostTags = (post: HivePost): string[] => {
    try {
      const metadata = typeof post.json_metadata === 'string'
        ? JSON.parse(post.json_metadata)
        : post.json_metadata
      return metadata?.tags?.slice(0, settings.maxTags || 5) || []
    } catch {}
    return []
  }

  // Format payout
  const formatPayout = (value: string): string => {
    const num = parseFloat(value.replace(' HBD', '').replace(' HIVE', ''))
    return `$${num.toFixed(2)}`
  }

  // Calculate reputation
  const calculateReputation = (rep: number): number => {
    if (rep === 0) return 25
    const neg = rep < 0
    const repLog = Math.log10(Math.abs(rep))
    let out = Math.max(repLog - 9, 0)
    out = (neg ? -1 : 1) * out * 9 + 25
    return Math.floor(out)
  }

  // Render header element
  const renderHeader = () => (
    <header
      class="bg-bg-card rounded-xl shadow-sm border border-border p-6 mb-6"
      style={`max-width: ${settings.headerMaxWidthPx || 1280}px; margin-left: auto; margin-right: auto;`}
    >
      <h1 class="text-2xl font-bold text-text">{settings.siteName || 'Hive Blog'}</h1>
      <p class="text-text-muted mt-1">{settings.siteDescription || 'Posts from Hive blockchain'}</p>
    </header>
  )

  // Format number with K/M suffix
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Render author profile element
  const renderAuthorProfile = (layout: 'horizontal' | 'vertical' = 'horizontal') => {
    const currentData = data()
    const account = currentData?.account
    const profile = currentData?.profile
    const followCount = currentData?.followCount
    if (!account) return null

    return (
      <div class={`bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden ${layout === 'vertical' ? 'p-4' : 'p-6'}`}>
        {settings.showAuthorCoverImage && profile?.cover_image && (
          <div
            class="h-24 bg-cover bg-center -mx-4 -mt-4 mb-4 rounded-t-xl"
            style={`background-image: url(${profile.cover_image});`}
          />
        )}
        <div class={`flex ${layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center'} gap-4`}>
          <img
            src={`https://images.hive.blog/u/${account.name}/avatar`}
            alt={account.name}
            class="rounded-full border-2 border-border"
            style={`width: ${settings.authorAvatarSizePx || 64}px; height: ${settings.authorAvatarSizePx || 64}px;`}
          />
          <div class={layout === 'vertical' ? '' : 'flex-1'}>
            <div class="flex items-center gap-2 flex-wrap justify-center">
              <h2 class="font-bold text-text">@{account.name}</h2>
              {settings.showAuthorReputation !== false && (
                <span class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  Rep: {calculateReputation(account.reputation)}
                </span>
              )}
            </div>
            {settings.showAuthorAbout !== false && profile?.about && (
              <p class="text-text-muted text-sm mt-1 line-clamp-2">{profile.about}</p>
            )}
            <div class="flex flex-wrap gap-4 mt-2 text-sm text-text-muted justify-center">
              {settings.showAuthorLocation !== false && profile?.location && (
                <span>{profile.location}</span>
              )}
              {settings.showAuthorWebsite !== false && profile?.website && (
                <a href={profile.website} class="text-primary hover:underline" target="_blank">
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border justify-center text-center">
          {settings.showPostCount !== false && (
            <div>
              <p class="font-bold text-text">{formatNumber(account.post_count)}</p>
              <p class="text-xs text-text-muted">Posts</p>
            </div>
          )}
          {settings.showAuthorFollowers !== false && followCount && (
            <div>
              <p class="font-bold text-text">{formatNumber(followCount.follower_count)}</p>
              <p class="text-xs text-text-muted">Followers</p>
            </div>
          )}
          {settings.showAuthorFollowing !== false && followCount && (
            <div>
              <p class="font-bold text-text">{formatNumber(followCount.following_count)}</p>
              <p class="text-xs text-text-muted">Following</p>
            </div>
          )}
          {settings.showAuthorHiveBalance !== false && (
            <div>
              <p class="font-bold text-text">{parseFloat(account.balance).toFixed(3)}</p>
              <p class="text-xs text-text-muted">HIVE</p>
            </div>
          )}
          {settings.showAuthorHbdBalance !== false && (
            <div>
              <p class="font-bold text-text">{parseFloat(account.hbd_balance).toFixed(3)}</p>
              <p class="text-xs text-text-muted">HBD</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Posts component - reactive
  const PostsSection = () => {
    const posts = () => data()?.posts || []

    return (
      <Show when={posts().length > 0} fallback={
        <div class="text-center py-8 bg-bg-card rounded-xl border border-border">
          <p class="text-text-muted">No posts found</p>
        </div>
      }>
        <Show when={settings.postsLayout === 'list'}>
          <div class="flex flex-col" style={`gap: ${settings.cardGapPx || 24}px;`}>
            <For each={posts()}>
              {(post) => <PostCard post={post} forceVertical={false} />}
            </For>
          </div>
        </Show>
        <Show when={settings.postsLayout === 'masonry'}>
          <div style={`column-count: ${settings.gridColumns || 2}; column-gap: ${settings.cardGapPx || 24}px;`}>
            <For each={posts()}>
              {(post) => (
                <div class="break-inside-avoid" style={`margin-bottom: ${settings.cardGapPx || 24}px;`}>
                  <PostCard post={post} forceVertical={true} />
                </div>
              )}
            </For>
          </div>
        </Show>
        <Show when={settings.postsLayout === 'grid'}>
          <div style={`display: grid; grid-template-columns: repeat(${settings.gridColumns || 2}, 1fr); gap: ${settings.cardGapPx || 24}px;`}>
            <For each={posts()}>
              {(post) => <PostCard post={post} forceVertical={true} />}
            </For>
          </div>
        </Show>
      </Show>
    )
  }

  // Single post card component - reactive
  const PostCard = (props: { post: HivePost; forceVertical: boolean }) => {
    const thumbnail = () => getPostThumbnail(props.post)
    const tags = () => getPostTags(props.post)
    const isVertical = () => props.forceVertical || settings.cardLayout === 'vertical' || settings.postsLayout !== 'list'

    return (
      <article
        class={`bg-bg-card rounded-xl border overflow-hidden ${settings.cardBorder !== false ? 'border-border' : 'border-transparent'}`}
        style={`padding: ${settings.cardPaddingPx || 24}px; border-radius: ${settings.cardBorderRadiusPx || 16}px;`}
      >
        <div class={isVertical() ? 'flex flex-col gap-3' : 'flex gap-4'}>
          <Show when={settings.showThumbnail !== false && thumbnail()}>
            <div
              class={`rounded-lg overflow-hidden flex-shrink-0 bg-cover bg-center ${isVertical() ? 'w-full h-40' : ''}`}
              style={isVertical() ? '' : `width: ${settings.thumbnailSizePx || 96}px; height: ${settings.thumbnailSizePx || 96}px;`}
            >
              <img src={thumbnail()!} alt="" class="w-full h-full object-cover" />
            </div>
          </Show>
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-text line-clamp-2 hover:text-primary transition-colors"
              style={`font-size: ${settings.titleSizePx || 20}px;`}
            >
              {props.post.title}
            </h3>
            <Show when={settings.showSummary !== false}>
              <p class="text-text-muted text-sm mt-1 line-clamp-2">
                {props.post.body.replace(/[#*`>\[\]()!]/g, '').slice(0, settings.summaryMaxLength || 150)}...
              </p>
            </Show>
            <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
              <Show when={settings.showDate !== false}>
                <span>{new Date(props.post.created).toLocaleDateString()}</span>
              </Show>
              <Show when={settings.showVotes !== false}>
                <span>{props.post.active_votes.length} votes</span>
              </Show>
              <Show when={settings.showComments !== false}>
                <span>{props.post.children} comments</span>
              </Show>
              <Show when={settings.showPayout !== false}>
                <span class="text-success">{formatPayout(props.post.pending_payout_value)}</span>
              </Show>
            </div>
            <Show when={settings.showTags !== false && tags().length > 0}>
              <div class="flex flex-wrap gap-1 mt-2">
                <For each={tags()}>
                  {(tag) => (
                    <span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">
                      #{tag}
                    </span>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </article>
    )
  }

  // Render footer element
  const renderFooter = () => (
    <footer class="text-center py-6 text-text-muted text-sm border-t border-border mt-6">
      <p>Powered by Hive Blockchain</p>
    </footer>
  )

  // Element renderer component - reactive
  const ElementRenderer = (props: { elementId: string; inSidebar?: boolean }) => {
    return (
      <>
        <Show when={props.elementId === 'header'}>
          {renderHeader()}
        </Show>
        <Show when={props.elementId === 'authorProfile'}>
          {renderAuthorProfile(props.inSidebar ? 'vertical' : (settings.authorProfileLayout || 'horizontal'))}
        </Show>
        <Show when={props.elementId === 'posts'}>
          <PostsSection />
        </Show>
        <Show when={props.elementId === 'footer'}>
          {renderFooter()}
        </Show>
        <Show when={['navigation', 'search', 'tags', 'recentPosts', 'comments'].includes(props.elementId)}>
          <div class="bg-bg-card rounded-xl p-4 border border-border">
            <p class="text-text-muted text-sm">{pageElementLabels[props.elementId]} (placeholder)</p>
          </div>
        </Show>
      </>
    )
  }

  return (
    <Show when={props.open()}>
      <Portal>
        {/* Full screen backdrop */}
        <div
          class="fixed inset-0 z-50 bg-bg overflow-auto"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={props.onClose}
            class="fixed top-4 right-4 z-50 p-2 rounded-lg bg-bg-card border border-border shadow-lg
              text-text-muted hover:text-text hover:bg-bg-secondary transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Preview info badge */}
          <div class="fixed top-4 left-4 z-50 px-3 py-1.5 rounded-lg bg-primary text-primary-text text-sm font-medium shadow-lg">
            Preview Mode - @{settings.hiveUsername || 'no user'}
          </div>

          {/* Loading state */}
          <Show when={loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="flex items-center gap-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span class="text-text-muted">Loading preview data...</span>
              </div>
            </div>
          </Show>

          {/* No username */}
          <Show when={!settings.hiveUsername && !loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <p class="text-text text-lg">No Hive username configured</p>
                <p class="text-text-muted mt-1">Enter a username in User Switcher to see preview</p>
              </div>
            </div>
          </Show>

          {/* Main content */}
          <Show when={data() && !loading()}>
            <div class="max-w-7xl mx-auto px-4 py-16">
              {/* Top slot */}
              <For each={getElementsInSlot('top')}>
                {(elementId) => (
                  <div class="mb-6">
                    <ElementRenderer elementId={elementId} />
                  </div>
                )}
              </For>

              {/* Main area with optional sidebars */}
              <Show when={hasLeftSidebar() || hasRightSidebar()}>
                <div class="flex gap-8">
                  {/* Left Sidebar */}
                  <Show when={hasLeftSidebar()}>
                    <aside style={`width: ${settings.sidebarWidthPx || 280}px; flex-shrink: 0;`}>
                      <For each={getElementsInSlot('sidebar-left')}>
                        {(elementId) => (
                          <div class="mb-4">
                            <ElementRenderer elementId={elementId} inSidebar={true} />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Main Content */}
                  <main class="flex-1 min-w-0">
                    <For each={getElementsInSlot('main')}>
                      {(elementId) => (
                        <div class="mb-6">
                          <ElementRenderer elementId={elementId} />
                        </div>
                      )}
                    </For>
                  </main>

                  {/* Right Sidebar */}
                  <Show when={hasRightSidebar()}>
                    <aside style={`width: ${settings.sidebarWidthPx || 280}px; flex-shrink: 0;`}>
                      <For each={getElementsInSlot('sidebar-right')}>
                        {(elementId) => (
                          <div class="mb-4">
                            <ElementRenderer elementId={elementId} inSidebar={true} />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>
                </div>
              </Show>

              {/* No sidebars - render main directly */}
              <Show when={!hasLeftSidebar() && !hasRightSidebar()}>
                <For each={getElementsInSlot('main')}>
                  {(elementId) => (
                    <div class="mb-6">
                      <ElementRenderer elementId={elementId} />
                    </div>
                  )}
                </For>
              </Show>

              {/* Bottom slot */}
              <For each={getElementsInSlot('bottom')}>
                {(elementId) => (
                  <div class="mt-6">
                    <ElementRenderer elementId={elementId} />
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Portal>
    </Show>
  )
}
