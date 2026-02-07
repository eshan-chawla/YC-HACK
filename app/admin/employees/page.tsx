'use client'

import { useState, useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmployeeFilters } from '@/components/Employees/EmployeeFilters'
import { EmployeeCard } from '@/components/Employees/EmployeeCard'
import { EmployeeTable } from '@/components/Employees/EmployeeTable'
import { motion } from 'framer-motion'
import { Plus, Layout, List, Users, UserCheck, UserX, Briefcase, Mail, MapPin, Building2, UserCircle, Loader2, CheckCircle2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

// Mock employee data
const mockEmployees = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@company.com',
    team: 'Engineering',
    role: 'Team Lead',
    location: 'San Francisco, CA',
    status: 'active' as const,
    totalTripsBooked: 12,
    lastEventBooking: 'Oct 2025',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@company.com',
    team: 'Product',
    role: 'Senior PM',
    location: 'New York, NY',
    status: 'active' as const,
    totalTripsBooked: 8,
    lastEventBooking: 'Sep 2025',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@company.com',
    team: 'Sales',
    role: 'Account Executive',
    location: 'Chicago, IL',
    status: 'active' as const,
    totalTripsBooked: 15,
    lastEventBooking: 'Nov 2025',
  },
  {
    id: '4',
    name: 'Lisa Wong',
    email: 'lisa@company.com',
    team: 'Design',
    role: 'UX Lead',
    location: 'Austin, TX',
    status: 'active' as const,
    totalTripsBooked: 5,
    lastEventBooking: 'Aug 2025',
  },
  {
    id: '5',
    name: 'James Taylor',
    email: 'james@company.com',
    team: 'Finance',
    role: 'Controller',
    location: 'Boston, MA',
    status: 'active' as const,
    totalTripsBooked: 3,
    lastEventBooking: 'Sep 2025',
  },
  {
    id: '6',
    name: 'Emma Davis',
    email: 'emma@company.com',
    team: 'Engineering',
    role: 'Senior Engineer',
    location: 'San Francisco, CA',
    status: 'active' as const,
    totalTripsBooked: 10,
    lastEventBooking: 'Oct 2025',
  },
  {
    id: '7',
    name: 'Alex Martin',
    email: 'alex@company.com',
    team: 'Marketing',
    role: 'Manager',
    location: 'Los Angeles, CA',
    status: 'inactive' as const,
    totalTripsBooked: 2,
    lastEventBooking: 'Jun 2025',
  },
  {
    id: '8',
    name: 'Rachel Green',
    email: 'rachel@company.com',
    team: 'HR',
    role: 'Director',
    location: 'New York, NY',
    status: 'active' as const,
    totalTripsBooked: 4,
    lastEventBooking: 'Oct 2025',
  },
  {
    id: '9',
    name: 'David Brown',
    email: 'david@company.com',
    team: 'Sales',
    role: 'Sales Manager',
    location: 'Chicago, IL',
    status: 'active' as const,
    totalTripsBooked: 9,
    lastEventBooking: 'Nov 2025',
  },
  {
    id: '10',
    name: 'Sophie Laurent',
    email: 'sophie@company.com',
    team: 'Product',
    role: 'Product Manager',
    location: 'London, UK',
    status: 'active' as const,
    totalTripsBooked: 7,
    lastEventBooking: 'Oct 2025',
  },
]

type ViewMode = 'grid' | 'table'

export default function EmployeesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New employee form state
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    toast.success('Employee added successfully', {
      description: `${newEmployee.name} has been invited to TripWeaver.`,
    })
    
    setIsSubmitting(false)
    setIsAddModalOpen(false)
    setNewEmployee({
      name: '',
      email: '',
      team: '',
      role: '',
      location: '',
    })
  }

  const filteredEmployees = useMemo(() => {
    return mockEmployees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesTeam =
        selectedTeams.length === 0 || selectedTeams.includes(emp.team)

      const matchesStatus =
        selectedStatus.length === 0 ||
        selectedStatus.includes(emp.status.toLowerCase())

      return matchesSearch && matchesTeam && matchesStatus
    })
  }, [searchTerm, selectedTeams, selectedStatus])

  // Calculate stats
  const stats = {
    totalEmployees: mockEmployees.length,
    activeEmployees: mockEmployees.filter(e => e.status === 'active').length,
    inactiveEmployees: mockEmployees.filter(e => e.status === 'inactive').length,
    teamsCount: new Set(mockEmployees.map(e => e.team)).size,
  }

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <PageHeader 
          title="Employees" 
          description="Manage your company directory and track employee travel participation"
          actions={
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 h-10">
                            {viewMode === 'grid' ? (
                                <Layout className="w-4 h-4" />
                            ) : (
                                <List className="w-4 h-4" />
                            )}
                            {viewMode === 'grid' ? 'Grid View' : 'Table View'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewMode('grid')} className="gap-2">
                            <Layout className="w-4 h-4" /> Grid View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewMode('table')} className="gap-2">
                            <List className="w-4 h-4" /> Table View
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

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
                                        onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
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
                                        onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Team</Label>
                                    <Select 
                                        value={newEmployee.team} 
                                        onValueChange={v => setNewEmployee({...newEmployee, team: v})}
                                        required
                                    >
                                        <SelectTrigger className="h-11 rounded-xl">
                                            <SelectValue placeholder="Select team" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Engineering">Engineering</SelectItem>
                                            <SelectItem value="Product">Product</SelectItem>
                                            <SelectItem value="Sales">Sales</SelectItem>
                                            <SelectItem value="Design">Design</SelectItem>
                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                            <SelectItem value="HR">HR</SelectItem>
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
                                            onChange={e => setNewEmployee({...newEmployee, role: e.target.value})}
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
                                        onChange={e => setNewEmployee({...newEmployee, location: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-muted/30 pt-6">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => setIsAddModalOpen(false)}
                            className="font-semibold text-xs uppercase tracking-wider"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 px-8 rounded-xl font-semibold shadow-lg shadow-emerald-500/10"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Invite Employee
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Employees" value={stats.totalEmployees} icon={Users} index={0} />
            <StatCard label="Active" value={stats.activeEmployees} icon={UserCheck} index={1} />
            <StatCard label="Inactive" value={stats.inactiveEmployees} icon={UserX} index={2} />
            <StatCard label="Total Teams" value={stats.teamsCount} icon={Briefcase} index={3} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <EmployeeFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedTeams={selectedTeams}
              setSelectedTeams={setSelectedTeams}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />
          </div>

          {/* Employee List/Table */}
          <div className="lg:col-span-3">
            {filteredEmployees.length === 0 ? (
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
                  We couldn't find any employees matching your current filters.
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
                        Showing {filteredEmployees.length} of {mockEmployees.length} employees
                    </motion.div>
                </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
