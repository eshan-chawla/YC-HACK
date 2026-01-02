'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, MapPin, Briefcase, Calendar, MoreVertical, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="p-0 overflow-hidden hover:shadow-lg transition-all border-border/60 group">
        <div className="p-5">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{employee.name}</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{employee.role}</p>
                    </div>
                </div>
                <Badge
                    className={cn(
                        "uppercase text-[8px] font-black tracking-tighter px-1.5 py-0 border-none shadow-none",
                        employee.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {employee.status}
                </Badge>
            </div>

            <div className="space-y-3 mt-6">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{employee.email}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{employee.team}</span>
                </div>

                {employee.location && (
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{employee.location}</span>
                    </div>
                )}
            </div>
        </div>

        <div className="bg-muted/30 p-4 border-t border-border/40 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase tracking-widest rounded-lg">
                Profile
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5">
                <MessageSquare className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-3.5 h-3.5" />
            </Button>
        </div>
      </Card>
    </motion.div>
  )
}
