import { splitProps, createSignal, createEffect, type JSX } from 'solid-js'

export interface SliderProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  unit?: string
  showValue?: boolean
}

export function Slider(props: SliderProps) {
  const [local, rest] = splitProps(props, ['label', 'unit', 'showValue', 'class', 'id', 'value', 'onInput'])

  const inputId = local.id || `slider-${Math.random().toString(36).slice(2)}`
  const [displayValue, setDisplayValue] = createSignal(local.value || rest.min || 0)

  createEffect(() => {
    if (local.value !== undefined) {
      setDisplayValue(local.value)
    }
  })

  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    setDisplayValue(e.currentTarget.value)
    if (typeof local.onInput === 'function') {
      local.onInput(e)
    }
  }

  return (
    <div>
      <label for={inputId} class="block text-sm font-medium text-text mb-1">
        {local.label}
        {local.showValue !== false && (
          <span class="ml-1">
            {displayValue()}{local.unit || ''}
          </span>
        )}
      </label>
      <input
        {...rest}
        type="range"
        id={inputId}
        value={displayValue()}
        onInput={handleInput}
        class={`
          w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer accent-primary
          ${local.class || ''}
        `}
      />
    </div>
  )
}
