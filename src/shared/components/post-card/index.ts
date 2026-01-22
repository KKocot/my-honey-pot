/**
 * PostCard shared component
 * Single source of truth for post card rendering
 */

export type { PostCardData, PostCardSettings, CardSection, CardSectionChild, CardLayout } from './types'
export { defaultPostCardSettings } from './types'

export {
  getPostThumbnail,
  getPostTags,
  formatPayout,
  getThumbnailUrl,
  createPostCardDataFromBridge,
  createPostCardDataFromPost,
  createPostCardSettings,
  getPostSummary,
  getSimpleSummary,
} from './utils'

export {
  renderPostCardContent,
  renderPostCard,
  isElementInLayout,
  collectElementIds,
} from './render'
