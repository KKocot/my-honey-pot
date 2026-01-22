import { Show, For, createMemo, createSignal, onMount, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'
import { settings } from './store'
import { pageElementLabels, platformInfos, type PageSlotPosition, type PageLayoutSection, type CardSection, type CardSectionChild } from './types'
import {
  useHivePreviewQuery,
  formatCompactNumber,
  type HivePost,
} from './queries'
import { parseFormattedAsset } from '../../lib/blog-logic'
import { PlatformIcon } from './SocialLinksSettings'
// Shared components
import {
  createAuthorProfileData,
  createAuthorProfileSettings,
  renderAuthorProfileSections,
  renderSocialLinks,
} from '../../shared/components/author-profile'
import {
  createPostCardDataFromBridge,
  renderPostCardContent,
  getSimpleSummary,
  formatPayout,
} from '../../shared/components/post-card'
import {
  createCommentCardData,
  createCommentCardSettings,
  renderCommentCardContent,
} from '../../shared/components/comment-card'
import {
  isExternalUrl,
  getNavigationItemClasses,
  getExternalLinkIconSvg,
} from '../../shared/components/navigation'

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

  // Render author profile element using shared components
  const renderAuthorProfile = (_layout: 'horizontal' | 'vertical' = 'horizontal') => {
    const currentData = data()
    const profile = currentData?.profile
    const dbAccount = currentData?.dbAccount
    const globalProps = currentData?.globalProps
    if (!profile) return null

    // Create normalized data using shared utility
    const profileData = createAuthorProfileData(
      profile.name,
      profile,
      dbAccount ?? null,
      globalProps ?? null,
      null // manabars not available in preview
    )

    // Create settings using shared utility
    const profileSettings = createAuthorProfileSettings({
      authorProfileLayout2: settings.authorProfileLayout2,
      authorAvatarSizePx: settings.authorAvatarSizePx,
      authorCoverHeightPx: settings.authorCoverHeightPx,
      authorUsernameSizePx: settings.authorUsernameSizePx,
      authorDisplayNameSizePx: settings.authorDisplayNameSizePx,
      authorAboutSizePx: settings.authorAboutSizePx,
      authorStatsSizePx: settings.authorStatsSizePx,
      authorMetaSizePx: settings.authorMetaSizePx,
      socialLinks: settings.socialLinks,
    })

    // Render using shared functions
    const sectionsHtml = renderAuthorProfileSections(profileData, profileSettings)
    const socialLinksHtml = renderSocialLinks(profileSettings.socialLinks)

    return (
      <div class="bg-bg-card rounded-xl shadow-sm border border-border overflow-hidden p-4">
        <div class="space-y-2" innerHTML={sectionsHtml} />
        <Show when={socialLinksHtml}>
          <div innerHTML={socialLinksHtml} />
        </Show>
      </div>
    )
  }

  // Posts component - reactive
  const PostsSection = () => {
    const posts = () => data()?.posts || []

    return (
      <div>
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
  // Uses shared render functions for content, but adds SolidJS animations
  const PostCard = (props: { post: HivePost; forceVertical: boolean; index: number }) => {
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

    // Create normalized post data using shared utility
    const postData = createMemo(() => createPostCardDataFromBridge(props.post, {
      thumbnailSizePx: settings.thumbnailSizePx || 96,
      maxTags: settings.maxTags || 5,
    }))

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

    // Create settings for shared render function
    const cardSettings = createMemo(() => ({
      cardLayout: isVertical() ? 'vertical' as const : (settings.cardLayout || 'horizontal' as const),
      thumbnailPosition: settings.thumbnailPosition || 'left' as const,
      thumbnailSizePx: settings.thumbnailSizePx || 96,
      cardPaddingPx: settings.cardPaddingPx || 24,
      cardBorderRadiusPx: settings.cardBorderRadiusPx || 16,
      titleSizePx: settings.titleSizePx || 20,
      showThumbnail: settings.showThumbnail !== false,
      showSummary: settings.showSummary !== false,
      summaryMaxLength: settings.summaryMaxLength || 150,
      showDate: settings.showDate !== false,
      showVotes: settings.showVotes !== false,
      showComments: settings.showComments !== false,
      showPayout: settings.showPayout !== false,
      showTags: settings.showTags !== false,
      cardBorder: settings.cardBorder !== false,
      maxTags: settings.maxTags || 5,
      // Pass sections layout for drag & drop support
      postCardLayout: settings.postCardLayout,
    }))

    // Render content using shared function
    const contentHtml = createMemo(() => renderPostCardContent(postData(), cardSettings(), isVertical()))

    return (
      <article
        class="bg-bg-card rounded-xl overflow-hidden cursor-pointer"
        style={cardStyle()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        innerHTML={contentHtml()}
      />
    )
  }

  // Render footer element
  const renderFooter = () => (
    <footer class="text-center py-6 text-text-muted text-sm border-t border-border mt-6">
      <p>Powered by Hive Blockchain</p>
    </footer>
  )

  // Navigation preview component - uses settings.navigationTabs with shared utilities
  // Note: Count badges are disabled - navigation shows only labels
  const NavigationPreview = () => {
    const enabledTabs = createMemo(() => settings.navigationTabs?.filter(t => t.enabled) || [])

    return (
      <nav class="border-b border-border mb-6">
        <div class="flex flex-wrap">
          <For each={enabledTabs()}>
            {(tab) => {
              const isActive = () => activeTab() === tab.id

              return (
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  class={getNavigationItemClasses(isActive())}
                  title={tab.tooltip}
                >
                  <span class="flex items-center gap-2">
                    {tab.label}
                    {isExternalUrl(tab.href) && (
                      <span innerHTML={getExternalLinkIconSvg()} />
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

  // Comments section - displays user's comments from Hive
  const CommentsSection = () => {
    const comments = () => data()?.comments || []

    // Create comment settings from current settings
    const commentSettings = createMemo(() => createCommentCardSettings({
      commentShowAuthor: settings.commentShowAuthor,
      commentShowAvatar: settings.commentShowAvatar,
      commentAvatarSizePx: settings.commentAvatarSizePx,
      commentShowReplyContext: settings.commentShowReplyContext,
      commentShowTimestamp: settings.commentShowTimestamp,
      commentShowRepliesCount: settings.commentShowRepliesCount,
      commentShowVotes: settings.commentShowVotes,
      commentShowPayout: settings.commentShowPayout,
      commentShowViewLink: settings.commentShowViewLink,
      commentMaxLength: settings.commentMaxLength,
      commentPaddingPx: settings.commentPaddingPx,
    }))

    return (
      <div class="space-y-4">
        <Show when={comments().length > 0} fallback={
          <div class="text-center py-8 bg-bg-card rounded-xl border border-border">
            <p class="text-text-muted">No comments found</p>
          </div>
        }>
          <For each={comments()}>
            {(comment) => {
              // Create normalized comment data using shared utility
              const commentData = createCommentCardData(comment)
              // Render using shared function
              const contentHtml = renderCommentCardContent(commentData, commentSettings())

              return (
                <article
                  class="bg-bg-card rounded-xl border border-border"
                  innerHTML={contentHtml}
                />
              )
            }}
          </For>
        </Show>
      </div>
    )
  }

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

          {/* Error/No data state */}
          <Show when={settings.hiveUsername && !data() && !loading()}>
            <div class="flex items-center justify-center min-h-screen">
              <div class="text-center">
                <p class="text-text text-lg">Failed to load data for @{settings.hiveUsername}</p>
                <p class="text-text-muted mt-1">Check if the username exists or try again later</p>
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
