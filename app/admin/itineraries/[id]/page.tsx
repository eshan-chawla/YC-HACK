'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/EventDetail/StatsCard'
import { BookingsTable } from '@/components/EventDetail/BookingsTable'
import { ActivityFeed } from '@/components/EventDetail/ActivityFeed'
import { EventConfiguration } from '@/components/EventConfig/EventConfiguration'
import { useEventPolling } from '@/hooks/useEventPolling'
import { ArrowLeft, RefreshCw, MoreVertical, Settings2, Users2, History, Pause, Plane, Building2, Car } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface MockEventData {
  id: string
  name: string
  destination: string
  startDate: string
  endDate: string
  status: 'active' | 'pending' | 'completed'
  createdAt: string
  totalBudget: number
  spent: number
  totalEmployees: number
  employees: Array<{
    id: string
    name: string
    status: 'pending' | 'in_progress' | 'booked' | 'failed' | 'alert'
    tripCost?: number
  }>
  activities: Array<{
    id: string
    time: string
    message: string
    type: 'booking' | 'email' | 'alert' | 'system'
  }>
  logistics: {
    flights: {
        total: number
        booked: number
        airlines: string[]
    }
    hotels: {
        totalRooms: number
        booked: number
        mainHotel: string
    }
    ground: {
        carRentals: number
        rideShareEnabled: boolean
    }
  }
}

const mockEventData: MockEventData = {
  id: '1',
  name: 'Team Q4 Offsite 2025',
  destination: 'Miami, Florida',
  startDate: 'Nov 20, 2025',
  endDate: 'Nov 24, 2025',
  status: 'active',
  createdAt: 'Nov 15, 2025',
  totalBudget: 25000,
  spent: 7500,
  totalEmployees: 10,
  employees: [
    { id: '1', name: 'John Smith', status: 'booked', tripCost: 2450 },
    { id: '2', name: 'Sarah Chen', status: 'pending' },
    { id: '3', name: 'Mike Johnson', status: 'in_progress', tripCost: 2350 },
    { id: '4', name: 'Lisa Wong', status: 'alert' },
    { id: '5', name: 'James Taylor', status: 'failed' },
    { id: '6', name: 'Emma Davis', status: 'booked', tripCost: 2400 },
    { id: '7', name: 'Alex Martin', status: 'in_progress', tripCost: 2300 },
    { id: '8', name: 'Rachel Green', status: 'pending' },
    { id: '9', name: 'Chris Lee', status: 'booked', tripCost: 2380 },
    { id: '10', name: 'Diana Prince', status: 'pending' },
  ],
  activities: [
    { id: '1', time: '2:34 PM', message: 'John Smith: Flight booked (United UA-487)', type: 'booking' },
    { id: '2', time: '2:15 PM', message: 'Sarah Chen: Email opened (clicked link)', type: 'email' },
    { id: '3', time: '1:52 PM', message: 'Mike Johnson: Hotel booking confirmed (Marriott)', type: 'booking' },
    { id: '4', time: '1:30 PM', message: 'Lisa Wong: Budget alert - exceeds limit by $150', type: 'alert' },
    { id: '5', time: '1:15 PM', message: 'Event invitations sent to 10 employees', type: 'system' },
    { id: '6', time: '12:45 PM', message: 'Emma Davis: Trip details received and confirmed', type: 'booking' },
  ],
  logistics: {
    flights: {
        total: 10,
        booked: 4,
        airlines: ['United', 'Delta', 'American']
    },
    hotels: {
        totalRooms: 10,
        booked: 6,
        mainHotel: 'Marriott Marquis Miami'
    },
    ground: {
        carRentals: 3,
        rideShareEnabled: true
    }
  }
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const { data, isRefreshing, refresh } = useEventPolling(mockEventData, { interval: 10000 })
  const [autoRefresh, setAutoRefresh] = useState(true)

  const bookedCount = data.employees.filter(e => e.status === 'booked').length
  const pendingCount = data.employees.filter(e => e.status === 'pending').length
  const failedCount = data.employees.filter(e => e.status === 'failed').length
  const bookingProgress = ((bookedCount / data.totalEmployees) * 100).toFixed(0)
  const spendProgress = ((data.spent / data.totalBudget) * 100).toFixed(0)

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-2">
          <div className="flex items-start gap-4">
            <Link href="/admin/itineraries">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-background shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{data.name}</h1>
                <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100 uppercase text-[10px] font-bold tracking-widest px-2.5 py-1">
                    {data.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Created {data.createdAt}</span>
                <span className="hidden md:inline text-muted-foreground/30">•</span>
                <span className="flex items-center gap-1.5">Ends {data.endDate}</span>
                <span className="hidden md:inline text-muted-foreground/30">•</span>
                <span className="flex items-center gap-1.5 text-primary">{data.destination}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={isRefreshing}
              className="h-10 gap-2 px-4 font-bold text-xs uppercase tracking-widest rounded-xl"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setAutoRefresh(!autoRefresh)} className="gap-2 cursor-pointer font-medium">
                  {autoRefresh ? <Pause className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  {autoRefresh ? 'Stop' : 'Resume'} Auto-Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer font-medium">Pause Event</DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer font-medium">Edit Event Details</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-destructive focus:text-destructive">
                    Cancel Event
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Bookings"
            value={`${bookedCount} / ${data.totalEmployees}`}
            progress={parseInt(bookingProgress)}
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
            value={`$${data.spent.toLocaleString()}`}
            unit={`of $${data.totalBudget.toLocaleString()}`}
            progress={parseInt(spendProgress)}
            delay={0.2}
          />
          <StatsCard
            label="Alerts & Pending"
            value={pendingCount + failedCount}
            unit={`${failedCount} critical alerts`}
            delay={0.3}
          />
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/40 p-1 rounded-xl h-11 mb-6">
            <TabsTrigger value="overview" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest">
                <Users2 className="w-4 h-4" />
                Overview
            </TabsTrigger>
            <TabsTrigger value="configuration" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest">
                <Settings2 className="w-4 h-4" />
                Configuration
            </TabsTrigger>
            <TabsTrigger value="logistics" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-bold text-xs uppercase tracking-widest">
                <Plane className="w-4 h-4" />
                Logistics & Coverage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-bold text-foreground">Employee Directory</h2>
                  <div className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                    Showing {data.employees.length} participants
                  </div>
                </div>
                <Card className="border-border/60 overflow-hidden shadow-sm">
                    <BookingsTable employees={data.employees} eventId={data.id} />
                </Card>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <History className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-xl font-bold text-foreground">Live Activity</h2>
                </div>
                <ActivityFeed items={data.activities} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="mt-0 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Plane className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Plane className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Flight Coverage</h3>
                            <p className="text-[10px] font-bold text-muted-foreground">Aggregate ticket status</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Booked Tickets</span>
                            <span className="text-sm font-black text-foreground">{data.logistics.flights.booked} / {data.logistics.flights.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${(data.logistics.flights.booked / data.logistics.flights.total) * 100}%` }} />
                        </div>
                        <div className="pt-2 flex flex-wrap gap-2">
                            {data.logistics.flights.airlines.map(airline => (
                                <Badge key={airline} variant="secondary" className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0">
                                    {airline}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Building2 className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Room Blocks</h3>
                            <p className="text-[10px] font-bold text-muted-foreground">Hotel reservations</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Reserved Rooms</span>
                            <span className="text-sm font-black text-foreground">{data.logistics.hotels.booked} / {data.logistics.hotels.totalRooms}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(data.logistics.hotels.booked / data.logistics.hotels.totalRooms) * 100}%` }} />
                        </div>
                        <div className="pt-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Primary Partner</p>
                            <p className="text-xs font-bold text-foreground truncate">{data.logistics.hotels.mainHotel}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Car className="w-24 h-24 -rotate-12" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Car className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Ground Transport</h3>
                            <p className="text-[10px] font-bold text-muted-foreground">Vehicle coverage</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted-foreground">Active Rentals</span>
                            <span className="text-sm font-black text-foreground">{data.logistics.ground.carRentals} vehicles</span>
                        </div>
                        <div className="pt-4 p-3 bg-muted/30 rounded-xl border border-border/40">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-black uppercase text-muted-foreground">Ride Share (Uber/Lyft)</span>
                                <Badge className="bg-green-50 text-green-600 text-[8px] font-black border-none shadow-none">ENABLED</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">Enterprise vouchers applied to all participants.</p>
                        </div>
                    </div>
                </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="configuration" className="mt-0 outline-none">
            <EventConfiguration eventId={data.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
