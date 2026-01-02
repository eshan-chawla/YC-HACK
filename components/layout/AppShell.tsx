'use client'

import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AppShellProps {
  children: React.ReactNode
  role?: 'admin' | 'employee'
}

export function AppShell({ children, role = 'admin' }: AppShellProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Client-side auth check for demo
    const sessionStr = localStorage.getItem('tripweaver_session')
    
    if (!sessionStr) {
      router.push('/')
    } else {
      try {
        const session = JSON.parse(sessionStr)
        const sessionDate = new Date(session.timestamp)
        const now = new Date()
        const diffDays = Math.ceil(Math.abs(now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Mock token expiry: Clear session if older than 15 days
        if (diffDays > 15) {
          localStorage.removeItem('tripweaver_session')
          router.push('/')
        } else {
          setIsAuthenticated(true)
        }
      } catch (e) {
        localStorage.removeItem('tripweaver_session')
        router.push('/')
      }
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - fixed width */}
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Topbar - fixed height */}
        <Topbar role={role} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-background/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={role} // Re-animate on role change if needed
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="container mx-auto p-4 md:p-8"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

