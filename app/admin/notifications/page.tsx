'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertTriangle, Info, AlertCircle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const iconConfig = {
  success: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  error: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60 * 1000) return 'Just now'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} mins ago`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} hours ago`
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / (24 * 3600000))} days ago`
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminNotificationsPage() {
  const notifications = useQuery(api.notifications.listForUser, { limit: 100 }) ?? []
  const markRead = useMutation(api.notifications.markRead)
  const markAllRead = useMutation(api.notifications.markAllRead)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <AppShell role="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Notifications"
          description="All your alerts and updates"
          actions={
            unreadCount > 0 ? (
              <Button variant="outline" size="sm" onClick={() => markAllRead({})}>
                Mark all read
              </Button>
            ) : null
          }
        />

        {notifications.length === 0 ? (
          <Card className="p-12 border-border/60 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No notifications yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const config = iconConfig[n.type]
              const Icon = config.icon
              return (
                <Card
                  key={n._id}
                  className={cn(
                    'p-4 border-border/60 cursor-pointer transition-colors hover:bg-muted/30',
                    !n.read && 'bg-primary/2'
                  )}
                  onClick={() => !n.read && markRead({ id: n._id })}
                >
                  <div className="flex gap-3">
                    <div className={cn('p-2 rounded-lg shrink-0', config.bg)}>
                      <Icon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', n.read ? 'text-foreground/70' : 'text-foreground')}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                        {formatRelativeTime(n.timestamp)}
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
