// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { Show } from 'solid-js'
import { HBAuthLogin, type AuthUser } from '../../../auth'

interface LoginModalProps {
  show: boolean
  onClose: () => void
  onSuccess: (user: AuthUser) => void
}

export function LoginModal(props: LoginModalProps) {
  return (
    <Show when={props.show}>
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={props.onClose}
      >
        <div
          class="bg-bg-card rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with icon */}
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-text">Login Required</h2>
                <p class="text-sm text-text-muted">Hive authentication</p>
              </div>
            </div>
            <button
              onClick={props.onClose}
              class="text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg p-1.5 transition-colors"
              aria-label="Close login modal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p class="text-text-muted mb-6 leading-relaxed">
            Sign in with your Hive account to save your blog configuration to the blockchain. Your settings will be stored permanently and loaded automatically.
          </p>

          {/* Login form */}
          <HBAuthLogin onSuccess={props.onSuccess} />
        </div>
      </div>
    </Show>
  )
}
