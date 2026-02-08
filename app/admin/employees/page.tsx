'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmployeeFilters } from '@/components/Employees/EmployeeFilters'
import { EmployeeCard } from '@/components/Employees/EmployeeCard'
import { EmployeeTable } from '@/components/Employees/EmployeeTable'
import { motion } from 'framer-motion'
import { Plus, Layout, List, Users, UserCheck, UserX, Briefcase, Mail, MapPin, UserCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type ViewMode = 'grid' | 'table'

type EmployeeUI = {
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

function mapEmployeeToUI(emp: Doc<'employees'>): EmployeeUI {
  return {
    id: emp._id,
    name: emp.name,
    email: emp.email,
    team: emp.team,
    role: emp.role,
    location: emp.location,
    status: emp.status,
    lastEventBooking: emp.lastEventBooking
      ? new Date(emp.lastEventBooking).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : undefined,
    totalTripsBooked: emp.totalTripsBooked,
  }
}

const DEFAULT_TEAMS = ['Engineering', 'Sales', 'Product', 'Design', 'Finance', 'HR', 'Marketing']

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const rawEmployees = useQuery(api.employees.list, {}) ?? []
  const createEmployee = useMutation(api.employees.create)

  const employees: EmployeeUI[] = useMemo(() => rawEmployees.map(mapEmployeeToUI), [rawEmployees])
  const teamsFromData = useMemo(() => [...new Set(employees.map((e) => e.team))].sort(), [employees])

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    team: '',
    role: '',
    location: '',
  })

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createEmployee({
        name: newEmployee.name.trim(),
        email: newEmployee.email.trim(),
        team: newEmployee.team.trim(),
        role: newEmployee.role.trim(),
        location: newEmployee.location.trim() || undefined,
        status: 'active',
      })
      toast.success('Employee added successfully', {
        description: `${newEmployee.name} has been added to TripWeaver.`,
      })
      setIsAddModalOpen(false)
      setNewEmployee({ name: '', email: '', team: '', role: '', location: '' })
    } catch (err) {
      toast.error('Failed to add employee', {
        description: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = selectedTeams.length === 0 || selectedTeams.includes(emp.team)
      const matchesStatus =
        selectedStatus.length === 0 || selectedStatus.includes(emp.status.toLowerCase())
      return matchesSearch && matchesTeam && matchesStatus
    })
  }, [employees, searchTerm, selectedTeams, selectedStatus])

  const stats = useMemo(
    () => ({
      totalEmployees: employees.length,
      activeEmployees: employees.filter((e) => e.status === 'active').length,
      inactiveEmployees: employees.filter((e) => e.status === 'inactive').length,
      teamsCount: new Set(employees.map((e) => e.team)).size,
    }),
    [employees]
  )

  const isLoading = rawEmployees === undefined
  const hasNoEmployees = !isLoading && employees.length === 0
  const hasNoMatches = employees.length > 0 && filteredEmployees.length === 0

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <PageHeader
          title="Employees"
          description="Manage your company directory and track employee travel participation"
          actions={
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && setViewMode(v as ViewMode)}
                variant="outline"
                className="h-10"
              >
                <ToggleGroupItem value="table" className="gap-2 px-4">
                  <List className="w-4 h-4" /> Table
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" className="gap-2 px-4">
                  <Layout className="w-4 h-4" /> Grid
                </ToggleGroupItem>
              </ToggleGroup>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-10 shadow-lg shadow-emerald-500/10"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </Button>
            </div>
          }
        />

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
            <form onSubmit={handleAddEmployee}>
              <DialogHeader className="p-8 bg-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <DialogTitle className="text-2xl font-bold tracking-[-0.02em]">Add New Employee</DialogTitle>
                  <DialogDescription className="text-slate-400 mt-2">
                    Invite a new team member to start managing their travel.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="p-8 space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="e.g., Jane Cooper"
                        className="pl-10 h-11 rounded-xl"
                        value={newEmployee.name}
                        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Company Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane.cooper@acme.com"
                        className="pl-10 h-11 rounded-xl"
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Team</Label>
                      <Select value={newEmployee.team} onValueChange={(v) => setNewEmployee({ ...newEmployee, team: v })} required>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_TEAMS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Role</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="role"
                          placeholder="e.g., Senior Lead"
                          className="pl-10 h-11 rounded-xl"
                          value={newEmployee.role}
                          onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Primary Office</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g., San Francisco, CA"
                        className="pl-10 h-11 rounded-xl"
                        value={newEmployee.location}
                        onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-muted/30 pt-6">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)} className="font-semibold text-xs uppercase tracking-wider">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-8 rounded-xl font-semibold shadow-lg shadow-emerald-500/10"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Invite Employee</>}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} index={0} />
          <StatCard label="Active" value={stats.activeEmployees} icon={UserCheck} index={1} />
          <StatCard label="Inactive" value={stats.inactiveEmployees} icon={UserX} index={2} />
          <StatCard label="Total Teams" value={stats.teamsCount} icon={Briefcase} index={3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <EmployeeFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTeams={selectedTeams}
              setSelectedTeams={setSelectedTeams}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              teams={teamsFromData}
            />
          </div>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border border-border/60 bg-muted/20">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Loading employees…</p>
              </div>
            ) : hasNoEmployees ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No employees yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs">
                  Add your first team member to get started.
                </p>
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4" /> Add Employee
                </Button>
              </motion.div>
            ) : hasNoMatches ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">No employees found</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-xs">
                  We couldn&apos;t find any employees matching your current filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedTeams([])
                    setSelectedStatus([])
                  }}
                >
                  Clear all filters
                </Button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEmployees.map((emp, idx) => (
                      <EmployeeCard key={emp.id} employee={emp} delay={idx * 0.05} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-border/60 overflow-hidden">
                    <EmployeeTable employees={filteredEmployees} />
                  </Card>
                )}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-center"
                >
                  Showing {filteredEmployees.length} of {employees.length} employees
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
