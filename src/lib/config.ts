// ============================================
// Application Configuration
// ============================================

// Helper to get env variable from both client and server contexts
const getEnv = (key: string, fallback: string): string => {
  // import.meta.env works in dev and client-side (Vite)
  // process.env works in Node.js SSR
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string
  }
  return fallback
}

// Hive API Endpoints
// import.meta.env works in dev and client-side, process.env only works in Node.js SSR
export const HIVE_API_ENDPOINT = getEnv('HIVE_API_ENDPOINT', 'https://api.openhive.network')

// Blog owner username (determines whose config to load and favicon)
export const HIVE_USERNAME = getEnv('HIVE_USERNAME', '')

// Config storage settings (where user configs are stored on Hive)
// These can be overridden via environment variables
export const CONFIG_PARENT_AUTHOR = getEnv('CONFIG_PARENT_AUTHOR', 'barddev')
export const CONFIG_PARENT_PERMLINK = getEnv('CONFIG_PARENT_PERMLINK', 'my-blog-configs')

// Fallback API endpoints for retry logic (ordered by preference)
export const HIVE_API_ENDPOINTS = [
  'https://api.openhive.network',
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://hive-api.arcange.eu',
  'https://api.syncad.com',
]

// Layout Constants
export const LAYOUT_CONSTANTS = {
  HEADER_MAX_WIDTH_PX: { min: 800, max: 1920, default: 1280 },
  SIDEBAR_WIDTH_PX: { min: 200, max: 400, default: 280 },
  CARD_GAP_PX: { min: 0, max: 64, default: 24 },
  CARD_PADDING_PX: { min: 0, max: 64, default: 24 },
  CARD_BORDER_RADIUS_PX: { min: 0, max: 48, default: 16 },
  TITLE_SIZE_PX: { min: 12, max: 48, default: 20 },
  THUMBNAIL_SIZE_PX: { min: 32, max: 400, default: 96 },
  AVATAR_SIZE_PX: { min: 32, max: 128, default: 64 },
  GRID_COLUMNS: { min: 1, max: 4, default: 2 },
  POSTS_PER_PAGE: { min: 5, max: 50, default: 20 },
  SUMMARY_MAX_LENGTH: { min: 50, max: 500, default: 150 },
  MAX_TAGS: { min: 1, max: 10, default: 5 },
} as const

// Comment Settings Constants
export const COMMENT_CONSTANTS = {
  AVATAR_SIZE_PX: { min: 24, max: 64, default: 40 },
  PADDING_PX: { min: 8, max: 32, default: 16 },
  GAP_PX: { min: 0, max: 64, default: 16 },
  MAX_LENGTH: { min: 0, max: 1000, default: 0 },
} as const
