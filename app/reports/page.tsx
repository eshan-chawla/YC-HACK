'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Download, TrendingUp, DollarSign, Users, CheckCircle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const spendData = [
  { month: 'Aug', spend: 12000, budget: 15000 },
  { month: 'Sep', spend: 18000, budget: 20000 },
  { month: 'Oct', spend: 15500, budget: 18000 },
  { month: 'Nov', spend: 22000, budget: 25000 },
]

const eventData = [
  { name: 'Q4 Offsite', value: 25000, fill: '#0060FF' },
  { name: 'Engineering Summit', value: 15000, fill: '#10B981' },
  { name: 'Sales Kickoff', value: 30000, fill: '#F59E0B' },
  { name: 'Other Events', value: 18000, fill: '#8B5CF6' },
]

const reportMetrics = [
  {
    label: 'Total Events',
    value: '24',
    change: '+8%',
    icon: TrendingUp,
    color: 'bg-blue-500',
  },
  {
    label: 'Total Spend',
    value: '$67.5K',
    change: '+12%',
    icon: DollarSign,
    color: 'bg-green-500',
  },
  {
    label: 'Employees Booked',
    value: '256',
    change: '+15%',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    label: 'Compliance Rate',
    value: '97%',
    change: '+2%',
    icon: CheckCircle,
    color: 'bg-amber-500',
  },
]

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">View analytics and travel insights</p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-blue-600">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportMetrics.map((metric, idx) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{metric.value}</p>
                      <p className="text-xs text-green-600 mt-2">{metric.change} vs last month</p>
                    </div>
                    <div className={`${metric.color} p-3 rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spend Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Monthly Spend Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={spendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#0060FF" strokeWidth={2} />
                  <Line type="monotone" dataKey="budget" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Budget Breakdown Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Budget Allocation by Event</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}k`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${(value / 1000).toFixed(1)}k`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Metrics Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Event Performance Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Event</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Employees</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Total Spend</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Compliance</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Avg Cost/Person</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { event: 'Q4 Offsite', employees: 10, spend: 25000, compliance: '100%', avg: 2500, status: 'Completed' },
                    { event: 'Engineering Summit', employees: 8, spend: 15000, compliance: '95%', avg: 1875, status: 'In Progress' },
                    { event: 'Sales Kickoff', employees: 12, spend: 30000, compliance: '92%', avg: 2500, status: 'Pending' },
                    { event: 'Design Retreat', employees: 6, spend: 12000, compliance: '100%', avg: 2000, status: 'Completed' },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 font-medium">{row.event}</td>
                      <td className="py-3 px-4">{row.employees}</td>
                      <td className="py-3 px-4">${row.spend.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="text-green-600 font-medium">{row.compliance}</span>
                      </td>
                      <td className="py-3 px-4">${row.avg.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          row.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}
