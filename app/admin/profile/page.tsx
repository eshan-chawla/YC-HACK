'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Briefcase, MapPin, Shield, Save, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'

function getInitials(name: string) {
  return name.trim().split(/\s+/).map((s) => s[0]).join('').toUpperCase().slice(0, 2) || 'U'
}

export default function AdminProfilePage() {
  const router = useRouter()
  const { user: profile, isLoading: profileLoading } = useCurrentUser()
  const clerkUser = useUser().user
  const updateProfile = useMutation(api.userProfiles.updateProfile)

  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
  const imageUrl = profile?.avatarUrl ?? clerkUser?.imageUrl ?? undefined
  const displayNameFallback = profile?.displayName ?? clerkUser?.fullName ?? 'User'
  const initials = getInitials(displayNameFallback)

  useEffect(() => {
    if (profile === undefined || !profile) return
    setDisplayName(profile.displayName ?? '')
    setPhoneNumber(profile.phoneNumber ?? '')
    setCompanyName(profile.companyName ?? '')
    setJobTitle(profile.jobTitle ?? '')
  }, [profile])

  const handleDiscard = () => {
    router.push('/admin')
  }

  const handleSave = useCallback(async () => {
    setError(null)
    setSaving(true)
    try {
      await updateProfile({
        displayName: displayName || undefined,
        phoneNumber: phoneNumber || undefined,
        companyName: companyName || undefined,
        jobTitle: jobTitle || undefined,
      })
      router.push('/admin')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [updateProfile, displayName, phoneNumber, companyName, jobTitle, router])

  if (profileLoading || (profile === undefined && clerkUser)) {
    return (
      <AppShell role="admin">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader title="My Profile" description="Manage your personal information and account security" />
          <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        </div>
      </AppShell>
    )
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
            <Card className="p-6 border-border/60 text-center relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600" />
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-emerald-500/10">
                <AvatarImage src={imageUrl} alt={displayNameFallback} />
                <AvatarFallback className="text-xl font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-semibold text-foreground">{displayNameFallback}</h3>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                Management
                  </p>

              <div className="mt-6 pt-6 border-t border-border/40 space-y-3 text-left">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {email || 'No email'}
                </div>
                {companyName && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {companyName}
                  </div>
                )}
                {jobTitle && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {jobTitle}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 border-border/60 bg-slate-900 text-white shadow-xl">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-400" />
                Access Level
              </h4>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-sm font-semibold text-white">Full Administrator</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    You have global access to manage itineraries, company policies, and employee records.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={displayNameFallback}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Contact Email</Label>
                  <Input value={email} readOnly disabled className="h-11 rounded-xl bg-muted/50" />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Company</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Job Title</Label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Global Operations"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Security Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Password and account security are managed through your sign-in provider. Sign out and use “Forgot password” if needed.
              </p>
            </Card>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleDiscard}
                className="font-semibold text-xs uppercase tracking-wider"
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-wider h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/10"
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
