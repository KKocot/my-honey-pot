import { Show, For, createMemo, createSignal, onMount, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'
import { settings, updateSettings } from './store'
import { pageElementLabels, type PageSlotPosition, type PageLayoutSection } from './types'
import {
  useHivePreviewQuery,
  formatCompactNumber,
  calculateEffectiveHivePower,
  type HivePost,
} from './queries'
import { parseFormattedAsset } from '../../lib/blog-logic'

// ============================================
// Full Preview Dialog Component
// Shows live preview with real Hive data
// ============================================

interface FullPreviewProps {
  open: Accessor<boolean>
  onClose: () => void
}

export function FullPreview(props: FullPreviewProps) {
  // Active tab state for navigation routing
  const [activeTab, setActiveTab] = createSignal('posts')

  // Use TanStack Query for data fetching with caching
  const hiveQuery = useHivePreviewQuery(
    () => settings.hiveUsername,
    () => settings.postsPerPage || 20,
    props.open
  )

  // Derive data and loading state from query
  const data = () => hiveQuery.data ?? null
  const loading = () => hiveQuery.isLoading

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  // Reactive memos for each slot - these track changes to settings.pageLayout
  // Returns full sections with orientation info
  const topSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'top' && s.active !== false && s.elements.length > 0)
  })

  const mainSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'main' && s.active !== false && s.elements.length > 0)
  })

  const bottomSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'bottom' && s.active !== false && s.elements.length > 0)
  })

  const leftSidebarSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'sidebar-left' && s.active !== false && s.elements.length > 0)
  })

  const rightSidebarSections = createMemo(() => {
    const sections = settings.pageLayout?.sections || []
    return sections.filter(s => s.slot === 'sidebar-right' && s.active !== false && s.elements.length > 0)
  })

  const hasLeftSidebar = createMemo(() => leftSidebarSections().length > 0)
  const hasRightSidebar = createMemo(() => rightSidebarSections().length > 0)

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

  // Render author profile element
  const renderAuthorProfile = (layout: 'horizontal' | 'vertical' = 'horizontal') => {
    const currentData = data()
    const profile = currentData?.profile
    const dbAccount = currentData?.dbAccount
    const globalProps = currentData?.globalProps
    if (!profile) return null

    const profileMeta = profile.metadata

    return (
      <div class={`bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden ${layout === 'vertical' ? 'p-4' : 'p-6'}`}>
        {settings.showAuthorCoverImage && profileMeta?.coverImage && (
          <div
            class="h-24 bg-cover bg-center -mx-4 -mt-4 mb-4 rounded-t-xl"
            style={`background-image: url(${profileMeta.coverImage});`}
          />
        )}
        <div class={`flex ${layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center'} gap-4`}>
          <img
            src={`https://images.hive.blog/u/${profile.name}/avatar`}
            alt={profile.name}
            class="rounded-full border-2 border-border"
            style={`width: ${settings.authorAvatarSizePx || 64}px; height: ${settings.authorAvatarSizePx || 64}px;`}
          />
          <div class={layout === 'vertical' ? '' : 'flex-1'}>
            <div class="flex items-center gap-2 flex-wrap justify-center">
              <h2 class="font-bold text-text">@{profile.name}</h2>
              {settings.showAuthorReputation !== false && (
                <span class="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  Rep: {Math.floor(profile.reputation)}
                </span>
              )}
            </div>
            {settings.showAuthorAbout !== false && profileMeta?.about && (
              <p class="text-text-muted text-sm mt-1 line-clamp-2">{profileMeta.about}</p>
            )}
            <div class="flex flex-wrap gap-4 mt-2 text-sm text-text-muted justify-center">
              {settings.showAuthorLocation !== false && profileMeta?.location && (
                <span>{profileMeta.location}</span>
              )}
              {settings.showAuthorWebsite !== false && profileMeta?.website && (
                <a href={profileMeta.website} class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  {profileMeta.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border justify-center text-center">
          {settings.showPostCount !== false && (
            <div>
              <p class="font-bold text-text">{formatCompactNumber(profile.postCount)}</p>
              <p class="text-xs text-text-muted">Posts</p>
            </div>
          )}
          {settings.showAuthorFollowers !== false && (
            <div>
              <p class="font-bold text-text">{formatCompactNumber(profile.stats.followers)}</p>
              <p class="text-xs text-text-muted">Followers</p>
            </div>
          )}
          {settings.showAuthorFollowing !== false && (
            <div>
              <p class="font-bold text-text">{formatCompactNumber(profile.stats.following)}</p>
              <p class="text-xs text-text-muted">Following</p>
            </div>
          )}
          {settings.showAuthorHiveBalance !== false && dbAccount && (
            <div>
              <p class="font-bold text-text">{parseFormattedAsset(dbAccount.balance).toFixed(3)}</p>
              <p class="text-xs text-text-muted">HIVE</p>
            </div>
          )}
          {settings.showAuthorHbdBalance !== false && dbAccount && (
            <div>
              <p class="font-bold text-text">{parseFormattedAsset(dbAccount.hbdBalance).toFixed(3)}</p>
              <p class="text-xs text-text-muted">HBD</p>
            </div>
          )}
          {settings.showAuthorVotingPower !== false && dbAccount && globalProps && (
            <div>
              <p class="font-bold text-text">
                {formatCompactNumber(calculateEffectiveHivePower(
                  dbAccount.vestingShares,
                  dbAccount.delegatedVestingShares,
                  dbAccount.receivedVestingShares,
                  globalProps
                ))}
              </p>
              <p class="text-xs text-text-muted">HP</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Sorting bar component for posts
  const PostsSortBar = () => {
    const sortOptions = [
      { value: 'blog', label: 'Blog (with reblogs)' },
      { value: 'posts', label: 'Posts only' },
      { value: 'payout', label: 'By payout' },
    ] as const

    return (
      <div class="flex items-center justify-between bg-bg-card rounded-lg px-4 py-2 mb-4 border border-border">
        <span class="text-sm text-text-muted">Sort posts:</span>
        <div class="flex gap-1">
          <For each={sortOptions}>
            {(option) => (
              <button
                type="button"
                onClick={() => updateSettings({ postsSortOrder: option.value })}
                class={`px-3 py-1 text-sm rounded-md transition-colors ${
                  settings.postsSortOrder === option.value
                    ? 'bg-primary text-primary-text'
                    : 'bg-bg hover:bg-bg-secondary text-text-muted hover:text-text'
                }`}
              >
                {option.label}
              </button>
            )}
          </For>
        </div>
      </div>
    )
  }

  // Posts component - reactive
  const PostsSection = () => {
    const posts = () => data()?.posts || []

    return (
      <div>
        <PostsSortBar />
        <Show when={posts().length > 0} fallback={
          <div class="text-center py-8 bg-bg-card rounded-xl border border-border">
            <p class="text-text-muted">No posts found</p>
          </div>
        }>
          <Show when={settings.postsLayout === 'list'}>
            <div class="flex flex-col" style={`gap: ${settings.cardGapPx || 24}px;`}>
              <For each={posts()}>
                {(post, index) => <PostCard post={post} forceVertical={false} index={index()} />}
              </For>
            </div>
          </Show>
          <Show when={settings.postsLayout === 'masonry'}>
            <div style={`column-count: ${settings.gridColumns || 2}; column-gap: ${settings.cardGapPx || 24}px;`}>
              <For each={posts()}>
                {(post, index) => (
                  <div class="break-inside-avoid" style={`margin-bottom: ${settings.cardGapPx || 24}px;`}>
                    <PostCard post={post} forceVertical={true} index={index()} />
                  </div>
                )}
              </For>
            </div>
          </Show>
          <Show when={settings.postsLayout === 'grid'}>
            <div style={`display: grid; grid-template-columns: repeat(${settings.gridColumns || 2}, 1fr); gap: ${settings.cardGapPx || 24}px;`}>
              <For each={posts()}>
                {(post, index) => <PostCard post={post} forceVertical={true} index={index()} />}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    )
  }

  // Shadow map for hover effects
  const shadowMap: Record<string, string> = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  }

  // Get initial scroll animation style based on type
  const getInitialScrollStyle = (type: string): Record<string, string> => {
    const base: Record<string, string> = { opacity: '0' }
    switch (type) {
      case 'fade':
        return base
      case 'slide-up':
        return { ...base, transform: 'translateY(20px)' }
      case 'slide-left':
        return { ...base, transform: 'translateX(-20px)' }
      case 'zoom':
        return { ...base, transform: 'scale(0.9)' }
      case 'flip':
        return { ...base, transform: 'perspective(600px) rotateX(-10deg)' }
      default:
        return {}
    }
  }

  // Get visible scroll animation style
  const getVisibleScrollStyle = (): Record<string, string> => {
    return { opacity: '1', transform: 'none' }
  }

  // Single post card component - reactive with hover and scroll animations
  const PostCard = (props: { post: HivePost; forceVertical: boolean; index: number }) => {
    const thumbnail = () => getPostThumbnail(props.post)
    const tags = () => getPostTags(props.post)
    const isVertical = () => props.forceVertical || settings.cardLayout === 'vertical' || settings.postsLayout !== 'list'

    // Hover state
    const [isHovered, setIsHovered] = createSignal(false)
    // Scroll animation visibility state
    const [isVisible, setIsVisible] = createSignal(false)

    // Trigger scroll animation on mount with staggered delay
    onMount(() => {
      if (settings.scrollAnimationType !== 'none' && settings.scrollAnimationEnabled) {
        const delay = props.index * (settings.scrollAnimationDelay || 100)
        setTimeout(() => setIsVisible(true), delay)
      } else {
        setIsVisible(true)
      }
    })

    // Compute card styles with hover and scroll animations
    const cardStyle = createMemo(() => {
      const effect = settings.cardHoverEffect || 'none'
      const hoverDuration = settings.cardTransitionDuration || 200
      const scrollDuration = settings.scrollAnimationDuration || 400
      const scrollType = settings.scrollAnimationType || 'none'
      const scale = settings.cardHoverScale || 1.02
      const shadow = settings.cardHoverShadow || 'lg'
      const brightness = settings.cardHoverBrightness || 1.05

      // Base styles
      const styles: Record<string, string> = {
        padding: `${settings.cardPaddingPx || 24}px`,
        'border-radius': `${settings.cardBorderRadiusPx || 16}px`,
        border: settings.cardBorder !== false ? '1px solid var(--color-border)' : '1px solid transparent',
        transition: `all ${scrollDuration}ms ease-out, box-shadow ${hoverDuration}ms ease-out, transform ${hoverDuration}ms ease-out, filter ${hoverDuration}ms ease-out`,
      }

      // Apply scroll animation initial state if not visible
      if (!isVisible() && scrollType !== 'none') {
        Object.assign(styles, getInitialScrollStyle(scrollType))
      } else if (isVisible()) {
        Object.assign(styles, getVisibleScrollStyle())
      }

      // Apply hover effects when hovered (override scroll transform)
      if (isHovered() && effect !== 'none') {
        if (effect === 'shadow') {
          styles['box-shadow'] = shadowMap[shadow] || shadowMap.md
        } else if (effect === 'scale') {
          styles.transform = `scale(${scale})`
        } else if (effect === 'lift') {
          styles.transform = `scale(${scale}) translateY(-4px)`
          styles['box-shadow'] = shadowMap[shadow] || shadowMap.lg
        } else if (effect === 'glow') {
          styles.filter = `brightness(${brightness})`
          styles['box-shadow'] = '0 0 20px var(--color-primary)'
        }
      }

      return styles
    })

    return (
      <article
        class="bg-bg-card rounded-xl overflow-hidden cursor-pointer"
        style={cardStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
              <Show when={settings.showPayout !== false && props.post.pending_payout_value}>
                <span class="text-success">{formatPayout(props.post.pending_payout_value!)}</span>
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

  // Navigation preview component - uses settings.navigationTabs
  const NavigationPreview = () => {
    const enabledTabs = createMemo(() => settings.navigationTabs?.filter(t => t.enabled) || [])
    const postsCount = () => data()?.posts?.length || 0
    const commentsCount = () => 128 // Placeholder

    // Check if tab has social integration configured
    const hasIntegration = (tabId: string) => {
      const tab = settings.navigationTabs?.find(t => t.id === tabId)
      return tab?.integration && (tab.integration.profileUrl || tab.integration.embedUrls?.length > 0)
    }

    // Get count for tab
    const getTabCount = (tab: typeof settings.navigationTabs[0]) => {
      if (!tab.showCount) return undefined
      if (tab.id === 'posts') return postsCount()
      if (tab.id === 'comments') return commentsCount()
      return undefined
    }

    return (
      <nav class="border-b border-border mb-6">
        <div class="flex flex-wrap">
          <For each={enabledTabs()}>
            {(tab) => {
              const isActive = () => activeTab() === tab.id
              const count = () => getTabCount(tab)

              return (
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  class={`
                    relative px-4 py-3 text-sm font-medium transition-colors
                    ${isActive() ? 'text-text' : 'text-text-muted hover:text-text'}
                  `}
                  title={tab.tooltip}
                >
                  <span class="flex items-center gap-2">
                    {tab.label}
                    {count() !== undefined && (
                      <span class={`
                        text-xs px-1.5 py-0.5 rounded-full
                        ${isActive() ? 'bg-primary/10 text-primary' : 'bg-bg text-text-muted'}
                      `}>
                        {count()}
                      </span>
                    )}
                    {tab.external && (
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    )}
                    {hasIntegration(tab.id) && (
                      <span class="w-2 h-2 rounded-full bg-success" title="Configured" />
                    )}
                  </span>
                  {isActive() && (
                    <span class="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                  )}
                </button>
              )
            }}
          </For>
        </div>
      </nav>
    )
  }

  // Section renderer - renders a section with proper orientation
  const SectionRenderer = (props: { section: PageLayoutSection; inSidebar?: boolean }) => {
    const isHorizontal = () => props.section.orientation === 'horizontal'

    return (
      <div
        class={isHorizontal() ? 'flex flex-wrap items-start gap-4' : 'flex flex-col gap-4'}
      >
        <For each={props.section.elements}>
          {(elementId) => (
            <div class={isHorizontal() ? 'flex-shrink-0' : 'w-full'}>
              <ElementRenderer elementId={elementId} inSidebar={props.inSidebar} />
            </div>
          )}
        </For>
      </div>
    )
  }

  // Comments placeholder section
  const CommentsSection = () => (
    <div class="space-y-4">
      <For each={[1, 2, 3, 4, 5]}>
        {(i) => (
          <div class="bg-bg-card rounded-xl p-4 border border-border">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-bg-secondary flex-shrink-0" />
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-text">@user{i}</span>
                  <span class="text-xs text-text-muted">2 hours ago</span>
                </div>
                <p class="text-sm text-text-muted">
                  This is a sample comment #{i}. In the real app, this would show actual comments from Hive blockchain.
                </p>
                <div class="flex gap-4 mt-2 text-xs text-text-muted">
                  <span>5 replies</span>
                  <span>12 votes</span>
                  <span class="text-success">$0.24</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </For>
    </div>
  )

  // Social media embed section - renders profile and post embeds
  const SocialEmbedSection = (props: { tabId: string }) => {
    const tab = createMemo(() => settings.navigationTabs?.find(t => t.id === props.tabId))
    const integration = createMemo(() => tab()?.integration)
    const platformInfo = createMemo(() => {
      const platforms: Record<string, { name: string; color: string; icon: string }> = {
        instagram: { name: 'Instagram', color: '#E4405F', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
        x: { name: 'X (Twitter)', color: '#000000', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
        youtube: { name: 'YouTube', color: '#FF0000', icon: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
        tiktok: { name: 'TikTok', color: '#000000', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
        threads: { name: 'Threads', color: '#000000', icon: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.858-.712 2.05-1.169 3.453-1.324 1.039-.114 2.107-.1 3.18.042.022-.652-.053-1.26-.223-1.799-.357-1.132-1.136-1.707-2.313-1.707h-.033c-.747.005-1.363.253-1.833.737l-1.455-1.408c.837-.864 1.96-1.328 3.252-1.346h.048c1.906 0 3.34.758 4.134 2.19.466.838.702 1.88.702 3.1v.092c1.37.821 2.327 1.918 2.745 3.266.567 1.833.392 4.282-1.679 6.312-1.838 1.8-4.17 2.619-7.345 2.644z' },
        facebook: { name: 'Facebook', color: '#1877F2', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
      }
      return platforms[props.tabId] || { name: props.tabId, color: '#666666', icon: '' }
    })

    // Extract username from profile URL
    const getUsername = (url: string): string => {
      try {
        const urlObj = new URL(url)
        const path = urlObj.pathname.replace(/^\/+|\/+$/g, '')
        // Remove @ if present
        return path.replace(/^@/, '').split('/')[0] || url
      } catch {
        return url
      }
    }

    return (
      <div class="space-y-6">
        {/* Profile card */}
        <Show when={integration()?.profileUrl}>
          <a
            href={integration()!.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="block bg-bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
          >
            <div class="p-6">
              <div class="flex items-center gap-4">
                <div
                  class="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${platformInfo().color}15` }}
                >
                  <svg class="w-8 h-8" style={{ color: platformInfo().color }} viewBox="0 0 24 24" fill="currentColor">
                    <path d={platformInfo().icon} />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-lg font-semibold text-text">@{getUsername(integration()!.profileUrl)}</p>
                  <p class="text-sm text-text-muted">{platformInfo().name}</p>
                </div>
                <div class="flex-shrink-0">
                  <span
                    class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white"
                    style={{ background: platformInfo().color }}
                  >
                    Otworz profil
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </a>
        </Show>

        {/* Embed cards */}
        <Show when={integration()?.embedUrls && integration()!.embedUrls.length > 0}>
          <div>
            <h3 class="text-sm font-medium text-text-muted mb-3 uppercase tracking-wide">
              Polecane posty ({integration()!.embedUrls.length})
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <For each={integration()!.embedUrls}>
                {(url, index) => (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block bg-bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all group"
                  >
                    {/* Thumbnail placeholder */}
                    <div
                      class="aspect-square flex items-center justify-center relative"
                      style={{ background: `linear-gradient(135deg, ${platformInfo().color}10, ${platformInfo().color}25)` }}
                    >
                      <div class="text-center">
                        <svg
                          class="w-12 h-12 mx-auto mb-2 opacity-50 group-hover:opacity-80 transition-opacity"
                          style={{ color: platformInfo().color }}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d={platformInfo().icon} />
                        </svg>
                        <p class="text-xs text-text-muted">Post #{index() + 1}</p>
                      </div>
                      {/* Play button overlay for video platforms */}
                      <Show when={['youtube', 'tiktok'].includes(props.tabId)}>
                        <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div class="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                            <svg class="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </Show>
                    </div>
                    {/* URL preview */}
                    <div class="p-3 border-t border-border">
                      <p class="text-xs text-text-muted truncate group-hover:text-primary transition-colors">
                        {url.replace(/^https?:\/\//, '').slice(0, 50)}...
                      </p>
                    </div>
                  </a>
                )}
              </For>
            </div>
          </div>
        </Show>

        {/* Info about real embeds */}
        <Show when={integration()?.profileUrl || (integration()?.embedUrls && integration()!.embedUrls.length > 0)}>
          <div class="flex items-start gap-2 p-3 bg-info/10 rounded-lg border border-info/20">
            <svg class="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm">
              <p class="font-medium text-info">Preview</p>
              <p class="text-text-muted mt-0.5">
                Na produkcji posty beda wyswietlane jako pelne embedy z {platformInfo().name}.
                Kliknij w kafelek aby otworzyc post.
              </p>
            </div>
          </div>
        </Show>

        {/* No content configured */}
        <Show when={!integration()?.profileUrl && (!integration()?.embedUrls || integration()!.embedUrls.length === 0)}>
          <div class="text-center py-12 bg-bg-card rounded-xl border border-border">
            <div
              class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: `${platformInfo().color}20` }}
            >
              <svg class="w-8 h-8" style={{ color: platformInfo().color }} viewBox="0 0 24 24" fill="currentColor">
                <path d={platformInfo().icon} />
              </svg>
            </div>
            <p class="text-text font-medium">{platformInfo().name} nie skonfigurowany</p>
            <p class="text-text-muted text-sm mt-1">
              Dodaj link do profilu lub posty do embedowania w ustawieniach Navigation Tabs.
            </p>
          </div>
        </Show>
      </div>
    )
  }

  // Main content section that switches based on active tab
  const MainContentSection = () => {
    const socialPlatforms = ['instagram', 'x', 'youtube', 'tiktok', 'threads', 'facebook']

    return (
      <>
        <Show when={activeTab() === 'posts'}>
          <PostsSection />
        </Show>
        <Show when={activeTab() === 'comments'}>
          <CommentsSection />
        </Show>
        <Show when={socialPlatforms.includes(activeTab())}>
          <SocialEmbedSection tabId={activeTab()} />
        </Show>
      </>
    )
  }

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
          <NavigationPreview />
          <MainContentSection />
        </Show>
        <Show when={props.elementId === 'footer'}>
          {renderFooter()}
        </Show>
        <Show when={props.elementId === 'navigation'}>
          <NavigationPreview />
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
              {/* Top slot - full width on all screens */}
              <For each={topSections()}>
                {(section) => (
                  <div class="mb-6">
                    <SectionRenderer section={section} />
                  </div>
                )}
              </For>

              {/* Main area with optional sidebars - responsive layout */}
              <Show when={hasLeftSidebar() || hasRightSidebar()}>
                {/* Uses sidebar-layout CSS class from global.css */}
                <div class="sidebar-layout">
                  {/* Left Sidebar */}
                  <Show when={hasLeftSidebar()}>
                    <aside
                      class="sidebar-left"
                      style={`--sidebar-width: ${settings.sidebarWidthPx || 280}px;`}
                    >
                      <For each={leftSidebarSections()}>
                        {(section) => (
                          <div class="mb-4">
                            <SectionRenderer section={section} inSidebar={true} />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Right Sidebar */}
                  <Show when={hasRightSidebar()}>
                    <aside
                      class="sidebar-right"
                      style={`--sidebar-width: ${settings.sidebarWidthPx || 280}px;`}
                    >
                      <For each={rightSidebarSections()}>
                        {(section) => (
                          <div class="mb-4">
                            <SectionRenderer section={section} inSidebar={true} />
                          </div>
                        )}
                      </For>
                    </aside>
                  </Show>

                  {/* Main Content */}
                  <main class="main-content">
                    <For each={mainSections()}>
                      {(section) => (
                        <div class="mb-6">
                          <SectionRenderer section={section} />
                        </div>
                      )}
                    </For>
                  </main>
                </div>
              </Show>

              {/* No sidebars - render main directly */}
              <Show when={!hasLeftSidebar() && !hasRightSidebar()}>
                <For each={mainSections()}>
                  {(section) => (
                    <div class="mb-6">
                      <SectionRenderer section={section} />
                    </div>
                  )}
                </For>
              </Show>

              {/* Bottom slot - full width on all screens */}
              <For each={bottomSections()}>
                {(section) => (
                  <div class="mt-6">
                    <SectionRenderer section={section} />
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
