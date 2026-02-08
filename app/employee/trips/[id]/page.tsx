'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plane,
  Building2,
  Calendar,
  MapPin,
  ArrowLeft,
  Clock,
  Car,
  Navigation,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Info,
  MessageSquare,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { use } from 'react'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatDateRange(departure: number, returnDate: number) {
  return `${formatDate(departure)} – ${formatDate(returnDate)}`
}

function formatDuration(departure: number, returnDate: number) {
  const nights = Math.round((returnDate - departure) / (24 * 60 * 60 * 1000))
  const days = nights + 1
  return `${days} Day${days !== 1 ? 's' : ''}, ${nights} Night${nights !== 1 ? 's' : ''}`
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id as Id<'trips'>
  const details = useQuery(api.trips.getWithDetails, { id })

  if (details === undefined) {
    return (
      <AppShell role="employee">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="h-10 w-64 bg-muted/50 rounded animate-pulse" />
          <div className="h-96 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (!details || !details.event) {
    return (
      <AppShell role="employee">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">Trip not found</h2>
          <Link href="/employee/trips" className="mt-4">
            <Button variant="outline">Back to My Trips</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const { trip, event, itinerary } = details
  const data = itinerary?.data
  const outbound = data?.outboundFlight
  const hotel = data?.hotel
  const ground = data?.groundTransport
  const compliant = trip.policyCompliance !== false

  return (
    <AppShell role="employee">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/employee/trips">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">{event.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {event.destination}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {formatDateRange(event.departureDate, event.returnDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/employee">
              <Button variant="outline" className="gap-2 font-bold text-xs uppercase tracking-widest h-10">
                <MessageSquare className="w-4 h-4" /> Modify with AI
              </Button>
            </Link>
            <Badge
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border shadow-sm',
                trip.status === 'booked' || trip.status === 'in_progress'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border/60'
              )}
            >
              {trip.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {outbound && (
              <Card className="p-0 overflow-hidden border-border/60">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-semibold text-foreground tracking-wider">Flight Information</h3>
                  </div>
                  <Badge variant="outline" className="bg-background text-[10px] font-bold">
                    {outbound.airline} {outbound.flightNumber}
                  </Badge>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8 relative">
                    <div className="text-center md:text-left">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Departure</p>
                      <p className="text-xl font-bold text-foreground">{outbound.departure.airport}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatTime(outbound.departure.time)}
                      </p>
                    </div>
                    <div className="hidden md:flex flex-1 items-center justify-center px-8">
                      <div className="h-px bg-dashed border-t-2 border-dashed border-border/60 w-full relative">
                        <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Arrival</p>
                      <p className="text-xl font-bold text-foreground">{outbound.arrival.airport}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatTime(outbound.arrival.time)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/60">
                    {outbound.seat && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Seat</p>
                        <p className="text-sm font-bold text-foreground">{outbound.seat}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Cabin</p>
                      <p className="text-sm font-bold text-foreground">{outbound.cabin}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {hotel && (
              <Card className="p-0 overflow-hidden border-border/60">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-semibold text-foreground tracking-wider">Accommodation</h3>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Confirmed</span>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{hotel.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Navigation className="w-3.5 h-3.5" /> {hotel.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-xl">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Room</p>
                      <p className="text-sm font-bold text-foreground">{hotel.room}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Check-In</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatDate(hotel.checkIn)}, {formatTime(hotel.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Check-Out</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatDate(hotel.checkOut)}, {formatTime(hotel.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {ground && (
              <Card className="p-0 overflow-hidden border-border/60">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-semibold text-foreground tracking-wider">Ground Transport</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/60">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                      {ground.type}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {ground.from} → {ground.to}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(ground.time)} at {formatTime(ground.time)}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {!outbound && !hotel && !ground && (
              <Card className="p-6 border-border/60">
                <p className="text-sm text-muted-foreground">
                  Itinerary details are not yet available. Your travel agent may still be preparing your booking.
                </p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-border/60 bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Clock className="w-24 h-24 rotate-12" />
              </div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2 relative z-10">
                <Clock className="w-3.5 h-3.5" />
                Trip Duration
              </h4>
              <div className="relative z-10">
                <p className="text-3xl font-bold text-white">
                  {formatDuration(event.departureDate, event.returnDate)}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {formatDateRange(event.departureDate, event.returnDate)}
                </p>
              </div>
            </Card>

            <Card className="p-6 border-border/60 shadow-sm space-y-6">
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Policy Compliance
                </h4>
                <div
                  className={cn(
                    'p-4 rounded-xl flex items-start gap-3',
                    compliant
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  )}
                >
                  {compliant ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-bold leading-tight">
                      {compliant ? 'Compliant' : 'Out of Policy'}
                    </p>
                    <p className="text-xs mt-1.5 opacity-80 leading-relaxed">
                      {compliant
                        ? 'Bookings are within policy.'
                        : 'Some bookings may be outside company policy.'}
                    </p>
                  </div>
                </div>
              </div>

              {trip.costBreakdown && (
                <div className="pt-6 border-t border-border/60">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Cost Summary
                  </h4>
                  <div className="p-4 bg-muted/20 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-bold">${trip.costBreakdown.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-foreground mb-2">Need a change?</h4>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Our AI Travel Agent can help you reschedule flights, upgrade rooms, or add rental extensions.
              </p>
              <Link href="/employee" className="w-full">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-widest rounded-xl">
                  Chat with Agent
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
