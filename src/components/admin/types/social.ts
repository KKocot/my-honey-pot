// ============================================
// Social Media Integration Types
// ============================================

/**
 * Platform types for social media integrations.
 * Each platform supports embedding via profile URL or individual post URLs.
 */
export type SocialPlatform = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'threads' | 'facebook' | 'custom'

/**
 * Platform metadata for UI display (used in social links)
 */
export interface PlatformInfo {
  id: SocialPlatform
  name: string
  color: string // Brand color
  profilePlaceholder: string // Example username
  baseUrl?: string // Base URL for the platform (undefined for custom)
  usernamePrefix?: string // Prefix for username (like @ for some platforms)
}

export const platformInfos: Record<SocialPlatform, PlatformInfo> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    profilePlaceholder: 'username',
    baseUrl: 'https://instagram.com/',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    color: '#000000',
    profilePlaceholder: 'username',
    baseUrl: 'https://x.com/',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    profilePlaceholder: 'channel',
    baseUrl: 'https://youtube.com/@',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    profilePlaceholder: 'username',
    baseUrl: 'https://tiktok.com/@',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    color: '#000000',
    profilePlaceholder: 'username',
    baseUrl: 'https://threads.net/@',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    profilePlaceholder: 'page',
    baseUrl: 'https://facebook.com/',
  },
  custom: {
    id: 'custom',
    name: 'Custom Link',
    color: '#6B7280',
    profilePlaceholder: 'https://example.com',
  },
}

/**
 * Social media link for author profile
 * Stores username instead of full URL (except for custom links)
 */
export interface SocialLink {
  platform: SocialPlatform
  username: string // Username/handle for the platform (or full URL for custom)
  url?: string // Deprecated: kept for backward compatibility with old data
}

/**
 * Safe protocols whitelist for URL validation
 */
const SAFE_PROTOCOLS = ['http:', 'https:']

/**
 * Check if URL has a safe protocol (http/https)
 */
function is_safe_url(url: string): boolean {
  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Build full URL from platform and username
 */
export function build_social_url(link: SocialLink): string {
  // Backward compatibility: if old 'url' field exists and is a full URL, validate protocol
  if (link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'))) {
    return is_safe_url(link.url) ? link.url : ''
  }

  // Custom links use username as full URL
  if (link.platform === 'custom') {
    const url = link.username || link.url || ''
    // Auto-prefix https:// if missing protocol
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      const fullUrl = `https://${url}`
      return is_safe_url(fullUrl) ? fullUrl : ''
    }
    return is_safe_url(url) ? url : ''
  }

  // Build URL from base + username
  const info = platformInfos[link.platform]
  if (!info.baseUrl) return ''

  const username = link.username || link.url || ''
  if (!username) return ''

  return `${info.baseUrl}${username}`
}

/**
 * Extract username from full URL (for backward compatibility)
 */
export function extract_username_from_url(url: string, platform: SocialPlatform): string {
  if (platform === 'custom') return url

  const info = platformInfos[platform]
  if (!info.baseUrl) return url

  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname.replace(/^\//, '').replace(/\/$/, '')

    // Remove @ prefix if present
    return pathname.startsWith('@') ? pathname.slice(1) : pathname
  } catch {
    return url
  }
}

/**
 * Validate username format (no URLs, no spaces, basic sanitization)
 */
export function is_valid_username(username: string, platform: SocialPlatform): boolean {
  if (!username) return true // Empty is OK

  // Custom links can be any valid URL (check protocol safety)
  if (platform === 'custom') {
    if (username.includes(' ')) return false
    // If looks like URL, validate protocol
    if (username.startsWith('http://') || username.startsWith('https://')) {
      return is_safe_url(username)
    }
    // If no protocol, will be auto-prefixed with https:// - just check no spaces
    return true
  }

  // Check if user accidentally pasted a full URL
  if (username.startsWith('http://') || username.startsWith('https://') || username.startsWith('www.')) {
    return false
  }

  // Block path traversal attempts
  if (username.includes('..')) {
    return false
  }

  // Block starting with dot or dash (potential path traversal)
  if (username.startsWith('.') || username.startsWith('-')) {
    return false
  }

  // No spaces, alphanumeric + underscore/dash/dot (but dot not allowed at start due to check above)
  // Safer regex: must start with alphanumeric or @, then can contain alphanumeric, dot, dash, underscore
  const validPattern = /^@?[a-zA-Z0-9][a-zA-Z0-9._-]*$/
  return validPattern.test(username)
}
