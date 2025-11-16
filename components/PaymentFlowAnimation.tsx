'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowUpDown, DollarSign, CreditCard, ShoppingBag } from 'lucide-react'

interface PaymentStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const paymentSteps: PaymentStep[] = [
  { id: 'wallet', label: 'CDP Wallet', icon: Wallet },
  { id: 'bridge', label: 'Bridge', icon: ArrowUpDown },
  { id: 'conversion', label: 'Conversion', icon: DollarSign },
  { id: 'card', label: 'Splice Card', icon: CreditCard },
  { id: 'merchant', label: 'Merchant', icon: ShoppingBag },
]

export function PaymentFlowAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (isComplete) return

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= paymentSteps.length - 1) {
          setIsComplete(true)
          return prev
        }
        return prev + 1
      })
    }, 800) // Move to next step every 800ms

    return () => clearInterval(interval)
  }, [isComplete])

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h3 className="text-lg font-semibold text-foreground mb-2">Payment Flow</h3>
      <div className="flex items-center gap-4 relative">
        {paymentSteps.map((step, index) => {
          const Icon = step.icon
          const isActive = index <= currentStep
          const isCurrent = index === currentStep
          const isLast = index === paymentSteps.length - 1

          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isActive
                    ? isLast
                      ? 'rgb(20 184 166)' // teal-500 for merchant
                      : 'rgb(34 197 94)' // green-500 for others
                    : 'rgb(229 231 235)', // gray-200 for inactive
                }}
                transition={{ duration: 0.3 }}
                className="relative flex flex-col items-center gap-2"
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.15 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    isActive
                      ? isLast
                        ? 'bg-teal-500'
                        : 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0.5 }}
                  animate={{
                    opacity: isActive ? 1 : 0.5,
                    fontWeight: isActive ? 600 : 400,
                  }}
                  className="text-xs text-center text-foreground whitespace-nowrap"
                >
                  {step.label}
                </motion.p>
                {isCurrent && !isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                  />
                )}
              </motion.div>

              {!isLast && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{
                    width: isActive ? 40 : 0,
                    opacity: isActive ? 1 : 0,
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-0.5 mx-2 ${
                    isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 w-full"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="bg-muted/50 rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </motion.svg>
                <h4 className="text-sm font-semibold text-foreground">Transaction Complete</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="text-sm font-semibold text-foreground">$0.05</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <p className="text-sm font-semibold text-foreground">USDC</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <p className="text-sm font-semibold text-foreground">USD</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-1">
                    <motion.svg
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                      className="w-4 h-4 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Complete
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">TX</p>
                <p className="text-xs font-mono text-foreground break-all">
                  0x57ba59033233c750b434636e86e385294d43eeba
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

