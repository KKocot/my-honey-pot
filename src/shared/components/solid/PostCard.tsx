// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

/**
 * PostCard - SolidJS component
 * Single post card with hover and scroll animations
 */

import { createSignal, createMemo, onMount } from 'solid-js'
import { settings } from '../../../components/admin/store'
import {
  createPostCardDataFromBridge,
  renderPostCardContent,
} from '../post-card'
import type { HivePost } from '../../../components/admin/queries'
import { SHADOW_MAP } from '../../../components/admin/constants'
import { get_initial_scroll_style, get_visible_scroll_style } from '../../utils/animations'

// ============================================
// PostCard Component
// ============================================

interface PostCardProps {
  post: HivePost
  forceVertical: boolean
  index: number
}

export function PostCard(props: PostCardProps) {
  const isVertical = () => props.forceVertical || settings.cardLayout === 'vertical' || settings.postsLayout !== 'list'

  // Hover state
  const [isHovered, setIsHovered] = createSignal(false)
  // Scroll animation visibility state
  const [isVisible, setIsVisible] = createSignal(false)

  // Trigger scroll animation on mount with staggered delay
  onMount(() => {
    if (settings.scrollAnimationType !== 'none' && settings.scrollAnimationEnabled) {
      const delay = props.index * (settings.scrollAnimationDelay || 100)
      setTimeout(() => setIsVisible(true), delay)
    } else {
      setIsVisible(true)
    }
  })

  // Create normalized post data using shared utility
  const postData = createMemo(() => createPostCardDataFromBridge(props.post, {
    thumbnailSizePx: settings.thumbnailSizePx || 96,
    maxTags: settings.maxTags || 5,
  }))

  // Compute card styles with hover and scroll animations
  const cardStyle = createMemo(() => {
    const effect = settings.cardHoverEffect || 'none'
    const hoverDuration = settings.cardTransitionDuration || 200
    const scrollDuration = settings.scrollAnimationDuration || 400
    const scrollType = settings.scrollAnimationType || 'none'
    const scale = settings.cardHoverScale || 1.02
    const shadow = settings.cardHoverShadow || 'lg'
    const brightness = settings.cardHoverBrightness || 1.05

    // Base styles
    const styles: Record<string, string> = {
      padding: `${settings.cardPaddingPx || 24}px`,
      'border-radius': `${settings.cardBorderRadiusPx || 16}px`,
      border: settings.cardBorder !== false ? '1px solid var(--color-border)' : '1px solid transparent',
      transition: `all ${scrollDuration}ms ease-out, box-shadow ${hoverDuration}ms ease-out, transform ${hoverDuration}ms ease-out, filter ${hoverDuration}ms ease-out`,
    }

    // Apply scroll animation initial state if not visible
    if (!isVisible() && scrollType !== 'none') {
      Object.assign(styles, get_initial_scroll_style(scrollType))
    } else if (isVisible()) {
      Object.assign(styles, get_visible_scroll_style())
    }

    // Apply hover effects when hovered (override scroll transform)
    if (isHovered() && effect !== 'none') {
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
  })

  // Create settings for shared render function
  const cardSettings = createMemo(() => ({
    thumbnailSizePx: settings.thumbnailSizePx || 96,
    cardPaddingPx: settings.cardPaddingPx || 24,
    cardBorderRadiusPx: settings.cardBorderRadiusPx || 16,
    titleSizePx: settings.titleSizePx || 20,
    summaryMaxLength: settings.summaryMaxLength || 150,
    cardBorder: settings.cardBorder !== false,
    maxTags: settings.maxTags || 5,
    postCardLayout: settings.postCardLayout,
  }))

  // Render content using shared function
  const contentHtml = createMemo(() => renderPostCardContent(postData(), cardSettings(), isVertical()))

  return (
    <article
      class="bg-bg-card rounded-xl overflow-hidden cursor-pointer"
      style={cardStyle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      innerHTML={contentHtml()}
    />
  )
}
