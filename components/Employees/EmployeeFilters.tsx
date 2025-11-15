'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const teams = ['Engineering', 'Sales', 'Product', 'Design', 'Finance', 'HR', 'Marketing']
const statuses = ['Active', 'Inactive']

interface EmployeeFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedTeams: string[]
  setSelectedTeams: (teams: string[]) => void
  selectedStatus: string[]
  setSelectedStatus: (status: string[]) => void
}

export function EmployeeFilters({
  searchTerm,
  setSearchTerm,
  selectedTeams,
  setSelectedTeams,
  selectedStatus,
  setSelectedStatus,
}: EmployeeFiltersProps) {
  const toggleTeam = (team: string) => {
    setSelectedTeams(
      selectedTeams.includes(team)
        ? selectedTeams.filter(t => t !== team)
        : [...selectedTeams, team]
    )
  }

  const toggleStatus = (status: string) => {
    setSelectedStatus(
      selectedStatus.includes(status)
        ? selectedStatus.filter(s => s !== status)
        : [...selectedStatus, status]
    )
  }

  const hasActiveFilters =
    searchTerm || selectedTeams.length > 0 || selectedStatus.length > 0

  return (
    <Card className="p-5 space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Search Employees
        </label>
        <Input
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Filter by Team
        </label>
        <div className="flex flex-wrap gap-2">
          {teams.map(team => (
            <Badge
              key={team}
              variant={selectedTeams.includes(team) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTeam(team)}
            >
              {team}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Filter by Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statuses.map(status => (
            <Badge
              key={status}
              variant={selectedStatus.includes(status.toLowerCase()) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleStatus(status.toLowerCase())}
            >
              {status}
            </Badge>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2"
          onClick={() => {
            setSearchTerm('')
            setSelectedTeams([])
            setSelectedStatus([])
          }}
        >
          <X className="w-4 h-4" />
          Clear all filters
        </Button>
      )}
    </Card>
  )
}
