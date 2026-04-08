'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useCurrentUser'

interface AppShellProps {
  children: React.ReactNode
  role?: 'admin' | 'employee'
}

export function AppShell({ children, role = 'admin' }: AppShellProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useCurrentUser()
  const isRedirecting = useRef(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (isRedirecting.current) return
      isRedirecting.current = true
      router.push('/')
    } else if (isAuthenticated) {
      isRedirecting.current = false
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl icon-3d-emerald flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role={role} />

      {/* Main content — floating sculpted plate */}
      <div className="flex-1 flex flex-col py-3 pr-3 pl-0 relative z-10 overflow-hidden">
        <div className="plate-macro w-full h-full rounded-[2rem] overflow-hidden flex flex-col relative">
          {/* Warm ambient glows inside the plate */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[250px] bg-emerald-400/[0.04] blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[200px] bg-yellow-400/[0.03] blur-[100px] rounded-full pointer-events-none" />

          <Topbar role={role} />

          <main className="flex-1 overflow-y-auto scrollbar-thin relative z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mx-auto max-w-[1400px] p-6 md:p-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom structural rim */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/30 to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
