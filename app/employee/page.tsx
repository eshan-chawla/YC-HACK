'use client'

import { AppShell } from '@/components/layout/AppShell'
import { ChatLayout } from '@/components/Chat/ChatLayout'

export default function EmployeeChatPage() {
  return (
    <AppShell role="employee">
      <div className="h-[calc(100vh-10rem)]">
        <ChatLayout role="employee" />
      </div>
    </AppShell>
  )
}
