/**
 * AuthorProfile utilities - data transformation functions
 */

import type { IProfile, IDatabaseAccount, IGlobalProperties, IAccountManabars } from '../../../lib/blog-logic'
import { calculateEffectiveHP, parseFormattedAsset } from '../../../lib/blog-logic'
import { formatJoinDate } from '../../formatters'
import type { AuthorProfileData, AuthorProfileSettings } from './types'
import type { CardLayout, SocialLink } from '../../../components/home/types'
import { defaultAuthorProfileLayout, defaultAuthorProfileSettings } from './types'

/**
 * Create normalized profile data from Hive API responses
 * Used by both Astro (SSR) and SolidJS (FullPreview)
 */
export function createAuthorProfileData(
  username: string,
  profile: IProfile | null,
  account: IDatabaseAccount | null,
  globalProperties: IGlobalProperties | null,
  manabars: IAccountManabars | null
): AuthorProfileData {
  const profileMeta = profile?.metadata

  // Calculate HP
  let hivePower = 0
  if (globalProperties && account) {
    hivePower = calculateEffectiveHP(
      account.vestingShares,
      account.delegatedVestingShares,
      account.receivedVestingShares,
      globalProperties
    )
  }

  return {
    username,
    displayName: profileMeta?.name || profile?.name || username,
    about: profileMeta?.about || '',
    location: profileMeta?.location || '',
    website: profileMeta?.website || '',
    coverImage: profileMeta?.coverImage || '',
    avatarUrl: profileMeta?.profileImage || `https://images.hive.blog/u/${username}/avatar`,
    reputation: profile?.reputation ?? 0,
    followers: profile?.stats?.followers ?? 0,
    following: profile?.stats?.following ?? 0,
    postCount: account?.postCount ?? profile?.postCount ?? 0,
    joinDate: profile?.created ? formatJoinDate(profile.created) : 'Unknown',
    hivePower,
    votingPower: manabars?.upvote?.percent ?? 0,
    hiveBalance: account ? parseFormattedAsset(account.balance) : 0,
    hbdBalance: account ? parseFormattedAsset(account.hbdBalance) : 0,
  }
}

/**
 * Create profile settings from partial settings object
 */
export function createAuthorProfileSettings(settings: {
  authorProfileLayout2?: CardLayout
  authorAvatarSizePx?: number
  authorCoverHeightPx?: number
  authorUsernameSizePx?: number
  authorDisplayNameSizePx?: number
  authorAboutSizePx?: number
  authorStatsSizePx?: number
  authorMetaSizePx?: number
  socialLinks?: SocialLink[]
}): AuthorProfileSettings {
  return {
    layout: settings.authorProfileLayout2 ?? defaultAuthorProfileLayout,
    avatarSize: settings.authorAvatarSizePx ?? defaultAuthorProfileSettings.avatarSize,
    coverHeight: settings.authorCoverHeightPx ?? defaultAuthorProfileSettings.coverHeight,
    usernameSize: settings.authorUsernameSizePx ?? defaultAuthorProfileSettings.usernameSize,
    displayNameSize: settings.authorDisplayNameSizePx ?? defaultAuthorProfileSettings.displayNameSize,
    aboutSize: settings.authorAboutSizePx ?? defaultAuthorProfileSettings.aboutSize,
    statsSize: settings.authorStatsSizePx ?? defaultAuthorProfileSettings.statsSize,
    metaSize: settings.authorMetaSizePx ?? defaultAuthorProfileSettings.metaSize,
    socialLinks: settings.socialLinks ?? [],
  }
}
