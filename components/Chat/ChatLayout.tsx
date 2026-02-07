'use client'

import { useState } from 'react'
import { ChatInterface } from './ChatInterface'
import { ConversationSidebar } from './ConversationSidebar'
import { MessageSquare, Phone, Video, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ChatLayoutProps {
  role: 'admin' | 'employee'
}

const MOCK_USERS = [
  { id: '1', name: 'Sarah Miller', role: 'Travel Coordinator', avatar: 'SM', status: 'online' },
  { id: '2', name: 'Michael Chen', role: 'Finance Manager', avatar: 'MC', status: 'offline' },
  { id: '3', name: 'Elena Rodriguez', role: 'Event Lead', avatar: 'ER', status: 'online' },
]

export function ChatLayout({ role }: ChatLayoutProps) {
  const [activeId, setActiveId] = useState('ai')

  const activeUser = MOCK_USERS.find(u => u.id === activeId)

  return (
    <div className="flex h-full bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
      <ConversationSidebar 
        activeId={activeId} 
        onSelect={setActiveId} 
        role={role} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeId === 'ai' ? (
          <div className="h-full p-4 md:p-6 overflow-y-auto scrollbar-thin">
            <ChatInterface role={role} />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-6 h-14 border-b border-border/60 bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-xs">
                  {activeUser?.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{activeUser?.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      activeUser?.status === 'online' ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                    <span className="text-[11px] text-muted-foreground">
                      {activeUser?.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
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

            {/* Empty state */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Chat with {activeUser?.name}</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start a secure, encrypted conversation about trip logistics.
              </p>
            </div>

            {/* Input */}
            <div className="p-4 bg-card border-t border-border/60">
              <div className="max-w-3xl mx-auto flex items-center gap-3">
                <Input 
                  placeholder={`Message ${activeUser?.name}...`} 
                  className="flex-1 bg-muted/40 border-transparent h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                />
                <Button className="h-10 px-5 text-sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
