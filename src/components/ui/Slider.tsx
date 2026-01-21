import { splitProps, createSignal, createEffect, type JSX } from 'solid-js'

export interface SliderProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label: string
  unit?: string
  showValue?: boolean
  /** Called when user finishes dragging or changes number input (on blur/change) */
  onChange?: (value: number) => void
}

export function Slider(props: SliderProps) {
  const [local, rest] = splitProps(props, ['label', 'unit', 'showValue', 'class', 'id', 'value', 'onInput', 'onChange', 'disabled'])

  const inputId = local.id || `slider-${Math.random().toString(36).slice(2)}`

  // Local state for display during dragging
  const [localValue, setLocalValue] = createSignal<number>(
    typeof local.value === 'number' ? local.value : parseInt(String(local.value)) || 0
  )

  // Sync local value when prop changes (e.g., external reset)
  createEffect(() => {
    const propValue = typeof local.value === 'number' ? local.value : parseInt(String(local.value)) || 0
    setLocalValue(propValue)
  })

  const getMinMax = () => {
    const minVal = typeof rest.min === 'number' ? rest.min : parseInt(String(rest.min)) || 0
    const maxVal = typeof rest.max === 'number' ? rest.max : parseInt(String(rest.max)) || 100
    return { minVal, maxVal }
  }

  // Handle range slider input (update local state only)
  const handleRangeInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    const newValue = parseInt(e.currentTarget.value)
    setLocalValue(newValue)

    // Call onInput if provided - handle both function and tuple forms (SolidJS event delegation)
    const onInputProp = local.onInput
    if (onInputProp) {
      if (typeof onInputProp === 'function') {
        ;(onInputProp as (e: InputEvent & { currentTarget: HTMLInputElement; target: Element }) => void)(e)
      } else if (Array.isArray(onInputProp)) {
        // Tuple form: [handler, data]
        const [handler, data] = onInputProp as [Function, unknown]
        handler(data, e)
      }
    }
  }

  // Handle range slider change (when user releases - fires onChange)
  const handleRangeChange: JSX.EventHandler<HTMLInputElement, Event> = () => {
    if (typeof local.onChange === 'function') {
      local.onChange(localValue())
    }
  }

  // Handle number input change
  const handleNumberInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    let newValue = parseInt(e.currentTarget.value)
    const { minVal, maxVal } = getMinMax()

    // Clamp value to min/max
    if (isNaN(newValue)) newValue = minVal
    if (newValue < minVal) newValue = minVal
    if (newValue > maxVal) newValue = maxVal

    setLocalValue(newValue)
  }

  // Handle number input blur (commit change)
  const handleNumberBlur = () => {
    if (typeof local.onChange === 'function') {
      local.onChange(localValue())
    }
  }

  return (
    <div class={local.disabled ? 'opacity-50' : ''}>
      <label for={inputId} class={`block text-sm font-medium mb-1 ${local.disabled ? 'text-text-muted' : 'text-text'}`}>
        {local.label}
      </label>
      <div class="flex items-center gap-3">
        <input
          {...rest}
          type="range"
          id={inputId}
          value={localValue()}
          onInput={handleRangeInput}
          onChange={handleRangeChange}
          disabled={local.disabled}
          class={`flex-1 ${local.disabled ? 'cursor-not-allowed' : ''} ${local.class || ''}`}
        />
        <div class="flex items-center gap-1">
          <input
            type="number"
            value={localValue()}
            min={rest.min}
            max={rest.max}
            step={rest.step}
            onInput={handleNumberInput}
            onBlur={handleNumberBlur}
            disabled={local.disabled}
            class={`w-16 px-2 py-1 text-sm bg-bg border border-border rounded text-text text-center focus:outline-none focus:ring-1 focus:ring-primary ${local.disabled ? 'cursor-not-allowed' : ''}`}
          />
          {local.unit && (
            <span class="text-xs text-text-muted">{local.unit}</span>
          )}
        </div>
      </div>
    </div>
  )
}
