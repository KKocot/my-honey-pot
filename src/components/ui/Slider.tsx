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
      // Cast to expected type - SolidJS passes Element as target but we know it's HTMLInputElement
      ;(local.onInput as (e: InputEvent & { currentTarget: HTMLInputElement; target: Element }) => void)(e)
    }
  }

  const handleNumberInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    let newValue = parseInt(e.currentTarget.value)
    const minVal = typeof rest.min === 'number' ? rest.min : parseInt(String(rest.min)) || 0
    const maxVal = typeof rest.max === 'number' ? rest.max : parseInt(String(rest.max)) || 100

    // Clamp value to min/max
    if (isNaN(newValue)) newValue = minVal
    if (newValue < minVal) newValue = minVal
    if (newValue > maxVal) newValue = maxVal

    setDisplayValue(newValue)

    // Create a synthetic event for the callback with proper types
    if (typeof local.onInput === 'function') {
      // Create a properly typed synthetic event
      const syntheticTarget = Object.create(e.currentTarget, {
        value: { value: String(newValue), writable: true }
      }) as HTMLInputElement

      const syntheticEvent = Object.assign(
        Object.create(Object.getPrototypeOf(e)),
        e,
        { currentTarget: syntheticTarget, target: syntheticTarget }
      ) as InputEvent & { currentTarget: HTMLInputElement; target: HTMLInputElement }

      local.onInput(syntheticEvent)
    }
  }

  return (
    <div>
      <label for={inputId} class="block text-sm font-medium text-text mb-1">
        {local.label}
      </label>
      <div class="flex items-center gap-3">
        <input
          {...rest}
          type="range"
          id={inputId}
          value={displayValue()}
          onInput={handleInput}
          class={`flex-1 ${local.class || ''}`}
        />
        <div class="flex items-center gap-1">
          <input
            type="number"
            value={displayValue()}
            min={rest.min}
            max={rest.max}
            step={rest.step}
            onInput={handleNumberInput}
            class="w-16 px-2 py-1 text-sm bg-bg border border-border rounded text-text text-center focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {local.unit && (
            <span class="text-xs text-text-muted">{local.unit}</span>
          )}
        </div>
      </div>
    </div>
  )
}
