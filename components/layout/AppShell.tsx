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
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Topbar role={role} />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
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
      </div>
    </div>
  )
}
