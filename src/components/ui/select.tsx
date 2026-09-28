import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/** A plain native select: it is keyboard- and touch-friendly for free. */
export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'border-input bg-background ring-offset-background flex h-10 w-full rounded-md border px-3 py-2 text-sm',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
