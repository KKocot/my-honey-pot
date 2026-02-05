// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show, createMemo, For } from 'solid-js'
import { settings, updateSettings } from '../store'
import { Slider } from '../../ui'
import { commentCardElementLabels, type CardLayout, type CardSection, type CardSectionChild } from '../types/index'
import { CardLayoutEditor } from '../editors/CardLayoutEditor'

// All available comment card element IDs
const COMMENT_CARD_ELEMENT_IDS = ['replyContext', 'avatar', 'author', 'timestamp', 'body', 'replies', 'votes', 'payout', 'viewLink']

// Extended labels for individual elements
const extendedCommentCardElementLabels: Record<string, string> = {
  ...commentCardElementLabels,
  replies: 'Replies Count',
  votes: 'Votes',
  payout: 'Payout',
  viewLink: 'View Link',
}


// ============================================
// Comment Card Settings Section
// ============================================

export function CommentSettings() {
  const handleLayoutUpdate = (layout: CardLayout) => {
    updateSettings({ commentCardLayout: layout })
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Comments Tab Settings</h2>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-text mb-2">Comment Card Settings</h3>

          {/* Sliders */}
          <Slider
            label="Avatar size:"
            unit="px"
            min={24}
            max={64}
            value={settings.commentAvatarSizePx}
            onChange={(val) => updateSettings({ commentAvatarSizePx: val })}
          />

          <Slider
            label="Card padding:"
            unit="px"
            min={8}
            max={32}
            value={settings.commentPaddingPx}
            onChange={(val) => updateSettings({ commentPaddingPx: val })}
          />

          <Slider
            label="Max content length:"
            unit="chars"
            min={0}
            max={1000}
            step={50}
            value={settings.commentMaxLength}
            onChange={(val) => updateSettings({ commentMaxLength: val })}
          />
          <p class="text-xs text-text-muted -mt-2">0 = show full content (no limit)</p>

          {/* Card Layout Editor - Drag & Drop */}
          <div class="border-t border-border pt-4">
            <h4 class="text-sm font-medium text-text-muted mb-3">
              Card Elements Layout
            </h4>
            <p class="text-xs text-text-muted mb-4">
              Drag elements between sections. Each section can be horizontal or vertical.
            </p>
            <CardLayoutEditor
              layout={settings.commentCardLayout}
              elementLabels={extendedCommentCardElementLabels}
              allElementIds={COMMENT_CARD_ELEMENT_IDS}
              onUpdate={handleLayoutUpdate}
            />
          </div>
        </div>

        {/* Live Preview */}
        <CommentPreview />
      </div>
    </div>
  )
}

// ============================================
// Comment Card Preview Component
// ============================================

function CommentPreview() {
  const mockComment = {
    author: 'hiveuser',
    parentAuthor: 'blocktrades',
    body: 'This is a great post! I really appreciate the detailed explanation of the Hive blockchain architecture. Looking forward to more content like this.',
    timestamp: '2h',
    repliesCount: 12,
    votes: 45,
    payout: 2.34,
  }

  // Use createMemo to make layout reactive
  const sections = createMemo(() => settings.commentCardLayout.sections)
  const avatarSize = createMemo(() => settings.commentAvatarSizePx)
  const padding = createMemo(() => settings.commentPaddingPx)
  const maxLength = createMemo(() => settings.commentMaxLength)

  const truncatedBody = createMemo(() => {
    if (maxLength() === 0) return mockComment.body
    if (mockComment.body.length <= maxLength()) return mockComment.body
    return mockComment.body.slice(0, maxLength()) + '...'
  })

  // Element renderer component
  const ElementRenderer = (props: { id: string }) => {
    switch (props.id) {
      case 'replyContext':
        return (
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span>
              Replying to <span class="text-primary">@{mockComment.parentAuthor}</span>
            </span>
          </div>
        )

      case 'avatar':
        return (
          <div class="flex-shrink-0">
            <img
              src={`https://images.hive.blog/u/${mockComment.author}/avatar`}
              alt={mockComment.author}
              style={{
                width: `${avatarSize()}px`,
                height: `${avatarSize()}px`,
              }}
              class="rounded-full border border-border"
              onError={(e) => {
                e.currentTarget.src = '/hive-logo.png'
              }}
            />
          </div>
        )

      case 'author':
        return <span class="font-semibold text-text">{mockComment.author}</span>

      case 'timestamp':
        return <span class="text-text-muted text-sm">{mockComment.timestamp}</span>

      case 'body':
        return (
          <div class="text-text text-sm leading-relaxed">
            {truncatedBody()}
          </div>
        )

      case 'replies':
        return (
          <div class="flex items-center gap-1.5 text-sm text-text-muted">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{mockComment.repliesCount}</span>
          </div>
        )

      case 'votes':
        return (
          <div class="flex items-center gap-1.5 text-sm text-text-muted">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
            <span>{mockComment.votes}</span>
          </div>
        )

      case 'payout':
        return (
          <div class="flex items-center gap-1.5 text-sm text-text-muted">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${mockComment.payout.toFixed(2)}</span>
          </div>
        )

      case 'viewLink':
        return (
          <div class="flex items-center gap-1.5 text-sm text-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View</span>
          </div>
        )

      default:
        return null
    }
  }

  // Child renderer component (element or nested section)
  const ChildRenderer = (props: { child: CardSectionChild }) => {
    return (
      <Show when={props.child.type === 'element'} fallback={
        <Show when={props.child.type === 'section'}>
          <SectionRenderer section={(props.child as { type: 'section'; section: CardSection }).section} />
        </Show>
      }>
        <ElementRenderer id={(props.child as { type: 'element'; id: string }).id} />
      </Show>
    )
  }

  // Section renderer component (recursive)
  const SectionRenderer = (props: { section: CardSection }) => {
    return (
      <Show when={props.section.children && props.section.children.length > 0}>
        <div
          class={props.section.orientation === 'horizontal' ? 'flex flex-wrap items-center gap-2' : 'flex flex-col gap-1'}
        >
          <For each={props.section.children}>
            {(child) => <ChildRenderer child={child} />}
          </For>
        </div>
      </Show>
    )
  }

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div class="bg-bg-card rounded-xl border border-border overflow-hidden">
        <article style={{ padding: `${padding()}px` }}>
          <div class="space-y-2">
            <For each={sections()}>
              {(section) => <SectionRenderer section={section} />}
            </For>
          </div>
        </article>
      </div>
    </div>
  )
}

