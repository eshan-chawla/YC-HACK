'use client'

import { cn } from '@/lib/utils'
import { Bot, MessageSquare, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

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
    <div className="w-80 border-r border-border h-full flex flex-col bg-background/50 backdrop-blur-sm">
      <div className="p-4 border-b border-border space-y-4">
        <h2 className="text-xl font-bold px-2">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 bg-muted/50 border-none h-9 text-sm focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {/* AI Agent Selection */}
        <div className="px-2 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-2">AI Assistants</p>
            <button
            onClick={() => onSelect('ai')}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                activeId === 'ai' 
                ? "bg-primary text-primary-foreground shadow-lg shadow-green-500/10" 
                : "hover:bg-muted text-foreground"
            )}
            >
            <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                activeId === 'ai' ? "bg-white/20" : "bg-primary/10 text-primary"
            )}>
                <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                <span className="font-bold text-sm">TripWeaver AI</span>
                <span className={cn("text-[10px] uppercase font-black", activeId === 'ai' ? "text-white/60" : "text-primary")}>Active</span>
                </div>
                <p className={cn("text-xs truncate", activeId === 'ai' ? "text-white/80" : "text-muted-foreground")}>
                Personal Travel Assistant
                </p>
            </div>
            </button>
        </div>

        {/* User List */}
        <div className="px-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest my-4 mb-2 px-2">Team Members</p>
            <div className="space-y-1">
                {MOCK_USERS.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onSelect(user.id)}
                    className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                    activeId === user.id 
                        ? "bg-slate-900 text-white shadow-lg" 
                        : "hover:bg-muted text-foreground"
                    )}
                >
                    <div className="relative">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs border-2",
                        activeId === user.id ? "bg-white/10 border-white/20" : "bg-muted border-transparent"
                    )}>
                        {user.avatar}
                    </div>
                    <div className={cn(
                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                        user.status === 'online' ? "bg-green-500" : "bg-slate-300"
                    )} />
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-sm truncate">{user.name}</span>
                        {activeId !== user.id && <span className="text-[10px] text-muted-foreground">12m</span>}
                    </div>
                    <p className={cn("text-xs truncate font-medium", activeId === user.id ? "text-white/60" : "text-muted-foreground")}>
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

