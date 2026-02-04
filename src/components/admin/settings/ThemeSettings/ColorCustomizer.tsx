// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, createMemo } from 'solid-js'
import { settings, setCustomColors } from '../../store'
import { themePresets, type ThemeColors } from '../../types/index'
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Button,
} from '../../../ui'
import { isValidHexColor, normalizeHexColor, getCurrentColors } from './helpers'
import { Shuffle } from 'lucide-solid'

// ============================================
// Color Labels for display
// ============================================

const colorLabels: Record<keyof ThemeColors, string> = {
  bg: 'Background',
  bgSecondary: 'Secondary BG',
  bgCard: 'Card BG',
  text: 'Text',
  textMuted: 'Muted Text',
  primary: 'Primary',
  primaryHover: 'Primary Hover',
  primaryText: 'Primary Text',
  accent: 'Accent',
  border: 'Border',
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
}

// ============================================
// Color Input Component
// ============================================

function ColorInput(props: {
  label: string
  colorKey: keyof ThemeColors
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div class="flex items-center gap-2">
      <input
        type="color"
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        class="w-10 h-10 rounded cursor-pointer border border-border bg-transparent"
      />
      <div class="flex flex-col min-w-0">
        <label class="text-xs text-text-muted truncate">{props.label}</label>
        <input
          type="text"
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          class="w-20 text-xs font-mono bg-bg border border-border rounded px-2 py-1 text-text"
        />
      </div>
    </div>
  )
}

// ============================================
// Color Customizer Dialog Content
// ============================================

export function ColorCustomizerContent(props: { onClose: () => void }) {
  const currentColors = createMemo(() => getCurrentColors())

  const updateColor = (key: keyof ThemeColors, value: string) => {
    const normalized = normalizeHexColor(value)

    if (!isValidHexColor(normalized)) {
      // Invalid color - don't update (UI shows validation feedback)
      return
    }

    const newColors = { ...currentColors(), [key]: normalized }
    setCustomColors(newColors)
  }

  const resetToPreset = () => {
    const preset = themePresets.find((p) => p.id === settings.siteTheme)
    if (preset) {
      const colorsCopy: ThemeColors = { ...preset.colors }
      setCustomColors(colorsCopy)
    }
  }

  const generate_random_colors = () => {
    const random_hex = (): string => {
      const hex = Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')
      return `#${hex}`
    }

    const newColors: ThemeColors = {
      bg: random_hex(),
      bgSecondary: random_hex(),
      bgCard: random_hex(),
      text: random_hex(),
      textMuted: random_hex(),
      primary: random_hex(),
      primaryHover: random_hex(),
      primaryText: random_hex(),
      accent: random_hex(),
      border: random_hex(),
      success: random_hex(),
      error: random_hex(),
      warning: random_hex(),
      info: random_hex(),
    }

    setCustomColors(newColors)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Customize Theme Colors</DialogTitle>
        <DialogDescription>
          Adjust individual colors to create your perfect theme. Changes are applied in real-time.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <For each={Object.keys(colorLabels) as Array<keyof ThemeColors>}>
            {(key) => (
              <ColorInput
                label={colorLabels[key]}
                colorKey={key}
                value={currentColors()[key]}
                onChange={(value) => updateColor(key, value)}
              />
            )}
          </For>
        </div>

        {/* Reset to preset button */}
        <div class="mt-6 pt-4 border-t border-border/50">
          <button
            type="button"
            onClick={resetToPreset}
            class="text-sm text-primary hover:text-primary-hover transition-colors"
          >
            Reset to {themePresets.find((p) => p.id === settings.siteTheme)?.name || 'preset'} defaults
          </button>
        </div>
      </DialogBody>

      <DialogFooter>
        <div class="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            onClick={generate_random_colors}
            class="flex items-center gap-2"
            aria-label="Generate random theme colors"
          >
            <Shuffle size={16} aria-hidden="true" />
            Random
          </Button>
          <Button variant="secondary" onClick={props.onClose}>
            Close
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
