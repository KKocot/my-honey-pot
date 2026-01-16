// ============================================
// Re-export from queries.ts for backward compatibility
// ============================================

export {
  settings,
  updateSettings,
  setCustomColors,
  updateLayoutSection,
  setLayoutSections,
  isInDemoMode,
  queryClient,
  queryKeys,
  useSettingsQuery,
  useSaveSettingsMutation,
  syncSettingsToStore,
} from './queries'
