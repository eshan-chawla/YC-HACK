'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ChatLayout } from '@/components/Chat/ChatLayout'
import type { Id } from '@/convex/_generated/dataModel'

function EmployeeChatContent() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversationId') as Id<'conversations'> | null

  return (
    <AppShell role="employee">
      <div className="h-[calc(100vh-10rem)]">
        <ChatLayout role="employee" initialConversationId={conversationId ?? undefined} />
      </div>
    </AppShell>
  )
}

export default function EmployeeChatPage() {
  return (
    <Suspense fallback={<AppShell role="employee"><div className="h-[calc(100vh-10rem)]" /></AppShell>}>
      <EmployeeChatContent />
    </Suspense>
  )
}
