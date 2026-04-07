// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Website Templates (ready-made layouts)
// ============================================

import type { SettingsData } from './settings'

export interface WebsiteTemplate {
  id: string
  name: string
  description: string
  icon: string // emoji or icon identifier
  settings: Partial<SettingsData>
}

/**
 * 11 ready-made website templates for different purposes
 * Each template includes postCardLayout with nested sections for advanced layouts
 * Each template includes both pageLayout (v1 legacy) and pageLayoutConfig (v3)
 */
export const websiteTemplates: WebsiteTemplate[] = [
  {
    id: 'minimal-writer',
    name: 'Minimal Writer',
    description: 'Distraction-free reading experience for long-form content',
    icon: '✍️',
    settings: {
      siteTheme: 'light',
      postsLayout: 'list',
      cardLayout: 'vertical',
      thumbnailSizePx: 0,
      showThumbnail: false,
      cardPaddingPx: 32,
      cardBorderRadiusPx: 0,
      titleSizePx: 28,
      showSummary: true,
      summaryMaxLength: 350,
      showTags: false,
      showDate: true,
      showVotes: false,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'none',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 600,
      scrollAnimationDelay: 0,
      cardGapPx: 48,
      gridColumns: 1,
      cardBorder: false,
      postCardLayout: {
        sections: [
          {
            id: 'sec-article',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'title' },
              { type: 'element', id: 'date' },
              { type: 'element', id: 'summary' },
            ],
          },
        ],
      },
      pageLayout: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'], active: true },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts'], active: true },
        ],
      },
      pageLayoutConfig: {
        template: 'no-sidebar',
        containers: {
          top: { elements: [{ id: 'header', active: true }] },
          sidebarLeft: { elements: [] },
          sidebarRight: { elements: [] },
          bottom: { elements: [] },
        },
      },
    },
  },
  {
    id: 'developer-blog',
    name: 'Developer Blog',
    description: 'Code-focused layout for programming tutorials and tech articles',
    icon: '👨‍💻',
    settings: {
      siteTheme: 'dark',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 100,
      cardPaddingPx: 20,
      cardBorderRadiusPx: 8,
      titleSizePx: 20,
      showSummary: true,
      summaryMaxLength: 180,
      showTags: true,
      maxTags: 5,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'glow',
      cardHoverBrightness: 1.05,
      scrollAnimationType: 'slide-left',
      scrollAnimationDuration: 300,
      scrollAnimationDelay: 80,
      cardGapPx: 16,
      gridColumns: 1,
      cardBorder: true,
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
    id: 'photo-portfolio',
    name: 'Photo Portfolio',
    description: 'Image-first masonry grid for photographers and visual artists',
    icon: '📷',
    settings: {
      siteTheme: 'midnight',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 350,
      cardPaddingPx: 0,
      cardBorderRadiusPx: 4,
      titleSizePx: 14,
      showSummary: false,
      showTags: false,
      showDate: false,
      showVotes: false,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'scale',
      cardHoverScale: 1.03,
      cardTransitionDuration: 300,
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 500,
      scrollAnimationDelay: 50,
      cardGapPx: 8,
      gridColumns: 3,
      cardBorder: false,
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
    id: 'tech-magazine',
    name: 'Tech Magazine',
    description: 'Modern news grid for tech publications and industry news',
    icon: '🔬',
    settings: {
      siteTheme: 'ocean',
      postsLayout: 'grid',
      cardLayout: 'vertical',
      thumbnailSizePx: 200,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 12,
      titleSizePx: 18,
      showSummary: true,
      summaryMaxLength: 100,
      showTags: true,
      maxTags: 2,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.02,
      cardHoverShadow: 'xl',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 350,
      scrollAnimationDelay: 75,
      cardGapPx: 20,
      gridColumns: 3,
      cardBorder: true,
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
    id: 'gaming-hub',
    name: 'Gaming Hub',
    description: 'Dynamic grid layout for gaming news, reviews, and streams',
    icon: '🎮',
    settings: {
      siteTheme: 'midnight',
      postsLayout: 'grid',
      cardLayout: 'vertical',
      thumbnailSizePx: 200,
      cardPaddingPx: 12,
      cardBorderRadiusPx: 12,
      titleSizePx: 16,
      showSummary: false,
      showTags: true,
      maxTags: 2,
      showDate: false,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'scale',
      cardHoverScale: 1.06,
      cardTransitionDuration: 200,
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 50,
      cardGapPx: 16,
      gridColumns: 4,
      cardBorder: true,
      postCardLayout: {
        sections: [
          {
            id: 'sec-game',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              { type: 'element', id: 'title' },
              {
                type: 'section',
                section: {
                  id: 'sec-engagement',
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
    id: 'personal-journal',
    name: 'Personal Journal',
    description: 'Clean, readable layout for personal stories and diary entries',
    icon: '📝',
    settings: {
      siteTheme: 'lavender',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 120,
      cardPaddingPx: 24,
      cardBorderRadiusPx: 16,
      titleSizePx: 22,
      showSummary: true,
      summaryMaxLength: 200,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: true,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'md',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 100,
      cardGapPx: 24,
      gridColumns: 1,
      cardBorder: true,
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
                          { type: 'element', id: 'tags' },
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
    id: 'fashion-lookbook',
    name: 'Fashion Lookbook',
    description: 'Elegant Pinterest-style layout for fashion and beauty content',
    icon: '👗',
    settings: {
      siteTheme: 'pink',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 320,
      cardPaddingPx: 8,
      cardBorderRadiusPx: 4,
      titleSizePx: 14,
      showSummary: false,
      showTags: false,
      showDate: true,
      showVotes: true,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.02,
      cardHoverShadow: 'xl',
      scrollAnimationType: 'fade',
      scrollAnimationDuration: 500,
      scrollAnimationDelay: 75,
      cardGapPx: 12,
      gridColumns: 3,
      cardBorder: false,
      postCardLayout: {
        sections: [
          {
            id: 'sec-look',
            orientation: 'vertical',
            children: [
              { type: 'element', id: 'thumbnail' },
              {
                type: 'section',
                section: {
                  id: 'sec-info',
                  orientation: 'horizontal',
                  children: [
                    { type: 'element', id: 'title' },
                    { type: 'element', id: 'votes' },
                  ],
                },
              },
              { type: 'element', id: 'date' },
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
    id: 'news-portal',
    name: 'News Portal',
    description: 'Information-dense grid for news aggregation and reporting',
    icon: '📰',
    settings: {
      siteTheme: 'dark',
      postsLayout: 'grid',
      cardLayout: 'vertical',
      thumbnailSizePx: 180,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 8,
      titleSizePx: 18,
      showSummary: true,
      summaryMaxLength: 100,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: false,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'lg',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 300,
      scrollAnimationDelay: 60,
      cardGapPx: 16,
      gridColumns: 3,
      cardBorder: true,
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
    id: 'travel-blog',
    name: 'Travel Blog',
    description: 'Vibrant masonry layout for travel stories and adventures',
    icon: '✈️',
    settings: {
      siteTheme: 'sunset',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 280,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 20,
      titleSizePx: 20,
      showSummary: true,
      summaryMaxLength: 150,
      showTags: true,
      maxTags: 3,
      showDate: true,
      showVotes: true,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'lift',
      cardHoverScale: 1.03,
      cardHoverShadow: 'lg',
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 450,
      scrollAnimationDelay: 100,
      cardGapPx: 20,
      gridColumns: 2,
      cardBorder: true,
      postCardLayout: {
        sections: [
          {
            id: 'sec-story',
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
    id: 'creative-studio',
    name: 'Creative Studio',
    description: 'Artistic masonry layout for designers and creative portfolios',
    icon: '🎨',
    settings: {
      siteTheme: 'forest',
      postsLayout: 'masonry',
      cardLayout: 'vertical',
      thumbnailSizePx: 240,
      cardPaddingPx: 16,
      cardBorderRadiusPx: 12,
      titleSizePx: 18,
      showSummary: true,
      summaryMaxLength: 120,
      showTags: true,
      maxTags: 4,
      showDate: true,
      showVotes: true,
      showComments: false,
      showPayout: false,
      cardHoverEffect: 'glow',
      cardHoverBrightness: 1.08,
      scrollAnimationType: 'zoom',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 80,
      cardGapPx: 20,
      gridColumns: 2,
      cardBorder: true,
      postCardLayout: {
        sections: [
          {
            id: 'sec-work',
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
  {
    id: 'coffee-shop',
    name: 'Coffee & Food',
    description: 'Warm, cozy aesthetic for food blogs and cafe reviews',
    icon: '☕',
    settings: {
      siteTheme: 'coffee',
      postsLayout: 'list',
      cardLayout: 'horizontal',
      thumbnailSizePx: 160,
      cardPaddingPx: 24,
      cardBorderRadiusPx: 20,
      titleSizePx: 22,
      showSummary: true,
      summaryMaxLength: 180,
      showTags: true,
      maxTags: 4,
      showDate: true,
      showVotes: true,
      showComments: true,
      showPayout: true,
      cardHoverEffect: 'shadow',
      cardHoverShadow: 'lg',
      scrollAnimationType: 'slide-up',
      scrollAnimationDuration: 400,
      scrollAnimationDelay: 120,
      cardGapPx: 28,
      gridColumns: 1,
      cardBorder: true,
      postCardLayout: {
        sections: [
          {
            id: 'sec-recipe',
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
                    { type: 'element', id: 'tags' },
                    {
                      type: 'section',
                      section: {
                        id: 'sec-meta',
                        orientation: 'horizontal',
                        children: [
                          { type: 'element', id: 'date' },
                          { type: 'element', id: 'votes' },
                          { type: 'element', id: 'comments' },
                          { type: 'element', id: 'payout' },
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
]
