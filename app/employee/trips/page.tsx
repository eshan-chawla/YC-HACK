'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Plane, Building2, Calendar, MapPin, ArrowRight, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const UPCOMING_STATUSES = ['pending', 'generating', 'booked', 'in_progress'] as const
const HISTORY_STATUSES = ['completed', 'cancelled', 'failed'] as const

function formatDateRange(departure: number, returnDate: number) {
  const d = new Date(departure)
  const r = new Date(returnDate)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  return `${d.toLocaleDateString('en-US', opts)} – ${r.toLocaleDateString('en-US', opts)}`
}

type TripWithEvent = Doc<'trips'> & {
  event: Doc<'events'> | null
  itinerary: Doc<'itineraries'> | null
}

export default function EmployeeTripsPage() {
  const trips = useQuery(api.trips.listMineWithEvents, {}) ?? []

  const upcoming = trips.filter((t) => UPCOMING_STATUSES.includes(t.status as any))
  const history = trips.filter((t) => HISTORY_STATUSES.includes(t.status as any))

  return (
    <AppShell role="employee">
      <div className="space-y-8">
        <PageHeader
          title="My Trips"
          description="View your upcoming and past travel itineraries"
          actions={
            <Link href="/employee">
              <Button className="btn-emerald-solid blob-2 gap-2 h-10 px-5 font-bold text-xs uppercase tracking-widest btn-press">
                <MessageSquare className="w-4 h-4" />
                Ask AI for help
              </Button>
            </Link>
          }
        />

        <div className="space-y-6">
          <h2 className="text-label px-1">Upcoming Travel</h2>
          {upcoming.length === 0 ? (
            <div className="p-12 paper-card rounded-2xl text-center relative overflow-hidden">
              <Plane className="w-16 h-16 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm relative z-10">No upcoming trips. When your admin assigns you to an event, it will appear here.</p>
            </div>
          ) : (
            upcoming.map((trip, idx) => (
              <TripCard key={trip._id} trip={trip as TripWithEvent} index={idx} />
            ))
          )}

          <h2 className="text-label px-1 pt-4">History</h2>
          {history.length === 0 ? (
            <div className="p-12 paper-card rounded-2xl text-center">
              <p className="text-muted-foreground text-sm">No past trips yet.</p>
            </div>
          ) : (
            history.map((trip, idx) => (
              <TripCard key={trip._id} trip={trip as TripWithEvent} index={idx} isPast />
            ))
          )}
        </div>
      </div>
    </AppShell>
  )
}

function TripCard({
  trip,
  index,
  isPast = false,
}: {
  trip: TripWithEvent
  index: number
  isPast?: boolean
}) {
  const event = trip.event
  const eventName = event?.name ?? 'Event'
  const destination = event?.destination ?? '—'
  const dates = event
    ? formatDateRange(event.departureDate, event.returnDate)
    : '—'
  const flightLabel = trip.itinerary?.data?.outboundFlight
    ? `${trip.itinerary.data.outboundFlight.airline ?? 'Flight'} ${trip.itinerary.data.outboundFlight.flightNumber ?? ''}`.trim() || '—'
    : '—'
  const hotelLabel = trip.itinerary?.data?.hotel?.name ?? '—'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div
        className={cn(
          'p-0 overflow-hidden rounded-2xl paper-card group',
          isPast && 'opacity-70 grayscale-[0.5]'
        )}
      >
        <div className="flex flex-col md:flex-row">
          <div
            className={cn(
              'w-full md:w-1.5 h-1.5 md:h-auto rounded-l-2xl',
              isPast ? 'bg-muted' : 'bg-gradient-to-b from-emerald-400 to-emerald-600'
            )}
          />
          <div className="flex-1 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-serif text-xl text-foreground group-hover:text-emerald-700 transition-colors tracking-[-0.02em]">
                  {eventName}
                </h3>
                <div className="flex items-center gap-4 mt-1.5 text-muted-foreground text-sm font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {destination}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {dates}
                  </span>
                </div>
              </div>
              <Link href={`/employee/trips/${trip._id}`}>
                <Button
                  variant="outline"
                  className="h-9 gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl btn-press"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl paper-inset flex items-center gap-4">
                <div className="w-10 h-10 paper-inset blob-1 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-label">Flight</p>
                  <p className="text-sm font-bold text-foreground">{flightLabel}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl paper-inset flex items-center gap-4">
                <div className="w-10 h-10 paper-inset blob-3 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-label">Stay</p>
                  <p className="text-sm font-bold text-foreground">{hotelLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
