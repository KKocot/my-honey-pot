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
