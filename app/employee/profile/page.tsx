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
            <div className="p-6 rounded-2xl paper-card text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-emerald-500/20 shadow-[var(--shadow-emerald-glow)]">
                <AvatarImage src={imageUrl} alt={displayNameFallback} />
                <AvatarFallback className="text-xl font-bold bg-emerald-50 text-emerald-600">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-serif text-lg text-foreground">{displayNameFallback}</h3>
              <p className="text-label mt-1">
                {employee ? employee.role : 'Employee'}
              </p>

              <div className="mt-6 pt-6 border-t border-border/10 space-y-3">
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
            </div>

            <div className="p-4 rounded-2xl paper-inset">
              <h4 className="text-label mb-4">Quick Stats</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Team</span>
                  <span className="text-sm font-serif text-emerald-600">{employee?.team ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Department</span>
                  <span className="text-sm font-serif text-emerald-600">{employee?.department ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl paper-card">
              <h3 className="font-serif text-base text-foreground mb-6 flex items-center gap-3">
                <div className="w-8 h-8 paper-inset blob-1 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-600" />
                </div>
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-label">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={displayNameFallback}
                    className="h-11 rounded-xl paper-inset border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-label">Contact Email</Label>
                  <Input value={email} readOnly disabled className="h-11 rounded-xl paper-inset border-0 opacity-60" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label className="text-label">Phone Number</Label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-11 rounded-xl paper-inset border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl paper-card">
              <h3 className="font-serif text-base text-foreground mb-6 flex items-center gap-3">
                <div className="w-8 h-8 paper-inset blob-3 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                Travel Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Travel policies and preferences are set by your administrator. Contact your admin or use the AI assistant for trip changes.
              </p>
            </div>

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
                className="gap-2 btn-emerald-solid blob-2 font-bold text-xs uppercase tracking-widest h-11 px-8 btn-press"
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
