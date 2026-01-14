import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Ustawienia strony',
  access: {
    read: () => true,
  },
  fields: [
    // ============================================
    // Site Settings
    // ============================================
    {
      name: 'siteTheme',
      label: 'Motyw kolorystyczny',
      type: 'select',
      required: true,
      defaultValue: 'light',
      options: [
        { label: 'Jasny (Light)', value: 'light' },
        { label: 'Ciemny (Dark)', value: 'dark' },
        { label: 'Zielony (Green)', value: 'green' },
        { label: 'Różowy (Pink)', value: 'pink' },
      ],
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
    // Layout Sections (Drag & Drop)
    // ============================================
    {
      name: 'layoutSections',
      label: 'Układ sekcji strony',
      type: 'json',
      defaultValue: [
        { id: 'header', position: 'top', enabled: true },
        { id: 'authorProfile', position: 'sidebar-left', enabled: true },
        { id: 'posts', position: 'main', enabled: true },
        { id: 'footer', position: 'bottom', enabled: false },
      ],
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
    // Comment Card Settings
    // ============================================
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
  ],
}
