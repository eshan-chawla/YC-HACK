'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, DollarSign, MapPin, Clock, Users, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface EmployeeOption {
  id: Id<'employees'>
  name: string
  email: string
  team: string
  location: string
}

export default function NewEventPage() {
  const router = useRouter()
  const employeesFromDb = useQuery(api.employees.list, { status: 'active' })
  const createEvent = useMutation(api.events.create)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<{
    eventName: string
    employeeCount: number
    totalBudget: number
    eventId?: Id<'events'>
  } | null>(null)

  const availableEmployees: EmployeeOption[] = useMemo(() => {
    if (!employeesFromDb) return []
    return employeesFromDb.map((emp) => ({
      id: emp._id,
      name: emp.name,
      email: emp.email,
      team: emp.team,
      location: emp.location ?? '',
    }))
  }, [employeesFromDb])

  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<Id<'employees'>>>(new Set())

  // Form state
  const [eventName, setEventName] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [budgetPerPerson, setBudgetPerPerson] = useState('')
  const [restrictions, setRestrictions] = useState('')

  const toggleEmployee = (employeeId: Id<'employees'>) => {
    const newSelected = new Set(selectedEmployeeIds)
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId)
    } else {
      newSelected.add(employeeId)
    }
    setSelectedEmployeeIds(newSelected)
  }

  const selectAll = () => {
    setSelectedEmployeeIds(new Set(availableEmployees.map((emp) => emp.id)))
  }

  const deselectAll = () => {
    setSelectedEmployeeIds(new Set())
  }

  const calculateTotalBudget = () => {
    const budget = parseFloat(budgetPerPerson) || 0
    return budget * selectedEmployeeIds.size
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!eventName.trim()) throw new Error('Please enter an event name')
      if (!location.trim()) throw new Error('Please enter a destination')
      if (!eventDate) throw new Error('Please select an event date')
      if (!eventTime) throw new Error('Please select a time')
      if (!budgetPerPerson || parseFloat(budgetPerPerson) <= 0) {
        throw new Error('Please enter a valid budget per person')
      }
      if (selectedEmployeeIds.size === 0) {
        throw new Error('Please select at least one employee')
      }

      const budgetPer = parseFloat(budgetPerPerson)
      const totalBudget = budgetPer * selectedEmployeeIds.size
      const departureDate = new Date(`${eventDate}T${eventTime}`).getTime()
      const returnDate = departureDate + 24 * 60 * 60 * 1000 // 1 day later

      const eventId = await createEvent({
        name: eventName.trim(),
        destination: location.trim(),
        departureDate,
        returnDate,
        departureTime: eventTime,
        budgetPerEmployee: budgetPer,
        totalBudget,
        employeeIds: Array.from(selectedEmployeeIds),
        requirements: restrictions.trim()
          ? { customRestrictions: restrictions.trim() }
          : undefined,
      })

      setSuccessData({
        eventName: eventName.trim(),
        employeeCount: selectedEmployeeIds.size,
        totalBudget,
        eventId,
      })
      setShowSuccessDialog(true)
      setEventName('')
      setLocation('')
      setEventDate('')
      setEventTime('')
      setBudgetPerPerson('')
      setRestrictions('')
      setSelectedEmployeeIds(new Set())
    } catch (err) {
      console.error('Error creating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = employeesFromDb === undefined
  if (isLoading) {
    return (
      <AppShell role="admin">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell role="admin">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader 
          title="Create New Event" 
          description="Set up a new corporate travel event and invite employees"
          className="mb-0"
        />

        <form onSubmit={handleSubmit} className="space-y-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                {/* Event Details Card */}
                <Card className="p-6 border-border/60 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2 tracking-wider">
                        <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        Basic Information
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="eventName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Event Name</Label>
                            <Input
                                id="eventName"
                                placeholder="e.g., Team Q4 Offsite 2025"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                                className="h-11 rounded-xl focus-visible:ring-emerald-500/20"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location" className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Destination
                            </Label>
                            <Input
                                id="location"
                                placeholder="e.g., Miami, FL"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="h-11 rounded-xl focus-visible:ring-emerald-500/20"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="eventDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</Label>
                                <Input
                                    id="eventDate"
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="h-11 rounded-xl focus-visible:ring-emerald-500/20"
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="eventTime" className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Preferred Time
                                </Label>
                                <Input
                                    id="eventTime"
                                    type="time"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="h-11 rounded-xl focus-visible:ring-emerald-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="restrictions" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Additional Notes / Restrictions</Label>
                            <Textarea
                                id="restrictions"
                                placeholder="Enter any specific travel policies or accommodation requirements..."
                                value={restrictions}
                                onChange={(e) => setRestrictions(e.target.value)}
                                rows={4}
                                className="rounded-xl focus-visible:ring-emerald-500/20"
                            />
                        </div>
                    </div>
                </Card>

                {/* Employees Selection Card */}
                <Card className="p-6 border-border/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2 tracking-wider">
                            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            Participants
                        </h2>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={selectAll}
                                className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            >
                                Select All
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={deselectAll}
                                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableEmployees.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-6 text-center">
                            No active employees. Add employees in the Employees section first.
                          </p>
                        ) : (
                        availableEmployees.map((employee) => (
                        <div
                            key={employee.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                selectedEmployeeIds.has(employee.id) 
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-sm" 
                                    : "border-border/60 hover:bg-muted/30"
                            )}
                            onClick={() => toggleEmployee(employee.id)}
                        >
                            <Checkbox
                                id={employee.id}
                                checked={selectedEmployeeIds.has(employee.id)}
                                onCheckedChange={() => toggleEmployee(employee.id)}
                                className="rounded-full h-5 w-5"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="font-bold text-foreground truncate">{employee.name}</p>
                                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">{employee.team}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="truncate">{employee.email}</span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {employee.location}
                                    </span>
                                </div>
                            </div>
                        </div>
                        ))
                        )}
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                {/* Budget Sidebar Card */}
                <Card className="p-6 border-border/60 shadow-sm sticky top-24">
                    <h2 className="text-base font-semibold text-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Budget Estimate
                    </h2>
                    
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="budgetPerPerson" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Budget Per Person</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="budgetPerPerson"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={budgetPerPerson}
                                    onChange={(e) => setBudgetPerPerson(e.target.value)}
                                    className="h-11 pl-9 rounded-xl focus-visible:ring-emerald-500/20"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border/60 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Participants</span>
                                <span className="font-bold">{selectedEmployeeIds.size}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Per Participant</span>
                                <span className="font-bold">${parseFloat(budgetPerPerson || '0').toLocaleString()}</span>
                            </div>
                            <div className="pt-4 flex justify-between items-center">
                                <span className="font-bold text-foreground uppercase tracking-widest text-xs">Total Budget</span>
                                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    ${calculateTotalBudget().toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium flex gap-2">
                                <div className="w-1 h-1 rounded-full bg-destructive mt-1.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/10"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Create & Send Invites'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/admin/itineraries')}
                                disabled={isSubmitting}
                                className="w-full h-11 rounded-xl font-bold text-xs uppercase tracking-widest"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
          </div>
        </form>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-[-0.02em] text-foreground uppercase">Event Ready!</h2>
                <p className="text-muted-foreground text-[15px] font-medium px-4">
                    Invitations have been sent to your team members. They can now start planning their trips.
                </p>
              </div>

              {successData && (
                <div className="bg-muted/30 rounded-xl p-6 space-y-4 border border-border/60">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground/60 uppercase tracking-wider text-xs">Event Name</span>
                    <span className="font-bold text-foreground truncate max-w-[200px]">{successData.eventName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground/60 uppercase tracking-wider text-xs">Participants</span>
                    <span className="font-bold text-foreground">{successData.employeeCount} Members</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t border-border/60 pt-4">
                    <span className="font-medium text-muted-foreground/60 uppercase tracking-wider text-xs">Total Allocation</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                      ${successData.totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button
                    onClick={() => {
                        setShowSuccessDialog(false)
                        router.push(successData?.eventId ? `/admin/itineraries/${successData.eventId}` : '/admin/itineraries')
                    }}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                >
                    {successData?.eventId ? 'View Event' : 'Return to Itineraries'}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setShowSuccessDialog(false)}
                    className="w-full h-11 text-muted-foreground font-bold text-xs uppercase tracking-widest"
                >
                    Dismiss
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
