import { Show, createMemo } from 'solid-js'
import { settings, updateSettings } from './store'
import { Checkbox, Slider } from '../ui'

// ============================================
// Comment Card Settings Section
// ============================================

export function CommentSettings() {
  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Comments Tab Settings</h2>

      {/* Tab Visibility */}
      <div class="mb-6 pb-4 border-b border-border">
        <Checkbox
          label="Show Comments Tab on Homepage"
          checked={settings.showCommentsTab}
          onChange={(e) => updateSettings({ showCommentsTab: e.currentTarget.checked })}
        />
        <p class="text-xs text-text-muted mt-1">
          When disabled, only the Posts tab will be shown on the homepage
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <Slider
            label="Avatar size:"
            unit="px"
            min={24}
            max={64}
            value={settings.commentAvatarSizePx}
            onInput={(e) => updateSettings({ commentAvatarSizePx: parseInt(e.currentTarget.value) })}
          />

          <Slider
            label="Card padding:"
            unit="px"
            min={8}
            max={32}
            value={settings.commentPaddingPx}
            onInput={(e) => updateSettings({ commentPaddingPx: parseInt(e.currentTarget.value) })}
          />

          <Slider
            label="Max content length:"
            unit="chars"
            min={0}
            max={1000}
            step={50}
            value={settings.commentMaxLength}
            onInput={(e) => updateSettings({ commentMaxLength: parseInt(e.currentTarget.value) })}
          />
          <p class="text-xs text-text-muted -mt-2">0 = show full content (no limit)</p>

          <div class="border-t border-border pt-4 mt-4">
            <p class="text-sm font-medium text-text-muted mb-3">Display Elements</p>
            <div class="grid grid-cols-2 gap-3">
              <Checkbox
                label="Avatar"
                checked={settings.commentShowAvatar}
                onChange={(e) => updateSettings({ commentShowAvatar: e.currentTarget.checked })}
              />
              <Checkbox
                label="Reply Context"
                checked={settings.commentShowReplyContext}
                onChange={(e) => updateSettings({ commentShowReplyContext: e.currentTarget.checked })}
              />
              <Checkbox
                label="Timestamp"
                checked={settings.commentShowTimestamp}
                onChange={(e) => updateSettings({ commentShowTimestamp: e.currentTarget.checked })}
              />
              <Checkbox
                label="View Link"
                checked={settings.commentShowViewLink}
                onChange={(e) => updateSettings({ commentShowViewLink: e.currentTarget.checked })}
              />
            </div>
          </div>

          <div class="border-t border-border pt-4">
            <p class="text-sm font-medium text-text-muted mb-3">Action Bar</p>
            <div class="grid grid-cols-2 gap-3">
              <Checkbox
                label="Replies Count"
                checked={settings.commentShowRepliesCount}
                onChange={(e) => updateSettings({ commentShowRepliesCount: e.currentTarget.checked })}
              />
              <Checkbox
                label="Votes"
                checked={settings.commentShowVotes}
                onChange={(e) => updateSettings({ commentShowVotes: e.currentTarget.checked })}
              />
              <Checkbox
                label="Payout"
                checked={settings.commentShowPayout}
                onChange={(e) => updateSettings({ commentShowPayout: e.currentTarget.checked })}
              />
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <CommentPreview />
      </div>
    </div>
  )
}

// ============================================
// Comment Preview Component
// ============================================

function CommentPreview() {
  const mockComment = {
    author: 'hiveuser',
    parentAuthor: 'blocktrades',
    body: 'This is a great post! I really appreciate the detailed explanation of the Hive blockchain architecture. Looking forward to more content like this. The technical depth combined with accessibility makes it perfect for both beginners and advanced users.',
    timestamp: '2h',
    repliesCount: 12,
    votes: 45,
    payout: 2.34,
  }

  const truncatedBody = createMemo(() => {
    if (settings.commentMaxLength === 0) return mockComment.body
    if (mockComment.body.length <= settings.commentMaxLength) return mockComment.body
    return mockComment.body.slice(0, settings.commentMaxLength) + '...'
  })

  return (
    <div class="bg-bg rounded-lg p-4 border border-border">
      <p class="text-xs text-text-muted mb-3 uppercase tracking-wide">Preview</p>

      <div class="bg-bg-card rounded-xl border border-border overflow-hidden">
        <article style={{ padding: `${settings.commentPaddingPx}px` }}>
          {/* Reply Context */}
          <Show when={settings.commentShowReplyContext}>
            <div class="flex items-center gap-2 text-xs text-text-muted mb-2">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span>
                Replying to <span class="text-primary">@{mockComment.parentAuthor}</span>
              </span>
            </div>
          </Show>

          <div class="flex gap-3">
            {/* Avatar */}
            <Show when={settings.commentShowAvatar}>
              <div class="flex-shrink-0">
                <img
                  src={`https://images.hive.blog/u/${mockComment.author}/avatar`}
                  alt={mockComment.author}
                  style={{
                    width: `${settings.commentAvatarSizePx}px`,
                    height: `${settings.commentAvatarSizePx}px`,
                  }}
                  class="rounded-full border border-border"
                  onError={(e) => {
                    e.currentTarget.src = '/hive-logo.png'
                  }}
                />
              </div>
            </Show>

            <div class="flex-1 min-w-0">
              {/* Author & Timestamp */}
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-text">{mockComment.author}</span>
                <Show when={settings.commentShowTimestamp}>
                  <span class="text-text-muted">·</span>
                  <span class="text-text-muted text-sm">{mockComment.timestamp}</span>
                </Show>
              </div>

              {/* Comment Body */}
              <div class="mt-2 text-text text-sm leading-relaxed">
                {truncatedBody()}
              </div>

              {/* Action Bar */}
              <Show when={settings.commentShowRepliesCount || settings.commentShowVotes || settings.commentShowPayout || settings.commentShowViewLink}>
                <div class="flex items-center gap-6 mt-3 text-text-muted">
                  <Show when={settings.commentShowRepliesCount}>
                    <div class="flex items-center gap-1.5 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>{mockComment.repliesCount}</span>
                    </div>
                  </Show>

                  <Show when={settings.commentShowVotes}>
                    <div class="flex items-center gap-1.5 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                      </svg>
                      <span>{mockComment.votes}</span>
                    </div>
                  </Show>

                  <Show when={settings.commentShowPayout}>
                    <div class="flex items-center gap-1.5 text-sm">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>${mockComment.payout.toFixed(2)}</span>
                    </div>
                  </Show>

                  <Show when={settings.commentShowViewLink}>
                    <div class="flex items-center gap-1.5 text-sm ml-auto text-primary">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>View</span>
                    </div>
                  </Show>
                </div>
              </Show>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
