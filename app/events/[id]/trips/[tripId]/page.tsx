'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { ItineraryCard } from '@/components/TripDetail/ItineraryCard'
import { CostBreakdown } from '@/components/TripDetail/CostBreakdown'
import { AgentNotes } from '@/components/TripDetail/AgentNotes'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Share2, Edit2, Trash2, Plane, Building2, Car } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const mockTripData = {
  employeeName: 'John Smith',
  status: 'booked' as const,
  confirmationNumber: 'LOCUS-12345',
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
    'Selected United flights to match preferred airline. Marriott chosen to maximize loyalty points. Hotel within allocated budget; added meal allowance per company policy. All bookings confirmed and paid via Locus wallet. Ground transport via rideshare for reliability.',
}

export default function TripDetailPage({
  params,
}: {
  params: { id: string; tripId: string }
}) {
  const statusConfig = {
    pending: 'bg-blue-100 text-blue-700',
    booked: 'bg-green-100 text-green-700',
    in_progress: 'bg-amber-100 text-amber-700',
    failed: 'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between"
        >
          <div className="flex items-start gap-4">
            <Link href={`/events/${params.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{mockTripData.employeeName}</h1>
                <Badge className={`${statusConfig[mockTripData.status]}`}>
                  {mockTripData.status.charAt(0).toUpperCase() + mockTripData.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Confirmation #: {mockTripData.confirmationNumber} • {mockTripData.eventName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Voucher
            </Button>
            <Button variant="outline" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Edit2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Edit Trip</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancel Booking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ItineraryCard segments={mockTripData.segments} />
          </div>

          <div className="space-y-6">
            <CostBreakdown
              items={mockTripData.costItems}
              total={mockTripData.total}
              budget={mockTripData.budget}
              isCompliant={mockTripData.isCompliant}
            />
            <AgentNotes notes={mockTripData.agentNotes} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
