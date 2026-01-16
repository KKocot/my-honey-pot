import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { defaultSettings, migrateCardLayout, themePresets, type SettingsData, type LayoutSection, type ThemeColors } from './types'

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
// Storage Keys
// ============================================

const STORAGE_KEY = 'hive-blog-settings'

// ============================================
// Demo Mode State
// ============================================

let isDemoMode = false

export function isInDemoMode(): boolean {
  return isDemoMode
}

export function setDemoMode(value: boolean): void {
  isDemoMode = value
}

// ============================================
// Local Store for UI State
// ============================================

const [settings, setSettings] = createStore<SettingsData>(defaultSettings)

export { settings }

export function updateSettings(partial: Partial<SettingsData>) {
  setSettings(produce((s) => {
    Object.assign(s, partial)
  }))
}

// Dedicated setter for customColors to ensure SolidJS reactivity
export function setCustomColors(colors: ThemeColors | null) {
  setSettings('customColors', colors)
  if (colors) {
    applyThemeColors(colors)
  }
}

export function updateLayoutSection(sectionId: string, updates: Partial<LayoutSection>) {
  setSettings(produce((s) => {
    const section = s.layoutSections.find((sec) => sec.id === sectionId)
    if (section) {
      Object.assign(section, updates)
    }
  }))
}

export function setLayoutSections(sections: LayoutSection[]) {
  setSettings('layoutSections', sections)
}

// ============================================
// localStorage & cookie helpers
// ============================================

function saveToCookie(data: SettingsData): void {
  if (typeof document !== 'undefined') {
    const json = JSON.stringify(data)
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(json)}; path=/; expires=${expires}; SameSite=Lax`
  }
}

function saveToLocalStorage(data: SettingsData): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  saveToCookie(data)
}

function loadFromLocalStorage(): SettingsData | null {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return null
      }
    }
  }
  return null
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
// API Functions
// ============================================

async function fetchSettings(): Promise<SettingsData> {
  try {
    const res = await fetch('/api/admin/settings')

    if (res.ok) {
      const data: SettingsData = await res.json()
      isDemoMode = false
      const migratedData = migrateSettingsLayouts(data)

      // Use API data if pageLayout exists (even if empty), otherwise use defaults
      // This allows users to intentionally clear all sections
      const pageLayout = data.pageLayout !== undefined ? data.pageLayout : defaultSettings.pageLayout

      const result = {
        ...defaultSettings,
        ...data,
        ...migratedData,
        layoutSections: data.layoutSections?.length ? data.layoutSections : defaultSettings.layoutSections,
        pageLayout,
      } as SettingsData

      return result
    }
    throw new Error('API unavailable')
  } catch (e) {
    console.warn('MongoDB unavailable, using localStorage (demo mode)')
    isDemoMode = true

    const localData = loadFromLocalStorage()
    if (localData) {
      const migratedData = migrateSettingsLayouts(localData)
      // Use localStorage data if pageLayout exists (even if empty), otherwise use defaults
      const pageLayout = localData.pageLayout !== undefined ? localData.pageLayout : defaultSettings.pageLayout

      return {
        ...defaultSettings,
        ...localData,
        ...migratedData,
        layoutSections: localData.layoutSections?.length ? localData.layoutSections : defaultSettings.layoutSections,
        pageLayout,
      } as SettingsData
    }
    return defaultSettings
  }
}

async function saveSettingsToServer(data: SettingsData): Promise<boolean> {
  // Always save to localStorage for demo mode support
  saveToLocalStorage(data)

  // Apply theme colors immediately
  applyThemeColors(getThemeColors(data))

  if (isDemoMode) {
    return true
  }

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    await res.json()
    return res.ok
  } catch {
    return true
  }
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

export function syncSettingsToStore(data: SettingsData) {
  setSettings(produce((s) => {
    Object.assign(s, data)
  }))
  // Apply theme colors from settings
  applyThemeColors(getThemeColors(data))
}
