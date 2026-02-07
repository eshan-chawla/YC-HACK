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

const statusStyles: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
}

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
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Events" value="2" icon={TrendingUp} trend={{ value: 12, label: "vs last month", isPositive: true }} index={0} />
          <StatCard label="Total Spend" value="$36,000" description="Across all events" icon={Users} index={1} />
          <StatCard label="Employees Booked" value="15 / 30" icon={AlertCircle} index={2} />
          <StatCard label="Policy Compliance" value="98%" icon={CheckCircle2} trend={{ value: 2, label: "vs last month", isPositive: true }} index={3} />
        </div>

        {/* Events and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Recent Events</h2>
              <Link href="/admin/itineraries" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.06 }}
                >
                  <Link href={`/admin/itineraries/${event.id}`}>
                    <Card className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-[15px]">{event.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.destination}</p>
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-medium capitalize",
                          statusStyles[event.status]
                        )}>
                          {event.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {[
                          { label: 'Dates', value: event.dates },
                          { label: 'Budget', value: `$${(event.budget / 1000).toFixed(0)}k` },
                          { label: 'Booked', value: `${event.booked}/${event.employees}` },
                          { label: 'Spent', value: `${((event.spent / event.budget) * 100).toFixed(0)}%` },
                        ].map((col) => (
                          <div key={col.label} className="space-y-0.5">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{col.label}</p>
                            <p className="text-sm font-medium text-foreground">{col.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress */}
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[11px] text-muted-foreground">Progress</span>
                          <span className="text-[11px] font-medium text-foreground">
                            {Math.round((event.booked / event.employees) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(event.booked / event.employees) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Activity</h2>
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-border/40">
                {mockActivity.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.06 }}
                    className="px-4 py-3.5 hover:bg-muted/30 transition-colors flex items-start gap-3"
                  >
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                      item.type === 'booking' ? "bg-blue-500" :
                      item.type === 'success' ? "bg-emerald-500" :
                      item.type === 'warning' ? "bg-amber-500" : "bg-slate-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground leading-snug">{item.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-border/40">
                <Button variant="ghost" className="w-full rounded-none h-10 text-xs font-medium text-primary hover:bg-primary/5">
                  View all activity
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
