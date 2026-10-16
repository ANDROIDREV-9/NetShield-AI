import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/format'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; size?: 'sm' | 'md'; icon?: ReactNode; loading?: boolean }
export function Button({ variant = 'secondary', size = 'md', icon, loading, className, children, disabled, ...rest }: Props) {
  const v = {
    primary: 'bg-cyan text-[rgb(8_12_16)] hover:brightness-110 font-semibold',
    secondary: 'border border-line bg-panel2 text-ink hover:border-cyan/60 hover:bg-panel',
    ghost: 'text-muted hover:bg-panel2 hover:text-ink',
    danger: 'border border-red/50 bg-red/10 text-red hover:bg-red/20',
  }[variant]
  return (
    <button {...rest} disabled={disabled || loading} aria-busy={loading || undefined}
      className={cn('inline-flex items-center justify-center gap-1.5 rounded-md transition disabled:cursor-not-allowed disabled:opacity-50', size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm', v, className)}>
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : icon}
      {children}
    </button>
  )
}
export function IconButton({ label, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button {...rest} aria-label={label} className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:bg-panel2 hover:text-ink', className)}>{children}</button>
}
