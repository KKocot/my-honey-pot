// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { createSignal, createEffect, onCleanup } from 'solid-js'
import { get_default_settings, themePresets, type SettingsData, type LayoutSection, type ThemeColors } from './types/index'
import { load_and_prepare_config } from '../../lib/config-pipeline'

// Import from store.ts to avoid circular dependency with AdminPanel
// Note: setHasUnsavedChanges is defined in store.ts and re-exported here
import { setHasUnsavedChanges } from './store'
import {
  configureEndpoints,
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
import { HIVE_API_ENDPOINTS, IS_COMMUNITY, is_community } from '../../lib/config'
import {
  fetch_community,
  fetch_community_posts,
  type FetchCommunityPostsResult,
} from '../../lib/queries'
import type { HiveCommunity } from '../../lib/types/community'
import { is_dark_color } from '../../shared/utils/color'

// Configure workerbee to use our custom Hive API endpoints
configureEndpoints(HIVE_API_ENDPOINTS)
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

  // Set data-theme-mode for CSS selectors (syntax highlighting, etc.)
  root.dataset.themeMode = is_dark_color(colors.bg) ? "dark" : "light";
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

// Always init with user defaults (false). IS_COMMUNITY relies on HIVE_USERNAME env var
// which is stripped client-side (no PUBLIC_ prefix). AdminPanel onMount overwrites
// the store with correct SSR-provided settings including proper community defaults.
const [settings, setSettings] = createStore<SettingsData>(get_default_settings(false))

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
// Owner context for correct community mode detection client-side
// ============================================
// IS_COMMUNITY from config.ts uses env vars that may not be available
// in the browser (non-PUBLIC_ vars are stripped by Astro/Vite).
// This signal receives the owner username from AdminPanel props
// (which come from the server) so we can detect community mode correctly.

const [ownerContext, setOwnerContextInternal] = createSignal<string>('')

/** Set the blog owner username (called once from AdminPanel onMount) */
export function setOwnerContext(username: string): void {
  setOwnerContextInternal(username)
}

/** Detect community mode from owner context (reliable client-side) */
export function is_community_mode(): boolean {
  const owner = ownerContext()
  return owner ? is_community(owner) : IS_COMMUNITY
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

  // Load from Hive through unified pipeline if user is logged in
  const username = currentUsername()
  if (username) {
    try {
      return await load_and_prepare_config(username, is_community_mode())
    } catch (error) {
      lastFetchError = error instanceof Error ? error.message : 'Failed to connect to Hive API'
      throw new Error(`Hive API error: ${lastFetchError}. Please refresh the page.`)
    }
  }

  return get_default_settings(is_community_mode())
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

// ============================================
// Community Preview Data
// ============================================

export interface CommunityPreviewData {
  community: HiveCommunity | null
  posts: BridgePost[]
}

async function fetchCommunityPreviewData(
  community_name: string,
  posts_per_page: number
): Promise<CommunityPreviewData | null> {
  if (!community_name) return null

  try {
    const [community, posts_result] = await Promise.all([
      fetch_community(community_name),
      fetch_community_posts(community_name, 'trending', posts_per_page),
    ])

    return {
      community,
      posts: posts_result.posts,
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to fetch community preview data:', error)
    return null
  }
}

// ============================================
// Community Preview Query Hook
// ============================================

export function useCommunityPreviewQuery(
  community_name: () => string | undefined,
  posts_per_page: () => number,
  enabled: () => boolean
) {
  const [debouncedName, setDebouncedName] = createSignal(community_name())
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  createEffect(() => {
    const name = community_name()
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      setDebouncedName(name)
    }, 500)

    onCleanup(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
    })
  })

  return createQuery(() => ({
    queryKey: ['community-preview', debouncedName(), posts_per_page()] as const,
    queryFn: () => fetchCommunityPreviewData(debouncedName() || '', posts_per_page()),
    enabled: enabled() && !!debouncedName(),
    staleTime: 1000 * 60 * 2,
    retry: 1,
  }))
}
