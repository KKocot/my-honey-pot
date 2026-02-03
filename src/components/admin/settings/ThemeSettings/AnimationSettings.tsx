import { Show } from 'solid-js'
import { settings, updateSettings } from '../../store'
import { cardHoverEffectOptions, cardHoverShadowOptions, scrollAnimationTypeOptions } from '../../types/index'
import { Select, Slider } from '../../../ui'

// ============================================
// Animation Settings Section
// ============================================

export function AnimationSettings() {
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
              onChange={(val) => updateSettings({ cardTransitionDuration: val })}
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
              onChange={(val) => updateSettings({ cardHoverScale: val })}
            />
          </Show>

          <Show when={settings.cardHoverEffect === 'glow'}>
            <Slider
              label="Glow brightness:"
              min={1}
              max={1.2}
              step={0.01}
              value={settings.cardHoverBrightness}
              onChange={(val) => updateSettings({ cardHoverBrightness: val })}
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
              onChange={(val) => updateSettings({ scrollAnimationDuration: val })}
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
              onChange={(val) => updateSettings({ scrollAnimationDelay: val })}
            />
          </Show>
        </div>
      </div>
    </div>
  )
}
