'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, User, ChevronDown, MessageSquare, LogOut, Users, Calendar, MessageCircle, Plane, Sparkles } from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
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
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationCenter } from '@/components/NotificationCenter'

const SEARCH_DEBOUNCE_MS = 200
const MAX_RESULTS_PER_GROUP = 5

const PAGE_SHORTCUTS: {
  keywords: string[]
  label: string
  href: string
  roles: ('admin' | 'employee')[]
  icon: 'Users' | 'Calendar' | 'Plane' | 'MessageCircle'
}[] = [
  { keywords: ['employee', 'employees', 'team', 'staff', 'people'], label: 'Go to Employees', href: '/admin/employees', roles: ['admin'], icon: 'Users' },
  { keywords: ['event', 'events', 'itinerar', 'itineraries', 'booking', 'bookings'], label: 'Go to Itineraries', href: '/admin/itineraries', roles: ['admin'], icon: 'Calendar' },
  { keywords: ['trip', 'trips', 'my trip', 'my trips'], label: 'Go to My trips', href: '/employee/trips', roles: ['employee'], icon: 'Plane' },
  { keywords: ['trip', 'trips'], label: 'Go to Itineraries', href: '/admin/itineraries', roles: ['admin'], icon: 'Plane' },
  { keywords: ['chat', 'chats', 'message', 'messages', 'ai', 'assistant'], label: 'Go to Chat', href: '/admin/chat', roles: ['admin'], icon: 'MessageCircle' },
  { keywords: ['chat', 'chats', 'message', 'messages'], label: 'Go to Chat', href: '/employee', roles: ['employee'], icon: 'MessageCircle' },
]

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'
}

interface TopbarProps {
  role?: 'admin' | 'employee'
}

export function Topbar({ role = 'admin' }: TopbarProps) {
  const router = useRouter()
  const { user: profile } = useCurrentUser()
  const clerkUser = useUser().user
  const { signOut } = useClerk()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleSignOut = () => {
    signOut({ redirectUrl: '/' })
  }

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const rawEmployees = useQuery(
    api.employees.list,
    role === 'admin' ? {} : 'skip'
  ) ?? []
  const rawEvents = useQuery(api.events.list, {}) ?? []
  const conversations = useQuery(
    api.conversations.search,
    debouncedQuery.length >= 2 ? { query: debouncedQuery, limit: MAX_RESULTS_PER_GROUP } : 'skip'
  ) ?? []
  const tripsWithEvents = useQuery(
    api.trips.listMineWithEvents,
    role === 'employee' ? {} : 'skip'
  ) ?? []

  const q = searchQuery.trim().toLowerCase()
  const hasQuery = q.length > 0

  const filteredEmployees = useMemo(() => {
    if (!hasQuery || role !== 'admin') return []
    return rawEmployees
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.team.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q)
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
  }, [rawEmployees, q, hasQuery, role])

  const filteredEvents = useMemo(() => {
    if (!hasQuery) return []
    return rawEvents
      .filter(
        (ev) =>
          ev.name.toLowerCase().includes(q) ||
          (ev.destination && ev.destination.toLowerCase().includes(q)) ||
          (ev.secondaryDestination && ev.secondaryDestination.toLowerCase().includes(q))
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
  }, [rawEvents, q, hasQuery])

  const filteredTrips = useMemo(() => {
    if (!hasQuery || role !== 'employee') return []
    return tripsWithEvents
      .filter((t) => {
        const event = t.event
        if (!event) return false
        return (
          event.name?.toLowerCase().includes(q) ||
          event.destination?.toLowerCase().includes(q) ||
          (event.secondaryDestination && event.secondaryDestination.toLowerCase().includes(q)) ||
          t.status?.toLowerCase().includes(q)
        )
      })
      .slice(0, MAX_RESULTS_PER_GROUP)
  }, [tripsWithEvents, q, hasQuery, role])

  const chatBase = role === 'admin' ? '/admin/chat' : '/employee'
  const hasAnyResults =
    (role === 'admin' && filteredEmployees.length > 0) ||
    filteredEvents.length > 0 ||
    (role === 'employee' && filteredTrips.length > 0) ||
    conversations.length > 0

  const matchingPageShortcuts = useMemo(() => {
    if (!hasQuery) return []
    const matched = PAGE_SHORTCUTS.filter(
      (p) => p.roles.includes(role) && p.keywords.some((kw) => q.includes(kw))
    )
    return matched.filter((p, i, arr) => arr.findIndex((x) => x.href === p.href && x.label === p.label) === i)
  }, [hasQuery, q, role])

  const handleSelect = (href: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(href)
  }

  const displayName = profile?.displayName ?? clerkUser?.fullName ?? 'User'
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
  const imageUrl = profile?.avatarUrl ?? clerkUser?.imageUrl ?? undefined
  const initials = getInitials(displayName)

  const profileHref = role === 'admin' ? '/admin/profile' : '/employee/profile'

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-border/30 relative z-20">
      {/* Left: Page context + Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full hidden md:block">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverAnchor asChild>
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none z-10" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder={role === 'admin' ? 'Locate traveler, event, trip...' : 'Search trips...'}
                  className="pl-9 pr-16 paper-inset border-0 h-10 text-[13px] rounded-2xl focus-visible:ring-1 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30 placeholder:text-muted-foreground/40 transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none h-5 px-1.5 rounded-lg border border-border/30 bg-white/60 text-[10px] font-bold text-muted-foreground/50 hidden sm:inline">⌘K</kbd>
              </div>
            </PopoverAnchor>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 rounded-2xl shadow-layer-2" align="start">
              <Command
                value={searchQuery}
                onValueChange={setSearchQuery}
                shouldFilter={false}
                className="rounded-2xl border-0 shadow-none"
              >
                <CommandList>
                  <CommandEmpty>
                    {hasQuery ? (
                      <>No results for &quot;{searchQuery}&quot;</>
                    ) : (
                      <>Type to search employees, events, trips, chats</>
                    )}
                  </CommandEmpty>
                  {hasQuery && matchingPageShortcuts.length > 0 && (
                    <CommandGroup heading="Go to">
                      {matchingPageShortcuts.map((p) => (
                        <CommandItem
                          key={`${p.href}-${p.label}`}
                          value={`goto-${p.href}-${p.label}`}
                          onSelect={() => handleSelect(p.href)}
                        >
                          {p.icon === 'Users' && <Users className="w-4 h-4 shrink-0" />}
                          {p.icon === 'Calendar' && <Calendar className="w-4 h-4 shrink-0" />}
                          {p.icon === 'Plane' && <Plane className="w-4 h-4 shrink-0" />}
                          {p.icon === 'MessageCircle' && <MessageCircle className="w-4 h-4 shrink-0" />}
                          <span>{p.label}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                    {hasQuery && hasAnyResults && (
                      <>
                        {role === 'admin' && filteredEmployees.length > 0 && (
                          <CommandGroup heading="Employees">
                            {filteredEmployees.map((e) => (
                              <CommandItem
                                key={e._id}
                                value={`employee-${e._id}-${e.name}`}
                                onSelect={() => handleSelect('/admin/employees')}
                              >
                                <Users className="w-4 h-4 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-medium">{e.name}</span>
                                  <span className="text-xs text-muted-foreground truncate">{e.team} · {e.role}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {filteredEvents.length > 0 && (
                          <CommandGroup heading="Events">
                            {filteredEvents.map((ev) => (
                              <CommandItem
                                key={ev._id}
                                value={`event-${ev._id}-${ev.name}`}
                                onSelect={() => handleSelect(`/admin/itineraries/${ev._id}`)}
                              >
                                <Calendar className="w-4 h-4 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-medium">{ev.name}</span>
                                  <span className="text-xs text-muted-foreground truncate">{ev.destination}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {role === 'employee' && filteredTrips.length > 0 && (
                          <CommandGroup heading="Trips">
                            {filteredTrips.map((t) => (
                              <CommandItem
                                key={t._id}
                                value={`trip-${t._id}-${t.event?.name ?? ''}`}
                                onSelect={() => handleSelect(`/employee/trips/${t._id}`)}
                              >
                                <Plane className="w-4 h-4 shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate font-medium">{t.event?.name ?? 'Trip'}</span>
                                  <span className="text-xs text-muted-foreground truncate">{t.event?.destination ?? t.status}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {conversations.length > 0 && (
                          <CommandGroup heading="Chats">
                            {conversations.map((c) => (
                              <CommandItem
                                key={c._id}
                                value={`chat-${c._id}-${c.title ?? ''}`}
                                onSelect={() => handleSelect(`${chatBase}?conversationId=${c._id}`)}
                              >
                                <MessageCircle className="w-4 h-4 shrink-0" />
                                <span className="truncate">{c.title ?? 'Untitled conversation'}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </>
                    )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* AI Concierge button */}
        <Link href={role === 'admin' ? '/admin/chat' : '/employee'}>
          <Button variant="ghost" className="relative group h-10 px-4 rounded-2xl paper-inset border-0 hover:border-emerald-500/20 transition-all duration-300 btn-press">
            <Sparkles className="w-4 h-4 text-gold mr-2" />
            <span className="text-[13px] font-medium hidden lg:inline">AI Concierge</span>
            {role === 'employee' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            )}
          </Button>
        </Link>

        <NotificationCenter />

        <div className="h-5 w-px bg-border/50 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="pl-1.5 pr-2.5 gap-2 h-10 rounded-2xl hover:bg-muted/30 btn-press">
              <Avatar className="w-7 h-7 ring-2 ring-border/50">
                <AvatarImage src={imageUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-[13px] font-medium text-foreground truncate max-w-[100px]">
                {displayName}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-layer-2 p-1.5">
            <div className="flex items-center gap-3 p-3">
              <Avatar className="w-9 h-9 ring-2 ring-border/50">
                <AvatarImage src={imageUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold leading-none truncate">{displayName}</span>
                <span className="text-[11px] text-muted-foreground mt-1 truncate">{email || 'No email'}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <Link href={profileHref}>
              <DropdownMenuItem className="gap-2 cursor-pointer text-[13px] rounded-xl">
                <User className="w-3.5 h-3.5" /> Profile
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2 cursor-pointer text-[13px] text-destructive focus:text-destructive rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
