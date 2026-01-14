import { For, Show, createMemo } from 'solid-js'
import { settings } from './store'

// ============================================
// Sample post data for preview
// ============================================

export interface SamplePost {
  title: string
  summary: string
  imageUrl: string
  date: string
  votes: number
  comments: number
  payout: string
  tags: string[]
}

export const samplePosts: SamplePost[] = [
  {
    title: 'Introduction to Hive Blockchain',
    summary: 'Hive is a decentralized social media platform built on blockchain technology. In this article you will learn how it works and what its advantages are.',
    imageUrl: 'https://images.hive.blog/u/gtg/avatar',
    date: 'Jan 13, 2026',
    votes: 156,
    comments: 24,
    payout: '$12.45',
    tags: ['hive', 'blockchain', 'crypto', 'introduction', 'guide'],
  },
  {
    title: 'How to Earn on Hive?',
    summary: 'A complete guide to earning opportunities on the Hive platform - from content creation to curation and staking.',
    imageUrl: 'https://images.hive.blog/u/blocktrades/avatar',
    date: 'Jan 12, 2026',
    votes: 89,
    comments: 15,
    payout: '$8.32',
    tags: ['earnings', 'hive', 'tutorial'],
  },
  {
    title: 'News from the Hive Ecosystem',
    summary: 'An overview of the latest apps and projects being built on the Hive blockchain. See what new developments are emerging in the community.',
    imageUrl: 'https://images.hive.blog/u/hiveio/avatar',
    date: 'Jan 11, 2026',
    votes: 234,
    comments: 42,
    payout: '$25.10',
    tags: ['hive', 'dapps', 'news', 'community'],
  },
  {
    title: 'Comparing Hive with Other Blockchains',
    summary: 'A technical analysis comparing Hive with Ethereum, Solana and other popular platforms. Check the differences in performance.',
    imageUrl: 'https://images.hive.blog/u/therealwolf/avatar',
    date: 'Jan 10, 2026',
    votes: 178,
    comments: 31,
    payout: '$18.75',
    tags: ['hive', 'ethereum', 'comparison', 'tech'],
  },
]

// ============================================
// Single Post Card Component
// ============================================

interface PostCardProps {
  post: SamplePost
  compact?: boolean
  /** Force list mode layout (ignores postsLayout setting) */
  forceListMode?: boolean
}

export function PostCard(props: PostCardProps) {
  // All computed values as memos for reactivity
  const truncatedSummary = createMemo(() => {
    const text = props.post.summary
    const maxLen = settings.summaryMaxLength
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  })

  const cardStyle = createMemo(() => {
    const border = settings.cardBorder ? 'border: 1px solid var(--color-border);' : ''
    return `padding: ${settings.cardPaddingPx}px; border-radius: ${settings.cardBorderRadiusPx}px; ${border}`
  })

  const isVerticalLayout = createMemo(() => {
    // When forceListMode is true, always use cardLayout setting (for card appearance preview)
    if (props.forceListMode) {
      return settings.cardLayout === 'vertical'
    }
    // Force vertical for grid/masonry, otherwise respect cardLayout setting
    if (settings.postsLayout !== 'list') return true
    return settings.cardLayout === 'vertical'
  })

  const flexDirectionClass = createMemo(() => {
    if (isVerticalLayout()) return 'flex-col'
    return settings.thumbnailPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
  })

  const thumbnailStyle = createMemo(() => {
    const baseSize = settings.thumbnailSizePx

    if (isVerticalLayout()) {
      // Full width thumbnail for vertical layout
      return {
        width: '100%',
        height: `${Math.min(baseSize, 200)}px`,
        'object-fit': 'cover' as const,
        'border-radius': '8px',
        'flex-shrink': '0',
      }
    }

    // Square thumbnail for horizontal list
    return {
      width: `${baseSize}px`,
      height: `${baseSize}px`,
      'object-fit': 'cover' as const,
      'border-radius': '8px',
      'flex-shrink': '0',
    }
  })

  const titleSize = createMemo(() => {
    return props.compact ? Math.max(14, settings.titleSizePx - 4) : settings.titleSizePx
  })

  const visibleTags = createMemo(() => {
    return props.post.tags.slice(0, settings.maxTags)
  })

  const showMeta = createMemo(() => {
    return settings.showDate || settings.showVotes || settings.showComments || settings.showPayout
  })

  return (
    <article
      class="bg-bg-card shadow-sm transition-all duration-200 overflow-hidden"
      style={cardStyle()}
    >
      <div class={`flex gap-3 ${flexDirectionClass()}`}>
        <Show when={settings.showThumbnail}>
          <img
            src={props.post.imageUrl}
            alt=""
            style={thumbnailStyle()}
            onError={(e) => { e.currentTarget.src = '/hive-logo.png' }}
          />
        </Show>
        <div class="flex-1 min-w-0">
          <h2
            class="font-semibold mb-2 line-clamp-2"
            style={{ 'font-size': `${titleSize()}px` }}
          >
            <span class="text-text hover:text-primary transition-colors cursor-pointer">
              {props.post.title}
            </span>
          </h2>

          <Show when={settings.showSummary && !props.compact}>
            <p class="text-text-muted text-sm mb-3 line-clamp-3">{truncatedSummary()}</p>
          </Show>

          <Show when={showMeta()}>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted mb-2">
              <Show when={settings.showDate}>
                <span>{props.post.date}</span>
              </Show>
              <Show when={settings.showVotes}>
                <span class="flex items-center gap-1">
                  <VoteIcon />
                  {props.post.votes}
                </span>
              </Show>
              <Show when={settings.showComments}>
                <span class="flex items-center gap-1">
                  <CommentIcon />
                  {props.post.comments}
                </span>
              </Show>
              <Show when={settings.showPayout}>
                <span class="text-success font-medium">{props.post.payout}</span>
              </Show>
            </div>
          </Show>

          <Show when={settings.showTags && !props.compact}>
            <div class="flex flex-wrap gap-1">
              <For each={visibleTags()}>
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

// ============================================
// Single Card Preview (for card appearance settings)
// Shows card in list mode to demonstrate orientation changes
// ============================================

interface SingleCardPreviewProps {
  maxHeight?: string
}

export function SingleCardPreview(props: SingleCardPreviewProps) {
  const post = samplePosts[0]

  return (
    <div
      class="overflow-auto bg-bg rounded-lg border border-border"
      style={{ 'max-height': props.maxHeight ?? '400px' }}
    >
      <div class="p-4">
        <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">
          Card Preview (list mode)
        </p>
        <PostCard post={post} compact={false} forceListMode={true} />
      </div>
    </div>
  )
}

// ============================================
// Full Layout Preview (multiple cards)
// ============================================

interface LayoutPreviewProps {
  postCount?: number
  maxHeight?: string
}

export function LayoutPreview(props: LayoutPreviewProps) {
  const count = createMemo(() => props.postCount ?? 4)

  const containerStyle = createMemo(() => {
    const gap = settings.cardGapPx
    const columns = settings.gridColumns

    if (settings.postsLayout === 'list') {
      return `display: flex; flex-direction: column; gap: ${gap}px;`
    }
    if (settings.postsLayout === 'grid') {
      return `display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px;`
    }
    // Masonry
    return `column-count: ${columns}; column-gap: ${gap}px;`
  })

  const masonryItemStyle = createMemo(() => {
    if (settings.postsLayout === 'masonry') {
      return `margin-bottom: ${settings.cardGapPx}px; break-inside: avoid;`
    }
    return ''
  })

  const layoutLabel = createMemo(() => {
    if (settings.postsLayout === 'list') return 'list'
    if (settings.postsLayout === 'grid') return `grid ${settings.gridColumns} col.`
    return `masonry ${settings.gridColumns} col.`
  })

  const isCompact = createMemo(() => settings.postsLayout !== 'list')

  const visiblePosts = createMemo(() => samplePosts.slice(0, count()))

  return (
    <div
      class="overflow-auto bg-bg rounded-lg border border-border"
      style={{ 'max-height': props.maxHeight ?? '500px' }}
    >
      <div class="p-4">
        <p class="text-xs text-text-muted mb-3 uppercase tracking-wide sticky top-0 bg-bg pb-2 z-10">
          Preview ({layoutLabel()})
        </p>
        <div style={containerStyle()}>
          <For each={visiblePosts()}>
            {(post) => (
              <div style={masonryItemStyle()}>
                <PostCard post={post} compact={isCompact()} />
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Responsive Preview Container
// Shows how it will look on different screen sizes
// ============================================

export function ResponsivePreview() {
  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs text-text-muted uppercase tracking-wide">Responsive Preview</p>
        <div class="flex gap-2 text-xs text-text-muted">
          <span class="px-2 py-1 bg-bg-secondary rounded">Desktop</span>
        </div>
      </div>

      <div
        class="overflow-auto bg-bg rounded-lg border border-border"
        style={{ 'max-height': '400px' }}
      >
        <div class="p-4 min-w-[600px]">
          <LayoutPreview postCount={4} />
        </div>
      </div>

      <p class="text-xs text-text-muted text-center">
        Scroll horizontally to see full preview
      </p>
    </div>
  )
}

// ============================================
// Icons
// ============================================

function VoteIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
