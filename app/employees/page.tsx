'use client'

import { useState, useMemo } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { EmployeeStats } from '@/components/Employees/EmployeeStats'
import { EmployeeFilters } from '@/components/Employees/EmployeeFilters'
import { EmployeeCard } from '@/components/Employees/EmployeeCard'
import { EmployeeTable } from '@/components/Employees/EmployeeTable'
import { motion } from 'framer-motion'
import { Plus, Layout, List } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground mt-1">
              Manage your company directory and employee information
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  {viewMode === 'grid' ? (
                    <>
                      <Layout className="w-4 h-4" />
                      Grid View
                    </>
                  ) : (
                    <>
                      <List className="w-4 h-4" />
                      Table View
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode('grid')}>
                  <Layout className="w-4 h-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('table')}>
                  <List className="w-4 h-4 mr-2" />
                  Table View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="bg-primary hover:bg-green-600 text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <EmployeeStats
          totalEmployees={stats.totalEmployees}
          activeEmployees={stats.activeEmployees}
          inactiveEmployees={stats.inactiveEmployees}
          teamsCount={stats.teamsCount}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                className="text-center py-12"
              >
                <p className="text-muted-foreground mb-4">
                  No employees found matching your filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedTeams([])
                    setSelectedStatus([])
                  }}
                >
                  Clear Filters
                </Button>
              </motion.div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEmployees.map((emp, idx) => (
                  <EmployeeCard key={emp.id} employee={emp} delay={idx * 0.05} />
                ))}
              </div>
            ) : (
              <EmployeeTable employees={filteredEmployees} />
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 text-sm text-muted-foreground text-center"
            >
              Showing {filteredEmployees.length} of {mockEmployees.length} employees
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
