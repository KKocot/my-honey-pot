// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createEffect, createSignal, onCleanup, Show, Switch, Match } from 'solid-js'
import { Portal } from 'solid-js/web'
import { HBAuthLogin } from './HBAuthLogin'
import { KeychainLogin } from './KeychainLogin'
import { LockIcon, CloseIcon } from './icons'
import type { AuthUser } from './auth-store'

type LoginMethod = 'hbauth-login' | 'hbauth-register' | 'keychain'

interface LoginModalProps {
  show: boolean
  onClose: () => void
  onSuccess: (user: AuthUser) => void
  description?: string
}

const DEFAULT_DESCRIPTION = 'Sign in with your Hive account to continue.'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function LoginModal(props: LoginModalProps) {
  const [login_method, setLoginMethod] = createSignal<LoginMethod>('hbauth-login')
  let dialog_ref: HTMLDivElement | undefined

  function handle_keydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      props.onClose()
      return
    }
    if (e.key !== 'Tab' || !dialog_ref) return

    const focusable = Array.from(dialog_ref.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (focusable.length === 0) {
      e.preventDefault()
      dialog_ref.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || !dialog_ref.contains(active))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !dialog_ref.contains(active))) {
      e.preventDefault()
      first.focus()
    }
  }

  createEffect(() => {
    if (!props.show) return
    const previously_focused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', handle_keydown)
    // Login forms focus their own username input in a microtask; fall back to the dialog only when nothing inside took focus
    requestAnimationFrame(() => {
      if (dialog_ref && !dialog_ref.contains(document.activeElement)) dialog_ref.focus()
    })
    onCleanup(() => {
      document.removeEventListener('keydown', handle_keydown)
      if (previously_focused?.isConnected) previously_focused.focus()
    })
  })

  function tab_class(method: LoginMethod): string {
    const is_active = login_method() === method
    return `flex-1 rounded-lg py-2 px-3 text-sm font-medium transition-all ${
      is_active
        ? 'bg-primary text-primary-text shadow-md'
        : 'text-text-muted hover:text-text hover:bg-bg-card'
    }`
  }

  return (
    <Show when={props.show}>
      <Portal>
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={props.onClose}
      >
        <div
          ref={dialog_ref}
          tabindex="-1"
          class="bg-bg-card rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl focus:outline-none animate-in fade-in zoom-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <LockIcon class="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 id="login-modal-title" class="text-xl font-bold text-text">Login Required</h2>
                <p class="text-sm text-text-muted">Hive authentication</p>
              </div>
            </div>
            <button
              type="button"
              onClick={props.onClose}
              class="text-text-muted hover:text-text hover:bg-bg-secondary rounded-lg p-1.5 transition-colors"
              aria-label="Close login modal"
            >
              <CloseIcon class="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p class="text-text-muted mb-6 leading-relaxed">
            {props.description ?? DEFAULT_DESCRIPTION}
          </p>

          {/* Flat login method tabs */}
          <div class="flex rounded-xl bg-bg-secondary border border-border p-1 mb-6 gap-1">
            <button
              type="button"
              onClick={() => setLoginMethod('hbauth-login')}
              class={tab_class('hbauth-login')}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('hbauth-register')}
              class={tab_class('hbauth-register')}
            >
              Register Key
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('keychain')}
              class={tab_class('keychain')}
            >
              Keychain
            </button>
          </div>

          {/* Login form */}
          <Switch>
            <Match when={login_method() === 'hbauth-login'}>
              <HBAuthLogin mode="login" onSuccess={props.onSuccess} />
            </Match>
            <Match when={login_method() === 'hbauth-register'}>
              <HBAuthLogin mode="register" onSuccess={props.onSuccess} />
            </Match>
            <Match when={login_method() === 'keychain'}>
              <KeychainLogin onSuccess={props.onSuccess} />
            </Match>
          </Switch>
        </div>
      </div>
      </Portal>
    </Show>
  )
}
