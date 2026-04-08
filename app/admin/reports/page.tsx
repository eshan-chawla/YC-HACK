'use client'

import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Download, TrendingUp, DollarSign, Users, CheckCircle, Calendar, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const PIE_COLORS = ['#10B981', '#059669', '#F59E0B', '#8B5CF6', '#6366F1', '#EC4899']

export default function ReportsPage() {
  const eventsWithStats = useQuery(api.events.listWithTripStats) ?? []
  const isLoading = eventsWithStats === undefined

  const { totalSpend, totalTrips, totalEmployees, compliancePct, avgTripCost, spendData, eventData, tableRows } =
    useMemo(() => {
      const events = eventsWithStats
      const totalSpend = events.reduce((sum, e) => sum + e.totalSpent, 0)
      const totalTrips = events.reduce((sum, e) => sum + e.tripCount, 0)
      const totalEmployees = events.reduce((sum, e) => sum + e.employeeIds.length, 0)
      const complianceTotal = events.reduce((sum, e) => sum + e.complianceCount, 0)
      const compliancePct = totalTrips > 0 ? Math.round((complianceTotal / totalTrips) * 100) : 0
      const avgTripCost = totalTrips > 0 ? Math.round(totalSpend / totalTrips) : 0

      const byMonth: Record<string, { spend: number; budget: number }> = {}
      for (const e of events) {
        const d = new Date(e.departureDate)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        const monthLabel = d.toLocaleDateString('en-US', { month: 'short' })
        if (!byMonth[monthLabel]) byMonth[monthLabel] = { spend: 0, budget: 0 }
        byMonth[monthLabel].spend += e.totalSpent
        byMonth[monthLabel].budget += e.totalBudget
      }
      const spendData = Object.entries(byMonth).map(([month, v]) => ({ month, spend: v.spend, budget: v.budget }))

      const eventData = events
        .filter((e) => e.totalSpent > 0 || e.totalBudget > 0)
        .map((e, i) => ({
          name: e.name.length > 20 ? e.name.slice(0, 18) + '…' : e.name,
          value: e.totalSpent || e.totalBudget,
          fill: PIE_COLORS[i % PIE_COLORS.length],
        }))

      const tableRows = events.map((e) => ({
        id: e._id,
        event: e.name,
        employees: e.employeeIds.length,
        spend: e.totalSpent,
        compliance: e.tripCount > 0 ? Math.round((e.complianceCount / e.tripCount) * 100) : 0,
        status: e.status,
      }))

      return {
        totalSpend,
        totalTrips,
        totalEmployees,
        compliancePct,
        avgTripCost,
        spendData,
        eventData,
        tableRows,
      }
    }, [eventsWithStats])

  const hasData = eventsWithStats.length > 0

  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <PageHeader
          title="Reporting & Insights"
          description="Analyze travel spending, compliance trends, and employee participation"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 gap-2 font-semibold text-xs uppercase tracking-wider rounded-xl" disabled>
                Export PDF
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>
        ) : !hasData ? (
          <Card className="p-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-foreground font-medium mb-1">No report data yet</p>
            <p className="text-sm text-muted-foreground mb-6">Create events and track trips to see spending and compliance here.</p>
            <Button asChild>
              <Link href="/admin/itineraries/new">Create Event</Link>
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Spend" value={totalSpend > 0 ? `$${totalSpend.toLocaleString()}` : '—'} icon={DollarSign} index={0} />
              <StatCard label="Avg. Trip Cost" value={avgTripCost > 0 ? `$${avgTripCost.toLocaleString()}` : '—'} icon={TrendingUp} index={1} />
              <StatCard label="Active Participants" value={totalEmployees > 0 ? String(totalEmployees) : '—'} icon={Users} index={2} />
              <StatCard label="Compliance Rate" value={totalTrips > 0 ? `${compliancePct}%` : '—'} icon={CheckCircle} index={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {spendData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="p-6 border-border/60 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground mb-8">Monthly Spending Trend</h2>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={spendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '12px',
                            }}
                          />
                          <Line type="monotone" dataKey="spend" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="Spend" />
                          <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={2} strokeDasharray="8 5" dot={false} name="Budget" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </motion.div>
              )}

              {eventData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card className="p-6 border-border/60 shadow-sm">
                    <h2 className="text-base font-semibold text-foreground mb-8">Budget Allocation by Event</h2>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="h-[300px] w-full md:w-1/2">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={eventData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                              {eventData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-1/2 space-y-4">
                        {eventData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                              <span className="text-sm font-semibold text-foreground">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold">${(item.value / 1000).toFixed(1)}k</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/40 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Event Performance Summary</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/30">
                        <th className="text-left py-4 px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Event</th>
                        <th className="text-left py-4 px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Team Size</th>
                        <th className="text-left py-4 px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Total Spend</th>
                        <th className="text-left py-4 px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Compliance</th>
                        <th className="text-left py-4 px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Status</th>
                        <th className="text-right py-4 px-6 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {tableRows.map((row) => (
                        <tr key={row.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-semibold text-foreground">{row.event}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-muted-foreground">{row.employees} Members</td>
                          <td className="py-4 px-6 text-sm font-bold text-foreground">${row.spend.toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-full max-w-[60px] h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${row.compliance}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-emerald-600">{row.compliance}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                                row.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : row.status === 'active'
                                    ? 'bg-sky-50 text-sky-700'
                                    : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                              <Link href={`/admin/itineraries/${row.id}`}>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  )
}
