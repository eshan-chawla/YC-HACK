'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'

interface AgentNotesProps {
  notes: string
}

export function AgentNotes({ notes }: AgentNotesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-2">Agent Notes & Reasoning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{notes}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
