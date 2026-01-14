import { QueryClient, createQuery, createMutation, useQueryClient } from '@tanstack/solid-query'
import { createStore, produce } from 'solid-js/store'
import { defaultSettings, migrateCardLayout, type SettingsData, type LayoutSection } from './types'

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
      return {
        ...defaultSettings,
        ...data,
        ...migratedData,
        layoutSections: data.layoutSections?.length ? data.layoutSections : defaultSettings.layoutSections,
        pageLayout: data.pageLayout?.sections?.length ? data.pageLayout : defaultSettings.pageLayout,
      } as SettingsData
    }
    throw new Error('API unavailable')
  } catch (e) {
    console.warn('MongoDB unavailable, using localStorage (demo mode)')
    isDemoMode = true

    const localData = loadFromLocalStorage()
    if (localData) {
      const migratedData = migrateSettingsLayouts(localData)
      return {
        ...defaultSettings,
        ...localData,
        ...migratedData,
        layoutSections: localData.layoutSections?.length ? localData.layoutSections : defaultSettings.layoutSections,
        pageLayout: localData.pageLayout?.sections?.length ? localData.pageLayout : defaultSettings.pageLayout,
      } as SettingsData
    }
    return defaultSettings
  }
}

async function saveSettingsToServer(data: SettingsData): Promise<boolean> {
  // Always save to localStorage for demo mode support
  saveToLocalStorage(data)

  if (isDemoMode) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', data.siteTheme)
    }
    return true
  }

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', data.siteTheme)
      }
      return true
    }
    return false
  } catch {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', data.siteTheme)
    }
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
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', data.siteTheme || 'light')
  }
}
