'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import Link from 'next/link'

const mockEvents = [
  {
    id: '1',
    name: 'Team Q4 Offsite 2025',
    destination: 'Miami, FL',
    dates: 'Nov 20-24, 2025',
    budget: 25000,
    spent: 7500,
    employees: 10,
    booked: 3,
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Engineering Summit',
    destination: 'San Francisco, CA',
    dates: 'Dec 5-7, 2025',
    budget: 15000,
    spent: 0,
    employees: 8,
    booked: 0,
    status: 'pending' as const,
  },
  {
    id: '3',
    name: 'Sales Kickoff',
    destination: 'Las Vegas, NV',
    dates: 'Jan 15-18, 2026',
    budget: 30000,
    spent: 28500,
    employees: 12,
    booked: 12,
    status: 'completed' as const,
  },
]

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Events</h1>
            <p className="text-muted-foreground mt-1">Manage all your travel events</p>
          </div>
          <Link href="/events/create">
            <Button className="bg-primary hover:bg-blue-600 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Create New Event
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {mockEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/events/${event.id}`}>
                <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">{event.destination}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
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

                  <div className="grid grid-cols-5 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground text-xs">Dates</p>
                      <p className="font-medium text-foreground">{event.dates}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Budget</p>
                      <p className="font-medium text-foreground">${(event.budget / 1000).toFixed(0)}k</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Employees</p>
                      <p className="font-medium text-foreground">{event.employees}</p>
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

                  <div className="w-full bg-muted rounded-full h-2">
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
    </DashboardLayout>
  )
}
