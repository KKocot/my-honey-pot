import { splitProps, createUniqueId, type JSX } from 'solid-js'

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input(props: InputProps) {
  const [local, rest] = splitProps(props, ['label', 'error', 'class', 'id'])

  const generatedId = createUniqueId()
  const inputId = local.id || `input-${generatedId}`

  return (
    <div>
      {local.label && (
        <label for={inputId} class="block text-sm font-medium text-text mb-1">
          {local.label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        class={`
          w-full px-4 py-2 bg-bg border border-border rounded-lg text-text
          focus:outline-none focus:ring-2 focus:ring-primary
          ${local.error ? 'border-error' : ''}
          ${local.class || ''}
        `}
      />
      {local.error && (
        <p class="mt-1 text-sm text-error">{local.error}</p>
      )}
    </div>
  )
}
