// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * AuthorProfile shared component
 * Single source of truth for author profile rendering
 */

export type { AuthorProfileData, AuthorProfileSettings } from './types'
export { defaultAuthorProfileLayout, defaultAuthorProfileSettings } from './types'

export { createAuthorProfileData, createAuthorProfileSettings } from './utils'

export {
  renderProfileElement,
  renderProfileSection,
  renderAuthorProfileSections,
  renderSocialLinks,
  renderAuthorProfileCard,
} from './render'
