'use client'

import { useEffect, useState } from 'react'

interface PollingOptions {
  interval?: number
  enabled?: boolean
}

export function useEventPolling<T>(
  initialData: T,
  options: PollingOptions = {}
) {
  const { interval = 10000, enabled = true } = options
  const [data, setData] = useState(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const timer = setInterval(() => {
      setIsRefreshing(true)
      // Simulate API call with data mutation
      setData(prev => {
        if (typeof prev === 'object' && prev !== null && 'employees' in prev) {
          return {
            ...prev,
            employees: (prev as any).employees.map((emp: any) => ({
              ...emp,
              // Randomly update some employee statuses for demo
              status: Math.random() > 0.7 ? emp.status : emp.status,
            }))
          }
        }
        return prev
      })
      setIsRefreshing(false)
    }, interval)

    return () => clearInterval(timer)
  }, [interval, enabled])

  const refresh = async () => {
    setIsRefreshing(true)
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsRefreshing(false)
  }

  return { data, isRefreshing, refresh }
}
