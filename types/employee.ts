export interface EmployeeDirectory {
  id: string
  name: string
  email: string
  team: string
  role: string
  department?: string
  location?: string
  status: 'active' | 'inactive'
  lastEventBooking?: string
  totalTripsBooked?: number
  profileImage?: string
}

export interface EmployeeStats {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  teamBreakdown: Record<string, number>
}
