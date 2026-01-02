'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/layout/StatCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Download, TrendingUp, DollarSign, Users, CheckCircle, Calendar, ArrowUpRight, Filter } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const spendData = [
  { month: 'Aug', spend: 12000, budget: 15000 },
  { month: 'Sep', spend: 18000, budget: 20000 },
  { month: 'Oct', spend: 15500, budget: 18000 },
  { month: 'Nov', spend: 22000, budget: 25000 },
]

const eventData = [
  { name: 'Q4 Offsite', value: 25000, fill: '#10B981' },
  { name: 'Engineering Summit', value: 15000, fill: '#3B82F6' },
  { name: 'Sales Kickoff', value: 30000, fill: '#F59E0B' },
  { name: 'Other Events', value: 18000, fill: '#8B5CF6' },
]

export default function ReportsPage() {
  return (
    <AppShell role="admin">
      <div className="space-y-8">
        <PageHeader 
          title="Reporting & Insights" 
          description="Analyze travel spending, compliance trends, and employee participation"
          actions={
            <div className="flex items-center gap-2">
                <Button variant="outline" className="h-10 gap-2 font-bold text-xs uppercase tracking-widest rounded-xl">
                    <Filter className="w-3.5 h-3.5" /> Filter
                </Button>
                <Button className="h-10 gap-2 bg-primary hover:bg-green-600 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-green-500/10">
                    <Download className="w-3.5 h-3.5" /> Export PDF
                </Button>
            </div>
          }
        />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Spend" value="$67,500" icon={DollarSign} trend={{ value: 12, label: "up", isPositive: true }} index={0} />
            <StatCard label="Avg. Trip Cost" value="$2,450" icon={TrendingUp} trend={{ value: 4, label: "down", isPositive: false }} index={1} />
            <StatCard label="Active Participants" value="256" icon={Users} trend={{ value: 15, label: "up", isPositive: true }} index={2} />
            <StatCard label="Compliance Rate" value="97.2%" icon={CheckCircle} trend={{ value: 2, label: "up", isPositive: true }} index={3} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spend Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 border-border/60 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-foreground">Monthly Spending Trend</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Actual</span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Budget</span>
                    </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={spendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                    />
                    <Tooltip 
                        contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '700'
                        }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="budget" stroke="#10b981" strokeWidth={3} strokeDasharray="8 5" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Budget Breakdown Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 border-border/60 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-8">Budget Allocation by Event</h2>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="h-[300px] w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={eventData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {eventData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                    {eventData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                <span className="text-sm font-bold text-foreground/80">{item.name}</span>
                            </div>
                            <span className="text-sm font-black">${(item.value / 1000).toFixed(0)}k</span>
                        </div>
                    ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Metrics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border/40 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Event Performance Summary</h2>
                <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-primary">
                    View Details
                </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Event</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Team Size</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Spend</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Compliance</th>
                    <th className="text-left py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="text-right py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {[
                    { event: 'Q4 Offsite 2025', employees: 10, spend: 25000, compliance: '100%', status: 'Completed' },
                    { event: 'Engineering Summit', employees: 8, spend: 15000, compliance: '95%', status: 'In Progress' },
                    { event: 'Sales Kickoff', employees: 12, spend: 30000, compliance: '92%', status: 'Pending' },
                    { event: 'Design Retreat', employees: 6, spend: 12000, compliance: '100%', status: 'Completed' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-foreground">{row.event}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-muted-foreground">{row.employees} Members</td>
                      <td className="py-4 px-6 text-sm font-black text-foreground">${row.spend.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                            <div className="w-full max-w-[60px] h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: row.compliance }} />
                            </div>
                            <span className="text-xs font-bold text-green-600">{row.compliance}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.status === 'Completed' ? 'bg-green-50 text-green-600' :
                          row.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </AppShell>
  )
}
