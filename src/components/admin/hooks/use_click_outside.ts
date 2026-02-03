// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { onMount, onCleanup } from 'solid-js'

/**
 * Hook that triggers callback when user clicks outside of ref element
 */
export function useClickOutside(
  ref: () => HTMLElement | undefined,
  callback: () => void
) {
  const handleClick = (e: MouseEvent) => {
    const element = ref()
    const target = e.target
    if (element && target instanceof Node && !element.contains(target)) {
      callback()
    }
  }

  onMount(() => {
    document.addEventListener('mousedown', handleClick)
  })

  onCleanup(() => {
    document.removeEventListener('mousedown', handleClick)
  })
}
