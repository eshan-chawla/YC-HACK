'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  className?: string
  index?: number
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  className,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "rounded-lg border border-border bg-card p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-label">{label}</p>
        <div className="icon-container icon-container-sm shrink-0">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-semibold tracking-tight tabular-nums leading-none text-foreground">
            {value}
          </span>
          {trend && (
            <span className={cn(
              "text-[11px] font-medium tabular-nums",
              trend.isPositive ? "text-primary" : "text-destructive"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        {(description || trend?.label) && (
          <p className="text-[12px] text-muted-foreground/50">
            {description ?? trend?.label}
          </p>
        )}
      </div>
    </motion.div>
  )
}
