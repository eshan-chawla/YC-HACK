'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  // Step 1
  eventName: string
  eventDescription: string
  destination: string
  secondaryDestination: string
  departureDate: string
  returnDate: string
  departureTime: string
  budgetPerEmployee: number

  // Step 2
  selectedEmployees: string[]

  // Step 3
  emailSubject: string
  emailBody: string
  confirmChecked: boolean
}

const mockEmployees = [
  { id: '1', name: 'John Smith', email: 'john@company.com', team: 'Engineering', role: 'Team Lead' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@company.com', team: 'Product', role: 'Senior PM' },
  { id: '3', name: 'Mike Johnson', email: 'mike@company.com', team: 'Sales', role: 'Account Executive' },
  { id: '4', name: 'Lisa Wong', email: 'lisa@company.com', team: 'Design', role: 'UX Lead' },
  { id: '5', name: 'James Taylor', email: 'james@company.com', team: 'Finance', role: 'Controller' },
  { id: '6', name: 'Emma Davis', email: 'emma@company.com', team: 'Engineering', role: 'Senior Engineer' },
  { id: '7', name: 'Alex Martin', email: 'alex@company.com', team: 'Marketing', role: 'Manager' },
  { id: '8', name: 'Rachel Green', email: 'rachel@company.com', team: 'HR', role: 'Director' },
]

const airlines = [
  { id: 'united', name: 'United' },
  { id: 'delta', name: 'Delta' },
  { id: 'southwest', name: 'Southwest' },
  { id: 'american', name: 'American' },
]

const hotels = [
  { id: 'marriott', name: 'Marriott' },
  { id: 'hilton', name: 'Hilton' },
  { id: 'hyatt', name: 'Hyatt' },
  { id: 'ihg', name: 'IHG' },
]

export function EventWizard() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({
    eventName: '',
    eventDescription: '',
    destination: '',
    secondaryDestination: '',
    departureDate: '',
    returnDate: '',
    departureTime: '',
    budgetPerEmployee: 2500,
    selectedEmployees: [],
    emailSubject: '',
    emailBody: '',
    confirmChecked: false,
  })
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>(['united', 'delta'])
  const [selectedHotels, setSelectedHotels] = useState<string[]>(['marriott'])
  const [mealAllowance, setMealAllowance] = useState(75)
  const [groundTransport, setGroundTransport] = useState(150)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEmployees = mockEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalBudget = data.budgetPerEmployee * data.selectedEmployees.length

  const updateData = (key: keyof FormData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const toggleEmployee = (id: string) => {
    setData(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.includes(id)
        ? prev.selectedEmployees.filter(e => e !== id)
        : [...prev.selectedEmployees, id]
    }))
  }

  const selectAllEmployees = () => {
    setData(prev => ({
      ...prev,
      selectedEmployees: prev.selectedEmployees.length === mockEmployees.length ? [] : mockEmployees.map(e => e.id)
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center flex-1">
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  i <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i}
              </motion.div>
              {i < 3 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 transition-colors',
                    i < step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          {step === 1 && 'Step 1/3: Event Details'}
          {step === 2 && 'Step 2/3: Select Employees'}
          {step === 3 && 'Step 3/3: Review & Launch'}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Event Configuration */}
          {step === 1 && (
            <Card className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Event Details</h2>
                <p className="text-muted-foreground mt-1">Configure your travel event parameters</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventName">Event Name *</Label>
                  <Input
                    id="eventName"
                    placeholder="Team Q4 Offsite 2025"
                    value={data.eventName}
                    onChange={e => updateData('eventName', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDesc">Event Description (Optional)</Label>
                  <Input
                    id="eventDesc"
                    placeholder="Annual team building trip"
                    value={data.eventDescription}
                    onChange={e => updateData('eventDescription', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="pt-2">
                  <h3 className="font-semibold text-foreground mb-4">Destination Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="destination">Primary Destination *</Label>
                      <Input
                        id="destination"
                        placeholder="Miami, Florida"
                        value={data.destination}
                        onChange={e => updateData('destination', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary">Secondary Destination (Optional)</Label>
                      <Input
                        id="secondary"
                        placeholder="Key West, Florida"
                        value={data.secondaryDestination}
                        onChange={e => updateData('secondaryDestination', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-semibold text-foreground mb-4">Travel Dates</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="departure">Departure Date *</Label>
                      <Input
                        id="departure"
                        type="date"
                        value={data.departureDate}
                        onChange={e => updateData('departureDate', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="return">Return Date *</Label>
                      <Input
                        id="return"
                        type="date"
                        value={data.returnDate}
                        onChange={e => updateData('returnDate', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h3 className="font-semibold text-foreground mb-4">Budget & Controls</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="budget">Budget Per Employee ($) *</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={data.budgetPerEmployee}
                        onChange={e => updateData('budgetPerEmployee', parseFloat(e.target.value))}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Total Budget Estimate: ${(data.budgetPerEmployee * data.selectedEmployees.length).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <Label>Preferred Airlines</Label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {airlines.map(airline => (
                          <label key={airline.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedAirlines.includes(airline.id)}
                              onCheckedChange={() => {
                                setSelectedAirlines(prev =>
                                  prev.includes(airline.id)
                                    ? prev.filter(a => a !== airline.id)
                                    : [...prev, airline.id]
                                )
                              }}
                            />
                            <span>{airline.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Hotel Preference</Label>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {hotels.map(hotel => (
                          <label key={hotel.id} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedHotels.includes(hotel.id)}
                              onCheckedChange={() => {
                                setSelectedHotels(prev =>
                                  prev.includes(hotel.id)
                                    ? prev.filter(h => h !== hotel.id)
                                    : [...prev, hotel.id]
                                )
                              }}
                            />
                            <span>{hotel.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="meals">Meal Allowance Per Day ($)</Label>
                      <Input
                        id="meals"
                        type="number"
                        value={mealAllowance}
                        onChange={e => setMealAllowance(parseFloat(e.target.value))}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="transport">Ground Transport Limits ($)</Label>
                      <Input
                        id="transport"
                        type="number"
                        value={groundTransport}
                        onChange={e => setGroundTransport(parseFloat(e.target.value))}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Employee Selection */}
          {step === 2 && (
            <Card className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Select Employees</h2>
                <p className="text-muted-foreground mt-1">Choose who receives travel event invitations</p>
              </div>

              <div className="space-y-4">
                {/* Quick Filters */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={searchTerm === '' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    All Employees
                  </Button>
                  {['Engineering', 'Sales', 'Product', 'Design', 'Finance'].map(team => (
                    <Button
                      key={team}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchTerm(team)}
                    >
                      {team}
                    </Button>
                  ))}
                </div>

                {/* Search */}
                <div>
                  <Input
                    placeholder="Search by name, email, team..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="mb-4"
                  />
                </div>

                {/* Employee List */}
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  <div className="p-3 bg-muted flex items-center gap-2">
                    <Checkbox
                      checked={data.selectedEmployees.length === mockEmployees.length}
                      onCheckedChange={selectAllEmployees}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

                  {filteredEmployees.map(emp => (
                    <label
                      key={emp.id}
                      className="p-4 flex items-start gap-3 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={data.selectedEmployees.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-sm text-muted-foreground">{emp.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {emp.team} • {emp.role}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="font-medium text-foreground">
                    Selected: {data.selectedEmployees.length} employees
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Budget: ${(data.budgetPerEmployee * data.selectedEmployees.length).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Step 3: Email & Confirmation */}
          {step === 3 && (
            <Card className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Review & Launch</h2>
                <p className="text-muted-foreground mt-1">Customize invitation email and confirm details</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Team Q4 Offsite Travel - $2,500 Budget"
                    value={data.emailSubject}
                    onChange={e => updateData('emailSubject', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="body">Email Body</Label>
                  <textarea
                    id="body"
                    placeholder="Hi {EMPLOYEE_NAME},..."
                    value={data.emailBody}
                    onChange={e => updateData('emailBody', e.target.value)}
                    className="mt-2 w-full p-3 rounded-lg border border-input bg-background text-foreground min-h-32 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Available tags: {'{'}{'{'}EMPLOYEE_NAME{'}'}{'}' | '{'}{'{'}EMPLOYEE_EMAIL{'}'}{'}'} | {'{'}{'{'}BUDGET{'}'}{'}'} | {'{'}{'{'}DESTINATION{'}'}{'}'} | {'{'}{'{'}TRAVEL_DATES{'}'}{'}'}
                  </p>
                </div>

                {/* Confirmation Checklist */}
                <div className="bg-muted p-4 rounded-lg space-y-3 mt-6">
                  <h3 className="font-semibold text-foreground">Final Confirmation</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Event Name:</span> {data.eventName || '—'}</p>
                    <p><span className="font-medium">Destination:</span> {data.destination || '—'}</p>
                    <p><span className="font-medium">Dates:</span> {data.departureDate} to {data.returnDate || '—'}</p>
                    <p><span className="font-medium">Employees:</span> {data.selectedEmployees.length}</p>
                    <p><span className="font-medium">Total Budget:</span> ${totalBudget.toLocaleString()}</p>
                  </div>
                </div>

                <label className="flex items-start gap-3 mt-6 cursor-pointer">
                  <Checkbox
                    checked={data.confirmChecked}
                    onCheckedChange={val => updateData('confirmChecked', val)}
                  />
                  <span className="text-sm text-foreground leading-tight">
                    I confirm all details are correct and ready to send emails to selected employees
                  </span>
                </label>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-8">
        <Button
          variant="outline"
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {step < 3 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!data.eventName || !data.destination)}
            className="gap-2 ml-auto bg-primary hover:bg-blue-600"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {step === 3 && (
          <>
            <Button variant="outline" onClick={() => setStep(2)}>
              Edit Employees
            </Button>
            <Button
              disabled={!data.confirmChecked || !data.emailSubject || !data.emailBody}
              className="gap-2 ml-auto bg-primary hover:bg-blue-600"
            >
              Send Event & Launch Agents
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
