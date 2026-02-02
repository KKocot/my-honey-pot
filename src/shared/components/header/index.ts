/**
 * Header shared component
 * Single source of truth for header rendering
 */

export type { HeaderData, HeaderSettings } from './types'
export { DEFAULT_HEADER_SETTINGS } from './types'

export { createHeaderData, createHeaderSettings } from './utils'

export { renderHeader, renderHeaderCompact, renderHeaderBottom } from './render'
