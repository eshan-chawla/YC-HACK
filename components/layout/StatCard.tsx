'use client'

import { Card } from '@/components/ui/card'
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
  index = 0
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <Card className={cn("p-5 hover:shadow-md transition-shadow duration-200", className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                {value}
              </h3>
              {trend && (
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded-md",
                  trend.isPositive 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {description}
              </p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
