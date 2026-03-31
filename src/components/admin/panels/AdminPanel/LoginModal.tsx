// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Krzysztof Kocot

import { createSignal, Show, Switch, Match, onMount } from 'solid-js'
import { HBAuthLogin, KeychainLogin, has_keychain, type AuthUser } from '../../../auth'
import { LockIcon, CloseIcon } from '../../../auth/icons'

type LoginMethod = 'hbauth-login' | 'hbauth-register' | 'keychain'

interface LoginModalProps {
  show: boolean
  onClose: () => void
  onSuccess: (user: AuthUser) => void
}

export function LoginModal(props: LoginModalProps) {
  const [login_method, setLoginMethod] = createSignal<LoginMethod>('hbauth-login')
  const [keychain_available, setKeychainAvailable] = createSignal(false)

  onMount(() => {
    setKeychainAvailable(has_keychain())
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
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        onClick={props.onClose}
      >
        <div
          class="bg-bg-card rounded-2xl border border-border p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-start justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <LockIcon class="w-6 h-6 text-primary" />
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
              <CloseIcon class="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <p class="text-text-muted mb-6 leading-relaxed">
            Sign in with your Hive account to save your blog configuration to the blockchain. Your settings will be stored permanently and loaded automatically.
          </p>

          {/* Flat login method tabs */}
          <div class="flex rounded-xl bg-bg-secondary border border-border p-1 mb-6 gap-1">
            <button
              onClick={() => setLoginMethod('hbauth-login')}
              class={tab_class('hbauth-login')}
            >
              Login
            </button>
            <button
              onClick={() => setLoginMethod('hbauth-register')}
              class={tab_class('hbauth-register')}
            >
              Register Key
            </button>
            <Show when={keychain_available()}>
              <button
                onClick={() => setLoginMethod('keychain')}
                class={tab_class('keychain')}
              >
                Keychain
              </button>
            </Show>
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
    </Show>
  )
}
