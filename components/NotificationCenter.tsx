'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react'

interface NotificationItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'success',
    title: 'Booking Confirmed',
    message: 'John Smith\'s flight booking for Team Q4 Offsite has been confirmed',
    timestamp: '2 mins ago',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Budget Alert',
    message: 'Lisa Wong\'s trip exceeds budget by $150. Requires approval.',
    timestamp: '15 mins ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Email Opened',
    message: 'Sarah Chen opened the event invitation email',
    timestamp: '1 hour ago',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Booking Failed',
    message: 'James Taylor\'s hotel booking failed. Please retry.',
    timestamp: '2 hours ago',
    read: true,
  },
]

const iconConfig = {
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 max-h-96 overflow-hidden p-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-80">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No notifications</p>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const config = iconConfig[notification.type]
                const Icon = config.icon

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`px-4 py-3 border-b border-border hover:bg-muted transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-foreground leading-snug">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 flex-shrink-0 -mr-1"
                            onClick={e => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1.5">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3">
              <Button variant="outline" size="sm" className="w-full text-xs">
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
