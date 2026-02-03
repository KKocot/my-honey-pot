import { createSignal, Show, onMount, onCleanup, type JSX, type Accessor } from 'solid-js'
import { Portal } from 'solid-js/web'

// ============================================
// Focus Trap Hook
// ============================================

function useFocusTrap(containerRef: () => HTMLElement | undefined, isActive: () => boolean) {
  let previousActiveElement: HTMLElement | null = null

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ]
    return Array.from(container.querySelectorAll(focusableSelectors.join(', ')))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const container = containerRef()
    if (!container || !isActive()) return

    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown)
    // Restore focus to previous element on cleanup
    if (previousActiveElement) {
      previousActiveElement.focus()
    }
  })

  // Store and focus first element when activated
  const activate = () => {
    previousActiveElement = document.activeElement as HTMLElement
    const container = containerRef()
    if (container) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden'

      // Focus first focusable element
      const focusableElements = getFocusableElements(container)
      if (focusableElements.length > 0) {
        setTimeout(() => focusableElements[0].focus(), 0)
      }
    }
  }

  const deactivate = () => {
    document.body.style.overflow = ''
    if (previousActiveElement) {
      previousActiveElement.focus()
    }
  }

  return { activate, deactivate }
}

// ============================================
// Dialog Context Types
// ============================================

export interface DialogContentProps {
  children: JSX.Element
  class?: string
}

export interface DialogHeaderProps {
  children: JSX.Element
  class?: string
}

export interface DialogTitleProps {
  children: JSX.Element
  class?: string
}

export interface DialogDescriptionProps {
  children: JSX.Element
  class?: string
}

export interface DialogFooterProps {
  children: JSX.Element
  class?: string
}


// ============================================
// Dialog Hook
// ============================================

export function createDialog(defaultOpen = false) {
  const [open, setOpen] = createSignal(defaultOpen)

  return {
    open,
    setOpen,
    onOpenChange: setOpen,
  }
}

// ============================================
// Dialog Components
// ============================================

export function DialogContent(props: DialogContentProps & { open: Accessor<boolean>; onClose: () => void }) {
  let dialogRef: HTMLDivElement | undefined

  // Focus trap
  const focusTrap = useFocusTrap(
    () => dialogRef,
    () => props.open()
  )

  // Handle escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      props.onClose()
    }
  }

  // Activate/deactivate focus trap on open/close
  const handleOpen = () => {
    focusTrap.activate()
  }

  const handleClose = () => {
    focusTrap.deactivate()
    props.onClose()
  }

  return (
    <Show when={props.open()}>
      <Portal>
        {/* Backdrop */}
        <div
          class="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
          onClick={handleClose}
          onKeyDown={handleKeyDown}
          aria-hidden="true"
        />
        {/* Dialog */}
        <div
          ref={(el) => {
            dialogRef = el
            handleOpen()
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          class={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
            w-full max-w-lg max-h-[90vh] overflow-y-auto
            bg-bg-card border border-border rounded-xl shadow-lg
            animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]
            ${props.class || ''}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:pointer-events-none text-text-muted hover:text-text"
            aria-label="Close dialog"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {props.children}
        </div>
      </Portal>
    </Show>
  )
}

export function DialogHeader(props: DialogHeaderProps) {
  return (
    <div class={`flex flex-col space-y-1.5 p-6 pb-0 ${props.class || ''}`}>
      {props.children}
    </div>
  )
}

export function DialogTitle(props: DialogTitleProps) {
  return (
    <h2 id="dialog-title" class={`text-lg font-semibold leading-none tracking-tight text-text ${props.class || ''}`}>
      {props.children}
    </h2>
  )
}

export function DialogDescription(props: DialogDescriptionProps) {
  return (
    <p class={`text-sm text-text-muted ${props.class || ''}`}>
      {props.children}
    </p>
  )
}

export function DialogBody(props: { children: JSX.Element; class?: string }) {
  return (
    <div class={`p-6 ${props.class || ''}`}>
      {props.children}
    </div>
  )
}

export function DialogFooter(props: DialogFooterProps) {
  return (
    <div class={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 pt-0 ${props.class || ''}`}>
      {props.children}
    </div>
  )
}

