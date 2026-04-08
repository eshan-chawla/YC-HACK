'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TripWeaverLogo } from '@/components/TripWeaverLogo'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useClerk } from '@clerk/nextjs'

interface NavItem {
  href: string
  label: string
  icon: any
}

interface SidebarProps {
  role?: 'admin' | 'employee'
}

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/itineraries', label: 'Itineraries', icon: Calendar },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/reports', label: 'Budgets & Policies', icon: BarChart3 },
  { href: '/admin/chat', label: 'Messages / AI Chat', icon: MessageSquare },
  { href: '/admin/profile', label: 'Profile', icon: User },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
]

const employeeNavItems: NavItem[] = [
  { href: '/employee', label: 'Messages / AI Chat', icon: MessageSquare },
  { href: '/employee/trips', label: 'My Trips', icon: Calendar },
  { href: '/employee/profile', label: 'Profile', icon: User },
]

export function Sidebar({ role = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useCurrentUser()
  const { signOut } = useClerk()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navItems = role === 'admin' ? adminNavItems : employeeNavItems
  const canSwitchRole = user?.role === 'admin'

  const handleSignOut = () => {
    signOut({ redirectUrl: '/' })
  }

  const handleRoleSwitch = (_e: React.MouseEvent) => {
    // Role switch is handled by the Link href
  }

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="relative h-screen bg-background flex flex-col z-50 shrink-0 overflow-hidden py-6"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center shrink-0 mb-8",
        isCollapsed ? "justify-center px-0" : "px-6 justify-between"
      )}>
        {!isCollapsed && (
          <Link href={role === 'admin' ? "/admin" : "/employee"} className="flex items-center gap-3">
            <TripWeaverLogo variant="full" size="sm" />
          </Link>
        )}
        {isCollapsed && (
          <Link href={role === 'admin' ? "/admin" : "/employee"} className="block">
            <TripWeaverLogo variant="icon" size="sm" />
          </Link>
        )}

        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-7 w-7 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-[60px] z-50 flex h-6 w-6 items-center justify-center rounded-full paper-card text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}

      {/* Section label */}
      {!isCollapsed && (
        <div className="px-6 mb-3">
          <span className="text-label">Workspace</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 group btn-press',
                isCollapsed ? 'justify-center' : '',
                isActive
                  ? 'plate-meso text-foreground shadow-layer-1'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                isActive
                  ? "icon-3d-emerald"
                  : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
              )}>
                <Icon className="w-[15px] h-[15px]" />
              </div>
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-3 px-3 py-2 bg-popover border border-border text-popover-foreground text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-layer-2">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "px-3 pt-4 mt-2 border-t border-border/50 space-y-1 shrink-0",
      )}>
        {canSwitchRole && (
          <Link
            href={role === 'admin' ? '/employee' : '/admin'}
            onClick={handleRoleSwitch}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-colors duration-200",
              "text-muted-foreground hover:text-foreground hover:bg-muted/30",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-[15px] h-[15px] text-muted-foreground/40" />
            </div>
            {!isCollapsed && <span>Switch to {role === 'admin' ? 'Employee' : 'Admin'}</span>}
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors duration-200 cursor-pointer",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <LogOut className="w-[15px] h-[15px] text-muted-foreground/40" />
          </div>
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </motion.aside>
  )
}
