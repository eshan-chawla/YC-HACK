'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, DollarSign, MapPin, Clock, Users, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Employee {
  id: string
  name: string
  email: string
  team: string
  location: string
}

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Available employees from database
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())

  // Form state
  const [eventName, setEventName] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [budgetPerPerson, setBudgetPerPerson] = useState('')
  const [restrictions, setRestrictions] = useState('')

  // Fetch employees from Supabase
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('name')

        if (error) throw error

        setAvailableEmployees(data || [])
      } catch (err) {
        console.error('[v0] Error fetching employees:', err)
        setError('Failed to load employees')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const toggleEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedEmployeeIds)
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId)
    } else {
      newSelected.add(employeeId)
    }
    setSelectedEmployeeIds(newSelected)
  }

  const selectAll = () => {
    setSelectedEmployeeIds(new Set(availableEmployees.map(emp => emp.id)))
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
      if (selectedEmployeeIds.size === 0) {
        throw new Error('Please select at least one employee')
      }

      const eventData = {
        name: eventName,
        destination: location, // API expects 'destination' field
        event_date: eventDate,
        event_time: eventTime,
        budget_per_person: parseFloat(budgetPerPerson),
        restrictions,
        employee_ids: Array.from(selectedEmployeeIds),
      }

      console.log('[v0] Submitting event data:', eventData)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create event')
      }

      const result = await response.json()
      console.log('[v0] Event created successfully:', result)
      
      // Redirect to dashboard
      router.push('/')
    } catch (err) {
      console.error('[v0] Error creating event:', err)
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
          <p className="text-muted-foreground mt-1">Set up a new corporate travel event</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Event Details
              </h2>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    placeholder="e.g., Team Q4 Offsite 2025"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Miami, FL"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="eventDate">Date *</Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="eventTime" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time *
                    </Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="budgetPerPerson" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Budget Per Person *
                  </Label>
                  <Input
                    id="budgetPerPerson"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 2500.00"
                    value={budgetPerPerson}
                    onChange={(e) => setBudgetPerPerson(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="restrictions">Budget / Restrictions (LOCUS Schema)</Label>
                  <Textarea
                    id="restrictions"
                    placeholder="Enter any budget restrictions or special requirements..."
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Employees Selection Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Select Employees ({selectedEmployeeIds.size} selected)
                </h2>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={employee.id}
                      checked={selectedEmployeeIds.has(employee.id)}
                      onCheckedChange={() => toggleEmployee(employee.id)}
                    />
                    <label
                      htmlFor={employee.id}
                      className="flex-1 cursor-pointer grid grid-cols-1 md:grid-cols-4 gap-2"
                    >
                      <div>
                        <p className="font-medium text-foreground">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.team}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {employee.location}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Budget Summary */}
            {budgetPerPerson && selectedEmployeeIds.size > 0 && (
              <Card className="p-6 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget Estimate</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      ${calculateTotalBudget().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedEmployeeIds.size} employees × ${parseFloat(budgetPerPerson).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-primary opacity-20" />
                </div>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="p-4 bg-destructive/10 border-destructive">
                <p className="text-sm text-destructive">{error}</p>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-blue-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Event...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
