/**
 * Generate Playwright auth state files for E2E tests using @clerk/testing.
 *
 * Uses Clerk's official testing integration to bypass Clerk's bot detection
 * and establish real sessions for test users, then saves the storageState.
 *
 * Prerequisites:
 *   - CLERK_SECRET_KEY must be set (read from .env.local)
 *   - Dev server must be running on http://localhost:3000
 *
 * Usage:
 *   node scripts/generate-e2e-auth.mjs
 *
 * Output:
 *   tests/e2e/.auth/admin.json
 *   tests/e2e/.auth/employee.json
 */

import { chromium } from '@playwright/test'
import { mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AUTH_DIR = join(ROOT, 'tests/e2e/.auth')

// Load env from .env.local
function loadEnv() {
  try {
    const envFile = readFileSync(join(ROOT, '.env.local'), 'utf-8')
    for (const line of envFile.split('\n')) {
      const match = line.match(/^([^#=\s]+)=(.+)$/)
      if (match) {
        const key = match[1].trim()
        const val = match[2].split('#')[0].trim()
        if (val) process.env[key] = val
      }
    }
  } catch { /* ignore */ }
}
loadEnv()

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  console.error('ERROR: CLERK_SECRET_KEY not found in .env.local')
  process.exit(1)
}

// ─── Clerk Backend API helpers ──────────────────────────────────────────────

async function clerkApi(path, options = {}) {
  const resp = await fetch(`https://api.clerk.com/v1${path}`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  return resp.json()
}

async function createSignInToken(userId) {
  const data = await clerkApi('/sign_in_tokens', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
  if (data.errors) throw new Error(`Clerk API error: ${data.errors[0].long_message}`)
  return data
}

async function listUsers() {
  const data = await clerkApi('/users?limit=20')
  return Array.isArray(data) ? data : (data.data || [])
}

// ─── Onboarding automation ──────────────────────────────────────────────────

async function handleOnboardingIfNeeded(page, role) {
  await page.waitForLoadState('networkidle')
  const url = page.url()

  if (!url.includes('/auth/onboarding')) {
    return // No onboarding needed
  }

  console.log(`  → Completing ${role} onboarding at ${url}`)

  const isEmployee = url.includes('/employee')

  // Step 1: Basic Info
  await page.waitForSelector('input', { timeout: 10000 })

  // Fill whatever input fields are visible
  for (const [placeholder, value] of [
    [/full.?name|display.?name/i, isEmployee ? 'Sarah Chen' : 'Test Admin'],
    [/phone/i, isEmployee ? '+12125550001' : '+12125550002'],
    [/department/i, 'Engineering'],
    [/job.?title|title|position/i, isEmployee ? 'Software Engineer' : 'Admin'],
    [/company/i, 'TripWeaver Corp'],
  ]) {
    const input = page.getByPlaceholder(placeholder)
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill(value)
    }
  }

  // Click through all steps
  for (let step = 0; step < 4; step++) {
    const nextBtn = page.getByRole('button', { name: /next|continue|finish|complete|get started/i }).first()
    if (await nextBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await nextBtn.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)

      if (!page.url().includes('/auth/onboarding')) break

      // Fill any new fields that appeared
      for (const [placeholder, value] of [
        [/full.?name|display.?name/i, isEmployee ? 'Sarah Chen' : 'Test Admin'],
        [/phone/i, isEmployee ? '+12125550001' : '+12125550002'],
        [/department/i, 'Engineering'],
        [/company/i, 'TripWeaver Corp'],
      ]) {
        const input = page.getByPlaceholder(placeholder)
        if (await input.isVisible({ timeout: 300 }).catch(() => false)) {
          const current = await input.inputValue()
          if (!current) await input.fill(value)
        }
      }
    }
  }

  console.log(`  → Onboarding done, now at: ${page.url()}`)
}

// ─── Auth state generation ──────────────────────────────────────────────────

async function generateAuthState(browser, { userId, outputFile, targetUrl, role, email, password }) {
  console.log(`\n[${role.toUpperCase()}] Generating auth state`)
  console.log(`  User: ${email} (${userId})`)

  const context = await browser.newContext({
    baseURL: APP_URL,
    viewport: { width: 1280, height: 720 },
  })
  const page = await context.newPage()

  try {
    // Approach 1: Use sign-in token redirect with __clerk_ticket on app domain
    console.log('  → Creating Clerk sign-in token...')
    const tokenData = await createSignInToken(userId)
    const ticket = new URL(tokenData.url).searchParams.get('__clerk_ticket')

    if (!ticket) {
      throw new Error('Could not extract __clerk_ticket from token URL')
    }

    // Navigate to app with __clerk_ticket — Clerk SDK processes it
    const loginUrl = `${APP_URL}/auth/login?__clerk_ticket=${ticket}`
    console.log('  → Navigating to app with ticket...')
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(3000) // Let Clerk process the ticket

    console.log('  → URL after ticket:', page.url())

    // Handle onboarding if redirected there
    await handleOnboardingIfNeeded(page, role)

    // Handle select-role redirect (new user without a Convex profile)
    if (page.url().includes('/auth/select-role')) {
      console.log('  → On select-role page, clicking Employee option...')
      const employeeBtn = page.getByText(/employee/i).first()
      if (await employeeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await employeeBtn.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)
        console.log('  → After role select:', page.url())
      }
      // May now be on /auth/signup/employee — the Clerk sign-up component
      // Since user already exists in Clerk, navigate directly to onboarding
      if (page.url().includes('/auth/signup')) {
        console.log('  → On signup page, navigating to onboarding...')
        await page.goto(`${APP_URL}/auth/onboarding/${role}`, { waitUntil: 'networkidle', timeout: 15000 })
        await page.waitForTimeout(1000)
      }
    }

    // Handle onboarding if still needed
    await handleOnboardingIfNeeded(page, role)

    // Navigate to the target page
    console.log(`  → Navigating to ${targetUrl}...`)
    await page.goto(APP_URL + targetUrl, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(2000)

    const finalUrl = page.url()
    console.log('  → Final URL:', finalUrl)

    const isAuthenticated = !finalUrl.includes('/auth/login') && !finalUrl.includes('/auth/select-role')
    if (isAuthenticated) {
      console.log('  ✓ Authenticated successfully')
    } else {
      console.warn(`  ⚠ May not be authenticated (landed on ${finalUrl})`)
    }

    // Save auth state regardless
    mkdirSync(AUTH_DIR, { recursive: true })
    await context.storageState({ path: outputFile })
    console.log(`  ✓ State saved to ${outputFile}`)

    // Verify cookies
    const state = JSON.parse(readFileSync(outputFile, 'utf-8'))
    const localhostCookies = state.cookies.filter(c => c.domain === 'localhost' || c.domain.includes('localhost'))
    const sessionCookies = localhostCookies.filter(c => c.name.includes('session') || c.name.includes('client_uat'))
    console.log(`  → Localhost cookies: ${localhostCookies.length} (session-related: ${sessionCookies.length})`)
    for (const c of sessionCookies) {
      console.log(`     ${c.name}: ${String(c.value).substring(0, 40)}...`)
    }
  } finally {
    await context.close()
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(AUTH_DIR, { recursive: true })

  console.log('TripWeaver E2E Auth State Generator')
  console.log('=====================================')
  console.log(`App URL: ${APP_URL}`)

  // Verify app is running
  try {
    const resp = await fetch(APP_URL)
    console.log(`App status: ${resp.status}`)
  } catch {
    console.error('ERROR: App is not running at', APP_URL)
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })

  try {
    // Admin user — has existing Convex profile (onboarding complete)
    await generateAuthState(browser, {
      userId: 'user_39MwMWufUoTHrdhRnOnYEq4gwXv',
      email: 'suryapugaz1629@gmail.com',
      outputFile: join(AUTH_DIR, 'admin.json'),
      targetUrl: '/admin/chat',
      role: 'admin',
    })

    // Employee user — new user, needs onboarding
    await generateAuthState(browser, {
      userId: 'user_3C11OB0ObjPBzvCuGlT5l9c6XFP',
      email: 'sarah.chen.test@gmail.com',
      outputFile: join(AUTH_DIR, 'employee.json'),
      targetUrl: '/employee/chat',
      role: 'employee',
    })
  } finally {
    await browser.close()
  }

  console.log('\n✓ Done!')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
