'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Plane, Building2, Car } from 'lucide-react'

interface ItinerarySegment {
  type: 'flight' | 'hotel' | 'transport'
  icon: React.ReactNode
  title: string
  details: string[]
  cost: number
}

interface ItineraryCardProps {
  segments: ItinerarySegment[]
}

export function ItineraryCard({ segments }: ItineraryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="p-6 space-y-6">
        <h3 className="font-semibold text-lg text-foreground">Itinerary Summary</h3>

        {segments.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border rounded-lg p-4 space-y-3 relative"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                {segment.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{segment.title}</h4>
                <div className="space-y-1 mt-2">
                  {segment.details.map((detail, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">${segment.cost.toLocaleString()}</p>
              </div>
            </div>

            {/* Connection line to next segment */}
            {index < segments.length - 1 && (
              <div className="absolute left-8 bottom-0 w-px h-8 bg-border transform translate-y-full" />
            )}
          </motion.div>
        ))}
      </Card>
    </motion.div>
  )
}
