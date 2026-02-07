import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full min-w-0 rounded-lg border border-input bg-background px-4 py-2.5 text-base text-foreground shadow-sm transition-all duration-200 outline-none',
        'placeholder:text-muted-foreground/60',
        'selection:bg-primary/20 selection:text-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/10',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'dark:bg-input/30 dark:border-input',
        'md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
