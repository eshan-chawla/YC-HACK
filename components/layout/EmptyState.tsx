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
        "flex flex-col items-center justify-center text-center py-20 px-8 rounded-3xl paper-card relative overflow-hidden",
        className
      )}
    >
      {/* Decorative ambient blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-400/[0.03] blur-[80px] pointer-events-none" />

      <div className="paper-inset blob-3 w-14 h-14 mb-5 flex items-center justify-center relative z-10">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-[15px] font-serif text-foreground mb-1.5 relative z-10">{title}</h3>
      <p className="text-[13px] text-muted-foreground/60 max-w-[280px] leading-relaxed mb-7 relative z-10">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick} size="sm" className="h-9 text-[13px] rounded-xl px-5 btn-emerald-solid blob-2 btn-press relative z-10">
          {action.label}
        </Button>
      )}
    </div>
  )
}
