// ============================================
// Navigation Types
// ============================================

// Navigation Tab configuration (Posts, Comments, Threads, or custom category tabs)
export interface NavigationTab {
  id: string
  label: string
  enabled: boolean
  showCount: boolean
  tag?: string // For custom category tabs - filters posts by tag/community
  tooltip?: string
}
