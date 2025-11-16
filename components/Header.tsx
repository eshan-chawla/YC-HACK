'use client'

import { Bell, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationCenter } from './NotificationCenter'
import { TripWeaverLogo } from './TripWeaverLogo'
import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="hidden md:block">
            <TripWeaverLogo variant="text" size="md" />
          </Link>
          <div className="h-6 w-px bg-border hidden md:block" />
          <h2 className="text-lg font-semibold text-foreground">Travel Event Management</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <NotificationCenter />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
