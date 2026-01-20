import { Show, For, createMemo, createSignal, onMount, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'
import { settings, updateSettings } from './store'
import { pageElementLabels, platformInfos, type PageSlotPosition, type PageLayoutSection } from './types'
import {
  useHivePreviewQuery,
  formatCompactNumber,
  calculateEffectiveHivePower,
  type HivePost,
} from './queries'
import { parseFormattedAsset } from '../../lib/blog-logic'
import { PlatformIcon } from './SocialLinksSettings'

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

        {/* Social Media Links */}
        <Show when={(settings.socialLinks || []).filter(l => l.url).length > 0}>
          <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border justify-center">
            <For each={(settings.socialLinks || []).filter(l => l.url)}>
              {(link) => {
                const info = platformInfos[link.platform]
                return (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: `${info.color}20` }}
                    title={info.name}
                  >
                    <PlatformIcon
                      platform={link.platform}
                      class="w-5 h-5"
                      style={{ color: info.color }}
                    />
                  </a>
                )
              }}
            </For>
          </div>
        </Show>
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

  // Threads placeholder section (Hive short posts)
  const ThreadsSection = () => (
    <div class="space-y-4">
      <div class="text-center py-12 bg-bg-card rounded-xl border border-border">
        <p class="text-text font-medium">Hive Threads</p>
        <p class="text-text-muted text-sm mt-1">
          Krotkie posty z Hive - wkrotce dostepne.
        </p>
      </div>
    </div>
  )

  // Main content section that switches based on active tab
  const MainContentSection = () => {
    return (
      <>
        <Show when={activeTab() === 'posts'}>
          <PostsSection />
        </Show>
        <Show when={activeTab() === 'comments'}>
          <CommentsSection />
        </Show>
        <Show when={activeTab() === 'threads'}>
          <ThreadsSection />
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
