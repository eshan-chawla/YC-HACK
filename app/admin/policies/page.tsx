'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Eye, ShieldCheck, Plane, Building2, Car, Coffee } from 'lucide-react'
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
    <AppShell role="admin">
      <div className="space-y-8 max-w-5xl">
        <PageHeader 
          title="Travel Policies" 
          description="Create and manage policy templates to automate booking compliance"
          actions={
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white h-10 shadow-lg shadow-emerald-500/10">
              <Plus className="w-4 h-4" />
              New Policy
            </Button>
          }
        />

        <div className="space-y-4">
          {policies.map((policy, index) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-0 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border/60 group">
                <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500 transition-colors duration-300">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{policy.name}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{policy.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 gap-2 px-3 font-bold text-[10px] uppercase tracking-widest rounded-lg">
                                <Eye className="w-3.5 h-3.5" /> View
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2 px-3 font-bold text-[10px] uppercase tracking-widest rounded-lg">
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="h-9 gap-2 px-3 font-bold text-[10px] uppercase tracking-widest rounded-lg text-destructive hover:text-destructive hover:bg-destructive/5">
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/60">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Plane className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Airlines</p>
                                <p className="text-sm font-bold">{policy.airlines.length} Allowed</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hotels</p>
                                <p className="text-sm font-bold">{policy.hotels.length} Preferred</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Coffee className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meals</p>
                                <p className="text-sm font-bold">${policy.mealAllowance}/day</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                <Car className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transport</p>
                                <p className="text-sm font-bold">${policy.groundTransport} Max</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-muted/30 px-6 py-3 border-t border-border/60 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                    <span>Created {policy.createdAt}</span>
                    <span>Used in {policy.usedInEvents} active events</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
