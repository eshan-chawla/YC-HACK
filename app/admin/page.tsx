'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, TrendingUp, Users, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
  { time: '2:34 PM', message: 'John Smith: Flight booked (United)', type: 'booking' },
  { time: '2:15 PM', message: 'Sarah Chen: Email opened (68%)', type: 'info' },
  { time: '1:52 PM', message: 'Mike Johnson: Trip confirmed', type: 'success' },
  { time: '1:30 PM', message: 'Lisa Wong: Policy alert (budget)', type: 'warning' },
  { time: '1:15 PM', message: 'Emails sent to 10 employees', type: 'info' },
]

export default function AdminDashboard() {
  const [events] = useState(mockEvents)

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <PageHeader 
          title="Overview" 
          description="Manage your corporate travel events and policy compliance"
          actions={
            <Link href="/admin/itineraries/new">
              <Button className="bg-primary hover:bg-green-600 text-primary-foreground gap-2 h-10 px-5 shadow-lg shadow-green-500/10 transition-all active:scale-95">
                <Plus className="w-4 h-4" />
                Create New Event
              </Button>
            </Link>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            label="Active Events"
            value="2"
            icon={TrendingUp}
            trend={{ value: 12, label: "vs last month", isPositive: true }}
            index={0}
          />
          <StatCard 
            label="Total Spend"
            value="$36,000"
            description="Across all events this month"
            icon={Users}
            index={1}
          />
          <StatCard 
            label="Employees Booked"
            value="15 / 30"
            icon={AlertCircle}
            index={2}
          />
          <StatCard 
            label="Policy Compliance"
            value="98%"
            icon={CheckCircle2}
            trend={{ value: 2, label: "vs last month", isPositive: true }}
            index={3}
          />
        </div>

        {/* Events and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Recent Events</h2>
              <Link href="/admin/itineraries" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link href={`/admin/itineraries/${event.id}`}>
                    <Card className="p-5 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group border-border/60">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{event.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.destination}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            event.status === 'active'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : event.status === 'pending'
                              ? 'bg-amber-50 text-amber-600 border border-amber-100'
                              : 'bg-green-50 text-green-600 border border-green-100'
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-5">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">Dates</p>
                          <p className="text-xs font-semibold text-foreground">{event.dates}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">Budget</p>
                          <p className="text-xs font-semibold text-foreground">${(event.budget / 1000).toFixed(0)}k</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">Booked</p>
                          <p className="text-xs font-semibold text-foreground">
                            {event.booked}/{event.employees}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">Spend</p>
                          <p className="text-xs font-semibold text-foreground">
                            {((event.spent / event.budget) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold inline-block text-primary uppercase tracking-widest">
                                    Booking Progress
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold inline-block text-primary">
                                    {Math.round((event.booked / event.employees) * 100)}%
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-1.5 mb-1 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(event.booked / event.employees) * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                            />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Activity Feed</h2>
            <Card className="p-0 overflow-hidden border-border/60">
              <div className="divide-y divide-border/40">
                {mockActivity.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="p-4 hover:bg-muted/30 transition-colors flex items-start gap-3"
                  >
                    <div className={cn(
                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                        item.type === 'booking' ? "bg-blue-500" :
                        item.type === 'success' ? "bg-green-500" :
                        item.type === 'warning' ? "bg-amber-500" : "bg-slate-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug font-medium">{item.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 font-semibold">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button variant="ghost" className="w-full rounded-none h-11 text-xs font-bold text-primary hover:bg-primary/5">
                View All Activity
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
