'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Briefcase, MapPin, Shield, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'

function getInitials(name: string) {
  return name.trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

export default function EmployeeProfilePage() {
  const router = useRouter()
  const { user: profile, isLoading: profileLoading } = useCurrentUser()
  const profileWithEmployee = useQuery(api.userProfiles.getWithEmployee, profile ? {} : 'skip')
  const clerkUser = useUser().user
  const updateProfile = useMutation(api.userProfiles.updateProfile)

  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
  const data = profileWithEmployee ?? profile
  const displayNameFallback = data?.displayName ?? clerkUser?.fullName ?? 'User'
  const imageUrl = data?.avatarUrl ?? clerkUser?.imageUrl ?? undefined
  const initials = getInitials(displayNameFallback)
  const employee = profileWithEmployee && 'employee' in profileWithEmployee ? profileWithEmployee.employee : null

  useEffect(() => {
    if (data === undefined || !data) return
    setDisplayName(data.displayName ?? '')
    setPhoneNumber(data.phoneNumber ?? '')
  }, [data])

  const handleDiscard = () => {
    router.push('/employee')
  }

  const handleSave = useCallback(async () => {
    setError(null)
    setSaving(true)
    try {
      await updateProfile({
        displayName: displayName || undefined,
        phoneNumber: phoneNumber || undefined,
      })
      router.push('/employee')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [updateProfile, displayName, phoneNumber, router])

  if (profileLoading || (profile === undefined && clerkUser)) {
    return (
      <AppShell role="employee">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader title="My Profile" description="Manage your personal travel preferences and account security" />
          <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </AppShell>
    )
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
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-emerald-500/10">
                <AvatarImage src={imageUrl} alt={displayNameFallback} />
                <AvatarFallback className="text-xl font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold text-foreground">{displayNameFallback}</h3>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                {employee ? employee.role : 'Employee'}
              </p>

              <div className="mt-6 pt-6 border-t border-border/60 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium justify-center">
                  <Mail className="w-3.5 h-3.5" />
                  {email || 'No email'}
                </div>
                {(employee?.location ?? employee?.team) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                    {[employee?.team, employee?.location].filter(Boolean).join(' • ')}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 border-border/60 bg-muted/20">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Team</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{employee?.team ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Department</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{employee?.department ?? '—'}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border/60 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2 tracking-wider">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={displayNameFallback}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Email</Label>
                  <Input value={email} readOnly disabled className="h-11 rounded-xl bg-muted/50" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/60 shadow-sm">
              <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2 tracking-wider">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Travel Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Travel policies and preferences are set by your administrator. Contact your admin or use the AI assistant for trip changes.
              </p>
            </Card>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleDiscard}
                className="font-bold text-xs uppercase tracking-widest"
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/10"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
