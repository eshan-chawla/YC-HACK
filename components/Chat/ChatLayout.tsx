'use client'

import { useState } from 'react'
import { ChatInterface } from './ChatInterface'
import { ConversationSidebar } from './ConversationSidebar'
import { Card } from '@/components/ui/card'
import { MessageSquare, User, Phone, Video, Info, MoreVertical } from 'lucide-react'
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
    <div className="flex h-full bg-background border border-border/60 rounded-3xl overflow-hidden shadow-2xl">
      <ConversationSidebar 
        activeId={activeId} 
        onSelect={setActiveId} 
        role={role} 
      />
      
      <div className="flex-1 flex flex-col bg-muted/5 overflow-hidden">
        {activeId === 'ai' ? (
          <div className="h-full p-4 md:p-8 overflow-y-auto">
            <ChatInterface role={role} />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            {/* User Chat Header */}
            <div className="p-6 border-b border-border bg-background flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {activeUser?.avatar}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{activeUser?.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activeUser?.status === 'online' ? "bg-green-500" : "bg-slate-300"
                    )} />
                    <span className="text-xs text-muted-foreground font-medium">
                      {activeUser?.status === 'online' ? 'Online' : 'Offline'} • {activeUser?.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {/* User Chat Messages (Placeholder) */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Chat with {activeUser?.name}</h2>
              <p className="text-muted-foreground max-w-sm mb-8">
                This direct message channel is secure and encrypted. You can now chat directly with your team members about trip logistics.
              </p>
              <div className="flex flex-col gap-4 w-full max-w-md">
                <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border/60">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Past History</p>
                    <p className="text-sm italic text-muted-foreground">Previous chat logs will appear here once you start the conversation.</p>
                </div>
              </div>
            </div>

            {/* User Chat Input (Placeholder) */}
            <div className="p-6 bg-background border-t border-border">
              <div className="max-w-4xl mx-auto flex items-center gap-4">
                <Input 
                  placeholder={`Message ${activeUser?.name}...`} 
                  className="flex-1 bg-muted/30 border-none h-12 rounded-xl focus-visible:ring-primary/20"
                />
                <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-green-600 text-primary-foreground font-bold">
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


