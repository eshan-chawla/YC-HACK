'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CostItem {
  label: string
  amount: number
}

interface CostBreakdownProps {
  items: CostItem[]
  total: number
  budget: number
  isCompliant: boolean
}

export function CostBreakdown({ items, total, budget, isCompliant }: CostBreakdownProps) {
  const remaining = budget - total
  const percent = Math.min((total / budget) * 100, 100)
  const percentDisplay = ((total / budget) * 100).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.25 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-[14px] font-medium text-foreground">Cost Breakdown</h3>
      </div>

      <div className="px-5 py-4 space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-1.5">
            <p className="text-[13px] text-muted-foreground">{item.label}</p>
            <p className="text-[13px] font-medium text-foreground tabular-nums">${item.amount.toLocaleString()}</p>
          </div>
        ))}

        <div className="border-t border-border pt-3 mt-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-medium text-foreground">Total</p>
            <p className="text-[22px] font-semibold text-foreground tabular-nums tracking-tight">${total.toLocaleString()}</p>
          </div>

          {/* Budget progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground/60">Budget: ${budget.toLocaleString()}</span>
              <span className={cn(
                "text-[12px] font-medium tabular-nums",
                remaining < 0 ? "text-destructive" : "text-primary"
              )}>
                {remaining < 0
                  ? `$${Math.abs(remaining).toLocaleString()} over`
                  : `$${remaining.toLocaleString()} left`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", remaining < 0 ? "bg-destructive" : "bg-primary")}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground/40">{percentDisplay}% of budget used</p>
          </div>
        </div>

        {/* Compliance */}
        <div className={cn(
          "flex items-center gap-2.5 mt-3 pt-3 border-t border-border",
        )}>
          <div className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isCompliant ? "bg-primary" : "bg-amber-500"
          )} />
          <div>
            <p className="text-[12px] font-medium text-foreground">
              Policy {isCompliant ? 'Compliant' : 'Review Required'}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {isCompliant
                ? 'All bookings comply with company policy'
                : 'This booking may have policy violations'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
