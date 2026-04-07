'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3", className)}>
      <div className="space-y-0.5">
        {breadcrumb && (
          <div className="mb-1.5">{breadcrumb}</div>
        )}
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-tight">{title}</h1>
        {description && (
          <p className="text-[13px] text-muted-foreground/70">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
}
