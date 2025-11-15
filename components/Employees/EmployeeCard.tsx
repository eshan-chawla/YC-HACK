'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, MapPin, Briefcase, Calendar } from 'lucide-react'

interface EmployeeCardProps {
  employee: {
    id: string
    name: string
    email: string
    team: string
    role: string
    location?: string
    status: 'active' | 'inactive'
    lastEventBooking?: string
    totalTripsBooked?: number
  }
  delay?: number
}

export function EmployeeCard({ employee, delay = 0 }: EmployeeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">{employee.name}</h3>
              <Badge
                className={
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }
              >
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{employee.role}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">{employee.email}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            <span>{employee.team}</span>
          </div>

          {employee.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{employee.location}</span>
            </div>
          )}

          {employee.lastEventBooking && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Last event: {employee.lastEventBooking}</span>
            </div>
          )}
        </div>

        {employee.totalTripsBooked !== undefined && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Total trips booked: <span className="font-semibold text-foreground">{employee.totalTripsBooked}</span>
            </p>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Profile
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            Message
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
