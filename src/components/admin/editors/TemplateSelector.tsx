// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For } from 'solid-js'
import { settings, updateSettings } from '../store'
import { applyThemeColors, is_community_mode } from '../queries'
import {
  websiteTemplates,
  themePresets,
  strip_irrelevant_fields,
  type WebsiteTemplate,
  type SettingsData,
} from '../types/index'
import { showToast } from '../../ui'

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: WebsiteTemplate
  onSelect: (template: WebsiteTemplate) => void
}

function TemplateCard(props: TemplateCardProps) {
  const getThemePreview = () => {
    const themeId = props.template.settings.siteTheme
    const theme = themePresets.find((p) => p.id === themeId) || themePresets[0]
    return theme.colors
  }

  const colors = getThemePreview()

  return (
    <button
      type="button"
      class="group relative flex flex-col rounded-xl border border-border bg-bg-card p-3 text-left transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={() => props.onSelect(props.template)}
    >
      {/* Mini Preview */}
      <div
        class="mb-3 aspect-video w-full overflow-hidden rounded-lg"
        style={{ background: colors.bg }}
      >
        {/* Simplified layout preview */}
        <div class="flex h-full flex-col p-2">
          {/* Header */}
          <div
            class="mb-1 h-2 w-full rounded-sm"
            style={{ background: colors.primary }}
          />
          {/* Content area */}
          <div class="flex flex-1 gap-1">
            {/* Sidebar if exists */}
            {props.template.settings.pageLayout?.sections.some(
              (s) => s.slot === 'sidebar-left' && s.active
            ) && (
              <div
                class="w-1/4 rounded-sm"
                style={{ background: colors.bgCard }}
              />
            )}
            {/* Main content */}
            <div class="flex-1 space-y-1">
              {props.template.settings.postsLayout === 'grid' ||
              props.template.settings.postsLayout === 'masonry' ? (
                <div class="grid grid-cols-2 gap-1 h-full">
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="rounded-sm" style={{ background: colors.bgCard }} />
                </div>
              ) : (
                <>
                  <div class="h-3 rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="h-3 rounded-sm" style={{ background: colors.bgCard }} />
                  <div class="h-3 rounded-sm" style={{ background: colors.bgCard }} />
                </>
              )}
            </div>
            {/* Right sidebar if exists */}
            {props.template.settings.pageLayout?.sections.some(
              (s) => s.slot === 'sidebar-right' && s.active
            ) && (
              <div
                class="w-1/4 rounded-sm"
                style={{ background: colors.bgCard }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Template Info */}
      <div class="flex items-start gap-2">
        <span class="text-2xl">{props.template.icon}</span>
        <div class="flex-1 min-w-0">
          <h3 class="font-medium text-text truncate">{props.template.name}</h3>
          <p class="text-xs text-text-muted line-clamp-2">{props.template.description}</p>
        </div>
      </div>

      {/* Hover overlay */}
      <div class="absolute inset-0 rounded-xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}

// ============================================
// Template Selector Component
// ============================================

export function TemplateSelector() {
  const applyTemplate = (template: WebsiteTemplate) => {
    // Apply template settings, stripping fields irrelevant for current mode
    const raw_settings: Partial<SettingsData> = {
      ...template.settings,
      // Ensure scroll animation is enabled when type is set
      scrollAnimationEnabled: template.settings.scrollAnimationType !== 'none',
    }
    const filtered_settings = strip_irrelevant_fields(raw_settings, is_community_mode())

    updateSettings(filtered_settings)

    // Apply theme colors
    if (template.settings.siteTheme) {
      const theme = themePresets.find((p) => p.id === template.settings.siteTheme)
      if (theme) {
        applyThemeColors(theme.colors)
      }
    }

    showToast(`Applied "${template.name}" template`, 'success')
  }

  const randomizeTemplate = () => {
    // Helper functions for random values
    const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const randomFloat = (min: number, max: number, decimals: number = 2) =>
      parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
    const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
    const randomBool = (probability = 0.5) => Math.random() < probability

    // Shuffle array helper
    const shuffle = <T,>(arr: T[]): T[] => {
      const result = [...arr]
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]]
      }
      return result
    }

    // Generate random card layout from element IDs
    const generateRandomCardLayout = (elementIds: string[]) => {
      const shuffled = shuffle(elementIds)
      // Randomly include 60-100% of elements
      const count = Math.max(2, Math.floor(shuffled.length * randomFloat(0.6, 1.0)))
      const selected = shuffled.slice(0, count)

      // Split into 2-4 random sections
      const numSections = randomInt(2, Math.min(4, selected.length))
      const sections: { id: string; orientation: 'horizontal' | 'vertical'; children: { type: 'element'; id: string }[] }[] = []

      let idx = 0
      for (let i = 0; i < numSections; i++) {
        const remaining = selected.length - idx
        const sectionSize = i === numSections - 1 ? remaining : randomInt(1, Math.max(1, remaining - (numSections - i - 1)))
        const sectionElements = selected.slice(idx, idx + sectionSize)
        idx += sectionSize

        if (sectionElements.length > 0) {
          sections.push({
            id: `sec-${i + 1}`,
            orientation: randomChoice(['horizontal', 'vertical'] as const),
            children: sectionElements.map(id => ({ type: 'element' as const, id }))
          })
        }
      }

      return { sections }
    }

    // Random theme
    const randomTheme = randomChoice(themePresets)

    // Random layout settings
    const postsLayout = randomChoice(['list', 'grid', 'masonry'] as const)
    const gridColumns = randomInt(1, 4)

    // Random hover effect
    const hoverEffects = ['none', 'shadow', 'lift', 'scale', 'glow'] as const
    const hoverEffect = randomChoice(hoverEffects)

    // Random scroll animation - must match type: 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip'
    const scrollAnimations = ['none', 'fade', 'slide-up', 'slide-left', 'zoom', 'flip'] as const
    const scrollAnimation = randomChoice(scrollAnimations)

    // Random page layout
    const pageLayoutOptions = [
      // Left sidebar
      {
        sections: [
          { id: 'page-sec-1', slot: 'top' as const, orientation: 'horizontal' as const, elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left' as const, orientation: 'vertical' as const, elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main' as const, orientation: 'vertical' as const, elements: ['navigation', 'posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom' as const, orientation: 'horizontal' as const, elements: ['footer'], active: true },
        ]
      },
      // Right sidebar
      {
        sections: [
          { id: 'page-sec-1', slot: 'top' as const, orientation: 'horizontal' as const, elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-right' as const, orientation: 'vertical' as const, elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main' as const, orientation: 'vertical' as const, elements: ['navigation', 'posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom' as const, orientation: 'horizontal' as const, elements: ['footer'], active: true },
        ]
      },
      // No sidebar
      {
        sections: [
          { id: 'page-sec-1', slot: 'top' as const, orientation: 'horizontal' as const, elements: ['header', 'authorProfile'], active: true },
          { id: 'page-sec-2', slot: 'main' as const, orientation: 'vertical' as const, elements: ['navigation', 'posts'], active: true },
          { id: 'page-sec-3', slot: 'bottom' as const, orientation: 'horizontal' as const, elements: ['footer'], active: true },
        ]
      },
      // Both sidebars
      {
        sections: [
          { id: 'page-sec-1', slot: 'top' as const, orientation: 'horizontal' as const, elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left' as const, orientation: 'vertical' as const, elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main' as const, orientation: 'vertical' as const, elements: ['navigation', 'posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom' as const, orientation: 'horizontal' as const, elements: ['footer'], active: true },
        ]
      },
    ]

    // Element IDs for card layouts (avatar removed from post cards, votingPower removed from author profile)
    const postCardElements = ['thumbnail', 'title', 'summary', 'date', 'votes', 'comments', 'payout', 'tags']
    const commentCardElements = ['replyContext', 'avatar', 'author', 'timestamp', 'body', 'replies', 'votes', 'payout', 'viewLink']
    const authorProfileElements = ['coverImage', 'avatar', 'username', 'displayName', 'reputation', 'about', 'location', 'website', 'joinDate', 'followers', 'following', 'postCount', 'hivePower', 'hpEarned', 'hiveBalance', 'hbdBalance']

    // Generate random settings
    const randomSettings: Partial<SettingsData> = {
      // Theme
      siteTheme: randomTheme.id,

      // Posts Layout
      postsLayout,
      gridColumns,
      cardGapPx: randomInt(8, 32),
      postsPerPage: randomChoice([10, 15, 20, 25, 30]),
      postsSortOrder: randomChoice(['blog', 'posts'] as const),
      includeReblogs: randomBool(0.3),

      // Post Card Appearance
      thumbnailSizePx: randomInt(60, 200),
      cardPaddingPx: randomInt(8, 32),
      cardBorderRadiusPx: randomInt(0, 24),
      titleSizePx: randomInt(14, 28),
      summaryMaxLength: randomInt(80, 300),
      maxTags: randomInt(2, 8),
      cardBorder: randomBool(0.7),
      postCardLayout: generateRandomCardLayout(postCardElements),

      // Card Hover Animation
      cardHoverEffect: hoverEffect,
      cardTransitionDuration: randomInt(150, 400),
      cardHoverScale: randomFloat(1.0, 1.08),
      cardHoverShadow: randomChoice(['sm', 'md', 'lg', 'xl']),
      cardHoverBrightness: randomFloat(1.0, 1.15),

      // Scroll Animation
      scrollAnimationType: scrollAnimation,
      scrollAnimationEnabled: scrollAnimation !== 'none',
      scrollAnimationDuration: randomInt(200, 600),
      scrollAnimationDelay: randomInt(30, 150),

      // Page Layout
      pageLayout: randomChoice(pageLayoutOptions),
      sidebarWidthPx: randomInt(240, 360),
      headerMaxWidthPx: randomChoice([1024, 1280, 1440, 1600]),

      // Author Profile Settings
      showHeader: randomBool(0.9),
      showAuthorProfile: randomBool(0.9),
      authorProfileLayout: randomChoice(['horizontal', 'vertical'] as const),
      authorAvatarSizePx: randomChoice([48, 64, 80, 96]),
      authorProfileLayout2: generateRandomCardLayout(authorProfileElements),

      // Comments Tab Settings
      showCommentsTab: randomBool(0.8),
      commentCardLayout: generateRandomCardLayout(commentCardElements),
      commentAvatarSizePx: randomChoice([32, 40, 48]),
      commentMaxLength: randomChoice([0, 200, 300, 500]),
      commentPaddingPx: randomInt(12, 24),
    }

    const filtered_random = strip_irrelevant_fields(randomSettings, is_community_mode())
    updateSettings(filtered_random)
    applyThemeColors(randomTheme.colors)

    showToast('Applied random settings!', 'success')
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-primary">Quick Start Templates</h2>
        <p class="text-sm text-text-muted mt-1">
          Choose a template to instantly apply a complete design preset
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Randomize Button */}
        <button
          type="button"
          class="group relative flex flex-col rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-3 text-left transition-all hover:border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={randomizeTemplate}
        >
          {/* Dice Preview */}
          <div class="mb-3 aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span class="text-4xl">🎲</span>
          </div>

          {/* Info */}
          <div class="flex items-start gap-2">
            <span class="text-2xl">✨</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-primary truncate">Randomize</h3>
              <p class="text-xs text-text-muted line-clamp-2">Generate random settings</p>
            </div>
          </div>
        </button>

        <For each={websiteTemplates}>
          {(template) => (
            <TemplateCard template={template} onSelect={applyTemplate} />
          )}
        </For>
      </div>
    </div>
  )
}
