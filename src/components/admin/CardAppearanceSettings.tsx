import { Show, For, createMemo } from 'solid-js'
import { settings, updateSettings } from './store'
import { Select, Slider } from '../ui'
import { cardLayoutOptions, thumbnailPositionOptions, postCardElementLabels, collectAllElementIds, type CardLayout, type CardSection, type CardSectionChild } from './types'
import { CardLayoutEditor } from './CardLayoutEditor'

// All available post card element IDs
const POST_CARD_ELEMENT_IDS = ['thumbnail', 'title', 'summary', 'date', 'votes', 'comments', 'payout', 'tags']

// Extended labels for individual elements
const extendedPostCardElementLabels: Record<string, string> = {
  ...postCardElementLabels,
  date: 'Date',
  votes: 'Votes',
  comments: 'Comments',
  payout: 'Payout',
}

// ============================================
// Card Appearance Settings Section
// ============================================

export function CardAppearanceSettings() {
  const handleLayoutUpdate = (layout: CardLayout) => {
    updateSettings({ postCardLayout: layout })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Post Card Appearance</h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="space-y-6">
          <CardLayoutSection />

          {/* Card Layout Editor - Drag & Drop */}
          <div class="border-t border-border pt-4">
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-3">
              Card Elements Layout
            </h3>
            <p class="text-xs text-text-muted mb-4">
              Drag elements between sections. Each section can be horizontal or vertical.
            </p>
            <CardLayoutEditor
              layout={settings.postCardLayout}
              elementLabels={extendedPostCardElementLabels}
              allElementIds={POST_CARD_ELEMENT_IDS}
              onUpdate={handleLayoutUpdate}
            />
          </div>

          {/* Additional Settings for enabled elements */}
          <AdditionalSettings />
        </div>

        {/* Live Preview */}
        <PostCardPreview />
      </div>
    </div>
  )
}

// ============================================
// Card Layout Section
// ============================================

function CardLayoutSection() {
  return (
    <div class="space-y-4">
      <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide">Card Settings</h3>

      <div class="grid grid-cols-2 gap-4">
        <Select
          label="Orientation (list)"
          options={cardLayoutOptions}
          value={settings.cardLayout}
          onChange={(e) => updateSettings({ cardLayout: e.currentTarget.value as 'horizontal' | 'vertical' })}
        />

        <Show when={settings.cardLayout === 'horizontal' && settings.postsLayout === 'list'}>
          <Select
            label="Thumbnail position"
            options={thumbnailPositionOptions}
            value={settings.thumbnailPosition}
            onChange={(e) => updateSettings({ thumbnailPosition: e.currentTarget.value as 'left' | 'right' })}
          />
        </Show>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <Slider
          label="Thumbnail:"
          unit="px"
          min={32}
          max={400}
          value={settings.thumbnailSizePx}
          onInput={(e) => updateSettings({ thumbnailSizePx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Padding:"
          unit="px"
          min={0}
          max={64}
          value={settings.cardPaddingPx}
          onInput={(e) => updateSettings({ cardPaddingPx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Border radius:"
          unit="px"
          min={0}
          max={48}
          value={settings.cardBorderRadiusPx}
          onInput={(e) => updateSettings({ cardBorderRadiusPx: parseInt(e.currentTarget.value) })}
        />

        <Slider
          label="Title:"
          unit="px"
          min={12}
          max={48}
          value={settings.titleSizePx}
          onInput={(e) => updateSettings({ titleSizePx: parseInt(e.currentTarget.value) })}
        />
      </div>
    </div>
  )
}

// ============================================
// Additional Settings (based on enabled elements)
// ============================================

function AdditionalSettings() {
  // Check if element is in any section (recursively)
  const isElementUsed = (id: string) => {
    return collectAllElementIds(settings.postCardLayout).includes(id)
  }

  return (
    <div class="space-y-4">
      <Show when={isElementUsed('summary')}>
        <Slider
          label="Summary length:"
          unit=" chars"
          min={50}
          max={500}
          value={settings.summaryMaxLength}
          onInput={(e) => updateSettings({ summaryMaxLength: parseInt(e.currentTarget.value) })}
        />
      </Show>

      <Show when={isElementUsed('tags')}>
        <Slider
          label="Max tags:"
          min={1}
          max={10}
          value={settings.maxTags}
          onInput={(e) => updateSettings({ maxTags: parseInt(e.currentTarget.value) })}
        />
      </Show>
    </div>
  )
}

// ============================================
// Live Preview Component
// ============================================

function PostCardPreview() {
  const mockPost = {
    title: 'Introduction to Hive Blockchain',
    summary: 'Hive is a decentralized social media platform built on blockchain technology. In this article you will learn how it works.',
    imageUrl: '/hive-logo.png',
    date: 'Jan 13, 2026',
    votes: 156,
    comments: 24,
    payout: '$12.45',
    tags: ['hive', 'blockchain', 'crypto', 'guide'],
  }

  const truncatedSummary = createMemo(() => {
    const text = mockPost.summary
    const maxLen = settings.summaryMaxLength
    return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
  })

  // Check if element is in any section (recursively)
  const isElementUsed = (id: string) => {
    return collectAllElementIds(settings.postCardLayout).includes(id)
  }

  // Render element by ID
  const renderElement = (id: string) => {
    switch (id) {
      case 'thumbnail':
        return (
          <img
            src={mockPost.imageUrl}
            alt=""
            class="rounded-lg object-cover flex-shrink-0"
            style={{
              width: `${settings.thumbnailSizePx}px`,
              height: `${settings.thumbnailSizePx}px`,
            }}
          />
        )

      case 'title':
        return (
          <h2 class="font-semibold text-text line-clamp-2" style={{ 'font-size': `${settings.titleSizePx}px` }}>
            {mockPost.title}
          </h2>
        )

      case 'summary':
        return <p class="text-text-muted text-sm line-clamp-3">{truncatedSummary()}</p>

      case 'date':
        return <span class="text-xs text-text-muted">{mockPost.date}</span>

      case 'votes':
        return (
          <span class="flex items-center gap-1 text-xs text-text-muted">
            <VoteIcon /> {mockPost.votes}
          </span>
        )

      case 'comments':
        return (
          <span class="flex items-center gap-1 text-xs text-text-muted">
            <CommentIcon /> {mockPost.comments}
          </span>
        )

      case 'payout':
        return <span class="text-xs text-success font-medium">{mockPost.payout}</span>

      case 'tags':
        return (
          <div class="flex flex-wrap gap-1">
            <For each={mockPost.tags.slice(0, settings.maxTags)}>
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

  // Render a child (element or nested section)
  const renderChild = (child: CardSectionChild): ReturnType<typeof renderElement> => {
    if (child.type === 'element') {
      return renderElement(child.id)
    } else {
      // Nested section - recursive render
      return renderSection(child.section)
    }
  }

  // Render a section with its orientation (recursive)
  const renderSection = (section: CardSection): ReturnType<typeof renderElement> => {
    if (!section.children || section.children.length === 0) return null

    return (
      <div
        class={`
          ${section.orientation === 'horizontal' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-1'}
        `}
      >
        <For each={section.children}>{(child) => renderChild(child)}</For>
      </div>
    )
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div
        class="bg-bg-card rounded-xl border border-border overflow-hidden"
        style={{
          padding: `${settings.cardPaddingPx}px`,
          'border-radius': `${settings.cardBorderRadiusPx}px`,
        }}
      >
        <div class="flex flex-col gap-3">
          <For each={settings.postCardLayout.sections}>
            {(section) => renderSection(section)}
          </For>
        </div>
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
