'use client'

import { LucideIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8 rounded-lg border border-dashed border-border",
        className
      )}
    >
      <Icon className="w-5 h-5 text-muted-foreground/30 mb-4" />
      <h3 className="text-[14px] font-medium text-foreground mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground/70 max-w-[260px] leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm" className="h-8 text-[13px]">
          {action.label}
        </Button>
      )}
    </div>
  )
}
