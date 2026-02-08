'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, TrendingUp, Users, AlertCircle, CheckCircle2, ArrowRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

function formatDateRange(departure: number, returnDate: number) {
  const d = new Date(departure)
  const r = new Date(returnDate)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${r.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function formatActivityTime(ts: number) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function AdminDashboard() {
  const eventsWithStats = useQuery(api.events.listWithTripStats, { limit: 10 })
  const activity = useQuery(api.auditLogs.getRecentActivity, { limit: 20 })

  const isLoading = eventsWithStats === undefined
  const events = eventsWithStats ?? []

  const activeCount = events.filter((e) => e.status === 'active').length
  const totalSpend = events.reduce((sum, e) => sum + e.totalSpent, 0)
  const totalBooked = events.reduce((sum, e) => sum + e.bookedCount, 0)
  const totalEmployees = events.reduce((sum, e) => sum + e.employeeIds.length, 0)
  const complianceTotal = events.reduce((sum, e) => sum + e.complianceCount, 0)
  const tripsWithCompliance = events.reduce((sum, e) => sum + e.tripCount, 0)
  const compliancePct = tripsWithCompliance > 0 ? Math.round((complianceTotal / tripsWithCompliance) * 100) : 0

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
          <StatCard
            label="Active Events"
            value={String(activeCount)}
            icon={TrendingUp}
            index={0}
          />
          <StatCard
            label="Total Spend"
            value={totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : '—'}
            description="Across all events"
            icon={Users}
            index={1}
          />
          <StatCard
            label="Employees Booked"
            value={totalEmployees > 0 ? `${totalBooked} / ${totalEmployees}` : '—'}
            icon={AlertCircle}
            index={2}
          />
          <StatCard
            label="Policy Compliance"
            value={tripsWithCompliance > 0 ? `${compliancePct}%` : '—'}
            icon={CheckCircle2}
            index={3}
          />
        </div>

        {/* Events and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Recent Events</h2>
              <Link href="/admin/itineraries" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground text-sm">Loading events…</div>
              </div>
            ) : events.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No events yet.</p>
                <Link href="/admin/itineraries/new">
                  <Button className="mt-4 gap-2" variant="outline">
                    <Plus className="w-4 h-4" /> Create your first event
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.06 }}
                  >
                    <Link href={`/admin/itineraries/${event._id}`}>
                      <Card className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-[15px]">
                              {event.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{event.destination}</p>
                          </div>
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-md text-[11px] font-medium capitalize',
                              statusStyles[event.status] ?? 'bg-muted text-muted-foreground'
                            )}
                          >
                            {event.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                          {[
                            { label: 'Dates', value: formatDateRange(event.departureDate, event.returnDate) },
                            { label: 'Budget', value: `$${(event.totalBudget / 1000).toFixed(0)}k` },
                            { label: 'Booked', value: `${event.bookedCount}/${event.employeeIds.length}` },
                            {
                              label: 'Spent',
                              value:
                                event.totalBudget > 0
                                  ? `${Math.round((event.totalSpent / event.totalBudget) * 100)}%`
                                  : '0%',
                            },
                          ].map((col) => (
                            <div key={col.label} className="space-y-0.5">
                              <p className="text-[11px] text-muted-foreground uppercase tracking-wider truncate">
                                {col.label}
                              </p>
                              <p className="text-sm font-medium text-foreground truncate" title={col.value}>
                                {col.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-[11px] text-muted-foreground">Progress</span>
                            <span className="text-[11px] font-medium text-foreground">
                              {event.employeeIds.length > 0
                                ? Math.round((event.bookedCount / event.employeeIds.length) * 100)
                                : 0}
                              %
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  event.employeeIds.length > 0
                                    ? (event.bookedCount / event.employeeIds.length) * 100
                                    : 0
                                }%`,
                              }}
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
            )}
          </div>

          {/* Activity */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">Activity</h2>
            <Card className="p-0 overflow-hidden">
              {activity === undefined ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : activity.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                <>
                  <div className="divide-y divide-border/40">
                    {activity.map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                        className="px-4 py-3.5 hover:bg-muted/30 transition-colors flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-slate-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground leading-snug">
                            {item.userName}: {item.action} ({item.resourceType}
                            {item.resourceId ? ` ${item.resourceId}` : ''})
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatActivityTime(item.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="border-t border-border/40">
                    <Button
                      variant="ghost"
                      className="w-full rounded-none h-10 text-xs font-medium text-primary hover:bg-primary/5"
                      asChild
                    >
                      <Link href="/admin/itineraries">View all activity</Link>
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
