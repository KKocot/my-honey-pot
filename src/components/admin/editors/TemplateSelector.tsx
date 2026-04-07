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
// Design Patterns for Randomize
// ============================================

interface DesignPattern {
  name: string
  settings: Partial<SettingsData>
}

const designPatterns: DesignPattern[] = [
  {
    name: 'clean-list',
    settings: {
      postsLayout: 'list',
      gridColumns: 1,
      cardLayout: 'horizontal',
      thumbnailSizePx: 140,
      cardPaddingPx: 24,
      cardBorderRadiusPx: 16,
      titleSizePx: 22,
      cardGapPx: 28,
      cardBorder: true,
      showSummary: true,
      summaryMaxLength: 200,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      showThumbnail: true,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'md',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 100,
      postCardLayout: {
        sections: [
          {
            id: 'sec-main',
            orientation: 'horizontal',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                        ],
                      },
                    },
                    { type: 'element', id: 'tags' },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'no-sidebar',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
  {
    name: 'dense-grid',
    settings: {
      postsLayout: 'grid',
      gridColumns: 3,
      cardLayout: 'vertical',
      thumbnailSizePx: 180,
      cardPaddingPx: 12,
      cardBorderRadiusPx: 8,
      titleSizePx: 16,
      cardGapPx: 12,
      cardBorder: true,
      showSummary: true,
      summaryMaxLength: 100,
      showTags: true,
      maxTags: 2,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      showThumbnail: true,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.02,
      cardHoverShadow: 'lg',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 300,
      scrollAnimationDelay: 60,
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                        ],
                      },
                    },
                    { type: 'element', id: 'tags' },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-right', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'sidebar-right',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [{ id: 'authorProfile', active: true }] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
  {
    name: 'visual-masonry',
    settings: {
      postsLayout: 'masonry',
      gridColumns: 3,
      cardLayout: 'vertical',
      thumbnailSizePx: 320,
      cardPaddingPx: 0,
      cardBorderRadiusPx: 4,
      titleSizePx: 14,
      cardGapPx: 8,
      cardBorder: false,
      showSummary: false,
      showTags: false,
      showDate: false,
      showVotes: false,
      showComments: false,
      showPayout: false,
      showThumbnail: true,
      cardHoverEffect: 'scale',
      cardHoverScale: 1.04,
      cardTransitionDuration: 300,
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 500,
      scrollAnimationDelay: 50,
      postCardLayout: {
        sections: [
          {
            id: 'sec-image',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              { type: 'element', id: 'title' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'no-sidebar',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
  {
    name: 'classic-blog',
    settings: {
      postsLayout: 'list',
      gridColumns: 1,
      cardLayout: 'horizontal',
      thumbnailSizePx: 120,
      cardPaddingPx: 24,
      cardBorderRadiusPx: 12,
      titleSizePx: 20,
      cardGapPx: 24,
      cardBorder: true,
      showSummary: true,
      summaryMaxLength: 180,
      showTags: true,
      maxTags: 4,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: true,
      showThumbnail: true,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'md',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 80,
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'horizontal',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-body',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-footer',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                          { type: 'element', id: 'payout' },
                        ],
                      },
                    },
                    { type: 'element', id: 'tags' },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'sidebar-left',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [{ id: 'authorProfile', active: true }] },
          sidebarRight: { elements: [] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
  {
    name: 'magazine-grid',
    settings: {
      postsLayout: 'grid',
      gridColumns: 3,
      cardLayout: 'vertical',
      thumbnailSizePx: 200,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 12,
      titleSizePx: 18,
      cardGapPx: 20,
      cardBorder: true,
      showSummary: true,
      summaryMaxLength: 100,
      showTags: true,
      maxTags: 2,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      showThumbnail: true,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.02,
      cardHoverShadow: 'xl',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 350,
      scrollAnimationDelay: 75,
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-content',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'tags' },
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-stats',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-2', slot: 'sidebar-right', orientation: 'vertical', elements: ['authorProfile'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'sidebar-right',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [{ id: 'authorProfile', active: true }] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
  {
    name: 'compact-grid',
    settings: {
      postsLayout: 'grid',
      gridColumns: 4,
      cardLayout: 'vertical',
      thumbnailSizePx: 180,
      cardPaddingPx: 8,
      cardBorderRadiusPx: 8,
      titleSizePx: 14,
      cardGapPx: 12,
      cardBorder: true,
      showSummary: false,
      showTags: true,
      maxTags: 2,
      showDate: false,
      showVotes: true,
      showComments: true,
      showPayout: false,
      showThumbnail: true,
      cardHoverEffect: 'scale',
      cardHoverScale: 1.05,
      cardTransitionDuration: 200,
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 350,
      scrollAnimationDelay: 50,
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              { type: 'element', id: 'title' },
              {
                type: 'section',
                section: {
                  id: 'sec-stats',
                  orientation: 'horizontal',
                  children: [
                    { type: 'element', id: 'votes' },
                    { type: 'element', id: 'comments' },
                  ],
                },
              },
              { type: 'element', id: 'tags' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'no-sidebar',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
  {
    name: 'wide-masonry',
    settings: {
      postsLayout: 'masonry',
      gridColumns: 2,
      cardLayout: 'vertical',
      thumbnailSizePx: 260,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 16,
      titleSizePx: 18,
      cardGapPx: 20,
      cardBorder: true,
      showSummary: true,
      summaryMaxLength: 140,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: false,
      showPayout: false,
      showThumbnail: true,
      cardHoverEffect: 'glow',
      cardHoverBrightness: 1.08,
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 80,
      postCardLayout: {
        sections: [
          {
            id: 'sec-card',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-details',
                  orientation: 'vertical',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'summary' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                        ],
                      },
                    },
                    { type: 'element', id: 'tags' },
                  ],
                },
              },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'no-sidebar',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [] },
          bottom: { elements: [{ id: 'footer', active: true }] },
        },
      },
    },
  },
]

// ============================================
// Template Card Component
// ============================================

interface TemplateCardProps {
  template: WebsiteTemplate
  onSelect: (template: WebsiteTemplate) => void
}

function TemplateCard(props: TemplateCardProps) {
  const colors = () => {
    const themeId = props.template.settings.siteTheme
    const theme = themePresets.find((p) => p.id === themeId) || themePresets[0]
    return theme.colors
  }

  // Read layout from pageLayoutConfig (v3)
  const layoutTemplate = () => props.template.settings.pageLayoutConfig?.template ?? 'no-sidebar'
  const postsLayout = () => props.template.settings.postsLayout ?? 'list'
  const gridCols = () => Math.min(props.template.settings.gridColumns ?? 2, 3)
  const gapClass = () => (props.template.settings.cardGapPx ?? 16) < 16 ? 'gap-0.5' : 'gap-1'

  return (
    <button
      type="button"
      class="group relative flex flex-col rounded-xl border border-border bg-bg-card p-3 text-left transition-all hover:border-primary hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      onClick={() => props.onSelect(props.template)}
    >
      {/* Mini Preview */}
      <div
        class="mb-3 aspect-video w-full overflow-hidden rounded-lg"
        style={{ background: colors().bg }}
      >
        {/* Simplified layout preview */}
        <div class="flex h-full flex-col p-2">
          {/* Header */}
          <div
            class="mb-1 h-2 w-full rounded-sm"
            style={{ background: colors().primary }}
          />
          {/* Content area */}
          <div class="flex flex-1 gap-1">
            {/* Left sidebar from pageLayoutConfig */}
            {(layoutTemplate() === 'sidebar-left' || layoutTemplate() === 'both-sidebars') && (
              <div
                class="rounded-sm"
                classList={{ 'w-1/4': layoutTemplate() === 'sidebar-left', 'w-1/5': layoutTemplate() === 'both-sidebars' }}
                style={{ background: colors().bgCard }}
              />
            )}
            {/* Main content area */}
            <div class={`flex-1 ${gapClass()}`}>
              {postsLayout() === 'list' ? (
                <div class={`flex flex-col h-full ${gapClass()}`}>
                  <div class="h-3 rounded-sm" style={{ background: colors().bgCard }} />
                  <div class="h-3 rounded-sm" style={{ background: colors().bgCard }} />
                  <div class="h-3 rounded-sm" style={{ background: colors().bgCard }} />
                </div>
              ) : postsLayout() === 'masonry' ? (
                <div
                  class={`grid h-full ${gapClass()}`}
                  style={{ 'grid-template-columns': `repeat(${gridCols()}, 1fr)` }}
                >
                  <div class="rounded-sm" style={{ background: colors().bgCard, 'grid-row': 'span 2' }} />
                  <div class="rounded-sm" style={{ background: colors().bgCard }} />
                  {gridCols() >= 3 && <div class="rounded-sm" style={{ background: colors().bgCard, 'grid-row': 'span 2' }} />}
                  <div class="rounded-sm" style={{ background: colors().bgCard }} />
                  {gridCols() < 3 && <div class="rounded-sm" style={{ background: colors().bgCard }} />}
                </div>
              ) : (
                <div
                  class={`grid h-full ${gapClass()}`}
                  style={{ 'grid-template-columns': `repeat(${gridCols()}, 1fr)` }}
                >
                  <For each={Array.from({ length: gridCols() * 2 })}>
                    {() => <div class="rounded-sm" style={{ background: colors().bgCard }} />}
                  </For>
                </div>
              )}
            </div>
            {/* Right sidebar from pageLayoutConfig */}
            {(layoutTemplate() === 'sidebar-right' || layoutTemplate() === 'both-sidebars') && (
              <div
                class="rounded-sm"
                classList={{ 'w-1/4': layoutTemplate() === 'sidebar-right', 'w-1/5': layoutTemplate() === 'both-sidebars' }}
                style={{ background: colors().bgCard }}
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
    const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
    const vary = (base: number, range: number, min = 0) =>
      Math.max(min, base + Math.floor(Math.random() * (range * 2 + 1)) - range)

    // Pick random pattern and theme
    const pattern = randomChoice(designPatterns)
    const randomTheme = randomChoice(themePresets)

    // Apply pattern with minor variations
    const randomSettings: Partial<SettingsData> = {
      ...pattern.settings,
      siteTheme: randomTheme.id,
      cardPaddingPx: vary(pattern.settings.cardPaddingPx ?? 16, 4),
      cardBorderRadiusPx: vary(pattern.settings.cardBorderRadiusPx ?? 8, 4),
      cardGapPx: vary(pattern.settings.cardGapPx ?? 16, 4),
      thumbnailSizePx: vary(pattern.settings.thumbnailSizePx ?? 120, 20),
      scrollAnimationEnabled: pattern.settings.scrollAnimationType !== 'none',
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
