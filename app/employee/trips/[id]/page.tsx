'use client'

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
    Shield
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { use } from 'react'

const mockTrips = {
  '1': {
    id: '1',
    eventName: 'Team Q4 Offsite 2025',
    destination: 'Miami, FL',
    dates: 'Nov 20-24, 2025',
    duration: '5 Days, 4 Nights',
    status: 'booked',
    flight: {
        number: 'United UA-487',
        departure: 'NYC (EWR) - 08:30 AM',
        arrival: 'MIA - 11:45 AM',
        seat: '12F (Economy Plus)',
        gate: 'C12'
    },
    hotel: {
        name: 'Marriott Marquis Miami',
        address: '255 Biscayne Blvd Way, Miami, FL 33131',
        roomType: 'Deluxe King Room',
        checkIn: 'Nov 20, 3:00 PM',
        checkOut: 'Nov 24, 11:00 AM',
        confirmation: 'MAR-882910'
    },
    ground: {
        type: 'Rental Car',
        provider: 'Hertz',
        model: 'Tesla Model 3',
        pickup: 'Miami Int Airport',
        rideShare: 'Ride-share services enabled for local travel'
    },
    policy: {
        compliant: true,
        details: 'All bookings are within the Q4 Offsite budget policy.'
    }
  },
  '2': {
    id: '2',
    eventName: 'Product Design Week',
    destination: 'Austin, TX',
    dates: 'Sep 12-15, 2025',
    duration: '4 Days, 3 Nights',
    status: 'completed',
    flight: {
        number: 'Delta DL-1204',
        departure: 'NYC (JFK) - 10:15 AM',
        arrival: 'AUS - 01:30 PM',
        seat: '4C (First Class)',
        gate: 'B4'
    },
    hotel: {
        name: 'The LINE Austin',
        address: '111 E Cesar Chavez St, Austin, TX 78701',
        roomType: 'Studio Suite',
        checkIn: 'Sep 12, 3:00 PM',
        checkOut: 'Sep 15, 12:00 PM',
        confirmation: 'LINE-AUS-442'
    },
    ground: {
        type: 'Ride Share',
        provider: 'Uber for Business',
        rideShare: 'Complimentary Uber vouchers applied to your account'
    },
    policy: {
        compliant: true,
        details: 'Travel completed within approved budget.'
    }
  }
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const trip = mockTrips[resolvedParams.id as keyof typeof mockTrips]

  if (!trip) {
    return (
      <AppShell role="employee">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold">Trip not found</h2>
          <Link href="/employee/trips" className="mt-4">
            <Button variant="outline">Back to My Trips</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{trip.eventName}</h1>
                    <div className="flex items-center gap-3 mt-1 text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {trip.destination}</span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {trip.dates}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link href="/employee">
                    <Button variant="outline" className="gap-2 font-bold text-xs uppercase tracking-widest h-10">
                        <MessageSquare className="w-4 h-4" /> Modify with AI
                    </Button>
                </Link>
                <Badge className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm",
                    trip.status === 'booked' ? "bg-green-50 text-green-600 border-green-100" : "bg-muted text-muted-foreground border-border"
                )}>
                    {trip.status}
                </Badge>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Details */}
            <div className="md:col-span-2 space-y-6">
                {/* Flight Section */}
                <Card className="p-0 overflow-hidden border-border/60">
                    <div className="p-4 bg-primary/5 border-b border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Plane className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Flight Information</h3>
                        </div>
                        <Badge variant="outline" className="bg-background text-[10px] font-bold">{trip.flight.number}</Badge>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-8 relative">
                            <div className="text-center md:text-left">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Departure</p>
                                <p className="text-xl font-black text-foreground">{trip.flight.departure.split(' - ')[0]}</p>
                                <p className="text-sm font-medium text-muted-foreground">{trip.flight.departure.split(' - ')[1]}</p>
                            </div>
                            
                            <div className="hidden md:flex flex-1 items-center justify-center px-8">
                                <div className="h-px bg-dashed border-t-2 border-dashed border-border/60 w-full relative">
                                    <Plane className="w-4 h-4 text-primary absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90" />
                                </div>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Arrival</p>
                                <p className="text-xl font-black text-foreground">{trip.flight.arrival.split(' - ')[0]}</p>
                                <p className="text-sm font-medium text-muted-foreground">{trip.flight.arrival.split(' - ')[1]}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/40">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Seat Assignment</p>
                                <p className="text-sm font-bold text-foreground">{trip.flight.seat}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Terminal/Gate</p>
                                <p className="text-sm font-bold text-foreground">{trip.flight.gate}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Hotel Section */}
                <Card className="p-0 overflow-hidden border-border/60">
                    <div className="p-4 bg-primary/5 border-b border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Accommodation</h3>
                        </div>
                        <span className="text-[10px] font-bold text-primary">Confirmed</span>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="text-lg font-black text-foreground">{trip.hotel.name}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                <Navigation className="w-3.5 h-3.5" /> {trip.hotel.address}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-2xl">
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Room Type</p>
                                <p className="text-sm font-bold text-foreground">{trip.hotel.roomType}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Confirmation #</p>
                                <p className="text-sm font-bold text-primary uppercase font-mono">{trip.hotel.confirmation}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Check-In</p>
                                <p className="text-sm font-bold text-foreground">{trip.hotel.checkIn}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Check-Out</p>
                                <p className="text-sm font-bold text-foreground">{trip.hotel.checkOut}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Ground Transport Section */}
                <Card className="p-0 overflow-hidden border-border/60">
                    <div className="p-4 bg-primary/5 border-b border-border/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Ground Transport</h3>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="flex-1 p-4 bg-muted/30 rounded-2xl border border-border/40">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">{trip.ground.type}</p>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-border/40">
                                        {trip.ground.type === 'Rental Car' ? <Car className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{trip.ground.provider}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{trip.ground.model || 'Business Profile Vouchers'}</p>
                                        {trip.ground.pickup && (
                                            <p className="text-[10px] font-bold text-primary uppercase mt-2">Pickup: {trip.ground.pickup}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-4 bg-muted/30 rounded-2xl border border-border/40 flex flex-col justify-center">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Info className="w-4 h-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Team Note</p>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    "{trip.ground.rideShare}"
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Sidebar / Sidebar Stats */}
            <div className="space-y-6">
                <Card className="p-6 border-border/60 bg-slate-900 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-24 h-24 rotate-12" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 relative z-10">
                        <Clock className="w-3.5 h-3.5" />
                        Trip Duration
                    </h4>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-white">{trip.duration}</p>
                        <p className="text-xs text-slate-400 mt-2">Nov 20, 2025 - Nov 24, 2025</p>
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm space-y-6">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-primary" />
                            Policy Compliance
                        </h4>
                        <div className={cn(
                            "p-4 rounded-2xl flex items-start gap-3",
                            trip.policy.compliant ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                        )}>
                            {trip.policy.compliant ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <div>
                                <p className="text-sm font-bold leading-tight">{trip.policy.compliant ? 'Compliant' : 'Out of Policy'}</p>
                                <p className="text-xs mt-1.5 opacity-80 leading-relaxed">{trip.policy.details}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/40">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-primary" />
                            Payment Info
                        </h4>
                        <div className="p-4 bg-muted/20 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-6 bg-slate-800 rounded flex items-center justify-center text-[8px] font-bold text-white tracking-widest">VISA</div>
                            <div>
                                <p className="text-xs font-bold text-foreground">Acme Corp Corporate Card</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Ending in •••• 4242</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-border/60 bg-primary/5 border-primary/20 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-foreground mb-2">Need a change?</h4>
                    <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                        Our AI Travel Agent can help you reschedule flights, upgrade rooms, or add rental extensions.
                    </p>
                    <Link href="/employee" className="w-full">
                        <Button className="w-full bg-primary hover:bg-green-600 font-bold text-xs uppercase tracking-widest rounded-xl">
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

