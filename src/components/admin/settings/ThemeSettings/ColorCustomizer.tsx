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
        <Button variant="secondary" onClick={props.onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}
