'use client'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import { User, Mail, Briefcase, MapPin, Shield, Bell, Save, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminProfilePage() {
  const router = useRouter()

  const handleDiscard = () => {
    // Navigate back to admin dashboard
    router.push('/admin')
  }

  return (
    <AppShell role="admin">
      <div className="max-w-4xl mx-auto space-y-8">
        <PageHeader 
          title="My Profile" 
          description="Manage your personal information and account security"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card className="p-6 border-border/60 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                    <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-primary/10">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="text-xl font-bold bg-primary/5 text-primary">AA</AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-bold text-foreground">Acme Corp Admin</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Management</p>
                    
                    <div className="mt-6 pt-6 border-t border-border/40 space-y-3 text-left">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Mail className="w-3.5 h-3.5 text-primary" />
                            admin@acme.com
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Briefcase className="w-3.5 h-3.5 text-primary" />
                            Global Operations
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            HQ • San Francisco
                        </div>
                    </div>
                </Card>

                <Card className="p-4 border-border/60 bg-slate-900 text-white shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-green-400" />
                        Access Level
                    </h4>
                    <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm font-bold text-white">Full Administrator</p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                                You have global access to manage itineraries, company policies, and employee records.
                            </p>
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
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Display Name</Label>
                            <Input defaultValue="Acme Corp Admin" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Email</Label>
                            <Input defaultValue="admin@acme.com" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                            <Input defaultValue="+1 (415) 555-0123" className="h-11 rounded-xl" />
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-border/60 shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-6 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-primary" />
                        Security Settings
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Password</Label>
                            <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Password</Label>
                                <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</Label>
                                <Input type="password" placeholder="••••••••" className="h-11 rounded-xl" />
                            </div>
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

