'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ChatLayout } from '@/components/Chat/ChatLayout'
import type { Id } from '@/convex/_generated/dataModel'

function AdminChatContent() {
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('conversationId') as Id<'conversations'> | null

  return (
    <AppShell role="admin">
      <div className="h-[calc(100vh-10rem)]">
        <ChatLayout role="admin" initialConversationId={conversationId ?? undefined} />
      </div>
    </AppShell>
  )
}

export default function AdminChatPage() {
  return (
    <Suspense fallback={<AppShell role="admin"><div className="h-[calc(100vh-10rem)]" /></AppShell>}>
      <AdminChatContent />
    </Suspense>
  )
}

