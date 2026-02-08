'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ChatInterface } from './ChatInterface'
import { ConversationSidebar } from './ConversationSidebar'
import { MessageSquare, Phone, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ChatLayoutProps {
  role: 'admin' | 'employee'
  /** When set (e.g. from URL ?conversationId=), open this conversation on mount. */
  initialConversationId?: Id<'conversations'>
}

export function ChatLayout({ role, initialConversationId }: ChatLayoutProps) {
  const conversations = useQuery(api.conversations.list, { limit: 50 }) ?? []
  const employees = useQuery(api.employees.list, role === 'admin' ? { status: 'active' } : 'skip') ?? []

  const [activeView, setActiveView] = useState<'ai' | 'employee'>('ai')
  const [activeConversationId, setActiveConversationId] = useState<Id<'conversations'> | null>(null)
  const [activeEmployeeId, setActiveEmployeeId] = useState<Id<'employees'> | null>(null)

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
      setActiveView('ai')
      setActiveEmployeeId(null)
    }
  }, [initialConversationId])

  const activeEmployee = activeEmployeeId ? employees.find((e) => e._id === activeEmployeeId) : null

  const handleSelectConversation = (id: 'new' | Id<'conversations'>) => {
    setActiveView('ai')
    setActiveConversationId(id === 'new' ? null : id)
    setActiveEmployeeId(null)
  }

  const handleSelectEmployee = (id: Id<'employees'>) => {
    setActiveView('employee')
    setActiveEmployeeId(id)
    setActiveConversationId(null)
  }

  return (
    <div className="flex h-full bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <ConversationSidebar
        role={role}
        conversations={conversations}
        employees={employees}
        activeConversationId={activeConversationId}
        activeEmployeeId={activeEmployeeId}
        onSelectConversation={handleSelectConversation}
        onSelectEmployee={handleSelectEmployee}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {activeView === 'ai' ? (
          <div className="h-full p-4 md:p-6 overflow-y-auto flex flex-col">
            <ChatInterface
              role={role}
              conversationId={activeConversationId}
              onConversationCreated={(id) => {
                setActiveConversationId(id)
                setActiveView('ai')
              }}
            />
          </div>
        ) : (
          <>
            <div className="px-6 h-14 border-b border-border/60 bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xs">
                  {activeEmployee ? activeEmployee.name.slice(0, 2).toUpperCase() : '—'}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{activeEmployee?.name ?? 'Employee'}</h3>
                  <p className="text-[11px] text-muted-foreground">{activeEmployee?.team ?? ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Chat with {activeEmployee?.name ?? 'team member'}</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Direct messages with team members are not yet available. Use the AI assistant for travel questions.
              </p>
            </div>

            <div className="p-4 bg-card border-t border-border/60 shrink-0">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <Input placeholder={`Message ${activeEmployee?.name ?? '...'} (coming soon)`} className="flex-1 bg-muted/40 border-transparent h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/20" disabled />
                <Button className="h-10 px-5 text-sm" disabled>Send</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
