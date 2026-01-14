import { createStore, produce } from 'solid-js/store'
import { defaultSettings, type SettingsData, type LayoutSection } from './types'

// ============================================
// Admin Settings Store
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

export async function loadSettings(): Promise<void> {
  try {
    const res = await fetch('/api/admin/settings')
    const data: SettingsData = await res.json()
    setSettings(produce((s) => {
      Object.assign(s, {
        ...defaultSettings,
        ...data,
        layoutSections: data.layoutSections?.length ? data.layoutSections : defaultSettings.layoutSections,
      })
    }))
    document.documentElement.setAttribute('data-theme', data.siteTheme || 'light')
  } catch (e) {
    console.error('Błąd ładowania ustawień:', e)
  }
}

export async function saveSettings(): Promise<boolean> {
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
    return false
  }
}
