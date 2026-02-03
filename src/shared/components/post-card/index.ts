// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * PostCard shared component
 * Single source of truth for post card rendering
 */

export type { PostCardData, PostCardSettings, CardSection, CardSectionChild, CardLayout, PostsGridSettings } from './types'
export { DEFAULT_POSTS_GRID_SETTINGS } from './types'

export {
  getPostThumbnail,
  getPostTags,
  formatPayout,
  getThumbnailUrl,
  createPostCardDataFromBridge,
  createPostCardDataFromPost,
  getPostSummary,
  getSimpleSummary,
} from './utils'

export {
  renderPostCardContent,
  renderPostCard,
  isElementInLayout,
  collectElementIds,
  renderPostsGrid,
} from './render'
