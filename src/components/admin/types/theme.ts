// ============================================
// Theme Colors System
// ============================================

/**
 * All customizable theme colors used throughout the application.
 * These colors map to CSS custom properties (--theme-*) and are applied
 * dynamically to support theme switching without page reload.
 */
export interface ThemeColors {
  bg: string
  bgSecondary: string
  bgCard: string
  text: string
  textMuted: string
  primary: string
  primaryHover: string
  primaryText: string // Text color on primary buttons/elements
  accent: string
  border: string
  success: string
  error: string
  warning: string
  info: string
}

/**
 * Theme preset with id, display name, and full color palette.
 * Presets are predefined color schemes that users can select from.
 */
export interface ThemePreset {
  id: string
  name: string
  colors: ThemeColors
}

/** All available theme presets */
export const themePresets: ThemePreset[] = [
  {
    id: 'light',
    name: 'Light',
    colors: {
      bg: '#f5f5f5',
      bgSecondary: '#e5e5e5',
      bgCard: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryText: '#ffffff',
      accent: '#8b5cf6',
      border: '#d1d5db',
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    colors: {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      bgCard: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      primary: '#3b82f6',
      primaryHover: '#60a5fa',
      primaryText: '#ffffff',
      accent: '#a78bfa',
      border: '#334155',
      success: '#4ade80',
      error: '#f87171',
      warning: '#fbbf24',
      info: '#22d3ee',
    },
  },
  {
    id: 'green',
    name: 'Green',
    colors: {
      bg: '#ecfdf5',
      bgSecondary: '#d1fae5',
      bgCard: '#ffffff',
      text: '#064e3b',
      textMuted: '#047857',
      primary: '#10b981',
      primaryHover: '#059669',
      primaryText: '#ffffff',
      accent: '#14b8a6',
      border: '#a7f3d0',
      success: '#16a34a',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'pink',
    name: 'Pink',
    colors: {
      bg: '#fdf2f8',
      bgSecondary: '#fce7f3',
      bgCard: '#ffffff',
      text: '#831843',
      textMuted: '#be185d',
      primary: '#ec4899',
      primaryHover: '#db2777',
      primaryText: '#ffffff',
      accent: '#f472b6',
      border: '#fbcfe8',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#0c1929',
      bgSecondary: '#132f4c',
      bgCard: '#1a3a5c',
      text: '#e3f2fd',
      textMuted: '#90caf9',
      primary: '#00bcd4',
      primaryHover: '#00acc1',
      primaryText: '#ffffff',
      accent: '#ff4081',
      border: '#1e4976',
      success: '#00e676',
      error: '#ff5252',
      warning: '#ffab40',
      info: '#40c4ff',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      bg: '#1a1a2e',
      bgSecondary: '#16213e',
      bgCard: '#0f3460',
      text: '#ffeaa7',
      textMuted: '#fdcb6e',
      primary: '#e17055',
      primaryHover: '#d63031',
      primaryText: '#ffffff',
      accent: '#fd79a8',
      border: '#2d3436',
      success: '#00b894',
      error: '#ff7675',
      warning: '#ffeaa7',
      info: '#74b9ff',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: '#1a2f1a',
      bgSecondary: '#243524',
      bgCard: '#2d4a2d',
      text: '#d4edda',
      textMuted: '#a3cfbb',
      primary: '#28a745',
      primaryHover: '#218838',
      primaryText: '#ffffff',
      accent: '#20c997',
      border: '#3d5c3d',
      success: '#00c853',
      error: '#ff6b6b',
      warning: '#ffc107',
      info: '#17a2b8',
    },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    colors: {
      bg: '#f3e8ff',
      bgSecondary: '#e9d5ff',
      bgCard: '#ffffff',
      text: '#581c87',
      textMuted: '#7c3aed',
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      primaryText: '#ffffff',
      accent: '#c084fc',
      border: '#d8b4fe',
      success: '#a855f7',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#0a0a0f',
      bgSecondary: '#121218',
      bgCard: '#1a1a24',
      text: '#e4e4e7',
      textMuted: '#a1a1aa',
      primary: '#a855f7',
      primaryHover: '#9333ea',
      primaryText: '#ffffff',
      accent: '#f472b6',
      border: '#27272a',
      success: '#4ade80',
      error: '#f87171',
      warning: '#fbbf24',
      info: '#22d3ee',
    },
  },
  {
    id: 'coffee',
    name: 'Coffee',
    colors: {
      bg: '#1c1612',
      bgSecondary: '#2a211a',
      bgCard: '#362b22',
      text: '#f5e6d3',
      textMuted: '#c4a77d',
      primary: '#d4a574',
      primaryHover: '#c49a6c',
      primaryText: '#1c1612',
      accent: '#a67c52',
      border: '#4a3c2f',
      success: '#7cb342',
      error: '#e57373',
      warning: '#ffb74d',
      info: '#4dd0e1',
    },
  },
]

