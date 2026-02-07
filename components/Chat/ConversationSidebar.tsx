'use client'

import { cn } from '@/lib/utils'
import { Bot, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  name: string
  role: string
  avatar: string
  status: 'online' | 'offline'
  lastMessage?: string
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Miller', role: 'Travel Coordinator', avatar: 'SM', status: 'online', lastMessage: 'The tickets have been issued.' },
  { id: '2', name: 'Michael Chen', role: 'Finance Manager', avatar: 'MC', status: 'offline', lastMessage: 'Please review the budget.' },
  { id: '3', name: 'Elena Rodriguez', role: 'Event Lead', avatar: 'ER', status: 'online', lastMessage: 'SF is going to be great!' },
]

interface ConversationSidebarProps {
  activeId: string
  onSelect: (id: string) => void
  role: 'admin' | 'employee'
}

export function ConversationSidebar({ activeId, onSelect, role }: ConversationSidebarProps) {
  return (
    <div className="w-72 border-r border-border/60 h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border/60 space-y-3">
        <h2 className="text-base font-semibold px-1">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input 
            placeholder="Search..." 
            className="pl-9 bg-muted/40 border-transparent h-8 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        {/* AI Assistant */}
        <div className="mb-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">AI Assistant</p>
          <button
            onClick={() => onSelect('ai')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
              activeId === 'ai' 
                ? "bg-emerald-50 dark:bg-emerald-500/10" 
                : "hover:bg-muted"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              activeId === 'ai' ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            )}>
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn("font-medium text-sm", activeId === 'ai' ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>TripWeaver AI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Travel Assistant
              </p>
            </div>
          </button>
        </div>

        {/* Team */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">Team</p>
          <div className="space-y-0.5">
            {MOCK_USERS.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelect(user.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                  activeId === user.id 
                    ? "bg-muted" 
                    : "hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold",
                    "bg-muted text-muted-foreground"
                  )}>
                    {user.avatar}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                    user.status === 'online' ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground truncate">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">12m</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
