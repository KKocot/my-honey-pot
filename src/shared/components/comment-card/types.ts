/**
 * CommentCard types - shared between Astro and SolidJS
 */

/**
 * Normalized comment data - framework-agnostic
 */
export interface CommentCardData {
  author: string
  permlink: string
  body: string
  created: string
  parentAuthor: string
  parentPermlink: string
  children: number
  votesCount: number
  payout: number
  url: string
  avatarUrl: string
}

/**
 * Comment card display settings
 */
export interface CommentCardSettings {
  showAuthor: boolean
  showAvatar: boolean
  avatarSize: number
  showReplyContext: boolean
  showTimestamp: boolean
  showRepliesCount: boolean
  showVotes: boolean
  showPayout: boolean
  showViewLink: boolean
  maxLength: number
  padding: number
}

/**
 * Default settings for comment card
 */
export const defaultCommentCardSettings: CommentCardSettings = {
  showAuthor: true,
  showAvatar: true,
  avatarSize: 40,
  showReplyContext: true,
  showTimestamp: true,
  showRepliesCount: true,
  showVotes: true,
  showPayout: true,
  showViewLink: true,
  maxLength: 0,
  padding: 16,
}
