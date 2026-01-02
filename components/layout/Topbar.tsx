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
import { Badge } from '@/components/ui/badge'

interface TopbarProps {
  role?: 'admin' | 'employee'
}

export function Topbar({ role = 'admin' }: TopbarProps) {
  const router = useRouter()

  const handleSignOut = () => {
    // Clear mock session
    localStorage.removeItem('tripweaver_session')
    // Redirect to login
    router.push('/')
  }

  const profileHref = role === 'admin' ? '/admin/profile' : '/employee/profile'

  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left: Context / Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={role === 'admin' ? "Search employees, trips, or reports..." : "Search my trips or messages..."} 
            className="pl-10 bg-muted/40 border-none h-9 text-sm focus-visible:ring-primary/20"
          />
        </div>
        {role === 'admin' && (
          <Badge variant="outline" className="hidden lg:flex gap-1.5 py-1 px-2.5 border-primary/20 bg-primary/5 text-primary">
            <Globe className="w-3.5 h-3.5" />
            Global Ops
          </Badge>
        )}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Role Indicator - Demo only */}
        <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-foreground capitalize">{role === 'admin' ? 'Acme Corp Admin' : 'John Doe'}</span>
            <span className="text-[10px] text-muted-foreground leading-none">{role === 'admin' ? 'Management' : 'Product Design'}</span>
        </div>

        <div className="flex items-center">
            <Link href={role === 'admin' ? '/admin/chat' : '/employee'}>
                <Button variant="ghost" size="icon" className="relative mr-1">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    {role === 'employee' && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />
                    )}
                </Button>
            </Link>
            
            <NotificationCenter />
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-1 pr-2 gap-2 h-9 rounded-full hover:bg-muted">
              <Avatar className="w-7 h-7">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">JD</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
                <Avatar className="w-10 h-10">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-none">John Doe</span>
                    <span className="text-xs text-muted-foreground mt-1">john.doe@acme.com</span>
                </div>
            </div>
            <DropdownMenuSeparator />
            <Link href={profileHref}>
              <DropdownMenuItem className="gap-2 cursor-pointer">
                  <User className="w-4 h-4" /> Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
                <LogOut className="w-4 h-4" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}


