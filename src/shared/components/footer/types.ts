// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * Footer types - shared between Astro and SolidJS
 */

// Empty author_name hides "Built by"; empty kofi_url hides the Ko-fi button.
export interface FooterData {
  author_name: string
  author_url: string
  kofi_url: string
  kofi_image_url: string
  platform_name: string
  custom_text?: string
}

export interface FooterSettings {
  extra_class: string
}

export const DEFAULT_FOOTER_DATA: FooterData = {
  author_name: '',
  author_url: '',
  kofi_url: '',
  kofi_image_url: 'https://storage.ko-fi.com/cdn/kofi6.png?v=6',
  platform_name: 'Hive Blockchain',
}

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  extra_class: '',
}
