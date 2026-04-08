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
        "paper-card rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group",
        className
      )}
    >
      {/* Decorative blob accent */}
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-emerald-400/[0.04] blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="px-2.5 py-1 rounded-lg paper-inset">
          <p className="text-label">{label}</p>
        </div>
        <div className="paper-inset blob-1 w-10 h-10 shrink-0 flex items-center justify-center">
          <Icon className="w-4 h-4 text-emerald-600" />
        </div>
      </div>

      <div className="space-y-1 relative z-10">
        <div className="flex items-baseline gap-2.5">
          <span className="stat-value text-foreground">
            {value}
          </span>
          {trend && (
            <span className={cn(
              "text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-lg border",
              trend.isPositive
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-destructive bg-red-50 border-red-200"
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
