import { splitProps, type JSX } from 'solid-js'

export interface CheckboxProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox(props: CheckboxProps) {
  const [local, rest] = splitProps(props, ['label', 'class', 'id'])

  const inputId = local.id || `checkbox-${Math.random().toString(36).slice(2)}`

  return (
    <label for={inputId} class="flex items-center gap-2 cursor-pointer">
      <input
        {...rest}
        type="checkbox"
        id={inputId}
        class={`
          w-5 h-5 rounded border-border text-primary focus:ring-primary
          ${local.class || ''}
        `}
      />
      <span class="text-sm text-text">{local.label}</span>
    </label>
  )
}
