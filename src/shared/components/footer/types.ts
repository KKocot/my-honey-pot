/**
 * Footer types - shared between Astro and SolidJS
 */

export interface FooterData {
  author_name: string
  author_url: string
  kofi_url: string
  kofi_image_url: string
  platform_name: string
}

export interface FooterSettings {
  extra_class: string
}

export const DEFAULT_FOOTER_DATA: FooterData = {
  author_name: 'BardDev',
  author_url: 'https://bard-dev.com',
  kofi_url: 'https://ko-fi.com/K3K713SMAY',
  kofi_image_url: 'https://storage.ko-fi.com/cdn/kofi6.png?v=6',
  platform_name: 'Hive Blockchain',
}

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  extra_class: '',
}
