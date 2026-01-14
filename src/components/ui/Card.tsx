import { splitProps, type JSX } from 'solid-js'

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title?: string
  padding?: boolean
}

export function Card(props: CardProps) {
  const [local, rest] = splitProps(props, ['title', 'padding', 'children', 'class'])

  const paddingClass = local.padding !== false ? 'p-6' : ''

  return (
    <div
      {...rest}
      class={`
        bg-bg-card rounded-xl border border-border
        ${paddingClass}
        ${local.class || ''}
      `}
    >
      {local.title && (
        <h2 class="text-xl font-semibold text-primary mb-6">{local.title}</h2>
      )}
      {local.children}
    </div>
  )
}
