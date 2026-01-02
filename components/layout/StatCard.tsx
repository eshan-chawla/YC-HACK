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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className={cn("p-6 overflow-hidden relative group hover:shadow-md transition-shadow", className)}>
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
              {label}
            </p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    {value}
                </h3>
                {trend && (
                    <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                {description}
              </p>
            )}
          </div>
          <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
      </Card>
    </motion.div>
  )
}

