// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { For, createSignal } from 'solid-js'
import { settings } from '../../store'
import { SHADOW_MAP } from '../../constants'

// ============================================
// Animation timing constants
// ============================================

const ANIMATION_INITIAL_DELAY = 100
const HOVER_DISPLAY_DURATION = 600

// ============================================
// Style Preview Component
// ============================================

export function StylePreview() {
  const [hoveredCard, setHoveredCard] = createSignal<number | null>(null)
  const [isAnimating, setIsAnimating] = createSignal(false)
  const [cardVisibility, setCardVisibility] = createSignal([true, true, true])

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

    setTimeout(() => setCardVisibility([true, false, false]), ANIMATION_INITIAL_DELAY)
    setTimeout(() => setCardVisibility([true, true, false]), ANIMATION_INITIAL_DELAY + delay)
    setTimeout(() => setCardVisibility([true, true, true]), ANIMATION_INITIAL_DELAY + delay * 2)

    // Then trigger hover animation on first card
    setTimeout(() => {
      setHoveredCard(0)
    }, ANIMATION_INITIAL_DELAY + delay * 2 + duration)

    // Release hover
    setTimeout(() => {
      setHoveredCard(null)
    }, ANIMATION_INITIAL_DELAY + delay * 2 + duration + HOVER_DISPLAY_DURATION)

    // Animation complete
    setTimeout(() => {
      setIsAnimating(false)
    }, ANIMATION_INITIAL_DELAY + delay * 2 + duration + HOVER_DISPLAY_DURATION + settings.cardTransitionDuration)
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
        styles['box-shadow'] = SHADOW_MAP[shadow] || SHADOW_MAP.md
      } else if (effect === 'scale') {
        styles.transform = `scale(${scale})`
      } else if (effect === 'lift') {
        styles.transform = `scale(${scale}) translateY(-4px)`
        styles['box-shadow'] = SHADOW_MAP[shadow] || SHADOW_MAP.lg
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
