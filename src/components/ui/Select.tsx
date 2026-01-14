import { splitProps, For, type JSX } from 'solid-js'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
}

export function Select(props: SelectProps) {
  const [local, rest] = splitProps(props, ['label', 'options', 'class', 'id'])

  const selectId = local.id || `select-${Math.random().toString(36).slice(2)}`

  return (
    <div>
      {local.label && (
        <label for={selectId} class="block text-sm font-medium text-text mb-1">
          {local.label}
        </label>
      )}
      <select
        {...rest}
        id={selectId}
        class={`
          w-full px-4 py-2 bg-bg border border-border rounded-lg text-text
          focus:outline-none focus:ring-2 focus:ring-primary
          ${local.class || ''}
        `}
      >
        <For each={local.options}>
          {(option) => (
            <option value={option.value}>{option.label}</option>
          )}
        </For>
      </select>
    </div>
  )
}
