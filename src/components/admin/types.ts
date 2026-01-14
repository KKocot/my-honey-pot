// ============================================
// Shared types for admin panel
// ============================================

export interface LayoutSection {
  id: string
  position: 'top' | 'sidebar-left' | 'main' | 'sidebar-right' | 'bottom'
  enabled: boolean
}

export interface SettingsData {
  siteTheme: 'light' | 'dark' | 'green' | 'pink'
  siteName: string
  siteDescription: string
  layoutSections: LayoutSection[]
  postsLayout: 'list' | 'grid' | 'masonry'
  gridColumns: number
  cardGapPx: number
  cardLayout: 'horizontal' | 'vertical'
  thumbnailPosition: 'left' | 'right'
  thumbnailSizePx: number
  cardPaddingPx: number
  cardBorderRadiusPx: number
  titleSizePx: number
  showThumbnail: boolean
  showSummary: boolean
  summaryMaxLength: number
  showDate: boolean
  showVotes: boolean
  showComments: boolean
  showPayout: boolean
  showTags: boolean
  cardBorder: boolean
  maxTags: number
  showHeader: boolean
  showAuthorProfile: boolean
  authorAvatarSizePx: number
  showPostCount: boolean
  showAuthorRewards: boolean
  postsPerPage: number
  sidebarWidthPx: number
}

export const defaultSettings: SettingsData = {
  siteTheme: 'light',
  siteName: '',
  siteDescription: '',
  layoutSections: [
    { id: 'header', position: 'top', enabled: true },
    { id: 'authorProfile', position: 'sidebar-left', enabled: true },
    { id: 'posts', position: 'main', enabled: true },
    { id: 'footer', position: 'bottom', enabled: false },
  ],
  postsLayout: 'list',
  gridColumns: 2,
  cardGapPx: 24,
  cardLayout: 'horizontal',
  thumbnailPosition: 'left',
  thumbnailSizePx: 96,
  cardPaddingPx: 24,
  cardBorderRadiusPx: 16,
  titleSizePx: 20,
  showThumbnail: true,
  showSummary: true,
  summaryMaxLength: 150,
  showDate: true,
  showVotes: true,
  showComments: true,
  showPayout: true,
  showTags: true,
  cardBorder: true,
  maxTags: 5,
  showHeader: true,
  showAuthorProfile: true,
  authorAvatarSizePx: 64,
  showPostCount: true,
  showAuthorRewards: true,
  postsPerPage: 20,
  sidebarWidthPx: 280,
}

export const sectionLabels: Record<string, string> = {
  header: 'Nagłówek',
  authorProfile: 'Profil autora',
  posts: 'Lista postów',
  footer: 'Stopka',
}

export const sectionColors: Record<string, string> = {
  header: 'bg-primary text-white',
  authorProfile: 'bg-accent text-white',
  posts: 'bg-success text-white',
  footer: 'bg-text-muted text-white',
}

export const themeOptions = [
  { value: 'light', label: 'Jasny (Light)' },
  { value: 'dark', label: 'Ciemny (Dark)' },
  { value: 'green', label: 'Zielony (Green)' },
  { value: 'pink', label: 'Różowy (Pink)' },
]

export const cardLayoutOptions = [
  { value: 'horizontal', label: 'Poziomy' },
  { value: 'vertical', label: 'Pionowy' },
]

export const thumbnailPositionOptions = [
  { value: 'left', label: 'Po lewej' },
  { value: 'right', label: 'Po prawej' },
]
