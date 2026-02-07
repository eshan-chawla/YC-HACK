'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ItineraryCard } from '@/components/TripDetail/ItineraryCard'
import { CostBreakdown } from '@/components/TripDetail/CostBreakdown'
import { AgentNotes } from '@/components/TripDetail/AgentNotes'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Share2, MoreVertical, Edit2, Trash2, Plane, Building2, Car } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const mockTripData = {
  employeeName: 'John Smith',
  status: 'booked' as const,
  confirmationNumber: 'TW-12345',
  eventName: 'Team Q4 Offsite 2025',
  segments: [
    {
      type: 'flight' as const,
      icon: <Plane className="w-5 h-5" />,
      title: 'Outbound Flight',
      details: [
        'United UA-487 | Nov 20, 9:00 AM - 1:15 PM',
        'San Francisco (SFO) → Miami (MIA)',
        'Seat: 12A | Economy | Baggage: 1 included',
      ],
      cost: 450,
    },
    {
      type: 'hotel' as const,
      icon: <Building2 className="w-5 h-5" />,
      title: 'Hotel',
      details: [
        'Marriott Marquis Miami',
        'Nov 20-24, 2025 (4 nights)',
        'Room: Ocean View King | $450/night',
      ],
      cost: 1800,
    },
    {
      type: 'transport' as const,
      icon: <Car className="w-5 h-5" />,
      title: 'Ground Transport',
      details: [
        'Uber from SFO to hotel (estimated)',
        'Departure: Nov 20, 1:45 PM',
      ],
      cost: 150,
    },
    {
      type: 'flight' as const,
      icon: <Plane className="w-5 h-5" />,
      title: 'Return Flight',
      details: [
        'United UA-502 | Nov 24, 5:00 PM - 9:15 PM',
        'Miami (MIA) → San Francisco (SFO)',
        'Seat: 15C | Economy',
      ],
      cost: 450,
    },
  ],
  costItems: [
    { label: 'Flights (2)', amount: 900 },
    { label: 'Hotel (4 nights)', amount: 1800 },
    { label: 'Ground Transport', amount: 150 },
    { label: 'Meal Allowance (4 days)', amount: 300 },
  ],
  total: 3150,
  budget: 2500,
  isCompliant: true,
  agentNotes:
    'Selected United flights to match preferred airline. Marriott chosen to maximize loyalty points. Hotel within allocated budget; added meal allowance per company policy. All bookings confirmed and paid via TripWeaver. Ground transport via rideshare for reliability.',
}

export default function TripDetailPage({
  params,
}: {
  params: { id: string; tripId: string }
}) {
  return (
    <AppShell role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link href={`/admin/itineraries/${params.id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground">{mockTripData.employeeName}</h1>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 uppercase text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-md">
                    {mockTripData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span className="text-foreground font-bold uppercase tracking-wider text-[10px] bg-muted px-2 py-0.5 rounded">Conf # {mockTripData.confirmationNumber}</span>
                <span className="text-muted-foreground/30">&bull;</span>
                <span>{mockTripData.eventName}</span>
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
            <ItineraryCard segments={mockTripData.segments} />
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground px-1 tracking-wider">Financials</h2>
                <CostBreakdown
                items={mockTripData.costItems}
                total={mockTripData.total}
                budget={mockTripData.budget}
                isCompliant={mockTripData.isCompliant}
                />
            </div>
            <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground px-1 tracking-wider">Agent Notes</h2>
                <AgentNotes notes={mockTripData.agentNotes} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
