// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { createSignal, createEffect, onCleanup } from 'solid-js'
import { defaultSettings, migrateCardLayout, themePresets, ALL_PAGE_ELEMENT_IDS, settingsToRecord, type SettingsData, type LayoutSection, type ThemeColors, type PageLayout } from './types/index'
import { loadConfigFromHive } from './hive-broadcast'

// Import from store.ts to avoid circular dependency with AdminPanel
// Note: setHasUnsavedChanges is defined in store.ts and re-exported here
import { setHasUnsavedChanges } from './store'
import {
  DataProvider,
  getWax,
  formatJoinDate,
  calculateEffectiveHP,
  type IProfile,
  type IDatabaseAccount,
  type IGlobalProperties,
  type BridgePost,
  type NaiAsset,
} from '@hiveio/workerbee/blog-logic'
import { formatCompactNumber } from '../../shared/formatters'

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

// Export a plain object copy of settings for serialization
// SolidJS store proxies may not serialize correctly with JSON.stringify
export function getSettingsSnapshot(): SettingsData {
  return JSON.parse(JSON.stringify(settings)) as SettingsData
}

/**
 * Debounce manager using closure pattern to prevent race conditions
 * Each call merges updates and schedules a single batch commit
 */
const createUpdateDebouncer = () => {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: Partial<SettingsData> = {}

  const debounce = (partial: Partial<SettingsData>) => {
    // Merge pending updates
    pending = { ...pending, ...partial }

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      const toApply = pending
      pending = {}
      timer = null

      setSettings(produce((s) => {
        Object.assign(s, toApply)
      }))
      setHasUnsavedChanges(true)
    }, 16) // ~1 frame (60fps)
  }

  debounce.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    pending = {}
  }

  return debounce
}

const debouncedUpdate = createUpdateDebouncer()

/**
 * Update settings with debouncing to prevent race conditions when multiple
 * components update settings simultaneously.
 * Batches updates within ~16ms (1 frame at 60fps).
 */
export function updateSettings(partial: Partial<SettingsData>) {
  debouncedUpdate(partial)
}

/**
 * Update settings immediately without debouncing.
 * Use for blur-commit inputs where the store must be in sync
 * before createEffect re-syncs the local input value.
 */
export function updateSettingsImmediate(partial: Partial<SettingsData>) {
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

  // Only migrate layouts that exist and are valid - migrateCardLayout returns null for invalid
  const migratedPost = migrateCardLayout(data.postCardLayout)
  if (migratedPost) {
    result.postCardLayout = migratedPost
  }

  const migratedComment = migrateCardLayout(data.commentCardLayout)
  if (migratedComment) {
    result.commentCardLayout = migratedComment
  }

  const migratedAuthorProfile = migrateCardLayout(data.authorProfileLayout2)
  if (migratedAuthorProfile) {
    result.authorProfileLayout2 = migratedAuthorProfile
  }

  return result
}

// Filter out obsolete page elements from loaded pageLayout
function migratePageLayout(pageLayout: PageLayout | undefined): PageLayout {
  if (!pageLayout) return defaultSettings.pageLayout

  const validElementIds = new Set(ALL_PAGE_ELEMENT_IDS)

  return {
    sections: pageLayout.sections.map(section => ({
      ...section,
      elements: section.elements.filter(el => validElementIds.has(el))
    }))
  }
}

// ============================================
// Current user for Hive config loading
// ============================================

const [currentUsername, setCurrentUsername] = createSignal<string | null>(null)

export { currentUsername, setCurrentUsername }

// ============================================
// API Functions
// ============================================

// Track if we had API error
let lastFetchError: string | null = null

export function getLastFetchError(): string | null {
  return lastFetchError
}

function clearFetchError(): void {
  lastFetchError = null
}

async function fetchSettings(): Promise<SettingsData> {
  lastFetchError = null

  // Load from Hive if user is logged in
  if (currentUsername()) {
    try {
      const hiveConfig = await loadConfigFromHive(currentUsername()!)
      if (hiveConfig) {
        const migratedData = migrateSettingsLayouts(hiveConfig)
        // Migrate pageLayout to filter out obsolete elements like 'comments'
        const pageLayout = migratePageLayout(hiveConfig.pageLayout)

        // Build final settings - start with defaults, then overlay hiveConfig (excluding undefined values)
        const finalSettings: SettingsData = { ...defaultSettings }

        // Apply hiveConfig values, but skip undefined/null to keep defaults
        const hiveConfigRecord = settingsToRecord(hiveConfig as SettingsData)
        for (const key of Object.keys(hiveConfig) as (keyof SettingsData)[]) {
          if (hiveConfig[key] !== undefined && hiveConfig[key] !== null) {
            const finalRecord = settingsToRecord(finalSettings)
            finalRecord[key] = hiveConfigRecord[key]
            Object.assign(finalSettings, { [key]: hiveConfigRecord[key] })
          }
        }

        // Apply migrated layouts (these are already validated to exist)
        Object.assign(finalSettings, migratedData)

        // Ensure layoutSections and pageLayout have proper values
        if (!finalSettings.layoutSections?.length) {
          finalSettings.layoutSections = defaultSettings.layoutSections
        }
        // Use migrated pageLayout (obsolete elements filtered out)
        finalSettings.pageLayout = pageLayout

        // Ensure authorProfileLayout2 has sections
        if (!finalSettings.authorProfileLayout2?.sections?.length) {
          finalSettings.authorProfileLayout2 = defaultSettings.authorProfileLayout2
        }

        // Ensure postCardLayout has sections
        if (!finalSettings.postCardLayout?.sections?.length) {
          finalSettings.postCardLayout = defaultSettings.postCardLayout
        }

        // Ensure commentCardLayout has sections
        if (!finalSettings.commentCardLayout?.sections?.length) {
          finalSettings.commentCardLayout = defaultSettings.commentCardLayout
        }

        return finalSettings
      }
    } catch (error) {
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
    if (import.meta.env.DEV) console.error('Failed to fetch Hive preview data:', error)
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

    onCleanup(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
    })
  })

  return createQuery(() => ({
    queryKey: ['hive-preview', debouncedUsername(), postsPerPage()] as const,
    queryFn: () => fetchHivePreviewData(debouncedUsername() || '', postsPerPage()),
    enabled: enabled() && !!debouncedUsername(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 1,
  }))
}
