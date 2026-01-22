/**
 * Date formatting utilities
 * Used by both Astro (SSR) and SolidJS (FullPreview) components
 */

/**
 * Format date to readable join date (for profile)
 * @example "2016-03-25T15:09:27" -> "Mar 2016"
 */
export function formatJoinDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr + 'Z') : dateStr
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/**
 * Format date to locale string
 * @example Date -> "1/22/2024"
 */
export function formatDate(date: Date | string, locale = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale)
}

/**
 * Format relative time (time ago)
 * @example "5m ago", "2h ago", "3d ago"
 */
export function formatTimeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
