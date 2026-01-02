'use client'

import { AppShell } from '@/components/layout/AppShell'
import { ChatLayout } from '@/components/Chat/ChatLayout'

export default function AdminChatPage() {
  return (
    <AppShell role="admin">
      <div className="h-[calc(100vh-10rem)]">
        <ChatLayout role="admin" />
      </div>
    </AppShell>
  )
}

