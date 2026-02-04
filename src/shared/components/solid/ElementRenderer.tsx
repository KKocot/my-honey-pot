// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * ElementRenderer - SolidJS component
 * Renders individual page elements (header, navigation, authorProfile, posts, footer)
 */

import { Show, For, createMemo, type Accessor } from 'solid-js'
import { settings } from '../../../components/admin/store'
import type { HiveData } from '../../../components/admin/queries'
import {
  createAuthorProfileData,
  createAuthorProfileSettings,
  renderAuthorProfileSections,
  renderSocialLinks,
} from '../author-profile'
import {
  createCommentCardData,
  createCommentCardSettings,
  renderCommentCardContent,
} from '../comment-card'
import {
  renderNavigationButtons,
  type NavigationSettings,
} from '../navigation'
import {
  createHeaderData,
  createHeaderSettings,
  renderHeader as renderHeaderHtml,
} from '../header'
import {
  renderFooter as renderFooterHtml,
} from '../footer'
import { PostCard } from './PostCard'

interface ElementRendererProps {
  elementId: string
  inSidebar?: boolean
  activeTab?: Accessor<string>
  setActiveTab?: (tab: string) => void
  data?: Accessor<HiveData | null>
}

// Render header element using shared component
function renderHeader() {
  const data = createHeaderData(
    settings.siteName || 'Hive Blog',
    settings.siteDescription || 'Posts from Hive blockchain'
  )
  const header_settings = createHeaderSettings({
    headerMaxWidthPx: settings.headerMaxWidthPx,
  })
  return <header innerHTML={renderHeaderHtml(data, header_settings)} />
}

// Render author profile element using shared components
function renderAuthorProfile(_layout: 'horizontal' | 'vertical' = 'horizontal', data: Accessor<HiveData | null>) {
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

// Render footer element using shared component
function renderFooter() {
  return <div innerHTML={renderFooterHtml()} />
}

// Posts component - reactive
function PostsSection(props: { data: Accessor<HiveData | null> }) {
  const posts = () => props.data()?.posts || []

  const gridSettings = createMemo(() => ({
    layout: settings.postsLayout || 'grid',
    columns: settings.gridColumns || 2,
    gap_px: settings.cardGapPx || 24,
  }))

  return (
    <div>
      <Show when={posts().length > 0} fallback={
        <div class="text-center py-8 bg-bg-card rounded-xl border border-border">
          <p class="text-text-muted">No posts found</p>
        </div>
      }>
        {/* List layout */}
        <Show when={gridSettings().layout === 'list'}>
          <div style={`display: flex; flex-direction: column; gap: ${gridSettings().gap_px}px;`}>
            <For each={posts()}>
              {(post, index) => <PostCard post={post} forceVertical={false} index={index()} />}
            </For>
          </div>
        </Show>
        {/* Masonry layout */}
        <Show when={gridSettings().layout === 'masonry'}>
          <div style={`column-count: ${gridSettings().columns}; column-gap: ${gridSettings().gap_px}px;`}>
            <For each={posts()}>
              {(post, index) => (
                <div style={`break-inside: avoid; margin-bottom: ${gridSettings().gap_px}px;`}>
                  <PostCard post={post} forceVertical={true} index={index()} />
                </div>
              )}
            </For>
          </div>
        </Show>
        {/* Grid layout */}
        <Show when={gridSettings().layout === 'grid'}>
          <div style={`display: grid; grid-template-columns: repeat(${gridSettings().columns}, 1fr); gap: ${gridSettings().gap_px}px;`}>
            <For each={posts()}>
              {(post, index) => <PostCard post={post} forceVertical={true} index={index()} />}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  )
}

// Comments section - displays user's comments from Hive
function CommentsSection(props: { data: Accessor<HiveData | null> }) {
  const comments = () => props.data()?.comments || []

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
function ThreadsSection() {
  return (
    <div class="space-y-4">
      <div class="text-center py-12 bg-bg-card rounded-xl border border-border">
        <p class="text-text font-medium">Hive Threads</p>
        <p class="text-text-muted text-sm mt-1">
          Krotkie posty z Hive - wkrotce dostepne.
        </p>
      </div>
    </div>
  )
}

// Main content section that switches based on active tab
function MainContentSection(props: { activeTab: Accessor<string>; data: Accessor<HiveData | null> }) {
  return (
    <>
      <Show when={props.activeTab() === 'posts'}>
        <PostsSection data={props.data} />
      </Show>
      <Show when={props.activeTab() === 'comments'}>
        <CommentsSection data={props.data} />
      </Show>
      <Show when={props.activeTab() === 'threads'}>
        <ThreadsSection />
      </Show>
    </>
  )
}

// Navigation preview component - uses settings.navigationTabs with shared utilities
function NavigationPreview(props: { activeTab: Accessor<string>; setActiveTab: (tab: string) => void }) {
  const navSettings = createMemo((): NavigationSettings => ({
    tabs: (settings.navigationTabs || []).filter(t => t.enabled).map(t => ({
      id: t.id,
      label: t.label,
      enabled: t.enabled,
      showCount: false,
      tooltip: t.tooltip,
    })),
    activeTab: props.activeTab(),
    postsCount: 0,
    commentsCount: 0,
  }))

  const navHtml = createMemo(() => renderNavigationButtons(navSettings()))

  // Event delegation for tab clicks
  const handleNavClick = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-tab]')
    if (target) {
      const tab = (target as HTMLElement).dataset.tab
      if (tab) props.setActiveTab(tab)
    }
  }

  return <div onClick={handleNavClick} innerHTML={navHtml()} />
}

export function ElementRenderer(props: ElementRendererProps) {
  return (
    <>
      <Show when={props.elementId === 'header'}>
        {renderHeader()}
      </Show>
      <Show when={props.elementId === 'authorProfile'}>
        {renderAuthorProfile(props.inSidebar ? 'vertical' : (settings.authorProfileLayout || 'horizontal'), props.data!)}
      </Show>
      <Show when={props.elementId === 'posts'}>
        <MainContentSection activeTab={props.activeTab!} data={props.data!} />
      </Show>
      <Show when={props.elementId === 'footer'}>
        {renderFooter()}
      </Show>
      <Show when={props.elementId === 'navigation'}>
        <NavigationPreview activeTab={props.activeTab!} setActiveTab={props.setActiveTab!} />
      </Show>
    </>
  )
}
