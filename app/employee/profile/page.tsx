'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { User, Mail, Briefcase, MapPin, Shield, Bell, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EmployeeProfilePage() {
  const router = useRouter()

  const handleDiscard = () => {
    // Navigate back to employee dashboard
    router.push('/employee')
  }

  return (
    <AppShell role="employee">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader 
          title="My Profile" 
          description="Manage your personal travel preferences and account security"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card className="p-6 border-border/60 text-center">
                    <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/10">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="text-xl font-bold bg-primary/5 text-primary">JD</AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-bold text-foreground">John Doe</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Product Designer</p>
                    
                    <div className="mt-6 pt-6 border-t border-border/40 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium justify-center">
                            <Mail className="w-3.5 h-3.5" />
                            john.doe@acme.com
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium justify-center">
                            <MapPin className="w-3.5 h-3.5" />
                            New York, NY
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-border/60 bg-muted/20">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Stats</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">Total Trips</span>
                            <span className="text-sm font-black text-primary">12</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">Compliance</span>
                            <span className="text-sm font-black text-green-600">100%</span>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="md:col-span-2 space-y-6">
                <Card className="p-6 border-border/60 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Personal Information
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                            <Input defaultValue="John Doe" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                            <Input defaultValue="+1 (555) 000-0000" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Work Address</Label>
                            <Input defaultValue="123 Innovation Drive, NYC Office" className="h-11 rounded-xl" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Travel Preferences
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Preferred Airlines</Label>
                            <Input defaultValue="Delta, United" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Dietary Requirements</Label>
                            <Input placeholder="None specified" className="h-11 rounded-xl" />
                        </div>
                    </div>
                </Card>

                <div className="flex items-center justify-end gap-3 pt-4">
                    <Button 
                      variant="ghost" 
                      onClick={handleDiscard}
                      className="font-bold text-xs uppercase tracking-widest"
                    >
                      Discard
                    </Button>
                    <Button className="gap-2 bg-primary hover:bg-green-600 font-bold text-xs uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-green-500/10">
                        <Save className="w-4 h-4" /> Save Profile
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </AppShell>
  )
}


