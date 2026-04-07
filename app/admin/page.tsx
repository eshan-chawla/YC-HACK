'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, TrendingUp, Users, AlertCircle, CheckCircle2, ArrowRight, Calendar, MessageSquare, Check, X } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const statusBadge: Record<string, string> = {
  active: 'badge badge-active',
  pending: 'badge badge-pending',
  draft: 'badge badge-draft',
  completed: 'badge badge-completed',
  cancelled: 'badge badge-cancelled',
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
  const pendingRequests = useQuery(api.trips.listPendingChangeRequests, {})
  const respond = useMutation(api.trips.respondToChangeRequest)

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

        {/* Pending Approvals */}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">Pending Approvals</h2>
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-400/12 text-amber-400 text-[11px] font-semibold tabular-nums">
                {pendingRequests.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingRequests.map((req, index) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.04 }}
                >
                  <Card className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-medium text-foreground">{req.employeeName}</p>
                        <p className="text-[11px] text-muted-foreground/60 capitalize">
                          {req.requestType.replace('_', ' ')} · {req.eventName}
                        </p>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">{req.description}</p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-[12px] gap-1 bg-primary hover:bg-primary/90"
                        onClick={() => respond({ requestId: req._id as Id<'changeRequests'>, action: 'approved' })}
                      >
                        <Check className="w-3 h-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-[12px] gap-1"
                        onClick={() => respond({ requestId: req._id as Id<'changeRequests'>, action: 'rejected' })}
                      >
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Events and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">Recent Events</h2>
              <Link href="/admin/itineraries" className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors duration-150">
                View all <ArrowRight className="w-3 h-3" />
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
                      <Card className="p-5 cursor-pointer group card-hover border-border">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">
                              {event.name}
                            </h3>
                            <p className="text-[12px] text-muted-foreground/60 mt-0.5">{event.destination}</p>
                          </div>
                          <span className={cn(statusBadge[event.status] ?? 'badge badge-draft', 'capitalize mt-0.5')}>
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
                          <div className="h-[3px] rounded-full bg-border overflow-hidden">
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
            <h2 className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">Activity</h2>
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
                        className="px-4 py-3 hover:bg-muted/20 transition-colors flex items-start gap-3"
                      >
                        <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0 bg-border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-foreground leading-snug">
                            <span className="font-medium">{item.userName}</span>
                            <span className="text-muted-foreground"> {item.action}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
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
