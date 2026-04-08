'use client'

import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import type { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Bot, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'

interface ConversationSidebarProps {
  role: 'admin' | 'employee'
  conversations: Doc<'conversations'>[]
  employees: Doc<'employees'>[]
  activeConversationId: Id<'conversations'> | null
  activeEmployeeId: Id<'employees'> | null
  onSelectConversation: (id: 'new' | Id<'conversations'>) => void
  onSelectEmployee: (id: Id<'employees'>) => void
  onConversationDeleted?: (deletedId: Id<'conversations'>) => void
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
  onConversationDeleted,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<Id<'conversations'> | null>(null)
  const removeConversation = useMutation(api.conversations.remove)

  const handleDelete = async (e: React.MouseEvent, id: Id<'conversations'>) => {
    e.stopPropagation()
    setDeletingId(id)
    try {
      await removeConversation({ id })
      onConversationDeleted?.(id)
      toast.success('Chat deleted')
    } catch {
      toast.error('Failed to delete chat')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = searchQuery
    ? conversations.filter((c) =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations

  return (
    <div className="w-72 border-r border-border/10 h-full flex flex-col shrink-0">
      <div className="p-4 border-b border-border/10 space-y-3">
        <h2 className="text-title px-1">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 paper-inset border-0 h-8 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <div className="mb-1">
          <p className="text-label px-3 py-2">AI Assistant</p>
          <button
            type="button"
            onClick={() => onSelectConversation('new')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
              activeConversationId === null && activeEmployeeId === null
                ? 'paper-card'
                : 'hover:bg-muted/50'
            )}
          >
            <div
              className={cn(
                'w-9 h-9 flex items-center justify-center shrink-0',
                activeConversationId === null && activeEmployeeId === null ? 'paper-inset blob-1' : 'paper-inset blob-3'
              )}
            >
              <Bot className={cn('w-5 h-5', activeConversationId === null && activeEmployeeId === null ? 'text-emerald-700 text-emerald-600' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'font-medium text-sm',
                    activeConversationId === null && activeEmployeeId === null ? 'text-emerald-700 text-emerald-600' : 'text-foreground'
                  )}
                >
                  New chat
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">TripWeaver AI</p>
            </div>
          </button>

          {filtered.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {filtered.map((conv) => (
                <div key={conv._id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conv._id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left pr-10',
                      activeConversationId === conv._id ? 'paper-card' : 'hover:bg-muted/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 flex items-center justify-center shrink-0 text-xs font-semibold',
                        activeConversationId === conv._id ? 'paper-inset blob-1' : 'paper-inset blob-3'
                      )}
                    >
                      <Bot className={cn('w-4 h-4', activeConversationId === conv._id ? 'text-emerald-700 text-emerald-600' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{formatRelativeTime(conv.lastMessageAt)}</p>
                      <p className="text-sm font-medium text-foreground truncate">{conv.title || 'Chat'}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, conv._id)}
                    disabled={deletingId === conv._id}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {role === 'admin' && employees.length > 0 && (
          <div>
            <p className="text-label px-3 py-2 mt-2">Team</p>
            <div className="space-y-0.5">
              {employees.map((emp) => (
                <button
                  type="button"
                  key={emp._id}
                  onClick={() => onSelectEmployee(emp._id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                    activeEmployeeId === emp._id ? 'paper-card' : 'hover:bg-muted/50'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold', activeEmployeeId === emp._id ? 'paper-inset blob-1 text-emerald-700 text-emerald-600' : 'paper-inset blob-3 text-muted-foreground')}>
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
