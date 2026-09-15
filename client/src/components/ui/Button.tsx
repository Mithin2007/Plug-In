import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ children, className = '', variant = 'primary', loading = false, fullWidth = false, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${fullWidth ? 'button--full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
