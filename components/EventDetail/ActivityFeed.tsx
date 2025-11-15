'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface ActivityItem {
  id: string
  time: string
  message: string
  type: 'booking' | 'email' | 'alert' | 'system'
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const typeColors = {
  booking: 'bg-green-500',
  email: 'bg-blue-500',
  alert: 'bg-amber-500',
  system: 'bg-gray-500',
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${
                  typeColors[item.type as keyof typeof typeColors]
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">{item.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}
