'use client'

import { useState, useCallback } from 'react'
import { Toaster, toast } from 'sonner'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9)
      const { type, title, message, duration = 5000 } = notification

      switch (type) {
        case 'success':
          toast.success(message, {
            description: title,
            duration,
          })
          break
        case 'error':
          toast.error(message, {
            description: title,
            duration,
          })
          break
        case 'warning':
          toast.warning(message, {
            description: title,
            duration,
          })
          break
        case 'info':
        default:
          toast.info(message, {
            description: title,
            duration,
          })
          break
      }

      return id
    },
    []
  )

  return { addNotification }
}
