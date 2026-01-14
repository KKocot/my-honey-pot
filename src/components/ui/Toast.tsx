import { createSignal, Show } from 'solid-js'

export type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

const [toastState, setToastState] = createSignal<ToastState>({
  message: '',
  type: 'success',
  visible: false,
})

let timeoutId: number | undefined

export function showToast(message: string, type: ToastType = 'success') {
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  setToastState({ message, type, visible: true })

  timeoutId = window.setTimeout(() => {
    setToastState((prev) => ({ ...prev, visible: false }))
  }, 3000)
}

export function Toast() {
  const state = toastState

  return (
    <div
      class={`
        fixed top-4 right-4 z-50 transform transition-transform duration-300 ease-out
        ${state().visible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div
        class={`
          px-6 py-4 rounded-lg shadow-lg flex items-center gap-3
          ${state().type === 'success' ? 'bg-success text-white' : 'bg-error text-white'}
        `}
      >
        <Show
          when={state().type === 'success'}
          fallback={
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </Show>
        <span class="font-medium">{state().message}</span>
      </div>
    </div>
  )
}
