'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Plane, Building2, Calendar, MapPin, ArrowRight, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const mockTrips = [
  {
    id: '1',
    eventName: 'Team Q4 Offsite 2025',
    destination: 'Miami, FL',
    dates: 'Nov 20-24, 2025',
    status: 'booked',
    hotel: 'Marriott Marquis Miami',
    flight: 'United UA-487',
  },
  {
    id: '2',
    eventName: 'Product Design Week',
    destination: 'Austin, TX',
    dates: 'Sep 12-15, 2025',
    status: 'completed',
    hotel: 'The LINE Austin',
    flight: 'Delta DL-1204',
  }
]

export default function EmployeeTripsPage() {
  return (
    <AppShell role="employee">
      <div className="space-y-8">
        <PageHeader 
          title="My Trips" 
          description="View your upcoming and past travel itineraries"
          actions={
            <Link href="/employee">
              <Button className="bg-primary hover:bg-green-600 gap-2 h-10 px-5 font-bold text-xs uppercase tracking-widest">
                  <MessageSquare className="w-4 h-4" />
                  Ask AI for help
              </Button>
            </Link>
          }
        />

        <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Upcoming Travel</h2>
            {mockTrips.filter(t => t.status === 'booked').map((trip, idx) => (
                <TripCard key={trip.id} trip={trip} index={idx} />
            ))}

            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1 pt-4">History</h2>
            {mockTrips.filter(t => t.status === 'completed').map((trip, idx) => (
                <TripCard key={trip.id} trip={trip} index={idx} isPast />
            ))}
        </div>
      </div>
    </AppShell>
  )
}

function TripCard({ trip, index, isPast = false }: { trip: any, index: number, isPast?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className={cn(
                "p-0 overflow-hidden border-border/60 hover:shadow-lg transition-all group",
                isPast && "opacity-70 grayscale-[0.5]"
            )}>
                <div className="flex flex-col md:flex-row">
                    <div className={cn(
                        "w-full md:w-2 h-2 md:h-auto",
                        isPast ? "bg-muted" : "bg-primary"
                    )} />
                    
                    <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{trip.eventName}</h3>
                                <div className="flex items-center gap-4 mt-1.5 text-muted-foreground text-sm font-medium">
                                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {trip.destination}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {trip.dates}</span>
                                </div>
                            </div>
                            <Link href={`/employee/trips/${trip.id}`}>
                                <Button variant="outline" className="h-9 gap-2 font-bold text-[10px] uppercase tracking-widest rounded-lg">
                                    View Details <ArrowRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                                    <Plane className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Flight</p>
                                    <p className="text-sm font-bold text-foreground">{trip.flight}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stay</p>
                                    <p className="text-sm font-bold text-foreground">{trip.hotel}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    )
}

