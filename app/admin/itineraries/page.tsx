'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Plus, Calendar, MapPin, Users, DollarSign, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const mockEvents = [
  {
    id: '1',
    name: 'Team Q4 Offsite 2025',
    destination: 'Miami, FL',
    dates: 'Nov 20-24, 2025',
    budget: 25000,
    spent: 7500,
    employees: 10,
    booked: 3,
    status: 'active' as const,
  },
  {
    id: '2',
    name: 'Engineering Summit',
    destination: 'San Francisco, CA',
    dates: 'Dec 5-7, 2025',
    budget: 15000,
    spent: 0,
    employees: 8,
    booked: 0,
    status: 'pending' as const,
  },
  {
    id: '3',
    name: 'Sales Kickoff',
    destination: 'Las Vegas, NV',
    dates: 'Jan 15-18, 2026',
    budget: 30000,
    spent: 28500,
    employees: 12,
    booked: 12,
    status: 'completed' as const,
  },
]

export default function ItinerariesPage() {
  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <PageHeader 
          title="Itineraries" 
          description="Track and manage travel events across your organization"
          actions={
            <Link href="/admin/itineraries/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </Link>
          }
        />

        <div className="space-y-4">
          {mockEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/admin/itineraries/${event.id}`}>
                <Card className="p-0 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border/60 group">
                  <div className="flex flex-col md:flex-row">
                    {/* Event Status Strip */}
                    <div className={cn(
                        "w-full md:w-2 h-2 md:h-auto",
                        event.status === 'active' ? "bg-emerald-500" :
                        event.status === 'pending' ? "bg-amber-500" : "bg-emerald-400"
                    )} />
                    
                    <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{event.name}</h3>
                                    <span className={cn(
                                        "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                        event.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" :
                                        event.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                                        "bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/5 dark:text-emerald-400/70 dark:border-emerald-500/10"
                                    )}>
                                        {event.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {event.destination}
                                    </span>
                                    <span className="flex items-center gap-1.5 font-medium">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {event.dates}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Budget</p>
                                    <p className="text-lg font-bold text-foreground">${event.budget.toLocaleString()}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors group-hover:translate-x-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/60">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <Users className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employees</p>
                                    <p className="text-sm font-bold">{event.employees}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Booked</p>
                                    <p className="text-sm font-bold">{event.booked}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Spent</p>
                                    <p className="text-sm font-bold">${event.spent.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Progress</span>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{Math.round((event.booked / event.employees) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(event.booked / event.employees) * 100}%` }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="h-full bg-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
