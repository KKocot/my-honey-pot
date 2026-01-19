import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { defaultSettings, migrateCardLayout, themePresets, type SettingsData, type LayoutSection, type ThemeColors } from './types'
import { loadConfigFromHive } from './hive-broadcast'
import { setHasUnsavedChanges } from './AdminPanel'
import { HIVE_API_ENDPOINTS } from '../../lib/config'
import {
  formatCompactNumber,
  formatJoinDate,
  parseVests,
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

// NAI Asset format from database_api
interface NaiAsset {
  amount: string
  precision: number
  nai: string
}

// Profile data from bridge.get_profile
export interface HiveBridgeProfile {
  name: string
  created: string
  post_count: number
  reputation: number
  stats: {
    followers: number
    following: number
    rank: number
  }
  metadata: {
    profile?: {
      name?: string
      about?: string
      location?: string
      website?: string
      profile_image?: string
      cover_image?: string
    }
  }
}

// Database account data from database_api.find_accounts
export interface HiveDatabaseAccount {
  name: string
  balance: NaiAsset
  hbd_balance: NaiAsset
  vesting_shares: NaiAsset
  delegated_vesting_shares: NaiAsset
  received_vesting_shares: NaiAsset
  post_count: number
  curation_rewards: number
  posting_rewards: number
}

// Global properties for VESTS to HP conversion
export interface HiveGlobalProps {
  total_vesting_fund_hive: NaiAsset
  total_vesting_shares: NaiAsset
}

export interface HiveData {
  profile: HiveBridgeProfile | null
  dbAccount: HiveDatabaseAccount | null
  globalProps: HiveGlobalProps | null
  posts: HivePost[]
}

// ============================================
// Hive API Client with Fallback (uses config endpoints)
// ============================================

let currentEndpointIndex = 0
let lastCheckedEndpoint: string | null = null

/**
 * Check if an API endpoint is healthy
 */
async function checkEndpointHealth(endpoint: string): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'database_api.get_dynamic_global_properties',
        params: {},
        id: 1,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    if (!response.ok) return false

    const data = await response.json()
    return !!data.result
  } catch {
    return false
  }
}

/**
 * Get a working API endpoint with fallback
 */
async function getWorkingEndpoint(): Promise<string> {
  const currentEndpoint = HIVE_API_ENDPOINTS[currentEndpointIndex]

  if (lastCheckedEndpoint === currentEndpoint) {
    return currentEndpoint
  }

  if (await checkEndpointHealth(currentEndpoint)) {
    lastCheckedEndpoint = currentEndpoint
    return currentEndpoint
  }

  for (let i = 0; i < HIVE_API_ENDPOINTS.length; i++) {
    const endpoint = HIVE_API_ENDPOINTS[i]
    if (endpoint === currentEndpoint) continue

    if (await checkEndpointHealth(endpoint)) {
      currentEndpointIndex = i
      lastCheckedEndpoint = endpoint
      console.log(`Switched to API endpoint: ${endpoint}`)
      return endpoint
    }
  }

  console.warn('No healthy API endpoints found, using first endpoint')
  return HIVE_API_ENDPOINTS[0]
}

/**
 * Make a fetch request with automatic endpoint fallback and retry
 */
async function fetchWithFallback(body: object, retries = 2): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const endpoint = await getWorkingEndpoint()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return response
      }

      const isTimeout = false // Response received but not ok
      console.warn(`API request failed (attempt ${attempt + 1}/${retries + 1}), switching endpoint...`)
      lastCheckedEndpoint = null
      currentEndpointIndex = (currentEndpointIndex + 1) % HIVE_API_ENDPOINTS.length
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      const isTimeout = lastError.message.includes('abort') || lastError.name === 'AbortError'

      if (isTimeout) {
        console.warn(`API request timed out (attempt ${attempt + 1}/${retries + 1}), switching endpoint...`)
      }

      lastCheckedEndpoint = null
      currentEndpointIndex = (currentEndpointIndex + 1) % HIVE_API_ENDPOINTS.length
    }
  }

  throw lastError || new Error('All API endpoints failed')
}

// ============================================
// Helper functions for parsing Hive data
// Uses parseVests from blog-logic where possible
// ============================================

/**
 * Parse NAI asset format to number
 */
function parseNaiAsset(asset: NaiAsset): number {
  return parseInt(asset.amount) / Math.pow(10, asset.precision)
}

/**
 * Calculate effective Hive Power from vesting shares
 */
export function calculateEffectiveHivePower(
  vestingShares: NaiAsset,
  delegatedVestingShares: NaiAsset,
  receivedVestingShares: NaiAsset,
  globalProps: HiveGlobalProps
): number {
  const own = parseNaiAsset(vestingShares)
  const delegated = parseNaiAsset(delegatedVestingShares)
  const received = parseNaiAsset(receivedVestingShares)
  const effectiveVests = own - delegated + received

  const fundHive = parseNaiAsset(globalProps.total_vesting_fund_hive)
  const totalShares = parseNaiAsset(globalProps.total_vesting_shares)
  if (totalShares === 0) return 0

  return effectiveVests * (fundHive / totalShares)
}

// Re-export utilities from blog-logic for convenience
export { formatCompactNumber, formatJoinDate }

// ============================================
// Hive Preview Data Fetcher (using bridge.get_profile - no condenser_api)
// Uses fetchWithFallback for automatic endpoint switching
// ============================================

async function fetchHivePreviewData(username: string, postsPerPage: number): Promise<HiveData | null> {
  if (!username) return null

  try {
    // Fetch profile, database account, global props, and posts in parallel
    // Uses bridge.get_profile (includes followers/following in stats)
    // Uses database_api.find_accounts for financial data
    // Uses database_api.get_dynamic_global_properties for VESTS to HP conversion
    const [profileRes, dbAccountRes, globalPropsRes, postsRes] = await Promise.all([
      fetchWithFallback({
        jsonrpc: '2.0',
        method: 'bridge.get_profile',
        params: { account: username, observer: '' },
        id: 1,
      }),
      fetchWithFallback({
        jsonrpc: '2.0',
        method: 'database_api.find_accounts',
        params: { accounts: [username] },
        id: 2,
      }),
      fetchWithFallback({
        jsonrpc: '2.0',
        method: 'database_api.get_dynamic_global_properties',
        params: {},
        id: 3,
      }),
      fetchWithFallback({
        jsonrpc: '2.0',
        method: 'bridge.get_account_posts',
        params: { sort: 'blog', account: username, limit: postsPerPage },
        id: 4,
      }),
    ])

    const [profileData, dbAccountData, globalPropsData, postsData] = await Promise.all([
      profileRes.json(),
      dbAccountRes.json(),
      globalPropsRes.json(),
      postsRes.json(),
    ])

    const profile: HiveBridgeProfile | null = profileData.result || null
    const dbAccount: HiveDatabaseAccount | null = dbAccountData.result?.accounts?.[0] || null
    const globalProps: HiveGlobalProps | null = globalPropsData.result || null
    const posts: HivePost[] = postsData.result || []

    return { profile, dbAccount, globalProps, posts }
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
