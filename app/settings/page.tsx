'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { Save, Bell, Lock, User, Zap } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

const settingsSections = [
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Manage how you receive alerts and updates',
  },
  {
    id: 'security',
    label: 'Security',
    icon: Lock,
    description: 'Update your security settings',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    description: 'Manage your profile information',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Zap,
    description: 'Connect external services',
  },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('notifications')

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your dashboard preferences and account</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {settingsSections.map(section => (
              <TabsTrigger key={section.id} value={section.id} className="gap-2">
                <section.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose how you want to be notified</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id="booking-alerts" defaultChecked />
                    <div className="flex-1">
                      <Label htmlFor="booking-alerts" className="font-medium cursor-pointer">
                        Booking Confirmations
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive alerts when employee bookings are confirmed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id="policy-alerts" defaultChecked />
                    <div className="flex-1">
                      <Label htmlFor="policy-alerts" className="font-medium cursor-pointer">
                        Policy Violations
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Alert me when bookings violate company policies
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id="budget-alerts" defaultChecked />
                    <div className="flex-1">
                      <Label htmlFor="budget-alerts" className="font-medium cursor-pointer">
                        Budget Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Notify when budgets are at 80% or exceeded
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id="email-digest" />
                    <div className="flex-1">
                      <Label htmlFor="email-digest" className="font-medium cursor-pointer">
                        Daily Email Digest
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Receive a daily summary of all travel events
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox id="email-failures" defaultChecked />
                    <div className="flex-1">
                      <Label htmlFor="email-failures" className="font-medium cursor-pointer">
                        Booking Failures
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Critical alerts for failed bookings only
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>
                  <p className="text-sm text-muted-foreground mt-1">Protect your account with strong security</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="password" className="font-medium">Current Password</Label>
                    <Input id="password" type="password" placeholder="••••••••" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="new-password" className="font-medium">New Password</Label>
                    <Input id="new-password" type="password" placeholder="••••••••" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password" className="font-medium">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="••••••••" className="mt-2" />
                  </div>

                  <div className="pt-2 border-t border-border">
                    <h3 className="font-medium text-foreground mb-3">Two-Factor Authentication</h3>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
                  <p className="text-sm text-muted-foreground mt-1">Update your account details</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="font-medium">Full Name</Label>
                    <Input id="name" placeholder="John Doe" defaultValue="John Doe" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="email" className="font-medium">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@company.com" defaultValue="john@company.com" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="title" className="font-medium">Job Title</Label>
                    <Input id="title" placeholder="Travel Manager" defaultValue="Travel Manager" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="department" className="font-medium">Department</Label>
                    <Input id="department" placeholder="Operations" defaultValue="Operations" className="mt-2" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Connected Services</h2>
                  <p className="text-sm text-muted-foreground mt-1">Integrate with external services</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Slack</p>
                      <p className="text-sm text-muted-foreground">Receive alerts in Slack</p>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Microsoft Teams</p>
                      <p className="text-sm text-muted-foreground">Get notifications in Teams</p>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Google Calendar</p>
                      <p className="text-sm text-muted-foreground">Sync travel dates to calendar</p>
                    </div>
                    <Button variant="outline" size="sm">Connect</Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button variant="outline">Cancel</Button>
          <Button className="gap-2 bg-primary hover:bg-blue-600 ml-auto">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
