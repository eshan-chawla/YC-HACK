'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
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
        <Button variant="ghost" size="icon" className="relative hover:bg-muted transition-colors rounded-full h-9 w-9">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-background">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 md:w-96 p-0 border-border/60 shadow-2xl rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm uppercase tracking-widest text-foreground">Notifications</h3>
            {unreadCount > 0 && (
                <Badge className="h-5 px-1.5 bg-primary/10 text-primary text-[10px] font-black border-none shadow-none">
                    {unreadCount} NEW
                </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/5 h-7 px-2"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
          <AnimatePresence initial={false}>
            {notifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <MailOpen className="w-6 h-6 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground">You have no new notifications.</p>
                </div>
              </div>
            ) : (
              notifications.map((notification, index) => {
                const config = iconConfig[notification.type]
                const Icon = config.icon

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "group relative px-4 py-4 border-b border-border/40 hover:bg-muted/30 transition-all cursor-pointer",
                        !notification.read && "bg-primary/[0.02]"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-xl flex-shrink-0 shadow-sm border border-border/20", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className={cn(
                              "text-sm leading-tight truncate",
                              notification.read ? "text-foreground/70 font-medium" : "text-foreground font-bold"
                          )}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-1"
                            onClick={e => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight">
                                {notification.timestamp}
                            </span>
                            {!notification.read && (
                                <div className="w-1 h-1 rounded-full bg-primary" />
                            )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>

        <div className="p-3 bg-muted/10">
          <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
            View Notification Archive
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
