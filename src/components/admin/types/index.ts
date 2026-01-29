// ============================================
// Barrel file - re-exports all types
// ============================================

// Re-export constants for use in components
import { LAYOUT_CONSTANTS, COMMENT_CONSTANTS } from '../../../lib/config'
export { LAYOUT_CONSTANTS, COMMENT_CONSTANTS }

// Theme types and presets
export * from './theme'

// Layout types and helpers
export * from './layout'

// Navigation types
export * from './navigation'

// Social media types
export * from './social'

// Settings data structure
export * from './settings'

// Website templates
export * from './templates'
