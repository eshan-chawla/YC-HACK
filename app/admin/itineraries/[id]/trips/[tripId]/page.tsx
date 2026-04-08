'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ItineraryCard } from '@/components/TripDetail/ItineraryCard'
import { CostBreakdown } from '@/components/TripDetail/CostBreakdown'
import { AgentNotes } from '@/components/TripDetail/AgentNotes'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Download, Share2, MoreVertical, Edit2, Trash2, Plane, Building2, Car, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTripWithDetails } from '@/hooks/useTrips'
import { use, useMemo } from 'react'

interface Segment {
  type: 'flight' | 'hotel' | 'transport'
  icon: React.ReactNode
  title: string
  details: string[]
  cost: number
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function buildSegments(trip: any): Segment[] {
  const segments: Segment[] = []
  const itinerary = trip.itinerary?.data as any
  
  if (itinerary?.outboundFlight) {
    const f = itinerary.outboundFlight as any
    segments.push({
      type: 'flight',
      icon: <Plane className="w-5 h-5" />,
      title: 'Outbound Flight',
      details: [
        `${f.airline || 'Airline'} | ${formatDate(f.departure.time)} ${formatTime(f.departure.time)} - ${formatTime(f.arrival.time)}`,
        `${f.departure.airport} → ${f.arrival.airport}`,
        f.seat ? `Seat: ${f.seat}` : '', f.cabin ? f.cabin : '', f.baggage ? `Baggage: ${f.baggage}` : '',
      ].filter(Boolean).join(' | ').split(' | '),
      cost: f.cost || 0,
    })
  }
  
  if (itinerary?.hotel) {
    const h = itinerary.hotel as any
    segments.push({
      type: 'hotel',
      icon: <Building2 className="w-5 h-5" />,
      title: 'Hotel',
      details: [
        h.name,
        `${formatDate(h.checkIn)} - ${formatDate(h.checkOut)} (${h.nights} nights)`,
        `Room: ${h.room}`,
        h.costPerNight ? `${formatCurrency(h.costPerNight)}/night` : '',
      ].filter(Boolean),
      cost: h.totalCost || 0,
    })
  }
  
  if (itinerary?.groundTransport) {
    const t = itinerary.groundTransport as any
    segments.push({
      type: 'transport',
      icon: <Car className="w-5 h-5" />,
      title: 'Ground Transport',
      details: [
        t.type || 'Transport',
        t.from && t.to ? `${t.from} to ${t.to}` : '',
        t.time ? formatDate(t.time) : '',
      ].filter(Boolean),
      cost: t.cost || 0,
    })
  }
  
  if (itinerary?.returnFlight) {
    const f = itinerary.returnFlight as any
    segments.push({
      type: 'flight',
      icon: <Plane className="w-5 h-5" />,
      title: 'Return Flight',
      details: [
        `${f.airline || 'Airline'} | ${formatDate(f.departure.time)} ${formatTime(f.departure.time)} - ${formatTime(f.arrival.time)}`,
        `${f.departure.airport} → ${f.arrival.airport}`,
        f.seat ? `Seat: ${f.seat}` : '', f.cabin ? f.cabin : '',
      ].filter(Boolean).join(' | ').split(' | '),
      cost: f.cost || 0,
    })
  }
  
  return segments
}

function buildCostItems(segments: Segment[], event: any): { label: string; amount: number }[] {
  const flights = segments.filter(s => s.type === 'flight').reduce((sum, s) => sum + s.cost, 0)
  const hotel = segments.filter(s => s.type === 'hotel').reduce((sum, s) => sum + s.cost, 0)
  const transport = segments.filter(s => s.type === 'transport').reduce((sum, s) => sum + s.cost, 0)
  
  const items: { label: string; amount: number }[] = []
  if (flights > 0) items.push({ label: 'Flights', amount: flights })
  if (hotel > 0) items.push({ label: 'Hotel', amount: hotel })
  if (transport > 0) items.push({ label: 'Ground Transport', amount: transport })
  
  return items
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string; tripId: string }>
}) {
  const { id, tripId } = use(params)
  const { trip, isLoading } = useTripWithDetails(tripId as any)

  const segments = useMemo(() => {
    if (!trip) return []
    return buildSegments(trip)
  }, [trip])

  const costItems = useMemo(() => {
    if (!trip || !trip.event) return []
    return buildCostItems(segments, trip.event)
  }, [segments, trip])

  const totalCost = useMemo(() => {
    return costItems.reduce((sum, item) => sum + item.amount, 0)
  }, [costItems])

  const isCompliant = trip?.event ? totalCost <= (trip.event.budgetPerEmployee || 0) : true

  if (isLoading) {
    return (
      <AppShell role="admin">
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!trip) {
    return (
      <AppShell role="admin">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">Trip not found</p>
          <Link href={`/admin/itineraries/${id}`}>
            <Button variant="outline">Back to Itineraries</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const employee = trip.employee as any
  const event = trip.event as any

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href={`/admin/itineraries/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">
                  {employee?.name || 'Employee'}
                </h1>
                <Badge className={`uppercase text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md ${
                  trip.status === 'booked'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : trip.status === 'generating'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : trip.status === 'pending'
                    ? 'bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {trip.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span>{event?.name || 'Event'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-start">
            <Button variant="outline" className="gap-2 h-10 rounded-xl font-bold text-xs uppercase tracking-widest">
              <Download className="w-4 h-4" />
              Voucher
            </Button>
            <Button variant="outline" className="gap-2 h-10 rounded-xl font-bold text-xs uppercase tracking-widest">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="gap-2 cursor-pointer font-medium">
                  <Edit2 className="w-4 h-4" /> Edit Trip
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4" /> Cancel Booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-semibold text-foreground px-1 tracking-wider">Itinerary Details</h2>
            {segments.length > 0 ? (
              <ItineraryCard segments={segments} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-8 rounded-xl border border-dashed border-border/60 bg-muted/30">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plane className="w-5 h-5 text-muted-foreground/60" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No Itinerary Generated</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {trip.status === 'generating' 
                    ? 'The AI agent is currently generating this itinerary. Please check back soon.'
                    : 'This trip does not have an itinerary yet. Click "Generate" to create one.'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground px-1 tracking-wider">Financials</h2>
              <CostBreakdown
                items={costItems}
                total={totalCost}
                budget={event?.budgetPerEmployee || 0}
                isCompliant={isCompliant}
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground px-1 tracking-wider">Agent Notes</h2>
              <AgentNotes 
                notes={trip.agentNotes || 'No notes available. The itinerary was generated based on company policies and employee preferences.'} 
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}