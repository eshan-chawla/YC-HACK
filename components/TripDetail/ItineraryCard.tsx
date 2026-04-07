'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.25 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14px] font-medium text-foreground">Itinerary</h3>
      </div>

      <div className="px-5 py-4">
        {segments.map((segment, index) => (
          <div key={index} className="relative">
            {/* Connector line */}
            {index < segments.length - 1 && (
              <div className="absolute left-4 top-9 bottom-0 w-px bg-border" />
            )}

            <div className="flex items-start gap-4 py-3">
              <div className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center shrink-0 text-muted-foreground/50">
                {segment.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-foreground leading-tight">{segment.title}</p>
                    <div className="space-y-0.5 mt-1.5">
                      {segment.details.map((detail, i) => (
                        <p key={i} className="text-[12px] text-muted-foreground/70 leading-relaxed">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                  <span className="text-[13px] font-medium text-foreground tabular-nums shrink-0">
                    ${segment.cost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
