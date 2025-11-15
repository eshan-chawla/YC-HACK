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
import { Eye, MoreVertical, AlertTriangle } from 'lucide-react'
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
  pending: {
    label: 'Pending',
    className: 'bg-blue-100 text-blue-700',
    icon: '⏳',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-amber-100 text-amber-700',
    icon: '🔄',
  },
  booked: {
    label: 'Booked',
    className: 'bg-green-100 text-green-700',
    icon: '✅',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-700',
    icon: '❌',
  },
  alert: {
    label: 'Alert',
    className: 'bg-amber-100 text-amber-700',
    icon: '⚠️',
  },
}

export function BookingsTable({ employees, eventId }: BookingsTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trip Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp, idx) => {
                const config = statusConfig[emp.status as keyof typeof statusConfig]
                return (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>
                      <Badge className={config.className}>
                        {config.icon} {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{emp.tripCost ? `$${emp.tripCost.toLocaleString()}` : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/events/${eventId}/trips/${emp.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  )
}
