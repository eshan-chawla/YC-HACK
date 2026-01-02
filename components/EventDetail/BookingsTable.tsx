'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, MoreVertical, AlertTriangle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Employee {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'booked' | 'failed' | 'alert'
  tripCost?: number
}

interface BookingsTableProps {
  employees: Employee[]
  eventId: string
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-blue-50 text-blue-600 border-blue-100',
    dot: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-500',
  },
  booked: {
    label: 'Booked',
    className: 'bg-green-50 text-green-600 border-green-100',
    dot: 'bg-green-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-600 border-red-100',
    dot: 'bg-red-500',
  },
  alert: {
    label: 'Alert',
    className: 'bg-red-50 text-red-600 border-red-100',
    dot: 'bg-red-500',
  },
}

export function BookingsTable({ employees, eventId }: BookingsTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground rounded-tl-xl">Employee</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Trip Cost</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right rounded-tr-xl">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/40">
          {employees.map((emp, idx) => {
            const config = statusConfig[emp.status as keyof typeof statusConfig]
            return (
              <TableRow
                key={emp.id}
                className="hover:bg-muted/20 transition-colors group border-none"
              >
                <TableCell className="py-4 px-6 font-bold text-foreground">
                    {emp.name}
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className={cn(
                      "inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
                      config.className
                  )}>
                    <div className={cn("w-1 h-1 rounded-full", config.dot)} />
                    {config.label}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6 text-sm font-black text-foreground">
                    {emp.tripCost ? `$${emp.tripCost.toLocaleString()}` : (
                        <span className="text-muted-foreground font-medium italic opacity-50 text-xs">Awaiting...</span>
                    )}
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/itineraries/${eventId}/trips/${emp.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 font-bold text-[10px] uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Details <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
