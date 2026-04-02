'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const { user } = useCurrentUser()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navItems = role === 'admin' ? adminNavItems : employeeNavItems
  const canSwitchRole = user?.role === 'admin'

  const handleSignOut = () => {
    localStorage.removeItem('tripweaver_session')
    router.push('/')
  }

  const handleRoleSwitch = (e: React.MouseEvent) => {
    const session = localStorage.getItem('tripweaver_session')
    if (session) {
      const parsed = JSON.parse(session)
      parsed.role = role === 'admin' ? 'employee' : 'admin'
      localStorage.setItem('tripweaver_session', JSON.stringify(parsed))
    }
  }

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 72 : 256 }}
      className={cn(
        "relative h-screen border-r border-border/60 bg-card text-card-foreground flex flex-col z-50",
      )}
    >
      {/* Logo */}
      <div className={cn(
        "px-5 flex items-center h-16 border-b border-border/60",
        isCollapsed ? "justify-center" : "justify-between"
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
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-[72px] bg-card border border-border/60 rounded-full w-7 h-7 shadow-sm hover:bg-muted z-50"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative border-l-2',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 pl-[10px]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent'
              )}
            >
              <Icon className={cn(
                "w-[18px] h-[18px] shrink-0",
                isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/70 group-hover:text-foreground"
              )} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-popover border border-border text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-2 border-t border-border/60 space-y-0.5">
        {canSwitchRole && (
          <Link 
            href={role === 'admin' ? '/employee' : '/admin'}
            onClick={handleRoleSwitch}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="w-[18px] h-[18px]" />
            {!isCollapsed && <span>Switch to {role === 'admin' ? 'Employee' : 'Admin'}</span>}
          </Link>
        )}

        <div 
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span className="font-medium">Sign out</span>}
        </div>
      </div>
    </motion.aside>
  )
}
