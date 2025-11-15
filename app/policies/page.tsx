'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { useState } from 'react'

const mockPolicies = [
  {
    id: '1',
    name: 'Q4-Offsite-Standard',
    description: 'Standard policy for Q4 team offsites',
    maxBudget: 2500,
    airlines: ['United', 'Delta'],
    hotels: ['Marriott', 'Hyatt'],
    mealAllowance: 75,
    groundTransport: 150,
    createdAt: 'Nov 10, 2025',
    usedInEvents: 5,
  },
  {
    id: '2',
    name: 'Executive-Travel',
    description: 'Premium policy for executive team travel',
    maxBudget: 5000,
    airlines: ['United', 'Delta', 'American'],
    hotels: ['Marriott', 'Hyatt', 'Four Seasons'],
    mealAllowance: 150,
    groundTransport: 250,
    createdAt: 'Nov 5, 2025',
    usedInEvents: 3,
  },
  {
    id: '3',
    name: 'Domestic-Standard',
    description: 'Standard policy for domestic travel',
    maxBudget: 1500,
    airlines: ['Southwest', 'United'],
    hotels: ['Marriott', 'IHG'],
    mealAllowance: 50,
    groundTransport: 100,
    createdAt: 'Oct 20, 2025',
    usedInEvents: 12,
  },
]

export default function PoliciesPage() {
  const [policies] = useState(mockPolicies)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Travel Policies</h1>
            <p className="text-muted-foreground mt-1">Manage company travel policy templates</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-blue-600">
            <Plus className="w-4 h-4" />
            Create Policy
          </Button>
        </div>

        <div className="space-y-3">
          {policies.map((policy, index) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{policy.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Max Budget</p>
                    <p className="font-medium text-foreground mt-1">${policy.maxBudget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Meal Allowance</p>
                    <p className="font-medium text-foreground mt-1">${policy.mealAllowance}/day</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ground Transport</p>
                    <p className="font-medium text-foreground mt-1">${policy.groundTransport}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Airlines</p>
                    <p className="font-medium text-foreground mt-1">{policy.airlines.length} approved</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Used In Events</p>
                    <p className="font-medium text-foreground mt-1">{policy.usedInEvents} events</p>
                  </div>
                </div>

                <div className="pt-3 text-xs text-muted-foreground">
                  Created on {policy.createdAt}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
