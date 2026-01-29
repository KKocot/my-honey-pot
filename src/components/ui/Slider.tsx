import { createSignal, createEffect, createUniqueId, on, type JSX } from 'solid-js'

export interface SliderProps {
  label: string
  unit?: string
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  class?: string
  id?: string
  /** Called when user finishes dragging or changes number input (on blur/change) */
  onChange?: (value: number) => void
}

export function Slider(props: SliderProps) {
  const generatedId = createUniqueId()
  const inputId = props.id || `slider-${generatedId}`

  // Local state for range slider (numeric)
  const [localValue, setLocalValue] = createSignal<number>(props.value ?? 0)

  // Separate local state for number input (string to allow free typing)
  const [inputText, setInputText] = createSignal<string>(String(props.value ?? 0))

  // Intentional: plain object to avoid triggering SolidJS reactivity.
  // Using a signal here would cause effect loops between local state and prop sync.
  const editing = { current: false }

  // Sync local value ONLY when props.value changes externally (not during editing)
  // Using on() with defer:true to only react to actual prop changes
  createEffect(on(
    () => props.value,
    (newValue) => {
      if (!editing.current) {
        setLocalValue(newValue ?? 0)
        setInputText(String(newValue ?? 0))
      }
    },
    { defer: true }
  ))

  const getMinMax = () => {
    const minVal = props.min ?? 0
    const maxVal = props.max ?? 100
    return { minVal, maxVal }
  }

  // Clamp value to min/max
  const clampValue = (val: number): number => {
    const { minVal, maxVal } = getMinMax()
    if (isNaN(val)) return minVal
    if (val < minVal) return minVal
    if (val > maxVal) return maxVal
    return val
  }

  // Commit range slider value
  const commitRangeValue = () => {
    const clamped = clampValue(localValue())
    setLocalValue(clamped)
    setInputText(String(clamped))
    // Set isEditing to false AFTER calling onChange to prevent effect from overwriting
    if (props.onChange) {
      props.onChange(clamped)
    }
    editing.current = false
  }

  // Commit number input value (validate and clamp on blur)
  const commitNumberValue = () => {
    const parsed = Number(inputText())
    const clamped = clampValue(parsed)
    setLocalValue(clamped)
    setInputText(String(clamped))
    // Set editing to false AFTER calling onChange to prevent effect from overwriting
    if (props.onChange) {
      props.onChange(clamped)
    }
    editing.current = false
  }

  // Handle range slider input
  const handleRangeInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    editing.current = true
    const val = Number(e.currentTarget.value)
    setLocalValue(val)
    setInputText(String(val))
  }

  // Handle number input - allow free typing without validation
  const handleNumberInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (e) => {
    editing.current = true
    setInputText(e.currentTarget.value)
  }

  return (
    <div class={props.disabled ? 'opacity-50' : ''}>
      <label for={inputId} class={`block text-sm font-medium mb-1 ${props.disabled ? 'text-text-muted' : 'text-text'}`}>
        {props.label}
      </label>
      <div class="flex items-center gap-3">
        <input
          type="range"
          id={inputId}
          min={props.min}
          max={props.max}
          step={props.step}
          value={localValue()}
          onInput={handleRangeInput}
          onChange={commitRangeValue}
          disabled={props.disabled}
          class={`flex-1 ${props.disabled ? 'cursor-not-allowed' : ''} ${props.class || ''}`}
        />
        <div class="flex items-center gap-1">
          <input
            type="number"
            value={inputText()}
            min={props.min}
            max={props.max}
            step={props.step}
            onInput={handleNumberInput}
            onBlur={commitNumberValue}
            disabled={props.disabled}
            class={`w-16 px-2 py-1 text-sm bg-bg border border-border rounded text-text text-center focus:outline-none focus:ring-1 focus:ring-primary ${props.disabled ? 'cursor-not-allowed' : ''}`}
          />
          {props.unit && (
            <span class="text-xs text-text-muted">{props.unit}</span>
          )}
        </div>
      </div>
    </div>
  )
}
