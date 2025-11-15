'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/EventDetail/StatsCard'
import { BookingsTable } from '@/components/EventDetail/BookingsTable'
import { ActivityFeed } from '@/components/EventDetail/ActivityFeed'
import { useEventPolling } from '@/hooks/useEventPolling'
import { ArrowLeft, RefreshCw, Pause, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface MockEventData {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: 'active' | 'pending' | 'completed'
  createdAt: string
  totalBudget: number
  spent: number
  totalEmployees: number
  employees: Array<{
    id: string
    name: string
    status: 'pending' | 'in_progress' | 'booked' | 'failed' | 'alert'
    tripCost?: number
  }>
  activities: Array<{
    id: string
    time: string
    message: string
    type: 'booking' | 'email' | 'alert' | 'system'
  }>
}

const mockEventData: MockEventData = {
  id: '1',
  name: 'Team Q4 Offsite 2025',
  destination: 'Miami, Florida',
  startDate: 'Nov 20, 2025',
  endDate: 'Nov 24, 2025',
  status: 'active',
  createdAt: 'Nov 15, 2025',
  totalBudget: 25000,
  spent: 7500,
  totalEmployees: 10,
  employees: [
    { id: '1', name: 'John Smith', status: 'booked', tripCost: 2450 },
    { id: '2', name: 'Sarah Chen', status: 'pending' },
    { id: '3', name: 'Mike Johnson', status: 'in_progress', tripCost: 2350 },
    { id: '4', name: 'Lisa Wong', status: 'alert' },
    { id: '5', name: 'James Taylor', status: 'failed' },
    { id: '6', name: 'Emma Davis', status: 'booked', tripCost: 2400 },
    { id: '7', name: 'Alex Martin', status: 'in_progress', tripCost: 2300 },
    { id: '8', name: 'Rachel Green', status: 'pending' },
    { id: '9', name: 'Chris Lee', status: 'booked', tripCost: 2380 },
    { id: '10', name: 'Diana Prince', status: 'pending' },
  ],
  activities: [
    { id: '1', time: '2:34 PM', message: 'John Smith: Flight booked (United UA-487)', type: 'booking' },
    { id: '2', time: '2:15 PM', message: 'Sarah Chen: Email opened (clicked link)', type: 'email' },
    { id: '3', time: '1:52 PM', message: 'Mike Johnson: Hotel booking confirmed (Marriott)', type: 'booking' },
    { id: '4', time: '1:30 PM', message: 'Lisa Wong: Budget alert - exceeds limit by $150', type: 'alert' },
    { id: '5', time: '1:15 PM', message: 'Event invitations sent to 10 employees', type: 'system' },
    { id: '6', time: '12:45 PM', message: 'Emma Davis: Trip details received and confirmed', type: 'booking' },
  ],
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { data, isRefreshing, refresh } = useEventPolling(mockEventData, { interval: 10000 })
  const [autoRefresh, setAutoRefresh] = useState(true)

  const bookedCount = data.employees.filter(e => e.status === 'booked').length
  const pendingCount = data.employees.filter(e => e.status === 'pending').length
  const failedCount = data.employees.filter(e => e.status === 'failed').length
  const bookingProgress = ((bookedCount / data.totalEmployees) * 100).toFixed(0)
  const spendProgress = ((data.spent / data.totalBudget) * 100).toFixed(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div className="flex items-start gap-4">
            <Link href="/events">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Status: <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 ml-1">Active</span></span>
                <span>|</span>
                <span>Created: {data.createdAt}</span>
                <span>|</span>
                <span>Ends: {data.endDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refresh()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAutoRefresh(!autoRefresh)}>
                  {autoRefresh ? 'Stop' : 'Resume'} Auto-Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Pause Event</DropdownMenuItem>
                <DropdownMenuItem>Edit Event</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Cancel Event</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Bookings"
            value={`${bookedCount} of ${data.totalEmployees}`}
            progress={parseInt(bookingProgress)}
            delay={0}
          />
          <StatsCard
            label="Completed"
            value={bookedCount}
            unit="trips finalized"
            delay={0.1}
          />
          <StatsCard
            label="Spend Tracking"
            value={`$${data.spent.toLocaleString()}`}
            unit={`of $${data.totalBudget.toLocaleString()}`}
            progress={parseInt(spendProgress)}
            delay={0.2}
          />
          <StatsCard
            label="Pending Confirmations"
            value={pendingCount}
            unit={failedCount > 0 ? `+ ${failedCount} failed` : 'awaiting approval'}
            delay={0.3}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Employee Bookings</h2>
            </div>
            <BookingsTable employees={data.employees} eventId={data.id} />
          </div>

          <ActivityFeed items={data.activities} />
        </div>
      </div>
    </DashboardLayout>
  )
}
