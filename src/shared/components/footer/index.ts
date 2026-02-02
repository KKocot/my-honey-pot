/**
 * Footer shared component
 * Single source of truth for footer rendering
 */

export type { FooterData, FooterSettings } from './types'
export { DEFAULT_FOOTER_DATA, DEFAULT_FOOTER_SETTINGS } from './types'

export { createFooterData, createFooterSettings } from './utils'

export { renderFooter } from './render'
