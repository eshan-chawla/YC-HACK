'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowRight, DollarSign, CreditCard, ShoppingBag, CheckCircle2 } from 'lucide-react'

interface PaymentStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  gradientClasses: string
  shadowClasses: string
  ringClasses: string
  glowColor: string
}

const paymentSteps: PaymentStep[] = [
  { 
    id: 'wallet', 
    label: 'CDP Wallet', 
    icon: Wallet,
    gradientClasses: 'from-blue-500 to-blue-600',
    shadowClasses: 'shadow-blue-500/50',
    ringClasses: 'ring-blue-400/50',
    glowColor: 'rgb(59 130 246)' // blue-500
  },
  { 
    id: 'bridge', 
    label: 'Bridge', 
    icon: ArrowRight,
    gradientClasses: 'from-purple-500 to-purple-600',
    shadowClasses: 'shadow-purple-500/50',
    ringClasses: 'ring-purple-400/50',
    glowColor: 'rgb(168 85 247)' // purple-500
  },
  { 
    id: 'conversion', 
    label: 'Conversion', 
    icon: DollarSign,
    gradientClasses: 'from-yellow-500 to-yellow-600',
    shadowClasses: 'shadow-yellow-500/50',
    ringClasses: 'ring-yellow-400/50',
    glowColor: 'rgb(234 179 8)' // yellow-500
  },
  { 
    id: 'card', 
    label: 'Splice Card', 
    icon: CreditCard,
    gradientClasses: 'from-indigo-500 to-indigo-600',
    shadowClasses: 'shadow-indigo-500/50',
    ringClasses: 'ring-indigo-400/50',
    glowColor: 'rgb(99 102 241)' // indigo-500
  },
  { 
    id: 'merchant', 
    label: 'Merchant', 
    icon: ShoppingBag,
    gradientClasses: 'from-green-500 to-emerald-600',
    shadowClasses: 'shadow-green-500/50',
    ringClasses: 'ring-green-400/50',
    glowColor: 'rgb(34 197 94)' // green-500
  },
]

interface PaymentFlowAnimationProps {
  isLoading?: boolean // If true, loop through steps without showing completion
  showCompletion?: boolean // If true, show the completion message
}

export function PaymentFlowAnimation({ isLoading = false, showCompletion = false }: PaymentFlowAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // If loading, loop through steps continuously
    if (isLoading) {
      setIsComplete(false)
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= paymentSteps.length - 1) {
            // Loop back to start
            return 0
          }
          return prev + 1
        })
      }, 1000) // Move to next step every 1000ms

      return () => clearInterval(interval)
    }

    // If showing completion and not already complete, progress through steps once then show completion
    if (showCompletion && !isLoading && !isComplete) {
      let intervalId: NodeJS.Timeout
      intervalId = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= paymentSteps.length - 1) {
            setIsComplete(true)
            if (intervalId) clearInterval(intervalId)
            return prev
          }
          return prev + 1
        })
      }, 600) // Faster progression for completion

      return () => {
        if (intervalId) clearInterval(intervalId)
      }
    }
  }, [isLoading, isComplete, showCompletion])

  // Reset when transitioning from loading to completion
  useEffect(() => {
    if (showCompletion && !isLoading) {
      setCurrentStep(0)
      setIsComplete(false)
    }
  }, [showCompletion, isLoading])

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {!isLoading && (
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-foreground bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent"
        >
          Payment Flow
        </motion.h3>
      )}
      
      <div className="flex items-center justify-center gap-1 relative px-2">
        {paymentSteps.map((step, index) => {
          const Icon = step.icon
          const isActive = index <= currentStep
          const isCurrent = index === currentStep
          const isCompleted = index < currentStep
          const isLast = index === paymentSteps.length - 1
          const nextStep = index < paymentSteps.length - 1 ? paymentSteps[index + 1] : null

          return (
            <div key={step.id} className="flex items-center">
              <motion.div
                className="relative flex flex-col items-center gap-3"
                initial={false}
                animate={{
                  scale: isCurrent ? 1.08 : 1,
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {/* Step Icon Container */}
                <motion.div
                  className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-br ${step.gradientClasses} shadow-2xl ${step.shadowClasses} ring-2 ${step.ringClasses} ring-offset-2 ring-offset-background`
                      : 'bg-muted/50 border-2 border-border/50'
                  }`}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.15 : isActive ? 1.05 : 1,
                    rotate: isCurrent ? [0, -8, 8, 0] : 0,
                  }}
                  transition={{
                    scale: { duration: 0.3 },
                    rotate: { duration: 0.6, repeat: isLoading && isCurrent ? Infinity : 0, repeatDelay: 0.4 },
                  }}
                  style={{
                    boxShadow: isActive && isCurrent 
                      ? `0 0 30px ${step.glowColor}40, 0 10px 40px ${step.glowColor}30`
                      : undefined
                  }}
                >
                  {/* Glow effect for active steps */}
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.gradientClasses} opacity-20 blur-xl`}
                      animate={{
                        opacity: isCurrent ? [0.3, 0.5, 0.3] : 0.2,
                        scale: isCurrent ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: isLoading && isCurrent ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                  
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive 
                        ? 'text-white drop-shadow-lg' 
                        : 'text-muted-foreground'
                    }`}
                  />
                  
                  {/* Multiple pulse effects for current step */}
                  {isCurrent && !isComplete && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{ backgroundColor: `${step.glowColor}30` }}
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{ backgroundColor: `${step.glowColor}20` }}
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeOut',
                          delay: 0.3,
                        }}
                      />
                    </>
                  )}
                  
                  {/* Checkmark for completed steps */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -180 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-2 border-background shadow-lg shadow-green-500/50 ring-2 ring-green-400/50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Step Label */}
                <motion.div
                  className={`px-2 py-0.5 rounded-md transition-all duration-300 ${
                    isActive
                      ? isCurrent
                        ? `bg-gradient-to-r ${step.gradientClasses} text-white shadow-lg ${step.shadowClasses}`
                        : `bg-gradient-to-r ${step.gradientClasses} opacity-10 text-foreground border border-current`
                      : 'bg-muted/30 text-muted-foreground'
                  }`}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.05 : 1,
                  }}
                >
                  <p className={`text-[10px] font-semibold text-center whitespace-nowrap ${
                    isActive && isCurrent ? 'text-white' : ''
                  }`}>
                    {step.label}
                  </p>
                </motion.div>
              </motion.div>

              {/* Connecting Arrow/Line */}
              {!isLast && nextStep && (
                <div className="relative mx-2 w-10 h-0.5">
                  <motion.div
                    className={`absolute inset-0 rounded-full bg-gradient-to-r ${step.gradientClasses} ${nextStep.gradientClasses} ${
                      isActive ? step.shadowClasses : 'opacity-30'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: isActive ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: 0.2,
                      ease: 'easeInOut',
                    }}
                    style={{ transformOrigin: 'left' }}
                  />
                  
                  {/* Animated dot moving along the line */}
                  {isActive && !isCompleted && (
                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-gradient-to-br ${step.gradientClasses} rounded-full shadow-lg ring-1 ring-white/50`}
                      style={{ boxShadow: `0 0 10px ${step.glowColor}60` }}
                      initial={{ left: 0 }}
                      animate={{ left: '100%' }}
                      transition={{
                        duration: 0.8,
                        repeat: isLoading ? Infinity : 0,
                        ease: 'linear',
                      }}
                    />
                  )}
                  
                  {/* Glow trail effect */}
                  {isActive && isCurrent && (
                    <motion.div
                      className={`absolute top-1/2 -translate-y-1/2 h-1 w-8 bg-gradient-to-r ${step.gradientClasses} opacity-30 blur-sm rounded-full`}
                      animate={{
                        x: [0, 16, 0],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Completion Card */}
      <AnimatePresence>
        {isComplete && showCompletion && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            <motion.div
              className="bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-background dark:from-green-950/20 dark:via-emerald-950/10 dark:to-background rounded-2xl border-2 border-green-500/30 shadow-2xl shadow-green-500/20 p-6 backdrop-blur-sm relative overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Header */}
              <motion.div
                className="flex items-center gap-3 mb-6 relative z-10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/50 ring-4 ring-green-400/30 ring-offset-2 ring-offset-background"
                >
                  <CheckCircle2 className="w-7 h-7 text-white drop-shadow-lg" />
                </motion.div>
                <div>
                  <h4 className="text-lg font-bold text-foreground bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Transaction Complete
                  </h4>
                  <p className="text-xs text-muted-foreground font-medium">Payment processed successfully</p>
                </div>
              </motion.div>

              {/* Transaction Details Grid */}
              <motion.div
                className="grid grid-cols-2 gap-4 mb-4 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  className="space-y-1 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/50 dark:border-blue-800/30"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Amount</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">$0.05</p>
                </motion.div>
                <motion.div
                  className="space-y-1 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/50 dark:border-purple-800/30"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.65 }}
                >
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">From</p>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">USDC</p>
                </motion.div>
                <motion.div
                  className="space-y-1 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 border border-indigo-200/50 dark:border-indigo-800/30"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">To</p>
                  <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">USD</p>
                </motion.div>
                <motion.div
                  className="space-y-1 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-green-950/30 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/30"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.75 }}
                >
                  <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Status</p>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">Complete</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Transaction Hash */}
              <motion.div
                className="pt-4 border-t-2 border-green-200/50 dark:border-green-800/30 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Transaction Hash</p>
                <div className="bg-gradient-to-br from-muted/80 to-muted/50 rounded-xl px-4 py-3 border border-border/50 shadow-inner">
                  <p className="text-xs font-mono text-foreground break-all leading-relaxed font-semibold">
                    0x57ba59033233c750b434636e86e385294d43eeba
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
