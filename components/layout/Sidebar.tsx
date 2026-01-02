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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navItems = role === 'admin' ? adminNavItems : employeeNavItems

  const handleSignOut = () => {
    // Clear mock session
    localStorage.removeItem('tripweaver_session')
    // Redirect to login
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
      animate={{ width: isCollapsed ? 80 : 260 }}
      className={cn(
        "relative h-screen border-r border-border bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-50",
      )}
    >
      {/* Logo */}
      <div className={cn(
        "p-6 flex items-center h-16 border-b border-sidebar-border",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <Link href={role === 'admin' ? "/admin" : "/employee"} className="block">
            <TripWeaverLogo variant="full" size="md" />
          </Link>
        )}
        {isCollapsed && (
          <Link href={role === 'admin' ? "/admin" : "/employee"} className="block">
            <TripWeaverLogo variant="icon" size="md" />
          </Link>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-4 top-20 bg-background border border-border rounded-full w-8 h-8 shadow-sm hover:bg-muted z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all group relative',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0 transition-colors",
                isActive ? "text-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
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
                 <div className="absolute left-14 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                 </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link 
            href={role === 'admin' ? '/employee' : '/admin'}
            onClick={handleRoleSwitch}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors",
                role === 'admin' ? "text-amber-600 hover:bg-amber-50" : "text-primary hover:bg-primary/5"
            )}
        >
            <Shield className="w-4 h-4" />
            {!isCollapsed && <span>Switch to {role === 'admin' ? 'Employee' : 'Admin'}</span>}
        </Link>

        <div 
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sidebar-foreground/60 text-sm hover:text-foreground cursor-pointer transition-colors",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </div>
        {!isCollapsed && (
          <p className="mt-4 px-3 text-[10px] uppercase tracking-widest font-bold text-sidebar-foreground/30 text-center">
            TripWeaver v1.0
          </p>
        )}
      </div>
    </motion.aside>
  )
}

