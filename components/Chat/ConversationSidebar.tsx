'use client'

import type { Doc } from '@/convex/_generated/dataModel'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Bot, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ConversationSidebarProps {
  role: 'admin' | 'employee'
  conversations: Doc<'conversations'>[]
  employees: Doc<'employees'>[]
  activeConversationId: Id<'conversations'> | null
  activeEmployeeId: Id<'employees'> | null
  onSelectConversation: (id: 'new' | Id<'conversations'>) => void
  onSelectEmployee: (id: Id<'employees'>) => void
}

function formatRelativeTime(ts: number) {
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - ts
  if (diff < 60 * 1000) return 'Just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function ConversationSidebar({
  role,
  conversations,
  employees,
  activeConversationId,
  activeEmployeeId,
  onSelectConversation,
  onSelectEmployee,
}: ConversationSidebarProps) {
  return (
    <div className="w-72 border-r border-border/60 h-full flex flex-col bg-card shrink-0">
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
        <div className="mb-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">AI Assistant</p>
          <button
            type="button"
            onClick={() => onSelectConversation('new')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
              activeConversationId === null && activeEmployeeId === null
                ? 'bg-emerald-50 dark:bg-emerald-500/10'
                : 'hover:bg-muted'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                activeConversationId === null && activeEmployeeId === null ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              )}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'font-medium text-sm',
                    activeConversationId === null && activeEmployeeId === null ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
                  )}
                >
                  New chat
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">TripWeaver AI</p>
            </div>
          </button>

          {conversations.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {conversations.map((conv) => (
                <button
                  type="button"
                  key={conv._id}
                  onClick={() => onSelectConversation(conv._id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                    activeConversationId === conv._id ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold',
                      activeConversationId === conv._id ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{formatRelativeTime(conv.lastMessageAt)}</p>
                    <p className="text-sm font-medium text-foreground truncate">{conv.title || 'Chat'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {role === 'admin' && employees.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-3 py-2 mt-2">Team</p>
            <div className="space-y-0.5">
              {employees.map((emp) => (
                <button
                  type="button"
                  key={emp._id}
                  onClick={() => onSelectEmployee(emp._id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                    activeEmployeeId === emp._id ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold bg-muted text-muted-foreground">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm text-foreground truncate block">{emp.name}</span>
                    <p className="text-xs text-muted-foreground truncate">{emp.team}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
