'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, Users, AlertCircle, CheckCircle2, ArrowRight, Calendar, Sparkles, Check, X, Globe, Plane } from 'lucide-react'
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
          title="Global Overview"
          description="Manage your corporate travel events and policy compliance"
          actions={
            <Link href="/admin/itineraries/new">
              <Button className="gap-2 rounded-2xl h-10 px-5 btn-emerald-solid blob-2 btn-press">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </Link>
          }
        />

        {/* Stats — Paper sculpture cards */}
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

        {/* Pending Approvals — Paper cards with gold accent */}
        {pendingRequests && pendingRequests.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-title text-lg text-foreground">Pending Approvals</h2>
              <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold tabular-nums">
                {pendingRequests.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req, index) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.04 }}
                >
                  <div className="paper-card rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    {/* Gold accent blob */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400/[0.06] rounded-full blur-[40px] pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                      <div className="space-y-0.5">
                        <p className="text-[13px] font-medium text-foreground">{req.employeeName}</p>
                        <p className="text-[11px] text-muted-foreground/60 capitalize">
                          {req.requestType.replace('_', ' ')} · {req.eventName}
                        </p>
                      </div>
                      <div className="paper-inset blob-1 w-8 h-8 shrink-0 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2 relative z-10">{req.description}</p>
                    <div className="flex gap-2.5 pt-1 relative z-10">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-[12px] gap-1.5 rounded-xl btn-emerald-solid btn-press"
                        onClick={() => respond({ requestId: req._id as Id<'changeRequests'>, action: 'approved' })}
                      >
                        <Check className="w-3 h-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-[12px] gap-1.5 rounded-xl btn-press"
                        onClick={() => respond({ requestId: req._id as Id<'changeRequests'>, action: 'rejected' })}
                      >
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Events and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-title text-lg text-foreground">Live Operations</h2>
              <Link href="/admin/itineraries" className="text-[12px] text-emerald-700 hover:text-emerald-600 flex items-center gap-1.5 transition-colors duration-200 group font-medium">
                View all <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {isLoading ? (
              <div className="paper-card rounded-3xl flex items-center justify-center py-16">
                <div className="animate-pulse text-muted-foreground text-sm">Loading events...</div>
              </div>
            ) : events.length === 0 ? (
              <div className="paper-card rounded-3xl p-10 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-emerald-400/[0.04] blur-[60px] pointer-events-none" />
                <div className="paper-inset blob-3 w-14 h-14 mx-auto mb-4 flex items-center justify-center relative z-10">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-muted-foreground mb-5 relative z-10">No events yet.</p>
                <Link href="/admin/itineraries/new">
                  <Button className="gap-2 rounded-xl btn-emerald-solid blob-2 btn-press relative z-10" variant="outline">
                    <Plus className="w-4 h-4" /> Create your first event
                  </Button>
                </Link>
              </div>
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
                      <div className="paper-card rounded-2xl p-5 cursor-pointer group relative overflow-hidden">
                        {/* Hover accent glow */}
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-emerald-400/[0.08]" />

                        <div className="flex items-start justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="paper-inset blob-5 w-10 h-10 flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="text-[14px] font-medium text-foreground group-hover:text-emerald-700 transition-colors">
                                {event.name}
                              </h3>
                              <p className="text-[12px] text-muted-foreground/60 mt-0.5">{event.destination}</p>
                            </div>
                          </div>
                          <span className={cn(statusBadge[event.status] ?? 'badge badge-draft', 'capitalize mt-0.5')}>
                            {event.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4 relative z-10">
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
                              <p className="text-label truncate">{col.label}</p>
                              <p className="text-sm font-medium text-foreground truncate" title={col.value}>
                                {col.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="relative z-10">
                          <div className="flex justify-between mb-2">
                            <span className="text-[11px] text-muted-foreground">Progress</span>
                            <span className="text-[11px] font-semibold text-foreground tabular-nums">
                              {event.employeeIds.length > 0
                                ? Math.round((event.bookedCount / event.employeeIds.length) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="progress-track">
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
                              className="progress-fill"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-title text-lg text-foreground">Activity</h2>
            <div className="paper-card rounded-3xl overflow-hidden">
              {activity === undefined ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">Loading...</div>
              ) : activity.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Plane className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/20">
                    {activity.map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.03 }}
                        className="px-5 py-3.5 hover:bg-emerald-50/30 transition-colors flex items-start gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-emerald-500/40" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-foreground leading-snug">
                            <span className="font-medium">{item.userName}</span>
                            <span className="text-muted-foreground"> {item.action}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground/40 mt-0.5">
                            {formatActivityTime(item.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="border-t border-border/20">
                    <Button
                      variant="ghost"
                      className="w-full rounded-none h-11 text-xs font-medium text-emerald-700 hover:bg-emerald-50/50"
                      asChild
                    >
                      <Link href="/admin/itineraries">View all activity</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
