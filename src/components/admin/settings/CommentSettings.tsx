// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createMemo } from 'solid-js'
import { settings, updateSettings } from '../store'
import { Slider } from '../../ui'

// ============================================
// Layout Options
// ============================================

// Comments only support list layout (grid/masonry removed - text content is best viewed as list)
const layoutOptions = [
  { value: 'list', label: 'List', icon: ListIcon },
] as const

// ============================================
// Comment Card Settings Section
// ============================================

export function CommentSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Comments Tab Settings</h2>

      {/* Layout Settings */}
      <div class="mb-6 pb-6 border-b border-border">
        <h3 class="text-sm font-medium text-text mb-4">Comments Layout</h3>

        {/* Layout is always 'list' - no need for selection UI */}
        <p class="text-xs text-text-muted mb-3">
          Comments are displayed as a list for optimal readability.
        </p>

        {/* Gap setting */}
        <Slider
          label="Gap between comments:"
          unit="px"
          min={0}
          max={64}
          value={settings.commentsGapPx}
          onChange={(val) => updateSettings({ commentsGapPx: val })}
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <h3 class="text-sm font-medium text-text mb-2">Comment Card Settings</h3>

          {/* Checkboxes for show/hide elements */}
          <div class="space-y-2">
            <h4 class="text-xs font-medium text-text-muted uppercase tracking-wide">Visible Elements</h4>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowAuthor}
                onChange={(e) => updateSettings({ commentShowAuthor: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show author name</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowAvatar}
                onChange={(e) => updateSettings({ commentShowAvatar: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show avatar</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowReplyContext}
                onChange={(e) => updateSettings({ commentShowReplyContext: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show "Replying to..." context</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowTimestamp}
                onChange={(e) => updateSettings({ commentShowTimestamp: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show timestamp</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowRepliesCount}
                onChange={(e) => updateSettings({ commentShowRepliesCount: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show replies count</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowVotes}
                onChange={(e) => updateSettings({ commentShowVotes: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show votes</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.commentShowPayout}
                onChange={(e) => updateSettings({ commentShowPayout: e.currentTarget.checked })}
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
              <span class="text-sm text-text">Show payout</span>
            </label>
          </div>

          {/* Sliders */}
          <div class="space-y-4 pt-4 border-t border-border">
            <h4 class="text-xs font-medium text-text-muted uppercase tracking-wide">Sizing</h4>

            <Slider
              label="Avatar size:"
              unit="px"
              min={24}
              max={64}
              value={settings.commentAvatarSizePx}
              onChange={(val) => updateSettings({ commentAvatarSizePx: val })}
              disabled={!settings.commentShowAvatar}
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

  const avatarSize = createMemo(() => settings.commentAvatarSizePx)
  const padding = createMemo(() => settings.commentPaddingPx)
  const maxLength = createMemo(() => settings.commentMaxLength)

  const truncatedBody = createMemo(() => {
    if (maxLength() === 0) return mockComment.body
    if (mockComment.body.length <= maxLength()) return mockComment.body
    return mockComment.body.slice(0, maxLength()) + '...'
  })

  const showAuthor = createMemo(() => settings.commentShowAuthor)
  const showAvatar = createMemo(() => settings.commentShowAvatar)
  const showReplyContext = createMemo(() => settings.commentShowReplyContext)
  const showTimestamp = createMemo(() => settings.commentShowTimestamp)
  const showRepliesCount = createMemo(() => settings.commentShowRepliesCount)
  const showVotes = createMemo(() => settings.commentShowVotes)
  const showPayout = createMemo(() => settings.commentShowPayout)

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div class="bg-bg-card rounded-xl border border-border overflow-hidden">
        <article style={{ padding: `${padding()}px` }}>
          {/* Reply context */}
          {showReplyContext() && (
            <div class="flex items-center gap-2 text-xs text-text-muted mb-2">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>
                Replying to <span class="text-primary">@{mockComment.parentAuthor}</span>
              </span>
            </div>
          )}

          {/* Main content: avatar + author info + body + actions */}
          <div class="flex gap-3">
            {/* Avatar */}
            {showAvatar() && (
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
            )}

            {/* Content */}
            <div class="flex-1 min-w-0">
              {/* Author + timestamp */}
              {(showAuthor() || showTimestamp()) && (
                <div class="flex items-center gap-2 flex-wrap">
                  {showAuthor() && <span class="font-semibold text-text">{mockComment.author}</span>}
                  {showAuthor() && showTimestamp() && <span class="text-text-muted">·</span>}
                  {showTimestamp() && <span class="text-text-muted text-sm">{mockComment.timestamp}</span>}
                </div>
              )}

              {/* Body */}
              <div class="mt-2 text-text whitespace-pre-wrap break-words leading-relaxed">
                {truncatedBody()}
              </div>

              {/* Actions */}
              {(showRepliesCount() || showVotes() || showPayout()) && (
                <div class="flex items-center gap-6 mt-3 text-text-muted">
                  {/* Replies */}
                  {showRepliesCount() && (
                    <div class="flex items-center gap-1.5 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{mockComment.repliesCount}</span>
                    </div>
                  )}

                  {/* Votes */}
                  {showVotes() && (
                    <div class="flex items-center gap-1.5 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                      <span>{mockComment.votes}</span>
                    </div>
                  )}

                  {/* Payout */}
                  {showPayout() && (
                    <div class="flex items-center gap-1.5 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>${mockComment.payout.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}

// ============================================
// Icons
// ============================================

function ListIcon() {
  return (
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}


