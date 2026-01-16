import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Ustawienia strony',
  access: {
    read: () => true,
  },
  fields: [
    // ============================================
    // Hive User Settings
    // ============================================
    {
      name: 'hiveUsername',
      label: 'Użytkownik Hive',
      type: 'text',
      admin: {
        description: 'Nazwa użytkownika Hive, którego posty będą wyświetlane (bez @)',
      },
    },

    // ============================================
    // Site Settings
    // ============================================
    {
      name: 'siteTheme',
      label: 'Motyw kolorystyczny (preset ID)',
      type: 'text',
      defaultValue: 'light',
      admin: {
        description: 'ID presetu motywu (light, dark, green, pink, ocean, sunset, forest, lavender, midnight, coffee)',
      },
    },
    {
      name: 'customColors',
      label: 'Custom kolory (JSON)',
      type: 'json',
      admin: {
        description: 'Własne kolory (puste = użyj presetu). Format: { bg, bgSecondary, bgCard, text, textMuted, primary, primaryHover, primaryText, accent, border, success, error, warning, info }',
      },
      validate: (value) => {
        if (value === null || value === undefined) return true

        const requiredKeys = [
          'bg', 'bgSecondary', 'bgCard', 'text', 'textMuted',
          'primary', 'primaryHover', 'primaryText', 'accent', 'border',
          'success', 'error', 'warning', 'info'
        ]

        if (typeof value !== 'object') {
          return 'customColors must be an object or null'
        }

        for (const key of requiredKeys) {
          if (typeof value[key] !== 'string') {
            return `customColors.${key} must be a string (hex color)`
          }
        }

        return true
      },
    },
    {
      name: 'siteName',
      label: 'Nazwa strony',
      type: 'text',
      defaultValue: 'Hive Blog',
    },
    {
      name: 'siteDescription',
      label: 'Opis strony',
      type: 'textarea',
      defaultValue: 'Posty z Hive blockchain',
    },

    // ============================================
    // Layout Sections (Legacy - kept for backwards compatibility)
    // ============================================
    {
      name: 'layoutSections',
      label: 'Układ sekcji strony (legacy)',
      type: 'json',
      defaultValue: [
        { id: 'header', position: 'top', enabled: true },
        { id: 'authorProfile', position: 'sidebar-left', enabled: true },
        { id: 'posts', position: 'main', enabled: true },
        { id: 'footer', position: 'bottom', enabled: false },
      ],
    },

    // ============================================
    // Page Layout (New Drag & Drop system)
    // ============================================
    {
      name: 'pageLayout',
      label: 'Page Layout (section-based)',
      type: 'json',
      defaultValue: {
        sections: [
          { id: 'page-sec-1', slot: 'top', orientation: 'horizontal', elements: ['header'] },
          { id: 'page-sec-2', slot: 'sidebar-left', orientation: 'vertical', elements: ['authorProfile'] },
          { id: 'page-sec-3', slot: 'main', orientation: 'vertical', elements: ['posts', 'comments'] },
          { id: 'page-sec-4', slot: 'bottom', orientation: 'horizontal', elements: ['footer'] },
        ],
      },
      admin: {
        description: 'Page layout configuration with sections per slot (top, sidebar-left, main, sidebar-right, bottom)',
      },
    },

    // ============================================
    // Posts Layout
    // ============================================
    {
      name: 'postsLayout',
      label: 'Układ postów',
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Lista (pionowo)', value: 'list' },
        { label: 'Grid (siatka)', value: 'grid' },
        { label: 'Masonry (Pinterest)', value: 'masonry' },
      ],
    },
    {
      name: 'gridColumns',
      label: 'Liczba kolumn',
      type: 'number',
      defaultValue: 2,
      min: 1,
      max: 4,
      admin: {
        condition: (data) => data?.postsLayout !== 'list',
      },
    },
    {
      name: 'cardGapPx',
      label: 'Odstęp między kartami (px)',
      type: 'number',
      defaultValue: 24,
      min: 0,
      max: 64,
    },

    // ============================================
    // Card Layout - Dynamic Sizes (px)
    // ============================================
    {
      name: 'cardLayout',
      label: 'Układ karty',
      type: 'select',
      defaultValue: 'horizontal',
      options: [
        { label: 'Poziomy (miniaturka obok)', value: 'horizontal' },
        { label: 'Pionowy (miniaturka nad)', value: 'vertical' },
      ],
    },
    {
      name: 'thumbnailPosition',
      label: 'Pozycja miniaturki',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Po lewej', value: 'left' },
        { label: 'Po prawej', value: 'right' },
      ],
      admin: {
        condition: (data) => data?.cardLayout === 'horizontal',
      },
    },
    {
      name: 'thumbnailSizePx',
      label: 'Rozmiar miniaturki (px)',
      type: 'number',
      defaultValue: 96,
      min: 32,
      max: 400,
    },
    {
      name: 'cardPaddingPx',
      label: 'Padding karty (px)',
      type: 'number',
      defaultValue: 24,
      min: 0,
      max: 64,
    },
    {
      name: 'cardBorderRadiusPx',
      label: 'Zaokrąglenie rogów (px)',
      type: 'number',
      defaultValue: 16,
      min: 0,
      max: 48,
    },
    {
      name: 'titleSizePx',
      label: 'Rozmiar tytułu (px)',
      type: 'number',
      defaultValue: 20,
      min: 12,
      max: 48,
    },

    // ============================================
    // Card Visibility
    // ============================================
    {
      name: 'showThumbnail',
      label: 'Pokaż miniaturkę',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showSummary',
      label: 'Pokaż streszczenie',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'summaryMaxLength',
      label: 'Maksymalna długość streszczenia',
      type: 'number',
      defaultValue: 150,
      min: 50,
      max: 500,
      admin: {
        condition: (data) => data?.showSummary === true,
      },
    },
    {
      name: 'showDate',
      label: 'Pokaż datę',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showVotes',
      label: 'Pokaż głosy',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showComments',
      label: 'Pokaż komentarze',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showPayout',
      label: 'Pokaż payout',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showTags',
      label: 'Pokaż tagi',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'maxTags',
      label: 'Maksymalna liczba tagów',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 10,
      admin: {
        condition: (data) => data?.showTags === true,
      },
    },
    {
      name: 'cardBorder',
      label: 'Pokaż ramkę karty',
      type: 'checkbox',
      defaultValue: true,
    },

    // ============================================
    // Homepage Settings
    // ============================================
    {
      name: 'showHeader',
      label: 'Pokaż nagłówek strony',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorProfile',
      label: 'Pokaż profil autora',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'authorAvatarSizePx',
      label: 'Rozmiar awatara autora (px)',
      type: 'number',
      defaultValue: 64,
      min: 32,
      max: 128,
      admin: {
        condition: (data) => data?.showAuthorProfile === true,
      },
    },
    {
      name: 'showPostCount',
      label: 'Pokaż liczbę postów autora',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (data) => data?.showAuthorProfile === true,
      },
    },
    {
      name: 'showAuthorRewards',
      label: 'Pokaż nagrody autora',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (data) => data?.showAuthorProfile === true,
      },
    },
    {
      name: 'postsPerPage',
      label: 'Liczba postów na stronie',
      type: 'number',
      defaultValue: 20,
      min: 5,
      max: 50,
    },

    // ============================================
    // Sidebar Settings
    // ============================================
    {
      name: 'sidebarWidthPx',
      label: 'Szerokość sidebara (px)',
      type: 'number',
      defaultValue: 280,
      min: 200,
      max: 400,
    },
    {
      name: 'headerMaxWidthPx',
      label: 'Maksymalna szerokość nagłówka (px)',
      type: 'number',
      defaultValue: 1280,
      min: 800,
      max: 1920,
    },

    // ============================================
    // Author Profile Extended Settings
    // ============================================
    {
      name: 'authorProfileLayout',
      label: 'Układ profilu autora',
      type: 'select',
      defaultValue: 'horizontal',
      options: [
        { label: 'Poziomy', value: 'horizontal' },
        { label: 'Pionowy', value: 'vertical' },
      ],
    },
    {
      name: 'showAuthorAbout',
      label: 'Pokaż bio/opis autora',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorLocation',
      label: 'Pokaż lokalizację autora',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorWebsite',
      label: 'Pokaż stronę autora',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorJoinDate',
      label: 'Pokaż datę dołączenia',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorReputation',
      label: 'Pokaż reputację',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorFollowers',
      label: 'Pokaż liczbę obserwujących',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorFollowing',
      label: 'Pokaż liczbę obserwowanych',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'showAuthorVotingPower',
      label: 'Pokaż voting power',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showAuthorHiveBalance',
      label: 'Pokaż saldo HIVE',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showAuthorHbdBalance',
      label: 'Pokaż saldo HBD',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'showAuthorCoverImage',
      label: 'Pokaż cover image',
      type: 'checkbox',
      defaultValue: true,
    },

    // ============================================
    // Comments Tab Settings
    // ============================================
    {
      name: 'showCommentsTab',
      label: 'Pokaż zakładkę Comments',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentsLayout',
      label: 'Układ komentarzy',
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Lista (pionowo)', value: 'list' },
        { label: 'Grid (siatka)', value: 'grid' },
        { label: 'Masonry (Pinterest)', value: 'masonry' },
      ],
    },
    {
      name: 'commentsGridColumns',
      label: 'Liczba kolumn (dla grid/masonry)',
      type: 'number',
      defaultValue: 2,
      min: 1,
      max: 4,
      admin: {
        condition: (data) => data?.commentsLayout !== 'list',
      },
    },
    {
      name: 'commentsGapPx',
      label: 'Odstęp między komentarzami (px)',
      type: 'number',
      defaultValue: 16,
      min: 0,
      max: 64,
    },

    // ============================================
    // Comment Card Settings
    // ============================================
    {
      name: 'commentShowAuthor',
      label: 'Pokaż autora komentarza',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentShowAvatar',
      label: 'Pokaż avatar w komentarzu',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentAvatarSizePx',
      label: 'Rozmiar avatara komentarza (px)',
      type: 'number',
      defaultValue: 40,
      min: 24,
      max: 64,
    },
    {
      name: 'commentShowReplyContext',
      label: 'Pokaż kontekst odpowiedzi',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentShowTimestamp',
      label: 'Pokaż znacznik czasu',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentShowRepliesCount',
      label: 'Pokaż liczbę odpowiedzi',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentShowVotes',
      label: 'Pokaż głosy komentarza',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentShowPayout',
      label: 'Pokaż payout komentarza',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentShowViewLink',
      label: 'Pokaż link "View"',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'commentMaxLength',
      label: 'Maksymalna długość komentarza (0 = bez limitu)',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 1000,
    },
    {
      name: 'commentPaddingPx',
      label: 'Padding komentarza (px)',
      type: 'number',
      defaultValue: 16,
      min: 8,
      max: 32,
    },

    // ============================================
    // Card Layouts (Drag & Drop for cards)
    // ============================================
    {
      name: 'postCardLayout',
      label: 'Post Card Layout',
      type: 'json',
      defaultValue: {
        sections: [
          { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'thumbnail' }] },
          { id: 'sec-2', orientation: 'vertical', children: [{ type: 'element', id: 'title' }, { type: 'element', id: 'summary' }] },
          { id: 'sec-3', orientation: 'horizontal', children: [{ type: 'element', id: 'date' }, { type: 'element', id: 'votes' }, { type: 'element', id: 'comments' }, { type: 'element', id: 'payout' }] },
          { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'tags' }] },
        ],
      },
      admin: {
        description: 'Layout configuration for post cards with draggable sections',
      },
    },
    {
      name: 'commentCardLayout',
      label: 'Comment Card Layout',
      type: 'json',
      defaultValue: {
        sections: [
          { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'replyContext' }] },
          { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'author' }, { type: 'element', id: 'timestamp' }] },
          { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'body' }] },
          { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'replies' }, { type: 'element', id: 'votes' }, { type: 'element', id: 'payout' }, { type: 'element', id: 'viewLink' }] },
        ],
      },
      admin: {
        description: 'Layout configuration for comment cards with draggable sections',
      },
    },
    {
      name: 'authorProfileLayout2',
      label: 'Author Profile Layout',
      type: 'json',
      defaultValue: {
        sections: [
          { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
          { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'username' }, { type: 'element', id: 'reputation' }] },
          { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'about' }] },
          { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'location' }, { type: 'element', id: 'website' }, { type: 'element', id: 'joinDate' }] },
          { id: 'sec-5', orientation: 'horizontal', children: [{ type: 'element', id: 'followers' }, { type: 'element', id: 'following' }, { type: 'element', id: 'postCount' }, { type: 'element', id: 'hpEarned' }] },
          { id: 'sec-6', orientation: 'horizontal', children: [{ type: 'element', id: 'votingPower' }, { type: 'element', id: 'hiveBalance' }, { type: 'element', id: 'hbdBalance' }] },
        ],
      },
      admin: {
        description: 'Layout configuration for author profile with draggable sections',
      },
    },

    // ============================================
    // Sorting Settings
    // ============================================
    {
      name: 'postsSortOrder',
      label: 'Sortowanie postów',
      type: 'select',
      defaultValue: 'blog',
      options: [
        { label: 'Blog (chronologicznie)', value: 'blog' },
        { label: 'Tylko posty (bez reblogów)', value: 'posts' },
        { label: 'Według wypłaty', value: 'payout' },
      ],
    },
    {
      name: 'commentsSortOrder',
      label: 'Sortowanie komentarzy',
      type: 'select',
      defaultValue: 'comments',
      options: [
        { label: 'Komentarze użytkownika', value: 'comments' },
        { label: 'Odpowiedzi do użytkownika', value: 'replies' },
      ],
    },
    {
      name: 'includeReblogs',
      label: 'Uwzględnij reblogi',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
