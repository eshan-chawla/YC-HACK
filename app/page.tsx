'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, TrendingUp, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Mock data
const mockEvents = [
  {
    id: 1,
    name: 'Team Q4 Offsite 2025',
    destination: 'Miami, FL',
    dates: 'Nov 20-24, 2025',
    budget: 25000,
    spent: 7500,
    employees: 10,
    booked: 3,
    status: 'active',
  },
  {
    id: 2,
    name: 'Engineering Summit',
    destination: 'San Francisco, CA',
    dates: 'Dec 5-7, 2025',
    budget: 15000,
    spent: 0,
    employees: 8,
    booked: 0,
    status: 'pending',
  },
  {
    id: 3,
    name: 'Sales Kickoff',
    destination: 'Las Vegas, NV',
    dates: 'Jan 15-18, 2026',
    budget: 30000,
    spent: 28500,
    employees: 12,
    booked: 12,
    status: 'completed',
  },
]

const mockActivity = [
  { time: '2:34 PM', message: 'John Smith: Flight booked (United)' },
  { time: '2:15 PM', message: 'Sarah Chen: Email opened (68%)' },
  { time: '1:52 PM', message: 'Mike Johnson: Trip confirmed' },
  { time: '1:30 PM', message: 'Lisa Wong: Policy alert (budget)' },
  { time: '1:15 PM', message: 'Emails sent to 10 employees' },
]

const statCards = [
  {
    label: 'Active Events',
    value: '2',
    icon: TrendingUp,
    color: 'text-blue-500',
  },
  {
    label: 'Total Spend This Month',
    value: '$36,000',
    icon: Users,
    color: 'text-green-500',
  },
  {
    label: 'Employees Booked',
    value: '15 / 30',
    icon: AlertCircle,
    color: 'text-amber-500',
  },
  {
    label: 'Policy Compliance Rate',
    value: '98%',
    icon: CheckCircle2,
    color: 'text-green-500',
  },
]

export default function Dashboard() {
  const [events] = useState(mockEvents)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your corporate travel events</p>
          </div>
          <Link href="/events/new">
            <Button className="bg-primary hover:bg-blue-600 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Create New Event
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                    </div>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Events and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events Table */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
              <p className="text-sm text-muted-foreground mt-1">All your travel events in one place</p>
            </div>

            <div className="space-y-3">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/events/${event.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{event.name}</h3>
                          <p className="text-sm text-muted-foreground">{event.destination}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            event.status === 'active'
                              ? 'bg-blue-100 text-blue-700'
                              : event.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Dates</p>
                          <p className="font-medium text-foreground">{event.dates}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Budget</p>
                          <p className="font-medium text-foreground">${(event.budget / 1000).toFixed(0)}k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Booked</p>
                          <p className="font-medium text-foreground">
                            {event.booked}/{event.employees}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Spend</p>
                          <p className="font-medium text-foreground">
                            {((event.spent / event.budget) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${(event.booked / event.employees) * 100}%` }}
                        />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Activity Feed</h2>
              <p className="text-sm text-muted-foreground mt-1">Recent updates</p>
            </div>

            <Card className="p-4">
              <div className="space-y-4">
                {mockActivity.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-snug">{item.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
