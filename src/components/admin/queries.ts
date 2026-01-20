import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { createSignal, createEffect } from 'solid-js'
import { defaultSettings, migrateCardLayout, themePresets, type SettingsData, type LayoutSection, type ThemeColors } from './types'
import { loadConfigFromHive } from './hive-broadcast'
import { setHasUnsavedChanges } from './AdminPanel'
import {
  DataProvider,
  getWax,
  formatCompactNumber,
  formatJoinDate,
  calculateEffectiveHP,
  type IProfile,
  type IDatabaseAccount,
  type IGlobalProperties,
  type BridgePost,
  type NaiAsset,
} from '../../lib/blog-logic'

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
  const result: Partial<SettingsData> = {}

  // Only migrate layouts that exist in data - return migrated versions
  if (data.postCardLayout) {
    result.postCardLayout = migrateCardLayout(data.postCardLayout)
  }
  if (data.commentCardLayout) {
    result.commentCardLayout = migrateCardLayout(data.commentCardLayout)
  }
  if (data.authorProfileLayout2) {
    result.authorProfileLayout2 = migrateCardLayout(data.authorProfileLayout2)
  }

  return result
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

        // Build final settings - start with defaults, then overlay hiveConfig (excluding undefined values)
        const finalSettings: SettingsData = { ...defaultSettings }

        // Apply hiveConfig values, but skip undefined/null to keep defaults
        for (const key of Object.keys(hiveConfig) as (keyof SettingsData)[]) {
          if (hiveConfig[key] !== undefined && hiveConfig[key] !== null) {
            (finalSettings as Record<string, unknown>)[key] = hiveConfig[key]
          }
        }

        // Apply migrated layouts (these are already validated to exist)
        Object.assign(finalSettings, migratedData)

        // Ensure layoutSections and pageLayout have proper values
        if (!finalSettings.layoutSections?.length) {
          finalSettings.layoutSections = defaultSettings.layoutSections
        }
        finalSettings.pageLayout = pageLayout

        return finalSettings
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
// Hive Preview Data Types (using blog-logic)
// ============================================

// Re-export blog-logic types with legacy names for backwards compatibility
export type HiveBridgeProfile = IProfile
export type HiveDatabaseAccount = IDatabaseAccount
export type HiveGlobalProps = IGlobalProperties
export type HivePost = BridgePost

export interface HiveData {
  profile: IProfile | null
  dbAccount: IDatabaseAccount | null
  globalProps: IGlobalProperties | null
  posts: BridgePost[]
  comments: BridgePost[]
}

// Re-export utilities from blog-logic for convenience
export { formatCompactNumber, formatJoinDate }

// Calculate effective HP using blog-logic
// Accepts NaiAsset values (from IDatabaseAccount and IGlobalProperties)
export function calculateEffectiveHivePower(
  vestingShares: NaiAsset,
  delegatedVestingShares: NaiAsset,
  receivedVestingShares: NaiAsset,
  globalProps: IGlobalProperties
): number {
  return calculateEffectiveHP(
    vestingShares,
    delegatedVestingShares,
    receivedVestingShares,
    globalProps
  )
}

// ============================================
// Hive Preview Data Fetcher (using blog-logic DataProvider)
// ============================================

async function fetchHivePreviewData(username: string, postsPerPage: number): Promise<HiveData | null> {
  if (!username) return null

  try {
    // Initialize Blog Logic DataProvider
    const chain = await getWax()
    const dataProvider = new DataProvider(chain)

    // Fetch account object first (needed for profile)
    const account = await dataProvider.bloggingPlatform.getAccount(username)

    // Fetch profile, database account, global props, posts, and comments in parallel
    const [profile, dbAccount, globalProps, posts, comments] = await Promise.all([
      account.getProfile(),
      dataProvider.getDatabaseAccount(username),
      dataProvider.getGlobalProperties(),
      dataProvider.bloggingPlatform.enumAccountPosts(
        { sort: 'blog', account: username },
        { page: 1, pageSize: postsPerPage }
      ),
      // Fetch user's comments using sort='comments'
      dataProvider.bloggingPlatform.enumAccountPosts(
        { sort: 'comments', account: username },
        { page: 1, pageSize: 20 }
      ),
    ])

    // Convert posts iterator to array of BridgePost
    const postsArray: BridgePost[] = []
    for (const post of posts) {
      const postData = dataProvider.getComment({ author: post.author, permlink: post.permlink })
      if (postData) {
        postsArray.push(postData)
      }
    }

    // Convert comments iterator to array of BridgePost
    const commentsArray: BridgePost[] = []
    for (const comment of comments) {
      const commentData = dataProvider.getComment({ author: comment.author, permlink: comment.permlink })
      if (commentData) {
        commentsArray.push(commentData)
      }
    }

    return {
      profile,
      dbAccount,
      globalProps,
      posts: postsArray,
      comments: commentsArray,
    }
  } catch (error) {
    console.error('Failed to fetch Hive preview data:', error)
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
  // Debounce username changes to avoid fetching on every keystroke
  const [debouncedUsername, setDebouncedUsername] = createSignal(username())
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Watch for username changes and debounce
  createEffect(() => {
    const newUsername = username()
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      setDebouncedUsername(newUsername)
    }, 500) // 500ms debounce
  })

  return createQuery(() => ({
    queryKey: ['hive-preview', debouncedUsername(), postsPerPage()] as const,
    queryFn: () => fetchHivePreviewData(debouncedUsername() || '', postsPerPage()),
    enabled: enabled() && !!debouncedUsername(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  }))
}
