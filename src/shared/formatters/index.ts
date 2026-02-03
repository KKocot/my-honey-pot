// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Shared formatters - single source of truth for formatting functions
 */
export {
  formatCompactNumber,
  formatNumber,
  formatFixed,
} from './numbers'

export {
  formatJoinDate,
  formatDate,
  formatTimeAgo,
} from './dates'

export {
  stripMarkdownSimple,
  stripMarkdownFull,
  truncateText,
  getSummary,
  normalizeUrl,
  getDisplayUrl,
} from './text'

export { escape_html } from './html'
