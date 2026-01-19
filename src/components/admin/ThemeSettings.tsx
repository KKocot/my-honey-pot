import { For, Show, createSignal, createEffect, on, createMemo } from 'solid-js'
import { settings, updateSettings, setCustomColors } from './store'
import { applyThemeColors } from './queries'
import { themePresets, cardHoverEffectOptions, cardHoverShadowOptions, scrollAnimationTypeOptions, type ThemeColors } from './types'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  createDialog,
} from '../ui'
import { Button, Select, Slider } from '../ui'

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
// Get current colors (from custom or preset)
// ============================================

export function getCurrentColors(): ThemeColors {
  if (settings.customColors) {
    return settings.customColors
  }
  const preset = themePresets.find((p) => p.id === settings.siteTheme)
  return preset?.colors || themePresets[0].colors
}

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

function ColorCustomizerContent(props: { onClose: () => void }) {
  const currentColors = createMemo(() => getCurrentColors())

  const updateColor = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...currentColors(), [key]: value }
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

// ============================================
// Animation Settings Section
// ============================================

function AnimationSettings() {
  return (
    <div class="border-t border-border pt-6 space-y-6">
      {/* Hover Animations */}
      <div>
        <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Hover Animations</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Hover effect"
            options={cardHoverEffectOptions}
            value={settings.cardHoverEffect}
            onChange={(e) => updateSettings({ cardHoverEffect: e.currentTarget.value as 'none' | 'shadow' | 'lift' | 'scale' | 'glow' })}
          />

          <Show when={settings.cardHoverEffect !== 'none'}>
            <Slider
              label="Transition duration:"
              unit="ms"
              min={50}
              max={500}
              step={10}
              value={settings.cardTransitionDuration}
              onInput={(e) => updateSettings({ cardTransitionDuration: parseInt(e.currentTarget.value) })}
            />
          </Show>

          <Show when={settings.cardHoverEffect === 'shadow' || settings.cardHoverEffect === 'lift'}>
            <Select
              label="Shadow size"
              options={cardHoverShadowOptions}
              value={settings.cardHoverShadow}
              onChange={(e) => updateSettings({ cardHoverShadow: e.currentTarget.value })}
            />
          </Show>

          <Show when={settings.cardHoverEffect === 'scale' || settings.cardHoverEffect === 'lift'}>
            <Slider
              label="Scale factor:"
              min={1}
              max={1.15}
              step={0.01}
              value={settings.cardHoverScale}
              onInput={(e) => updateSettings({ cardHoverScale: parseFloat(e.currentTarget.value) })}
            />
          </Show>

          <Show when={settings.cardHoverEffect === 'glow'}>
            <Slider
              label="Glow brightness:"
              min={1}
              max={1.2}
              step={0.01}
              value={settings.cardHoverBrightness}
              onInput={(e) => updateSettings({ cardHoverBrightness: parseFloat(e.currentTarget.value) })}
            />
          </Show>
        </div>
      </div>

      {/* Scroll Animations */}
      <div class="border-t border-border/50 pt-6">
        <h3 class="text-sm font-medium text-text-muted uppercase tracking-wide mb-4">Scroll Animations</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Animation type"
            options={scrollAnimationTypeOptions}
            value={settings.scrollAnimationType}
            onChange={(e) => updateSettings({
              scrollAnimationType: e.currentTarget.value as 'none' | 'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'flip',
              scrollAnimationEnabled: e.currentTarget.value !== 'none'
            })}
          />

          <Show when={settings.scrollAnimationType !== 'none'}>
            <Slider
              label="Animation duration:"
              unit="ms"
              min={100}
              max={1000}
              step={50}
              value={settings.scrollAnimationDuration}
              onInput={(e) => updateSettings({ scrollAnimationDuration: parseInt(e.currentTarget.value) })}
            />
          </Show>

          <Show when={settings.scrollAnimationType !== 'none'}>
            <Slider
              label="Stagger delay:"
              unit="ms"
              min={0}
              max={300}
              step={10}
              value={settings.scrollAnimationDelay}
              onInput={(e) => updateSettings({ scrollAnimationDelay: parseInt(e.currentTarget.value) })}
            />
          </Show>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Style Preview Component
// ============================================

function StylePreview() {
  const [hoveredCard, setHoveredCard] = createSignal<number | null>(null)
  const [isAnimating, setIsAnimating] = createSignal(false)
  const [cardVisibility, setCardVisibility] = createSignal([true, true, true])

  // Shadow map for hover effects
  const shadowMap: Record<string, string> = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  }

  // Get initial scroll animation style based on type
  const getInitialScrollStyle = (type: string): Record<string, string> => {
    const base: Record<string, string> = { opacity: '0' }
    switch (type) {
      case 'fade':
        return base
      case 'slide-up':
        return { ...base, transform: 'translateY(20px)' }
      case 'slide-left':
        return { ...base, transform: 'translateX(-20px)' }
      case 'zoom':
        return { ...base, transform: 'scale(0.9)' }
      case 'flip':
        return { ...base, transform: 'perspective(600px) rotateX(-10deg)' }
      default:
        return {}
    }
  }

  // Get visible scroll animation style
  const getVisibleScrollStyle = (): Record<string, string> => {
    return { opacity: '1', transform: 'none' }
  }

  // Play animation demo - shows both scroll and hover animations
  const playAnimation = () => {
    if (isAnimating()) return

    setIsAnimating(true)
    // Reset all cards to hidden
    setCardVisibility([false, false, false])

    // Animate cards appearing one by one (scroll animation)
    const delay = settings.scrollAnimationDelay
    const duration = settings.scrollAnimationDuration

    setTimeout(() => setCardVisibility([true, false, false]), 100)
    setTimeout(() => setCardVisibility([true, true, false]), 100 + delay)
    setTimeout(() => setCardVisibility([true, true, true]), 100 + delay * 2)

    // Then trigger hover animation on first card
    setTimeout(() => {
      setHoveredCard(0)
    }, 100 + delay * 2 + duration)

    // Release hover
    setTimeout(() => {
      setHoveredCard(null)
    }, 100 + delay * 2 + duration + 600)

    // Animation complete
    setTimeout(() => {
      setIsAnimating(false)
    }, 100 + delay * 2 + duration + 600 + settings.cardTransitionDuration)
  }

  // Compute card style for a specific card index
  const getCardStyle = (index: number) => {
    const effect = settings.cardHoverEffect
    const hoverDuration = settings.cardTransitionDuration
    const scrollDuration = settings.scrollAnimationDuration
    const scrollType = settings.scrollAnimationType
    const scale = settings.cardHoverScale
    const shadow = settings.cardHoverShadow
    const brightness = settings.cardHoverBrightness
    const isHovered = hoveredCard() === index
    const isVisible = cardVisibility()[index]

    // Base styles
    const styles: Record<string, string> = {
      padding: '12px',
      'border-radius': '12px',
      transition: `all ${scrollDuration}ms ease-out, box-shadow ${hoverDuration}ms ease-out, transform ${hoverDuration}ms ease-out, filter ${hoverDuration}ms ease-out`,
    }

    // Apply scroll animation initial state if not visible
    if (!isVisible && scrollType !== 'none') {
      Object.assign(styles, getInitialScrollStyle(scrollType))
    } else if (isVisible) {
      Object.assign(styles, getVisibleScrollStyle())
    }

    // Apply hover effects when hovered (override scroll transform)
    if (isHovered && effect !== 'none') {
      if (effect === 'shadow') {
        styles['box-shadow'] = shadowMap[shadow] || shadowMap.md
      } else if (effect === 'scale') {
        styles.transform = `scale(${scale})`
      } else if (effect === 'lift') {
        styles.transform = `scale(${scale}) translateY(-4px)`
        styles['box-shadow'] = shadowMap[shadow] || shadowMap.lg
      } else if (effect === 'glow') {
        styles.filter = `brightness(${brightness})`
        styles['box-shadow'] = '0 0 20px var(--color-primary)'
      }
    }

    return styles
  }

  // Check if any animation is enabled
  const hasAnyAnimation = () =>
    settings.cardHoverEffect !== 'none' || settings.scrollAnimationType !== 'none'

  // Sample card data
  const sampleCards = [
    { title: 'My First Blog Post', votes: 156, comments: 24, payout: 12.45 },
    { title: 'Exploring New Ideas', votes: 89, comments: 12, payout: 5.67 },
    { title: 'Weekly Update #42', votes: 234, comments: 45, payout: 18.90 },
  ]

  return (
    <div class="bg-bg rounded-xl p-4 border border-border">
      <div class="flex items-center justify-between mb-4">
        <p class="text-xs text-text-muted uppercase tracking-wide">Preview</p>
        <button
          type="button"
          onClick={playAnimation}
          disabled={!hasAnyAnimation() || isAnimating()}
          class={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            !hasAnyAnimation()
              ? 'bg-bg-secondary text-text-muted cursor-not-allowed'
              : isAnimating()
                ? 'bg-primary/50 text-primary-text cursor-wait'
                : 'bg-primary text-primary-text hover:bg-primary-hover'
          }`}
        >
          <svg class={`w-4 h-4 ${isAnimating() ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isAnimating() ? 'Playing...' : 'Replay Animation'}
        </button>
      </div>

      {/* Mini page preview */}
      <div class="rounded-lg overflow-hidden border-2 border-dashed border-border">
        {/* Header */}
        <div class="bg-bg-secondary p-2 border-b border-border">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-primary" />
            <div class="h-2.5 w-20 bg-text rounded" />
          </div>
        </div>

        {/* Content area - list of cards */}
        <div class="bg-bg p-3 space-y-2 min-h-[220px]">
          <For each={sampleCards}>
            {(card, index) => (
              <div
                class="bg-bg-card border border-border cursor-pointer"
                style={getCardStyle(index())}
                onMouseEnter={() => !isAnimating() && setHoveredCard(index())}
                onMouseLeave={() => !isAnimating() && setHoveredCard(null)}
              >
                <div class="flex gap-3">
                  {/* Thumbnail */}
                  <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex-shrink-0 flex items-center justify-center">
                    <svg class="w-7 h-7 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {/* Content */}
                  <div class="flex-1 min-w-0">
                    <h3 class="text-text font-semibold text-xs truncate">{card.title}</h3>
                    <div class="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                      <span class="flex items-center gap-0.5">
                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                        {card.votes}
                      </span>
                      <span class="flex items-center gap-0.5">
                        <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {card.comments}
                      </span>
                      <span class="text-success font-medium">${card.payout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>

        {/* Footer */}
        <div class="bg-bg-secondary p-1.5 border-t border-border">
          <div class="h-1.5 w-24 bg-text-muted/30 rounded mx-auto" />
        </div>
      </div>

      {/* Color swatches */}
      <div class="mt-4 pt-4 border-t border-border">
        <p class="text-xs text-text-muted mb-2">Current palette</p>
        <div class="flex gap-1 flex-wrap">
          <div class="w-6 h-6 rounded bg-bg border border-border" title="Background" />
          <div class="w-6 h-6 rounded bg-bg-secondary" title="Secondary" />
          <div class="w-6 h-6 rounded bg-bg-card border border-border" title="Card" />
          <div class="w-6 h-6 rounded bg-primary" title="Primary" />
          <div class="w-6 h-6 rounded bg-accent" title="Accent" />
          <div class="w-6 h-6 rounded bg-success" title="Success" />
          <div class="w-6 h-6 rounded bg-error" title="Error" />
          <div class="w-6 h-6 rounded bg-warning" title="Warning" />
          <div class="w-6 h-6 rounded bg-info" title="Info" />
          <div class="w-6 h-6 rounded bg-text" title="Text" />
          <div class="w-6 h-6 rounded bg-text-muted" title="Muted" />
        </div>
      </div>
    </div>
  )
}
