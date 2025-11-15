'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<{
    eventName: string
    employeeCount: number
    totalBudget: number
  } | null>(null)

  const demoEmployees = [
    {
      "id": "e7f8c1b2-a345-6789-b0c1-d2e3f4a5b6c7",
      "name": "Alice Johnson",
      "email": "alice.johnson@example.com",
      "team": "Engineering",
      "location": "New York, NY"
    },
    {
      "id": "f9a0b1c2-d3e4-f5a6-b7c8-d9e0f1a2b3c4",
      "name": "Bob Smith",
      "email": "bob.smith@example.com",
      "team": "Marketing",
      "location": "San Francisco, CA"
    },
    {
      "id": "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
      "name": "Carol White",
      "email": "carol.white@example.com",
      "team": "Sales",
      "location": "Chicago, IL"
    },
    {
      "id": "b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9",
      "name": "David Brown",
      "email": "david.brown@example.com",
      "team": "Engineering",
      "location": "Austin, TX"
    },
    {
      "id": "c6d7e8f9-a0b1-c2d3-e4f5-a6b7c8d9e0f1",
      "name": "Eve Davis",
      "email": "eve.davis@example.com",
      "team": "Product",
      "location": "Remote"
    },
    {
      "id": "d8e9f0a1-b2c3-d4e5-f6a7-b8c9d0e1f2a3",
      "name": "Frank Miller",
      "email": "frank.miller@example.com",
      "team": "Sales",
      "location": "London, UK"
    },
    {
      "id": "e0f1a2b3-c4d5-e6f7-a8b9-c0d1e2f3a4b5",
      "name": "Grace Wilson",
      "email": "grace.wilson@example.com",
      "team": "Human Resources",
      "location": "New York, NY"
    }
  ];

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
  // useEffect(() => {
    // const fetchEmployees = async () => {
    //   try {
    //     const supabase = createClient()
    //     const { data, error } = await supabase
    //       .from('employees')
    //       .select('*')
    //       .order('name')
    //
    //     if (error) throw error
    //
    //     setAvailableEmployees(data || [])
    //   } catch (err) {
    //     console.error('[v0] Error fetching employees:', err)
    //     setError('Failed to load employees')
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }

    // fetchEmployees()
  // }, [])

  useEffect(() => {
    // Use the demo data instead of fetching
    setAvailableEmployees(demoEmployees);
    setIsLoading(false);
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
      // Validate required fields
      if (!eventName.trim()) {
        throw new Error('Please enter an event name')
      }
      if (!location.trim()) {
        throw new Error('Please enter a location')
      }
      if (!eventDate) {
        throw new Error('Please select an event date')
      }
      if (!eventTime) {
        throw new Error('Please select an event time')
      }
      if (!budgetPerPerson || parseFloat(budgetPerPerson) <= 0) {
        throw new Error('Please enter a valid budget per person')
      }
      if (selectedEmployeeIds.size === 0) {
        throw new Error('Please select at least one employee')
      }

      // Simulate API call delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800))

      const totalBudget = calculateTotalBudget()
      
      // Store success data and show dialog
      setSuccessData({
        eventName,
        employeeCount: selectedEmployeeIds.size,
        totalBudget,
      })
      setShowSuccessDialog(true)
      
      // Clear form
      setEventName('')
      setLocation('')
      setEventDate('')
      setEventTime('')
      setBudgetPerPerson('')
      setRestrictions('')
      setSelectedEmployeeIds(new Set())
    } catch (err) {
      console.error('[v0] Error creating event:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event'
      setError(errorMessage)
      
      // Show error notification (keep toast for errors as they're less prominent)
      // Could also use a dialog here if preferred
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

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <DialogTitle className="text-2xl">Event Created Successfully!</DialogTitle>
              </div>
              <DialogDescription className="text-base pt-2">
                Your event has been created and is ready to use.
              </DialogDescription>
            </DialogHeader>

            {successData && (
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Event Name</span>
                    <span className="text-sm font-semibold text-foreground">{successData.eventName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Employees</span>
                    <span className="text-sm font-semibold text-foreground">
                      {successData.employeeCount} {successData.employeeCount === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Budget</span>
                    <span className="text-sm font-semibold text-green-600">
                      ${successData.totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessDialog(false)
                  router.push('/events')
                }}
                className="w-full sm:w-auto bg-primary hover:bg-blue-600"
              >
                View Events
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
