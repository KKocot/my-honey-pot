// ============================================
// Social Media Integration Types
// ============================================

/**
 * Platform types for social media integrations.
 * Each platform supports embedding via profile URL or individual post URLs.
 */
export type SocialPlatform = 'instagram' | 'x' | 'youtube' | 'tiktok' | 'threads' | 'facebook'

/**
 * Platform metadata for UI display (used in social links)
 */
export interface PlatformInfo {
  id: SocialPlatform
  name: string
  color: string // Brand color
  profilePlaceholder: string // Example profile URL
}

export const platformInfos: Record<SocialPlatform, PlatformInfo> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    profilePlaceholder: 'https://instagram.com/username',
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    color: '#000000',
    profilePlaceholder: 'https://x.com/username',
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    profilePlaceholder: 'https://youtube.com/@channel',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    profilePlaceholder: 'https://tiktok.com/@username',
  },
  threads: {
    id: 'threads',
    name: 'Threads',
    color: '#000000',
    profilePlaceholder: 'https://threads.net/@username',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    profilePlaceholder: 'https://facebook.com/page',
  },
}

// Social media link for author profile
export interface SocialLink {
  platform: SocialPlatform
  url: string
}

// Default social platforms for author profile
export const defaultSocialLinks: SocialLink[] = []
