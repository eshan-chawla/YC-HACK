'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

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
  pending: { label: 'Pending', badge: 'badge badge-pending' },
  in_progress: { label: 'In Progress', badge: 'badge badge-generating' },
  booked: { label: 'Booked', badge: 'badge badge-completed' },
  failed: { label: 'Failed', badge: 'badge badge-cancelled' },
  alert: { label: 'Alert', badge: 'badge badge-cancelled' },
}

export function BookingsTable({ employees, eventId }: BookingsTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="py-3 px-5 text-label">Employee</TableHead>
            <TableHead className="py-3 px-5 text-label">Status</TableHead>
            <TableHead className="py-3 px-5 text-label">Trip Cost</TableHead>
            <TableHead className="py-3 px-5 text-label text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp) => {
            const config = statusConfig[emp.status as keyof typeof statusConfig]
            return (
              <TableRow
                key={emp.id}
                className="border-border hover:bg-muted/30 transition-colors group"
              >
                <TableCell className="py-3 px-5 text-[13px] font-medium text-foreground">
                  {emp.name}
                </TableCell>
                <TableCell className="py-3 px-5">
                  <span className={config.badge}>{config.label}</span>
                </TableCell>
                <TableCell className="py-3 px-5 text-[13px] font-medium text-foreground tabular-nums">
                  {emp.tripCost
                    ? `$${emp.tripCost.toLocaleString()}`
                    : <span className="text-muted-foreground/40">—</span>
                  }
                </TableCell>
                <TableCell className="py-3 px-5 text-right">
                  <Link
                    href={`/admin/itineraries/${eventId}/trips/${emp.id}`}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                  >
                    View <ChevronRight className="w-3 h-3" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
