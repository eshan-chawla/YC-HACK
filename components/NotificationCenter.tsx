'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle, Bell, MailOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  success: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  error: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
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

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 border-border/60 shadow-xl rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium border-none">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-primary hover:text-primary hover:bg-primary/5 h-7 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[360px] scrollbar-thin">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <div className="py-10 px-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <MailOpen className="w-5 h-5 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground">No new notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = iconConfig[notification.type]
                const Icon = config.icon

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "group relative px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer",
                      !notification.read && "bg-primary/[0.02]"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className={cn("p-1.5 rounded-lg flex-shrink-0", config.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm leading-tight truncate",
                            notification.read ? "text-foreground/70" : "text-foreground font-medium"
                          )}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-5 h-5 rounded opacity-0 group-hover:opacity-100 transition-opacity -mt-0.5 -mr-1"
                            onClick={e => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/50 mt-1.5 block">
                          {notification.timestamp}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        <div className="p-2 border-t border-border/30">
          <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground">
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
