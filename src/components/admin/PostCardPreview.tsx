import { For, Show } from 'solid-js'
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
    title: 'Wprowadzenie do blockchain Hive',
    summary: 'Hive to zdecentralizowana platforma społecznościowa oparta na technologii blockchain. W tym artykule dowiesz się jak działa i jakie ma zalety.',
    imageUrl: 'https://images.hive.blog/u/gtg/avatar',
    date: '13 sty 2026',
    votes: 156,
    comments: 24,
    payout: '$12.45',
    tags: ['hive', 'blockchain', 'crypto', 'wprowadzenie', 'poradnik'],
  },
  {
    title: 'Jak zarabiać na Hive?',
    summary: 'Kompletny przewodnik po możliwościach zarobku na platformie Hive - od publikowania treści po kuratorstwo i staking.',
    imageUrl: 'https://images.hive.blog/u/blocktrades/avatar',
    date: '12 sty 2026',
    votes: 89,
    comments: 15,
    payout: '$8.32',
    tags: ['zarobek', 'hive', 'tutorial'],
  },
  {
    title: 'Nowości w ekosystemie Hive',
    summary: 'Przegląd najnowszych aplikacji i projektów budowanych na blockchainie Hive. Zobacz co nowego pojawia się w społeczności.',
    imageUrl: 'https://images.hive.blog/u/hiveio/avatar',
    date: '11 sty 2026',
    votes: 234,
    comments: 42,
    payout: '$25.10',
    tags: ['hive', 'dapps', 'news', 'community'],
  },
  {
    title: 'Porównanie Hive z innymi blockchainami',
    summary: 'Analiza techniczna porównująca Hive z Ethereum, Solana i innymi popularnymi platformami. Sprawdź różnice w wydajności.',
    imageUrl: 'https://images.hive.blog/u/therealwolf/avatar',
    date: '10 sty 2026',
    votes: 178,
    comments: 31,
    payout: '$18.75',
    tags: ['hive', 'ethereum', 'porównanie', 'tech'],
  },
]

// ============================================
// Single Post Card Component
// ============================================

interface PostCardProps {
  post: SamplePost
  compact?: boolean
}

export function PostCard(props: PostCardProps) {
  const truncatedSummary = () => {
    const text = props.post.summary
    const maxLen = settings.summaryMaxLength
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  }

  const cardStyle = () => {
    const border = settings.cardBorder ? 'border: 1px solid var(--color-border);' : ''
    return `padding: ${settings.cardPaddingPx}px; border-radius: ${settings.cardBorderRadiusPx}px; ${border}`
  }

  const flexDirection = () => {
    if (settings.cardLayout === 'vertical') return 'flex-col'
    return settings.thumbnailPosition === 'right' ? 'flex-row-reverse' : 'flex-row'
  }

  // For grid/masonry, force vertical layout
  const effectiveFlexDirection = () => {
    if (settings.postsLayout !== 'list') return 'flex-col'
    return flexDirection()
  }

  // Adjust thumbnail size for grid/masonry
  const thumbnailStyle = () => {
    const baseSize = settings.thumbnailSizePx

    if (settings.postsLayout !== 'list' || settings.cardLayout === 'vertical') {
      // Full width thumbnail for grid/masonry or vertical layout
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
  }

  return (
    <article
      class="bg-bg-card shadow-sm transition-all duration-300 overflow-hidden"
      style={cardStyle()}
    >
      <div class={`flex ${effectiveFlexDirection()} gap-3`}>
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
            style={{ 'font-size': `${props.compact ? Math.max(14, settings.titleSizePx - 4) : settings.titleSizePx}px` }}
          >
            <span class="text-text hover:text-primary transition-colors cursor-pointer">
              {props.post.title}
            </span>
          </h2>

          <Show when={settings.showSummary && !props.compact}>
            <p class="text-text-muted text-sm mb-3 line-clamp-3">{truncatedSummary()}</p>
          </Show>

          <Show when={settings.showDate || settings.showVotes || settings.showComments || settings.showPayout}>
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
              <For each={props.post.tags.slice(0, settings.maxTags)}>
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
// Full Layout Preview (multiple cards)
// ============================================

interface LayoutPreviewProps {
  postCount?: number
  maxHeight?: string
}

export function LayoutPreview(props: LayoutPreviewProps) {
  const count = () => props.postCount ?? 4

  const getContainerStyle = () => {
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
  }

  const getMasonryItemStyle = () => {
    if (settings.postsLayout === 'masonry') {
      return `margin-bottom: ${settings.cardGapPx}px; break-inside: avoid;`
    }
    return ''
  }

  return (
    <div
      class="overflow-auto bg-bg rounded-lg border border-border"
      style={{ 'max-height': props.maxHeight ?? '500px' }}
    >
      <div class="p-4">
        <p class="text-xs text-text-muted mb-3 uppercase tracking-wide sticky top-0 bg-bg pb-2">
          Podgląd ({settings.postsLayout === 'list' ? 'lista' : settings.postsLayout === 'grid' ? `grid ${settings.gridColumns} kol.` : `masonry ${settings.gridColumns} kol.`})
        </p>
        <div style={getContainerStyle()}>
          <For each={samplePosts.slice(0, count())}>
            {(post) => (
              <div style={getMasonryItemStyle()}>
                <PostCard post={post} compact={settings.postsLayout !== 'list'} />
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
        <p class="text-xs text-text-muted uppercase tracking-wide">Podgląd responsywny</p>
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
        Przewiń w poziomie aby zobaczyć pełny podgląd
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
