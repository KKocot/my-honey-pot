/**
 * AuthorProfile types - shared between Astro and SolidJS
 */

import type { CardLayout, SocialLink } from '../../../components/home/types'

/**
 * Normalized profile data - framework-agnostic
 */
export interface AuthorProfileData {
  username: string
  displayName: string
  about: string
  location: string
  website: string
  coverImage: string
  avatarUrl: string
  reputation: number
  followers: number
  following: number
  postCount: number
  joinDate: string // Formatted date string
  hivePower: number
  votingPower: number
  hiveBalance: number
  hbdBalance: number
}

/**
 * Profile display settings
 */
export interface AuthorProfileSettings {
  layout: CardLayout
  avatarSize: number
  coverHeight: number
  usernameSize: number
  displayNameSize: number
  aboutSize: number
  statsSize: number
  metaSize: number
  socialLinks: SocialLink[]
}

/**
 * Default layout for author profile
 */
export const defaultAuthorProfileLayout: CardLayout = {
  sections: [
    { id: 'sec-1', orientation: 'horizontal', children: [{ type: 'element', id: 'coverImage' }] },
    { id: 'sec-2', orientation: 'horizontal', children: [{ type: 'element', id: 'avatar' }, { type: 'element', id: 'username' }, { type: 'element', id: 'reputation' }] },
    { id: 'sec-3', orientation: 'vertical', children: [{ type: 'element', id: 'displayName' }, { type: 'element', id: 'about' }] },
    { id: 'sec-4', orientation: 'horizontal', children: [{ type: 'element', id: 'location' }, { type: 'element', id: 'website' }, { type: 'element', id: 'joinDate' }] },
    { id: 'sec-5', orientation: 'horizontal', children: [{ type: 'element', id: 'followers' }, { type: 'element', id: 'following' }, { type: 'element', id: 'postCount' }] },
  ],
}

/**
 * Default settings for author profile
 */
export const defaultAuthorProfileSettings: Omit<AuthorProfileSettings, 'layout' | 'socialLinks'> = {
  avatarSize: 64,
  coverHeight: 64,
  usernameSize: 14,
  displayNameSize: 18,
  aboutSize: 14,
  statsSize: 14,
  metaSize: 12,
}
