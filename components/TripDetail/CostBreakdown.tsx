'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle } from 'lucide-react'

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
  const percent = ((total / budget) * 100).toFixed(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="p-6 space-y-6">
        <h3 className="font-semibold text-lg text-foreground">Cost Breakdown</h3>

        <div className="space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="flex items-center justify-between py-2"
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="font-medium text-foreground">${item.amount.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between py-2 mb-4">
            <p className="font-semibold text-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">${total.toLocaleString()}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">Budget</p>
              <p className="font-medium">${budget.toLocaleString()}</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(parseInt(percent), 100)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{percent}% used</span>
              <span className={remaining < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                {remaining < 0
                  ? `$${Math.abs(remaining).toLocaleString()} over budget`
                  : `$${remaining.toLocaleString()} remaining`}
              </span>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg flex items-start gap-2 ${
          isCompliant
            ? 'bg-green-100'
            : 'bg-amber-100'
        }`}>
          {isCompliant ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className={`text-sm font-medium ${isCompliant ? 'text-green-700' : 'text-amber-700'}`}>
              {isCompliant ? 'Policy Compliance: PASS' : 'Policy Compliance: ALERT'}
            </p>
            <p className={`text-xs ${isCompliant ? 'text-green-600' : 'text-amber-600'} mt-0.5`}>
              {isCompliant
                ? 'All bookings comply with company policy'
                : 'This booking may have policy violations. Please review.'}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
