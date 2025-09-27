import * as React from 'react'
import { cn } from '@/lib/utils'

const BASE =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const VARIANTS = {
  default: 'bg-primary text-white hover:bg-blue-600',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50',
  ghost: 'hover:bg-slate-100',
} as const

const SIZES = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 rounded-md px-3',
  lg: 'h-10 rounded-md px-8',
  icon: 'h-9 w-9',
} as const

export type ButtonVariant = keyof typeof VARIANTS
export type ButtonSize = keyof typeof SIZES

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

function buttonClasses(opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string }) {
  const v = opts.variant ?? 'default'
  const s = opts.size ?? 'default'
  return cn(BASE, VARIANTS[v], SIZES[s], opts.className)
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={buttonClasses({ variant, size, className })} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonClasses as buttonVariants }
