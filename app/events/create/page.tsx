'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { EventWizard } from '@/components/EventWizard'

export default function CreateEventPage() {
  return (
    <DashboardLayout>
      <EventWizard />
    </DashboardLayout>
  )
}
