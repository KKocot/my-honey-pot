/**
 * Text formatting utilities
 * Used by both Astro (SSR) and SolidJS (FullPreview) components
 */

/**
 * Strip markdown formatting from text (simple version)
 * Used for quick summary extraction
 */
export function stripMarkdownSimple(text: string): string {
  return text.replace(/[#*`>\[\]()!]/g, '')
}

/**
 * Strip markdown formatting from text (full version)
 * Removes images, links, headings, formatting, HTML tags
 */
export function stripMarkdownFull(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')        // Remove images ![alt](url)
    .replace(/\[[^\]]*\]\([^)]+\)/g, '')         // Remove links [text](url)
    .replace(/#{1,6}\s*/g, '')                   // Remove headings
    .replace(/[*_`~]/g, '')                      // Remove bold, italic, code
    .replace(/<[^>]+>/g, '')                     // Remove HTML tags
    .replace(/\n+/g, ' ')                        // Replace newlines with spaces
    .replace(/\s+/g, ' ')                        // Normalize whitespace
    .trim()
}

/**
 * Truncate text to max length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Get summary from post body
 * Strips markdown and truncates to max length
 */
export function getSummary(body: string, maxLength = 150): string {
  const plainText = stripMarkdownFull(body)
  if (plainText.length === 0) return 'No description...'
  return truncateText(plainText, maxLength)
}

/**
 * Normalize URL - ensure it has protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

/**
 * Get display URL (without protocol)
 */
export function getDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
