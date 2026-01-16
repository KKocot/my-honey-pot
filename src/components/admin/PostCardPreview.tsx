import { For, Show, createMemo } from 'solid-js'
import { settings } from './store'
import type { CardSection, CardSectionChild } from './types'

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
    imageUrl: '/hive-logo.png',
    date: 'Jan 13, 2026',
    votes: 156,
    comments: 24,
    payout: '$12.45',
    tags: ['hive', 'blockchain', 'crypto', 'introduction', 'guide'],
  },
  {
    title: 'How to Earn on Hive?',
    summary: 'A complete guide to earning opportunities on the Hive platform - from content creation to curation and staking.',
    imageUrl: '/hive-logo.png',
    date: 'Jan 12, 2026',
    votes: 89,
    comments: 15,
    payout: '$8.32',
    tags: ['earnings', 'hive', 'tutorial'],
  },
  {
    title: 'News from the Hive Ecosystem',
    summary: 'An overview of the latest apps and projects being built on the Hive blockchain. See what new developments are emerging in the community.',
    imageUrl: '/hive-logo.png',
    date: 'Jan 11, 2026',
    votes: 234,
    comments: 42,
    payout: '$25.10',
    tags: ['hive', 'dapps', 'news', 'community'],
  },
  {
    title: 'Comparing Hive with Other Blockchains',
    summary: 'A technical analysis comparing Hive with Ethereum, Solana and other popular platforms. Check the differences in performance.',
    imageUrl: '/hive-logo.png',
    date: 'Jan 10, 2026',
    votes: 178,
    comments: 31,
    payout: '$18.75',
    tags: ['hive', 'ethereum', 'comparison', 'tech'],
  },
]

// ============================================
// Single Post Card Component
// Uses postCardLayout sections for rendering
// ============================================

interface PostCardProps {
  post: SamplePost
}

export function PostCard(props: PostCardProps) {
  // Reactive values
  const sections = createMemo(() => settings.postCardLayout.sections)
  const thumbnailSize = createMemo(() => settings.thumbnailSizePx)
  const titleSize = createMemo(() => settings.titleSizePx)
  const padding = createMemo(() => settings.cardPaddingPx)
  const borderRadius = createMemo(() => settings.cardBorderRadiusPx)
  const maxTags = createMemo(() => settings.maxTags)
  const summaryMaxLen = createMemo(() => settings.summaryMaxLength)

  const truncatedSummary = createMemo(() => {
    const text = props.post.summary
    const maxLen = summaryMaxLen()
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  })

  // Element renderer component
  const ElementRenderer = (elProps: { id: string }) => {
    switch (elProps.id) {
      case 'thumbnail':
        return (
          <img
            src={props.post.imageUrl}
            alt=""
            class="rounded-lg object-cover flex-shrink-0"
            style={{
              width: `${thumbnailSize()}px`,
              height: `${thumbnailSize()}px`,
            }}
            onError={(e) => { e.currentTarget.src = '/hive-logo.png' }}
          />
        )

      case 'title':
        return (
          <h2 class="font-semibold text-text line-clamp-2" style={{ 'font-size': `${titleSize()}px` }}>
            {props.post.title}
          </h2>
        )

      case 'summary':
        return <p class="text-text-muted text-sm line-clamp-3">{truncatedSummary()}</p>

      case 'date':
        return <span class="text-xs text-text-muted">{props.post.date}</span>

      case 'votes':
        return (
          <span class="flex items-center gap-1 text-xs text-text-muted">
            <VoteIcon /> {props.post.votes}
          </span>
        )

      case 'comments':
        return (
          <span class="flex items-center gap-1 text-xs text-text-muted">
            <CommentIcon /> {props.post.comments}
          </span>
        )

      case 'payout':
        return <span class="text-xs text-success font-medium">{props.post.payout}</span>

      case 'tags':
        return (
          <div class="flex flex-wrap gap-1">
            <For each={props.post.tags.slice(0, maxTags())}>
              {(tag) => (
                <span class="px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded">
                  #{tag}
                </span>
              )}
            </For>
          </div>
        )

      default:
        return null
    }
  }

  // Child renderer component (element or nested section)
  const ChildRenderer = (childProps: { child: CardSectionChild }) => {
    return (
      <Show when={childProps.child.type === 'element'} fallback={
        <Show when={childProps.child.type === 'section'}>
          <SectionRenderer section={(childProps.child as { type: 'section'; section: CardSection }).section} />
        </Show>
      }>
        <ElementRenderer id={(childProps.child as { type: 'element'; id: string }).id} />
      </Show>
    )
  }

  // Section renderer component (recursive)
  const SectionRenderer = (secProps: { section: CardSection }) => {
    return (
      <Show when={secProps.section.children && secProps.section.children.length > 0}>
        <div
          class={secProps.section.orientation === 'horizontal' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-1'}
        >
          <For each={secProps.section.children}>
            {(child) => <ChildRenderer child={child} />}
          </For>
        </div>
      </Show>
    )
  }

  return (
    <article
      class="bg-bg-card shadow-sm transition-all duration-200 overflow-hidden"
      style={{
        padding: `${padding()}px`,
        'border-radius': `${borderRadius()}px`,
        border: settings.cardBorder ? '1px solid var(--color-border)' : 'none',
      }}
    >
      <div class="flex flex-col gap-3">
        <For each={sections()}>
          {(section) => <SectionRenderer section={section} />}
        </For>
      </div>
    </article>
  )
}

// ============================================
// Full Layout Preview (multiple cards) - Scaled
// ============================================

interface LayoutPreviewProps {
  postCount?: number
  maxHeight?: string
}

export function LayoutPreview(props: LayoutPreviewProps) {
  const count = createMemo(() => props.postCount ?? 4)
  const scale = 0.6 // Scale factor for preview

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

  const visiblePosts = createMemo(() => samplePosts.slice(0, count()))

  return (
    <div
      class="overflow-hidden bg-bg rounded-lg border border-border"
      style={{ 'max-height': props.maxHeight ?? '500px' }}
    >
      <div class="p-3">
        <p class="text-xs text-text-muted mb-2 uppercase tracking-wide">
          Preview ({layoutLabel()}) - scaled {Math.round(scale * 100)}%
        </p>
        <div
          class="overflow-auto"
          style={{ 'max-height': `calc(${props.maxHeight ?? '500px'} - 40px)` }}
        >
          <div
            style={{
              width: `${100 / scale}%`,
              transform: `scale(${scale})`,
              'transform-origin': 'top left',
            }}
          >
            <div style={containerStyle()}>
              <For each={visiblePosts()}>
                {(post) => (
                  <div style={masonryItemStyle()}>
                    <PostCard post={post} />
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Responsive Preview Container
// Shows how it will look on different screen sizes
// ============================================

interface ViewportConfig {
  name: string
  width: number
  scale: number
}

const viewports: ViewportConfig[] = [
  { name: 'Desktop', width: 1200, scale: 0.35 },
  { name: 'Tablet', width: 768, scale: 0.45 },
  { name: 'Mobile', width: 375, scale: 0.55 },
]

export function ResponsivePreview() {
  return (
    <div class="space-y-4">
      <p class="text-xs text-text-muted uppercase tracking-wide">Responsive Preview</p>

      <div class="flex gap-4 justify-center flex-wrap">
        <For each={viewports}>
          {(viewport) => (
            <div class="flex flex-col items-center">
              <span class="text-xs text-text-muted mb-2 px-2 py-1 bg-bg-secondary rounded">
                {viewport.name} ({viewport.width}px)
              </span>
              <div
                class="bg-bg rounded-lg border border-border overflow-hidden"
                style={{
                  width: `${viewport.width * viewport.scale}px`,
                  height: `${400 * viewport.scale}px`,
                }}
              >
                <div
                  style={{
                    width: `${viewport.width}px`,
                    transform: `scale(${viewport.scale})`,
                    'transform-origin': 'top left',
                    overflow: 'hidden',
                  }}
                >
                  <div class="p-4">
                    <LayoutPreview postCount={viewport.name === 'Mobile' ? 2 : 4} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
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
