'use client'

import { use, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/EventDetail/StatsCard'
import { BookingsTable } from '@/components/EventDetail/BookingsTable'
import { ActivityFeed } from '@/components/EventDetail/ActivityFeed'
import { EventConfiguration } from '@/components/EventConfig/EventConfiguration'
import { ArrowLeft, RefreshCw, MoreVertical, Settings2, Users2, History, Plane, Building2, Car } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

type TripStatus = 'pending' | 'generating' | 'booked' | 'in_progress' | 'failed' | 'completed' | 'cancelled'
function mapTripStatusToTable(s: TripStatus | undefined): 'pending' | 'in_progress' | 'booked' | 'failed' | 'alert' {
  if (!s) return 'pending'
  if (s === 'booked' || s === 'completed') return 'booked'
  if (s === 'in_progress') return 'in_progress'
  if (s === 'failed') return 'failed'
  return 'pending'
}

function formatActivityTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const eventId = id as Id<'events'>
  const eventData = useQuery(api.events.getWithEmployees, { id: eventId })
  const trips = useQuery(api.trips.listByEvent, { eventId })
  const recentActivity = useQuery(api.auditLogs.getRecentActivity, { limit: 50 })
  const auditLogs = useMemo(
    () => (recentActivity ?? []).filter((log) => log.resourceId === id),
    [recentActivity, id]
  )

  const isLoading = eventData === undefined || trips === undefined
  const notFound = !isLoading && eventData === null

  const { employeesForTable, bookedCount, totalSpent, spendProgress, bookingProgress, pendingOrFailed, activityItems } =
    useMemo(() => {
      if (!eventData || !trips) {
        return {
          employeesForTable: [],
          bookedCount: 0,
          totalSpent: 0,
          spendProgress: 0,
          bookingProgress: 0,
          pendingOrFailed: 0,
          activityItems: [],
        }
      }
      const event = eventData
      const employeesForTable = event.employees.map((emp) => {
        const trip = trips.find((t) => t.employeeId === emp._id)
        return {
          id: trip ? String(trip._id) : String(emp._id),
          name: emp.name,
          status: mapTripStatusToTable(trip?.status),
          tripCost: trip?.costBreakdown?.total,
        }
      })
      const bookedCount = trips.filter(
        (t) => t.status === 'booked' || t.status === 'in_progress' || t.status === 'completed'
      ).length
      const totalSpent = trips.reduce((sum, t) => sum + (t.costBreakdown?.total ?? 0), 0)
      const totalEmployees = event.employeeIds.length
      const spendProgress = event.totalBudget > 0 ? Math.round((totalSpent / event.totalBudget) * 100) : 0
      const bookingProgress = totalEmployees > 0 ? Math.round((bookedCount / totalEmployees) * 100) : 0
      const pendingOrFailed = trips.filter((t) => t.status === 'pending' || t.status === 'failed').length
      const activityItems = auditLogs.map((log: { _id: string; timestamp: number; action: string; resourceType: string; userName?: string }) => ({
        id: log._id,
        time: formatActivityTime(log.timestamp),
        message: `${log.userName ?? 'System'}: ${log.action} (${log.resourceType})`,
        type: 'system' as const,
      }))
      return {
        employeesForTable,
        bookedCount,
        totalSpent,
        spendProgress,
        bookingProgress,
        pendingOrFailed,
        activityItems,
      }
    }, [eventData, trips, auditLogs])

  if (notFound) {
    return (
      <AppShell role="admin">
        <div className="space-y-6">
          <Link href="/admin/itineraries">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </AppShell>
    )
  }

  if (isLoading || !eventData) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
          Loading event…
        </div>
      </AppShell>
    )
  }

  const event = eventData

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-2">
          <div className="flex items-start gap-4">
            <Link href="/admin/itineraries">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">{event.name}</h1>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 uppercase text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md">
                  {event.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground font-medium">
                <span>Created {formatDate(event.createdAt)}</span>
                <span className="hidden md:inline text-muted-foreground/30">&bull;</span>
                <span>Ends {formatDate(event.returnDate)}</span>
                <span className="hidden md:inline text-muted-foreground/30">&bull;</span>
                <span className="text-emerald-600 dark:text-emerald-400">{event.destination}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="gap-2 cursor-pointer font-medium" asChild>
                  <Link href={`/admin/itineraries/${event._id}`}>Refresh</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Bookings"
            value={`${bookedCount} / ${event.employeeIds.length}`}
            progress={bookingProgress}
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
            value={`$${totalSpent.toLocaleString()}`}
            unit={`of $${event.totalBudget.toLocaleString()}`}
            progress={spendProgress}
            delay={0.2}
          />
          <StatsCard
            label="Alerts & Pending"
            value={pendingOrFailed}
            unit={pendingOrFailed > 0 ? 'pending or failed' : 'none'}
            delay={0.3}
          />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/40 p-1 rounded-xl h-11 mb-6">
            <TabsTrigger
              value="overview"
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest"
            >
              <Users2 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="configuration"
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest"
            >
              <Settings2 className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="logistics"
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest"
            >
              <Plane className="w-4 h-4" />
              Logistics &amp; Coverage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-base font-semibold text-foreground tracking-wider">
                    Employee Directory
                  </h2>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Showing {employeesForTable.length} participants
                  </div>
                </div>
                <Card className="border-border/60 overflow-hidden shadow-sm">
                  <BookingsTable employees={employeesForTable} eventId={id} />
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-base font-semibold text-foreground tracking-wider">Live Activity</h2>
                </div>
                <ActivityFeed items={activityItems} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="mt-0 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="p-6 border-border/60 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground tracking-wider">Flight Coverage</h3>
                    <p className="text-xs font-medium text-muted-foreground">Booked / Total</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-foreground">
                    {bookedCount} / {event.employeeIds.length} participants
                  </p>
                  <p className="text-xs text-muted-foreground">Trip status drives coverage.</p>
                </div>
              </Card>
              <Card className="p-6 border-border/60 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground tracking-wider">Accommodation</h3>
                    <p className="text-xs font-medium text-muted-foreground">Per itinerary</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Hotel and room details appear on each trip when generated.</p>
              </Card>
              <Card className="p-6 border-border/60 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground tracking-wider">Ground Transport</h3>
                    <p className="text-xs font-medium text-muted-foreground">Per itinerary</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Ground transport is included in generated itineraries.</p>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="configuration" className="mt-0 outline-none">
            <EventConfiguration eventId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
