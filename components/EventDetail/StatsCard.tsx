'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  progress?: number
  delay?: number
}

export function StatsCard({ label, value, unit, icon: Icon, progress, delay = 0 }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-end gap-2 mt-3">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {unit && <p className="text-sm text-muted-foreground mb-1">{unit}</p>}
            </div>
          </div>
          {Icon && (
            <Icon className="w-5 h-5 text-primary flex-shrink-0" />
          )}
        </div>
        {progress !== undefined && (
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        )}
      </Card>
    </motion.div>
  )
}
