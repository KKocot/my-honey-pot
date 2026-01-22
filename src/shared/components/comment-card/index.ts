/**
 * CommentCard shared component utilities
 * Provides data transformation and processing for comment cards
 */

export type { CommentCardData, CommentCardSettings } from './types'
export { defaultCommentCardSettings } from './types'

export {
  processCommentBody,
  parseParentFromUrl,
  createCommentCardData,
  createCommentCardSettings,
  formatTimeAgo,
} from './utils'

export {
  renderCommentCardContent,
  renderCommentCard,
} from './render'
