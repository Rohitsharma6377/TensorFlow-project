import * as React from 'react'
import { cn } from '@/lib/utils'

const BASE =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'

const VARIANTS = {
  default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
  outline: 'text-foreground',
} as const

export type BadgeVariant = keyof typeof VARIANTS

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

function badgeVariants(opts: { variant?: BadgeVariant; className?: string }) {
  const v = opts.variant ?? 'default'
  return cn(BASE, VARIANTS[v], opts.className)
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />
}

export { Badge, badgeVariants }
