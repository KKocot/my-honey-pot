import { createStore, produce } from 'solid-js/store'
import { defaultSettings, type SettingsData, type LayoutSection } from './types'

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEY = 'hive-blog-settings'

// ============================================
// Demo Mode Detection
// ============================================

let isDemoMode = false

export function isInDemoMode(): boolean {
  return isDemoMode
}

// ============================================
// Admin Settings Store
// ============================================

const [settings, setSettings] = createStore<SettingsData>(defaultSettings)

export { settings }

// ============================================
// Settings Operations
// ============================================

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
    // Save to cookie so SSR can read it (demo mode)
    const json = JSON.stringify(data)
    // Cookie expires in 1 year
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(json)}; path=/; expires=${expires}; SameSite=Lax`
  }
}

function saveToLocalStorage(data: SettingsData): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  // Also sync to cookie for SSR access
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
// Load Settings (API with localStorage fallback)
// ============================================

export async function loadSettings(): Promise<void> {
  try {
    const res = await fetch('/api/admin/settings')

    if (res.ok) {
      const data: SettingsData = await res.json()
      isDemoMode = false
      setSettings(produce((s) => {
        Object.assign(s, {
          ...defaultSettings,
          ...data,
          layoutSections: data.layoutSections?.length ? data.layoutSections : defaultSettings.layoutSections,
          pageLayout: data.pageLayout?.sections?.length ? data.pageLayout : defaultSettings.pageLayout,
        })
      }))
      document.documentElement.setAttribute('data-theme', data.siteTheme || 'light')
    } else {
      // API failed - use localStorage (demo mode)
      throw new Error('API unavailable')
    }
  } catch (e) {
    console.warn('MongoDB unavailable, using localStorage (demo mode)')
    isDemoMode = true

    const localData = loadFromLocalStorage()
    if (localData) {
      setSettings(produce((s) => {
        Object.assign(s, {
          ...defaultSettings,
          ...localData,
          layoutSections: localData.layoutSections?.length ? localData.layoutSections : defaultSettings.layoutSections,
          pageLayout: localData.pageLayout?.sections?.length ? localData.pageLayout : defaultSettings.pageLayout,
        })
      }))
      document.documentElement.setAttribute('data-theme', localData.siteTheme || 'light')
    }
  }
}

// ============================================
// Save Settings (API with localStorage fallback)
// ============================================

export async function saveSettings(): Promise<boolean> {
  // Always save to localStorage for demo mode support
  saveToLocalStorage(settings as SettingsData)

  if (isDemoMode) {
    // In demo mode, just use localStorage
    document.documentElement.setAttribute('data-theme', settings.siteTheme)
    return true
  }

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })

    if (res.ok) {
      document.documentElement.setAttribute('data-theme', settings.siteTheme)
      return true
    }
    return false
  } catch {
    // API failed - already saved to localStorage
    document.documentElement.setAttribute('data-theme', settings.siteTheme)
    return true
  }
}
