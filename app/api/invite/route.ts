import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Simple in-memory rate limiter: max 20 invites per user per hour
const inviteRateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = inviteRateMap.get(userId)
  if (!entry || entry.resetAt < now) {
    inviteRateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role via Convex
  try {
    const token = await getToken({ template: 'convex' })
    if (token) convex.setAuth(token)
    const profile = await convex.query(api.userProfiles.me)
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Could not verify role' }, { status: 500 })
  }

  // Rate limiting
  if (!checkRateLimit(userId)) {
    return NextResponse.json({ error: 'Too many invitations. Try again later.' }, { status: 429 })
  }

  let body: { email: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, name } = body
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  try {
    const client = await clerkClient()
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${appUrl}/auth/signup/employee`,
      publicMetadata: { invitedName: name ?? '' },
    })
    return NextResponse.json({ id: invitation.id, status: invitation.status })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send invitation'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
