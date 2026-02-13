// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

// ============================================
// Shared state that needs to be imported by both
// AdminPanel and queries to avoid circular dependencies
// ============================================

import { createSignal } from 'solid-js'

// Track if user has made changes since last save (reactive signal)
const [hasUnsavedChanges, setHasUnsavedChangesInternal] = createSignal(false)

/**
 * Set whether there are unsaved changes in the admin panel.
 * Used by queries.ts when settings are modified.
 */
export function setHasUnsavedChanges(value: boolean): void {
  setHasUnsavedChangesInternal(value)
}

/**
 * Check if there are unsaved changes.
 * Used by AdminPanel to show warning before leaving.
 */
export function getHasUnsavedChanges(): boolean {
  return hasUnsavedChanges()
}

// Export the signal itself for components that want to use it reactively
export { hasUnsavedChanges }

// ============================================
// Re-export from queries.ts for backward compatibility
// NOTE: These imports must come AFTER the exports above
// to avoid circular dependency issues
// TODO: Consider extracting hasUnsavedChanges to separate file (unsaved-state.ts)
// if circular dependency becomes problematic in future
// ============================================

export {
  settings,
  updateSettings,
  updateSettingsImmediate,
  setCustomColors,
  updateLayoutSection,
  setLayoutSections,
  queryClient,
  queryKeys,
  useSettingsQuery,
  syncSettingsToStore,
  setCurrentUsername,
  setOwnerContext,
  getLastFetchError,
} from './queries'
