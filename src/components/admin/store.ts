// ============================================
// Re-export from queries.ts for backward compatibility
// ============================================

export {
  settings,
  updateSettings,
  setCustomColors,
  updateLayoutSection,
  setLayoutSections,
  queryClient,
  queryKeys,
  useSettingsQuery,
  useSaveSettingsMutation,
  syncSettingsToStore,
  isSettingsLoaded,
  setCurrentUsername,
  getLastFetchError,
  clearFetchError,
} from './queries'
