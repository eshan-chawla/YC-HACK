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
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="relative h-screen border-r border-border bg-background flex flex-col z-50 shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-14 border-b border-border shrink-0",
        isCollapsed ? "justify-center px-0" : "px-5 justify-between"
      )}>
        {!isCollapsed && (
          <Link href={role === 'admin' ? "/admin" : "/employee"} className="block">
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
            className="h-6 w-6 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.04]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-[52px] z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground/60 hover:text-muted-foreground shadow-sm transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-px overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium transition-all duration-150 group',
                isCollapsed ? 'justify-center' : '',
                isActive
                  ? 'text-foreground bg-white/[0.055] before:absolute before:left-0 before:top-[6px] before:bottom-[6px] before:w-[3px] before:rounded-full before:bg-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              )}
            >
              <Icon className={cn(
                "w-[15px] h-[15px] shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
              )} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="pointer-events-none absolute left-full ml-2.5 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "px-2 pb-3 pt-2 border-t border-border space-y-px shrink-0",
      )}>
        {canSwitchRole && (
          <Link
            href={role === 'admin' ? '/employee' : '/admin'}
            onClick={handleRoleSwitch}
            className={cn(
              "flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium transition-colors duration-150",
              "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <Shield className="w-[15px] h-[15px] shrink-0 text-muted-foreground/40" />
            {!isCollapsed && <span>Switch to {role === 'admin' ? 'Employee' : 'Admin'}</span>}
          </Link>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="w-[15px] h-[15px] shrink-0 text-muted-foreground/40" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </motion.aside>
  )
}
