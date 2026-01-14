import { splitProps, type JSX } from 'solid-js'

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['variant', 'size', 'loading', 'children', 'class', 'disabled'])

  const variant = local.variant || 'primary'
  const size = local.size || 'md'

  const variantClasses: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-bg-secondary text-text hover:bg-border',
    accent: 'bg-accent text-bg-card hover:opacity-90',
    ghost: 'bg-transparent text-text hover:bg-bg-secondary',
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-8 py-3 text-lg',
  }

  return (
    <button
      {...rest}
      disabled={local.disabled || local.loading}
      class={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        font-medium rounded-lg transition-all
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg
        disabled:opacity-50 disabled:cursor-not-allowed
        ${local.class || ''}
      `}
    >
      {local.loading ? 'Ładowanie...' : local.children}
    </button>
  )
}
