// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import type { Accessor } from 'solid-js'
import type { AuthUser } from '../../../auth'
import { showToast } from '../../../ui'
import { broadcastConfigToHive, getConfigUrlSync, loadConfigFromHive } from '../../hive-broadcast'
import { settings_to_record, strip_community_fields } from '../../types/index'
import { setHasUnsavedChanges, syncSettingsToStore } from '../../store'
import { getSettingsSnapshot } from '../../queries'
import { is_community_mode } from '../../queries'
import type { SettingsData } from '../../types/index'

/**
 * Handle broadcast config to Hive blockchain
 */
export async function handle_broadcast_to_hive(
  user: AuthUser | null,
  setBroadcasting: (val: boolean) => void,
  setShowLoginModal: (val: boolean) => void
) {
  if (!user) {
    setShowLoginModal(true)
    return
  }

  setBroadcasting(true)
  try {
    const settings_to_save = getSettingsSnapshot()
    const result = await broadcastConfigToHive(settings_to_save, user.username, user.privateKey)
    if (result.success && result.permlink) {
      const action = result.isUpdate ? 'Updated' : 'Published'
      const url = getConfigUrlSync(user.username, result.permlink)
      showToast('Broadcasting... waiting for confirmation', 'success')

      setTimeout(() => {
        setHasUnsavedChanges(false)
        showToast(`${action} config on Hive! View at: ${url}`, 'success')
      }, 5000)
    } else {
      showToast(`Failed: ${result.error}`, 'error')
    }
  } catch (error) {
    showToast(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
  } finally {
    setBroadcasting(false)
  }
}

/**
 * Handle JSON preview with diff calculation
 */
export async function handle_preview_json(
  owner_username: string | undefined,
  setLoading: (val: boolean) => void,
  setShowPreview: (val: boolean) => void,
  setDiffViewMode: (mode: 'diff' | 'old' | 'new') => void,
  setJsonNewContent: (content: Record<string, unknown> | null) => void,
  setJsonOldContent: (content: Record<string, unknown> | null) => void,
  setJsonPreviewContent: (content: string) => void,
  setJsonDiff: (diff: Array<{ key: string; oldValue: unknown; newValue: unknown; type: 'changed' | 'added' | 'removed' }>) => void
) {
  if (!owner_username) return

  setLoading(true)
  setShowPreview(true)
  setDiffViewMode('diff')

  try {
    const snapshot = getSettingsSnapshot()
    const new_settings = settings_to_record(snapshot)
    setJsonNewContent(new_settings)
    setJsonPreviewContent(JSON.stringify(new_settings, null, 2))

    const old_settings = await loadConfigFromHive(owner_username) as Record<string, unknown> | null
    setJsonOldContent(old_settings)

    if (old_settings) {
      const diff = calculate_diff(old_settings, new_settings)
      setJsonDiff(diff)
    } else {
      const diff = Object.keys(new_settings).map(key => ({
        key,
        oldValue: undefined,
        newValue: new_settings[key],
        type: 'added' as const
      }))
      setJsonDiff(diff)
    }
  } catch (error) {
    if (import.meta.env.DEV) console.error('Failed to load old config:', error)
    showToast('Failed to load old config from Hive', 'error')
  } finally {
    setLoading(false)
  }
}

/**
 * Calculate diff between two objects
 */
export function calculate_diff(
  old_obj: Record<string, unknown>,
  new_obj: Record<string, unknown>
): Array<{ key: string; oldValue: unknown; newValue: unknown; type: 'changed' | 'added' | 'removed' }> {
  const diff: Array<{ key: string; oldValue: unknown; newValue: unknown; type: 'changed' | 'added' | 'removed' }> = []
  const all_keys = new Set([...Object.keys(old_obj), ...Object.keys(new_obj)])

  for (const key of all_keys) {
    const old_val = old_obj[key]
    const new_val = new_obj[key]
    const old_str = JSON.stringify(old_val)
    const new_str = JSON.stringify(new_val)

    if (old_str !== new_str) {
      if (old_val === undefined) {
        diff.push({ key, oldValue: undefined, newValue: new_val, type: 'added' })
      } else if (new_val === undefined) {
        diff.push({ key, oldValue: old_val, newValue: undefined, type: 'removed' })
      } else {
        diff.push({ key, oldValue: old_val, newValue: new_val, type: 'changed' })
      }
    }
  }

  return diff.sort((a, b) => a.key.localeCompare(b.key))
}

/**
 * Download config as JSON file
 */
export function handle_download_config() {
  try {
    const snapshot = getSettingsSnapshot()
    const json_str = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json_str], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hive-blog-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showToast('Config downloaded successfully', 'success')
  } catch (error) {
    showToast('Failed to download config', 'error')
  }
}

/**
 * Save settings to browser local storage
 */
export function handle_save_local_storage() {
  const snapshot = getSettingsSnapshot()
  localStorage.setItem('hive-blog-settings', JSON.stringify(snapshot))
  showToast('Settings saved to local storage', 'success')
}

/**
 * Load settings from browser local storage
 */
export function handle_load_local_storage() {
  const saved = localStorage.getItem('hive-blog-settings')
  if (!saved) {
    showToast('No local settings found', 'error')
    return
  }
  try {
    const parsed: SettingsData = JSON.parse(saved)
    const safe_settings = is_community_mode() ? parsed : strip_community_fields(parsed)
    syncSettingsToStore(safe_settings, true)
    setHasUnsavedChanges(true)
    showToast('Settings loaded from local storage', 'success')
  } catch {
    showToast('Failed to parse local settings', 'error')
  }
}

/**
 * Clear settings from browser local storage
 */
export function handle_clear_local_storage() {
  const saved = localStorage.getItem('hive-blog-settings')
  if (!saved) {
    showToast('No local settings to clear', 'error')
    return
  }
  localStorage.removeItem('hive-blog-settings')
  showToast('Local settings cleared', 'success')
}
