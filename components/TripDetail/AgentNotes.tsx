'use client'

import { motion } from 'framer-motion'

interface AgentNotesProps {
  notes: string
}

export function AgentNotes({ notes }: AgentNotesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.25 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        <h3 className="text-[14px] font-medium text-foreground">Agent Reasoning</h3>
      </div>
      <div className="px-5 py-4">
        <p className="text-[13px] text-muted-foreground leading-relaxed">{notes}</p>
      </div>
    </motion.div>
  )
}
