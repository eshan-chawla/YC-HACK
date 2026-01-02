'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MoreVertical, Mail, MessageSquare, ChevronRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface Employee {
  id: string
  name: string
  email: string
  team: string
  role: string
  status: 'active' | 'inactive'
  location?: string
  totalTripsBooked?: number
  lastEventBooking?: string
}

interface EmployeeTableProps {
  employees: Employee[]
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground rounded-tl-xl">Employee</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Organization</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activity</TableHead>
            <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right rounded-tr-xl">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/40">
          {employees.map((emp, idx) => (
            <TableRow
              key={emp.id}
              className="hover:bg-muted/20 transition-colors group border-none"
            >
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                        {emp.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{emp.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{emp.email}</span>
                    </div>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground/80">{emp.team}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{emp.role}</span>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <Badge
                    className={cn(
                        "uppercase text-[8px] font-black tracking-tighter px-1.5 py-0 border-none shadow-none",
                        emp.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-muted text-muted-foreground'
                    )}
                >
                    {emp.status}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-foreground">{emp.totalTripsBooked || 0} Trips</span>
                    <span className="text-[10px] text-muted-foreground font-medium italic">Last: {emp.lastEventBooking || 'None'}</span>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Mail className="w-3.5 h-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        <MessageSquare className="w-4 h-4" /> Send Message
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        View Full Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 cursor-pointer">
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
