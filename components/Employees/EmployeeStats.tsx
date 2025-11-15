'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Users, UserCheck, UserX, Users2 } from 'lucide-react'

interface EmployeeStatsProps {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  teamsCount: number
}

export function EmployeeStats({
  totalEmployees,
  activeEmployees,
  inactiveEmployees,
  teamsCount,
}: EmployeeStatsProps) {
  const stats = [
    {
      label: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      delay: 0,
    },
    {
      label: 'Active',
      value: activeEmployees,
      icon: UserCheck,
      color: 'bg-green-500',
      delay: 0.1,
    },
    {
      label: 'Inactive',
      value: inactiveEmployees,
      icon: UserX,
      color: 'bg-red-500',
      delay: 0.2,
    },
    {
      label: 'Teams',
      value: teamsCount,
      icon: Users2,
      color: 'bg-purple-500',
      delay: 0.3,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
          >
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
