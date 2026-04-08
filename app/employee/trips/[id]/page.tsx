'use client'

import { useQuery, useMutation } from 'convex/react'
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
  Send,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { use, useState } from 'react'

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

  const changeRequests = useQuery(api.trips.listChangeRequestsByTrip, { tripId: id })
  const submitChange = useMutation(api.trips.submitChangeRequest)
  const [requestType, setRequestType] = useState<'flight_change' | 'hotel_change' | 'transport_change' | 'general'>('general')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
          <h2 className="text-heading">Trip not found</h2>
          <Link href="/employee/trips" className="mt-4">
            <Button variant="outline">Back to My Trips</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const { trip, event, itinerary } = details

  const handleSubmitRequest = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await submitChange({ tripId: id, requestType, description: description.trim() })
      setDescription('')
      setRequestType('general')
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } finally {
      setSubmitting(false)
    }
  }

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
              <h1 className="text-heading text-foreground">{event.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-muted-foreground font-medium text-sm">
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
                'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border-0',
                trip.status === 'booked' || trip.status === 'in_progress'
                  ? 'badge-completed'
                  : 'badge-draft'
              )}
            >
              {trip.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {outbound && (
              <div className="p-0 overflow-hidden rounded-2xl paper-card">
                <div className="p-4 border-b border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 paper-inset blob-1 flex items-center justify-center">
                      <Plane className="w-4 h-4 text-emerald-700 text-emerald-600" />
                    </div>
                    <h3 className="font-serif text-base text-foreground tracking-[-0.01em]">Flight Information</h3>
                  </div>
                  <span className="text-label paper-inset rounded-full px-3 py-1">
                    {outbound.airline} {outbound.flightNumber}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8 relative">
                    <div className="text-center md:text-left">
                      <p className="text-label mb-1">Departure</p>
                      <p className="font-serif text-xl text-foreground">{outbound.departure.airport}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatTime(outbound.departure.time)}
                      </p>
                    </div>
                    <div className="hidden md:flex flex-1 items-center justify-center px-8">
                      <div className="h-px border-t-2 border-dashed border-border/60 w-full relative">
                        <Plane className="w-4 h-4 text-emerald-600 text-emerald-600 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                      </div>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-label mb-1">Arrival</p>
                      <p className="font-serif text-xl text-foreground">{outbound.arrival.airport}</p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {formatTime(outbound.arrival.time)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/10">
                    {outbound.seat && (
                      <div>
                        <p className="text-label mb-1">Seat</p>
                        <p className="text-sm font-bold text-foreground">{outbound.seat}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-label mb-1">Cabin</p>
                      <p className="text-sm font-bold text-foreground">{outbound.cabin}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hotel && (
              <div className="p-0 overflow-hidden rounded-2xl paper-card">
                <div className="p-4 border-b border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 paper-inset blob-1 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-emerald-700 text-emerald-600" />
                    </div>
                    <h3 className="font-serif text-base text-foreground tracking-[-0.01em]">Accommodation</h3>
                  </div>
                  <span className="badge-completed text-[11px]">Confirmed</span>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="font-serif text-lg text-foreground">{hotel.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Navigation className="w-3.5 h-3.5" /> {hotel.address}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 paper-inset rounded-xl">
                    <div>
                      <p className="text-label mb-1">Room</p>
                      <p className="text-sm font-bold text-foreground">{hotel.room}</p>
                    </div>
                    <div>
                      <p className="text-label mb-1">Check-In</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatDate(hotel.checkIn)}, {formatTime(hotel.checkIn)}
                      </p>
                    </div>
                    <div>
                      <p className="text-label mb-1">Check-Out</p>
                      <p className="text-sm font-bold text-foreground">
                        {formatDate(hotel.checkOut)}, {formatTime(hotel.checkOut)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {ground && (
              <div className="p-0 overflow-hidden rounded-2xl paper-card">
                <div className="p-4 border-b border-border/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 paper-inset blob-1 flex items-center justify-center">
                      <Car className="w-4 h-4 text-emerald-700 text-emerald-600" />
                    </div>
                    <h3 className="font-serif text-base text-foreground tracking-[-0.01em]">Ground Transport</h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="p-4 paper-inset rounded-xl">
                    <p className="text-label mb-3">
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
              </div>
            )}

            {!outbound && !hotel && !ground && (
              <div className="p-8 paper-inset rounded-2xl text-center">
                <p className="text-sm text-muted-foreground">
                  Itinerary details are not yet available. Your travel agent may still be preparing your booking.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#111110] to-[#050505] text-white glow-gold">
              <div className="absolute top-0 right-0 p-4 opacity-[0.06]">
                <Clock className="w-24 h-24 rotate-12" />
              </div>
              <h4 className="text-label text-gold-light/70 mb-6 flex items-center gap-2 relative z-10">
                <div className="w-6 h-6 paper-inset blob-5 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-gold-foreground text-yellow-600" />
                </div>
                Trip Duration
              </h4>
              <div className="relative z-10">
                <p className="stat-value text-white">
                  {formatDuration(event.departureDate, event.returnDate)}
                </p>
                <p className="text-xs text-white/40 mt-2">
                  {formatDateRange(event.departureDate, event.returnDate)}
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl paper-card space-y-6">
              <div>
                <h4 className="text-label mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 paper-inset blob-1 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-emerald-700 text-emerald-600" />
                  </div>
                  Policy Compliance
                </h4>
                <div
                  className={cn(
                    'p-4 rounded-xl flex items-start gap-3',
                    compliant
                      ? 'badge-completed bg-emerald-500/[0.08]'
                      : 'badge-pending bg-amber-500/[0.08]'
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
                <div className="pt-6 border-t border-border/10">
                  <h4 className="text-label mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 paper-inset blob-5 flex items-center justify-center">
                      <CreditCard className="w-3 h-3 text-gold-foreground text-yellow-600" />
                    </div>
                    Cost Summary
                  </h4>
                  <div className="p-4 paper-inset rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-serif text-lg font-normal text-foreground">${trip.costBreakdown.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl paper-card space-y-5">
              <h4 className="text-label flex items-center gap-2">
                <div className="w-6 h-6 paper-inset blob-1 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 text-emerald-700 text-emerald-600" />
                </div>
                Request a Change
              </h4>

              {submitted && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Request submitted
                </div>
              )}

              <div className="space-y-3">
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as typeof requestType)}
                  className="w-full h-9 rounded-xl paper-inset border-0 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="general">General</option>
                  <option value="flight_change">Flight Change</option>
                  <option value="hotel_change">Hotel Change</option>
                  <option value="transport_change">Transport Change</option>
                </select>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the change you need..."
                  rows={3}
                  className="w-full rounded-xl paper-inset border-0 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
                <Button
                  onClick={handleSubmitRequest}
                  disabled={submitting || !description.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-widest rounded-xl gap-2 btn-press glow-emerald"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Request
                </Button>
              </div>

              {changeRequests && changeRequests.length > 0 && (
                <div className="pt-4 border-t border-border/10 space-y-3">
                  <p className="text-label">Past Requests</p>
                  {changeRequests.map((req) => (
                    <div key={req._id} className="p-3 rounded-xl paper-inset space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground capitalize">
                          {req.requestType.replace('_', ' ')}
                        </span>
                        <Badge
                          className={cn(
                            'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border-0',
                            req.status === 'approved'
                              ? 'badge-completed'
                              : req.status === 'rejected'
                                ? 'badge-cancelled'
                                : 'badge-pending'
                          )}
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{req.description}</p>
                      {req.adminNotes && (
                        <p className="text-[11px] text-muted-foreground italic">Admin: {req.adminNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
