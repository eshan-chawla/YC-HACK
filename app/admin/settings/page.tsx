'use client'

import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { Save, Bell, Lock, User, Zap, Shield, Mail, Globe, Megaphone, Bot, Activity } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/layout/EmptyState'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const settingsSections = [
  { id: 'notifications', label: 'Alerts', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'profile', label: 'Company', icon: User },
  { id: 'integrations', label: 'Apps', icon: Zap },
]

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('notifications')
  const createAnnouncement = useMutation(api.notifications.createAnnouncement)
  const agentUsage = useQuery(api.rateLimits.getAgentUsageStats)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceMessage, setAnnounceMessage] = useState('')
  const [announceTarget, setAnnounceTarget] = useState<'all' | 'admin' | 'employee'>('all')
  const [announceSending, setAnnounceSending] = useState(false)

  const handleSendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceMessage.trim()) return
    setAnnounceSending(true)
    try {
      await createAnnouncement({ title: announceTitle.trim(), message: announceMessage.trim(), targetRole: announceTarget })
      setAnnounceTitle('')
      setAnnounceMessage('')
    } finally {
      setAnnounceSending(false)
    }
  }

  const handleDiscard = () => {
    // Navigate back to admin dashboard
    router.push('/admin')
  }

  return (
    <AppShell role="admin">
      <div className="space-y-8 max-w-4xl">
        <PageHeader 
          title="System Settings" 
          description="Manage global configuration, security protocols, and integration endpoints"
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-muted/40 p-1 rounded-xl h-11 inline-flex w-auto">
            {settingsSections.map(section => (
              <TabsTrigger key={section.id} value={section.id} className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-6 font-semibold text-xs uppercase tracking-wider">
                <section.icon className="w-3.5 h-3.5" />
                {section.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid gap-6">
                <Card className="p-6 border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Bell className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Event Notifications</h3>
                    </div>
                    <div className="space-y-4">
                        <NotificationItem 
                            title="Booking Confirmations" 
                            description="Alerts when flights or hotels are successfully booked"
                            defaultChecked
                        />
                        <NotificationItem 
                            title="Policy Violations" 
                            description="Immediate notification if a booking exceeds budget or limits"
                            defaultChecked
                        />
                        <NotificationItem 
                            title="Budget Thresholds" 
                            description="Notify when an event reaches 80% of its total budget"
                            defaultChecked
                        />
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">System Digests</h3>
                    </div>
                    <div className="space-y-4">
                        <NotificationItem 
                            title="Daily Summary" 
                            description="Consolidated report of all activities across active events"
                        />
                        <NotificationItem 
                            title="Critical Failures" 
                            description="Real-time alerts for booking errors or system downtime"
                            defaultChecked
                        />
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <Megaphone className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-semibold text-foreground">Send announcement</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Notify admins, employees, or everyone about travel updates or company news.</p>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</Label>
                            <Input
                                value={announceTitle}
                                onChange={(e) => setAnnounceTitle(e.target.value)}
                                placeholder="e.g. Q4 travel policy update"
                                className="h-11 rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</Label>
                            <Textarea
                                value={announceMessage}
                                onChange={(e) => setAnnounceMessage(e.target.value)}
                                placeholder="Write your announcement..."
                                className="min-h-[100px] rounded-xl"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Send to</Label>
                            <Select value={announceTarget} onValueChange={(v: 'all' | 'admin' | 'employee') => setAnnounceTarget(v)}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All users</SelectItem>
                                    <SelectItem value="admin">Admins only</SelectItem>
                                    <SelectItem value="employee">Employees only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleSendAnnouncement}
                            disabled={!announceTitle.trim() || !announceMessage.trim() || announceSending}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider h-11 px-6 rounded-xl"
                        >
                            <Megaphone className="w-4 h-4" /> {announceSending ? 'Sending…' : 'Send announcement'}
                        </Button>
                    </div>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 border-border/60 shadow-sm space-y-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Shield className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Authentication & Security</h3>
                </div>

                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Password</Label>
                        <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New Password</Label>
                            <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
                            <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border/40">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border/60 shadow-sm">
                                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Two-Factor Authentication</p>
                                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                            </div>
                        </div>
                        <Button variant="outline" className="font-semibold text-[10px] uppercase tracking-widest h-9 px-4 rounded-lg">Enable 2FA</Button>
                    </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Profile/Company Tab */}
          <TabsContent value="profile" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6 border-border/60 shadow-sm space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <Globe className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Company Profile</h3>
                </div>

                <div className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Organization Name</Label>
                            <Input defaultValue="Acme Corporation" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Primary Domain</Label>
                            <Input defaultValue="acme.com" className="h-11 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Billing Contact Email</Label>
                        <Input defaultValue="billing@acme.com" className="h-11 rounded-xl" />
                    </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="grid gap-6">
                <Card className="p-6 border-border/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">AI Agent Usage</h3>
                  </div>
                  {agentUsage ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Calls Today', value: String(agentUsage.totalCallsToday) },
                        { label: 'Active Users', value: String(agentUsage.activeUsers) },
                        { label: 'Daily Limit / User', value: String(agentUsage.dailyLimitPerUser) },
                        { label: 'Rate Limit / Min', value: String(agentUsage.perMinuteLimit) },
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 bg-muted/20 rounded-xl text-center">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading usage data...</p>
                  )}
                </Card>
                <Card className="p-6 border-border/60 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Flight Data Providers</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'Kiwi MCP', status: 'Active', desc: 'Primary flight search' },
                      { name: 'Amadeus API', status: process.env.NEXT_PUBLIC_AMADEUS_CONFIGURED === 'true' ? 'Active' : 'Standby', desc: 'Backup flight search' },
                      { name: 'Mock Fallback', status: 'Always On', desc: 'Last-resort demo data' },
                    ].map((p) => (
                      <div key={p.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-8 border-t border-border/40">
            <p className="text-xs text-muted-foreground font-medium italic">Changes are saved automatically to your session.</p>
            <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  onClick={handleDiscard}
                  className="font-semibold text-xs uppercase tracking-wider"
                >
                  Discard
                </Button>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/10">
                    <Save className="w-4 h-4" /> Save Changes
                </Button>
            </div>
        </div>
      </div>
    </AppShell>
  )
}


function NotificationItem({ title, description, defaultChecked = false }: { title: string, description: string, defaultChecked?: boolean }) {
    return (
        <div className="flex items-start justify-between p-4 rounded-xl border border-border/40 hover:bg-muted/30 transition-colors">
            <div className="flex-1 pr-4">
                <Label className="text-sm font-semibold text-foreground cursor-pointer mb-1 block">{title}</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <Checkbox defaultChecked={defaultChecked} className="h-5 w-5 rounded-md" />
        </div>
    )
}
