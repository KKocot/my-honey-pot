// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, createSignal, createEffect, on } from 'solid-js'
import { settings, updateSettings, setCustomColors } from '../../store'
import { applyThemeColors } from '../../queries'
import { themePresets, type ThemeColors } from '../../types/index'
import { DialogContent, createDialog } from '../../../ui'
import { ColorCustomizerContent } from './ColorCustomizer'
import { AnimationSettings } from './AnimationSettings'
import { StylePreview } from './StylePreview'

// Re-export getCurrentColors from helpers for barrel export
export { getCurrentColors } from './helpers'

// ============================================
// Preset Card Component
// ============================================

function PresetCard(props: {
  id: string
  name: string
  colors: ThemeColors
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`p-3 rounded-lg border-2 transition-all text-left ${
        props.active
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Mini color preview */}
      <div class="flex gap-1 mb-2">
        <div
          style={{ background: props.colors.bg }}
          class="w-5 h-5 rounded border border-border/30"
        />
        <div
          style={{ background: props.colors.primary }}
          class="w-5 h-5 rounded"
        />
        <div
          style={{ background: props.colors.accent }}
          class="w-5 h-5 rounded"
        />
        <div
          style={{ background: props.colors.text }}
          class="w-5 h-5 rounded"
        />
      </div>
      <span class="text-sm font-medium text-text">{props.name}</span>
    </button>
  )
}

// ============================================
// Custom Preset Card
// ============================================

function CustomPresetCard(props: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      class={`p-3 rounded-lg border-2 transition-all text-left ${
        props.active
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 border-dashed'
      }`}
    >
      {/* Custom icon */}
      <div class="flex gap-1 mb-2 items-center justify-center h-5">
        <svg
          class="w-5 h-5 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </div>
      <span class="text-sm font-medium text-text">Custom</span>
    </button>
  )
}

// ============================================
// Main ThemeSettings Component
// ============================================

export function ThemeSettings() {
  // Dialog state for color customizer
  const dialog = createDialog(false)

  // Use local signal for custom mode state to ensure reactivity
  const [isCustomMode, setIsCustomMode] = createSignal(
    settings.customColors != null && typeof settings.customColors === 'object'
  )

  // Sync with store when customColors changes externally
  createEffect(
    on(
      () => settings.customColors,
      (customColors) => {
        setIsCustomMode(customColors != null && typeof customColors === 'object')
      }
    )
  )

  // Determine active preset for display
  const activePreset = () => (isCustomMode() ? 'custom' : settings.siteTheme)

  const selectPreset = (presetId: string) => {
    const preset = themePresets.find((p) => p.id === presetId)
    if (preset) {
      // Clear custom mode and colors
      setIsCustomMode(false)
      setCustomColors(null)
      updateSettings({ siteTheme: presetId })
      applyThemeColors(preset.colors)
    }
  }

  const enableCustomMode = () => {
    // Start custom mode with current preset colors
    const preset = themePresets.find((p) => p.id === settings.siteTheme)
    const baseColors = preset?.colors || themePresets[0].colors
    // Create a deep copy of the colors
    const customColorsCopy: ThemeColors = {
      bg: baseColors.bg,
      bgSecondary: baseColors.bgSecondary,
      bgCard: baseColors.bgCard,
      text: baseColors.text,
      textMuted: baseColors.textMuted,
      primary: baseColors.primary,
      primaryHover: baseColors.primaryHover,
      primaryText: baseColors.primaryText,
      accent: baseColors.accent,
      border: baseColors.border,
      success: baseColors.success,
      error: baseColors.error,
      warning: baseColors.warning,
      info: baseColors.info,
    }
    // Set local state first for immediate UI update
    setIsCustomMode(true)
    // Then update store
    setCustomColors(customColorsCopy)
    // Open the dialog
    dialog.setOpen(true)
  }

  // Open dialog when clicking on custom card (if already in custom mode)
  const handleCustomClick = () => {
    if (isCustomMode()) {
      // Already in custom mode, just open dialog
      dialog.setOpen(true)
    } else {
      // Enable custom mode (which also opens dialog)
      enableCustomMode()
    }
  }

  return (
    <div class="bg-bg-card rounded-xl p-6 mb-6 border border-border">
      <h2 class="text-xl font-semibold text-primary mb-6">Style</h2>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left column - Settings */}
        <div class="space-y-6">
          {/* Theme Colors Section */}
          <div>
            <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Theme Colors</h3>

            {/* Preset Grid */}
            <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <For each={themePresets}>
                {(preset) => (
                  <PresetCard
                    id={preset.id}
                    name={preset.name}
                    colors={preset.colors}
                    active={activePreset() === preset.id}
                    onClick={() => selectPreset(preset.id)}
                  />
                )}
              </For>
              {/* Custom option */}
              <CustomPresetCard
                active={activePreset() === 'custom'}
                onClick={handleCustomClick}
              />
            </div>
          </div>

          {/* Animations Section */}
          <AnimationSettings />
        </div>

        {/* Right column - Preview */}
        <StylePreview />
      </div>

      {/* Color customization dialog */}
      <DialogContent
        open={dialog.open}
        onClose={() => dialog.setOpen(false)}
        class="max-w-2xl"
      >
        <ColorCustomizerContent onClose={() => dialog.setOpen(false)} />
      </DialogContent>
    </div>
  )
}
