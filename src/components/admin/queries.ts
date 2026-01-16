import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { defaultSettings, migrateCardLayout, themePresets, type SettingsData, type LayoutSection, type ThemeColors } from './types'
import { loadConfigFromHive } from './hive-broadcast'
import { setHasUnsavedChanges } from './AdminPanel'

// ============================================
// Apply theme colors to CSS variables
// ============================================

export function applyThemeColors(colors: ThemeColors) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.style.setProperty('--theme-bg', colors.bg)
  root.style.setProperty('--theme-bg-secondary', colors.bgSecondary)
  root.style.setProperty('--theme-bg-card', colors.bgCard)
  root.style.setProperty('--theme-text', colors.text)
  root.style.setProperty('--theme-text-muted', colors.textMuted)
  root.style.setProperty('--theme-primary', colors.primary)
  root.style.setProperty('--theme-primary-hover', colors.primaryHover)
  root.style.setProperty('--theme-primary-text', colors.primaryText)
  root.style.setProperty('--theme-accent', colors.accent)
  root.style.setProperty('--theme-border', colors.border)
  root.style.setProperty('--theme-success', colors.success)
  root.style.setProperty('--theme-error', colors.error)
  root.style.setProperty('--theme-warning', colors.warning)
  root.style.setProperty('--theme-info', colors.info)
}

function getThemeColors(data: SettingsData): ThemeColors {
  if (data.customColors) {
    return data.customColors
  }
  const preset = themePresets.find((p) => p.id === data.siteTheme)
  return preset?.colors || themePresets[0].colors
}

// ============================================
// Query Client
// ============================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})


// ============================================
// Local Store for UI State
// ============================================

const [settings, setSettings] = createStore<SettingsData>(defaultSettings)

export { settings }

export function updateSettings(partial: Partial<SettingsData>) {
  setSettings(produce((s) => {
    Object.assign(s, partial)
  }))
  setHasUnsavedChanges(true)
}

// Dedicated setter for customColors to ensure SolidJS reactivity
export function setCustomColors(colors: ThemeColors | null) {
  setSettings('customColors', colors)
  if (colors) {
    applyThemeColors(colors)
  }
  setHasUnsavedChanges(true)
}

export function updateLayoutSection(sectionId: string, updates: Partial<LayoutSection>) {
  setSettings(produce((s) => {
    const section = s.layoutSections.find((sec) => sec.id === sectionId)
    if (section) {
      Object.assign(section, updates)
    }
  }))
  setHasUnsavedChanges(true)
}

export function setLayoutSections(sections: LayoutSection[]) {
  setSettings('layoutSections', sections)
  setHasUnsavedChanges(true)
}


// ============================================
// Helper to migrate all card layouts
// ============================================

function migrateSettingsLayouts(data: Partial<SettingsData>): Partial<SettingsData> {
  return {
    ...data,
    postCardLayout: data.postCardLayout ? migrateCardLayout(data.postCardLayout) : undefined,
    commentCardLayout: data.commentCardLayout ? migrateCardLayout(data.commentCardLayout) : undefined,
    authorProfileLayout2: data.authorProfileLayout2 ? migrateCardLayout(data.authorProfileLayout2) : undefined,
  }
}

// ============================================
// Current user for Hive config loading
// ============================================

let currentUsername: string | null = null

export function setCurrentUsername(username: string | null) {
  currentUsername = username
}

// ============================================
// API Functions
// ============================================

// Track if we had API error
let lastFetchError: string | null = null

export function getLastFetchError(): string | null {
  return lastFetchError
}

export function clearFetchError(): void {
  lastFetchError = null
}

async function fetchSettings(): Promise<SettingsData> {
  lastFetchError = null

  // Load from Hive if user is logged in
  if (currentUsername) {
    try {
      console.log(`Loading config from Hive for @${currentUsername}...`)
      const hiveConfig = await loadConfigFromHive(currentUsername)
      if (hiveConfig) {
        console.log('Loaded config from Hive!')
        const migratedData = migrateSettingsLayouts(hiveConfig)
        const pageLayout = hiveConfig.pageLayout !== undefined ? hiveConfig.pageLayout : defaultSettings.pageLayout

        return {
          ...defaultSettings,
          ...hiveConfig,
          ...migratedData,
          layoutSections: hiveConfig.layoutSections?.length ? hiveConfig.layoutSections : defaultSettings.layoutSections,
          pageLayout,
        } as SettingsData
      }
      console.log('No config found on Hive, using defaults')
    } catch (error) {
      console.error('Failed to load from Hive:', error)
      lastFetchError = error instanceof Error ? error.message : 'Failed to connect to Hive API'
      throw new Error(`Hive API error: ${lastFetchError}. Please refresh the page.`)
    }
  }

  return defaultSettings
}

async function saveSettingsToServer(data: SettingsData): Promise<boolean> {
  // Apply theme colors immediately
  applyThemeColors(getThemeColors(data))

  // Note: To persist to Hive, user should click "Publish to Hive" button
  return true
}

// ============================================
// Query Keys
// ============================================

export const queryKeys = {
  settings: ['settings'] as const,
}

// ============================================
// Hooks
// ============================================

export function useSettingsQuery() {
  return createQuery(() => ({
    queryKey: queryKeys.settings,
    queryFn: fetchSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  }))
}

export function useSaveSettingsMutation() {
  const client = useQueryClient()

  return createMutation(() => ({
    mutationFn: saveSettingsToServer,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: queryKeys.settings })
    },
  }))
}

// ============================================
// Sync settings to store when query succeeds
// ============================================

// Track if settings have been loaded from server at least once
let settingsLoadedFromServer = false

export function syncSettingsToStore(data: SettingsData, fromServer: boolean = false) {
  setSettings(produce((s) => {
    Object.assign(s, data)
  }))

  // Only apply theme colors if data came from server (not default init)
  // This prevents overwriting SSR theme with default light theme
  if (fromServer) {
    settingsLoadedFromServer = true
    applyThemeColors(getThemeColors(data))
  }
}

export function isSettingsLoaded(): boolean {
  return settingsLoadedFromServer
}

// ============================================
// Hive Preview Data Types
// ============================================

export interface HivePost {
  author: string
  permlink: string
  title: string
  body: string
  created: string
  json_metadata: { image?: string[]; tags?: string[] } | string
  active_votes: { voter: string }[]
  children: number
  pending_payout_value: string
}

export interface HiveAccount {
  name: string
  reputation: number
  post_count: number
  balance: string
  savings_balance: string
  hbd_balance: string
  vesting_shares: string
  received_vesting_shares: string
  delegated_vesting_shares: string
  json_metadata: string
  posting_json_metadata: string
  created: string
}

export interface HiveProfile {
  name: string
  about?: string
  location?: string
  website?: string
  cover_image?: string
  profile_image?: string
  post_count?: number
}

export interface HiveFollowCount {
  follower_count: number
  following_count: number
}

export interface HiveData {
  account: HiveAccount | null
  profile: HiveProfile | null
  posts: HivePost[]
  followCount: HiveFollowCount | null
}

// Default Hive API endpoint for client-side usage
const HIVE_API_ENDPOINT = 'https://api.openhive.network'

// ============================================
// Hive Preview Data Fetcher
// ============================================

async function fetchHivePreviewData(username: string, postsPerPage: number): Promise<HiveData | null> {
  if (!username) return null

  try {
    // Fetch account, posts, and follow count in parallel
    const [accountRes, postsRes, followRes] = await Promise.all([
      fetch(HIVE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_accounts',
          params: [[username]],
          id: 1,
        }),
      }),
      fetch(HIVE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bridge.get_account_posts',
          params: { sort: 'blog', account: username, limit: postsPerPage },
          id: 2,
        }),
      }),
      fetch(HIVE_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_follow_count',
          params: [username],
          id: 3,
        }),
      }),
    ])

    const [accountData, postsData, followData] = await Promise.all([
      accountRes.json(),
      postsRes.json(),
      followRes.json(),
    ])

    const account: HiveAccount | null = accountData.result?.[0] || null
    const posts: HivePost[] = postsData.result || []
    const followCount: HiveFollowCount | null = followData.result || null

    // Parse profile from account metadata
    let profile: HiveProfile | null = null
    if (account) {
      try {
        const metadata = JSON.parse(account.posting_json_metadata || account.json_metadata || '{}')
        profile = metadata.profile || null
      } catch {
        // Invalid JSON
      }
    }

    return { account, profile, posts, followCount }
  } catch {
    return null
  }
}

// ============================================
// Hive Preview Query Hook
// ============================================

export function useHivePreviewQuery(
  username: () => string | undefined,
  postsPerPage: () => number,
  enabled: () => boolean
) {
  return createQuery(() => ({
    queryKey: ['hive-preview', username(), postsPerPage()] as const,
    queryFn: () => fetchHivePreviewData(username() || '', postsPerPage()),
    enabled: enabled() && !!username(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  }))
}
