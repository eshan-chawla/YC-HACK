'use client'

import { Bell, Search, User, Globe, ChevronDown, MessageSquare, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationCenter } from '@/components/NotificationCenter'

interface TopbarProps {
  role?: 'admin' | 'employee'
}

export function Topbar({ role = 'admin' }: TopbarProps) {
  const router = useRouter()

  const handleSignOut = () => {
    localStorage.removeItem('tripweaver_session')
    router.push('/')
  }

  const profileHref = role === 'admin' ? '/admin/profile' : '/employee/profile'

  return (
    <header className="h-14 border-b border-border/60 bg-card sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left: Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input 
            placeholder={role === 'admin' ? "Search employees, trips..." : "Search trips..."} 
            className="pl-9 bg-muted/40 border-transparent h-9 text-sm focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary/20"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <Link href={role === 'admin' ? '/admin/chat' : '/employee'}>
          <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
            <MessageSquare className="w-4 h-4" />
            {role === 'employee' && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            )}
          </Button>
        </Link>
        
        <NotificationCenter />

        <div className="h-5 w-px bg-border/60 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-1.5 pr-2 gap-2 h-8 rounded-full hover:bg-muted">
              <Avatar className="w-6 h-6">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 text-[10px] font-semibold">JD</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium text-foreground">
                {role === 'admin' ? 'Admin' : 'John'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="flex items-center gap-2.5 p-2.5">
              <Avatar className="w-9 h-9">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-none">John Doe</span>
                <span className="text-xs text-muted-foreground mt-1">john@acme.com</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <Link href={profileHref}>
              <DropdownMenuItem className="gap-2 cursor-pointer text-sm">
                <User className="w-4 h-4" /> Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="gap-2 cursor-pointer text-sm text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
