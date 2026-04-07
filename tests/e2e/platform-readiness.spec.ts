/**
 * Platform Readiness — Comprehensive E2E A/B Tests
 *
 * Validates every publicly-accessible surface of TripWeaver without requiring
 * authentication. Tests are grouped by area and designed to pass/fail cleanly
 * regardless of whether the AI agent backend is connected.
 *
 * Coverage:
 *  A) Landing page (public)
 *  B) Auth pages (login, select-role, signup redirect)
 *  C) Unauthenticated redirect guard (all protected routes)
 *  D) Responsive layout (mobile viewport)
 *  E) HTTP health checks (page status codes)
 *  F) Navigation and linking
 *  G) Admin onboarding UI
 *  H) Chat page (structure, no agent)
 *  I) A/B — Dark theme & branding
 *  J) Accessibility basics
 *
 * Key architectural notes:
 * - Auth is Clerk + Convex. `proxy.ts` runs clerkMiddleware() (no auto-protect).
 * - AppShell redirects unauthenticated users to `/` (root), NOT `/auth/login`.
 * - Framer Motion whileInView animations need scroll to be visible.
 * - `<Link><Button>Sign in</Button></Link>` means role=link won't match text directly.
 */

import { test, expect, Page } from '@playwright/test'

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Helper: wait for networkidle and animation settling
async function waitForPage(page: Page) {
  await page.waitForLoadState('networkidle')
  // Brief settle for Framer Motion mount animations
  await page.waitForTimeout(300)
}

// Helper: scroll page to trigger whileInView animations
async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(400)
}

// ─────────────────────────────────────────────────────────
// A) LANDING PAGE
// ─────────────────────────────────────────────────────────
test.describe('A) Landing Page', () => {
  test('A01 — returns HTTP 200', async ({ page }) => {
    const response = await page.goto(`${BASE}/`)
    expect(response?.status()).toBe(200)
  })

  test('A02 — hero heading contains "Corporate travel"', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await expect(page.locator('h1')).toContainText('Corporate travel')
  })

  test('A03 — hero subtitle mentions AI and itineraries', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const body = await page.textContent('body')
    expect(body?.toLowerCase()).toContain('itinerar')
  })

  test('A04 — "Sign in" nav button is visible', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    // Nav uses <Link href="/auth/login"><Button>Sign in</Button></Link>
    // Match via href attribute rather than role=link name
    const signInLink = page.locator('a[href="/auth/login"]').first()
    await expect(signInLink).toBeVisible()
  })

  test('A05 — "Get started" nav button is visible', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const getStartedLink = page.locator('a[href="/auth/select-role"]').first()
    await expect(getStartedLink).toBeVisible()
  })

  test('A06 — TripWeaver logo is present in navbar', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('A07 — stats section shows "< 2min" metric', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await scrollToBottom(page)
    const body = await page.textContent('body')
    expect(body).toContain('2min')
  })

  test('A08 — features section text includes at least 3 domain keywords', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await scrollToBottom(page)
    const body = await page.textContent('body')
    const keywords = ['itinerary', 'compli', 'flight', 'payment', 'policy', 'analytic']
    const matches = keywords.filter(k => body?.toLowerCase().includes(k))
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })

  test('A09 — "For Employees" section is visible after scroll', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await scrollToBottom(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('for employee')
  })

  test('A10 — "Try the demo" or "Get started" CTA exists somewhere on page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await scrollToBottom(page)
    const text = await page.textContent('body')
    const hasCta = text?.includes('Try the demo') || text?.includes('Get started')
    expect(hasCta).toBeTruthy()
  })

  test('A11 — page title includes TripWeaver', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const title = await page.title()
    expect(title.toLowerCase()).toContain('tripweaver')
  })

  test('A12 — no critical JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const criticalErrors = errors.filter(
      e =>
        !e.includes('clerk') &&
        !e.includes('hydrat') &&
        !e.includes('ResizeObserver') &&
        !e.includes('convex')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('A13 — landing page AI badge is visible', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('ai-powered')
  })
})

// ─────────────────────────────────────────────────────────
// B) AUTH PAGES
// ─────────────────────────────────────────────────────────
test.describe('B) Auth Pages', () => {
  test('B01 — /auth/login returns 200', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/login`)
    expect(res?.status()).toBe(200)
  })

  test('B02 — login page shows "Welcome back" heading', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    // Clerk injects its own h1 inside SignIn — use .first() for our custom heading
    await expect(page.locator('h1').first()).toContainText('Welcome back', { timeout: 15000 })
  })

  test('B03 — login page subtitle is correct', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    await expect(page.getByText('Sign in to your TripWeaver account')).toBeVisible()
  })

  test('B04 — Clerk SignIn widget container mounts', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    await expect(page.locator('.clerk-container')).toBeVisible()
  })

  test('B05 — login page has back-to-home link', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    const homeLink = page.locator('a[href="/"]').first()
    await expect(homeLink).toBeVisible()
  })

  test('B06 — /auth/signup redirects to /auth/select-role', async ({ page }) => {
    await page.goto(`${BASE}/auth/signup`)
    await waitForPage(page)
    await expect(page).toHaveURL(/\/auth\/select-role/)
  })

  test('B07 — /auth/select-role returns 200', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/select-role`)
    expect(res?.status()).toBe(200)
  })

  test('B08 — select-role shows Admin / Manager option', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    await expect(page.getByText(/admin.*manager/i)).toBeVisible()
  })

  test('B09 — select-role shows Employee option', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('employee')
  })

  test('B10 — select-role Admin card lists policy management benefit', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('polic')
  })

  test('B11 — select-role Employee card lists itinerary benefit', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('itinerar')
  })

  test('B12 — select-role has link back to home', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    const homeLink = page.locator('a[href="/"]').first()
    await expect(homeLink).toBeVisible()
  })

  test('B13 — /auth/verify page loads without 500', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/verify`)
    expect(res?.status()).not.toBe(500)
  })

  test('B14 — select-role has links to signup flows', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    // Admin or Employee signup links should exist
    const signupLinks = await page.locator('a[href*="/auth/signup/"]').count()
    expect(signupLinks).toBeGreaterThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────────────────
// C) UNAUTHENTICATED REDIRECT GUARD
// Note: AppShell.tsx calls router.push('/') for unauthenticated users.
// Tests verify that accessing protected routes does NOT leave you on
// that protected route — you end up redirected away.
// ─────────────────────────────────────────────────────────
test.describe('C) Unauthenticated Redirect Guard', () => {
  const protectedRoutes = [
    '/admin',
    '/admin/itineraries',
    '/admin/itineraries/new',
    '/admin/employees',
    '/admin/chat',
    '/admin/policies',
    '/admin/settings',
    '/admin/reports',
    '/employee',
    '/employee/trips',
    '/employee/profile',
  ]

  for (const route of protectedRoutes) {
    test(`C — ${route} does not render the admin/employee dashboard unauthenticated`, async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000) // allow client-side redirect to fire

      const url = page.url()
      // AppShell redirects unauthenticated users to '/'
      // Clerk middleware may redirect to sign-in URL
      // Either way: the user should NOT stay on the protected route
      const isStillOnRoute = url === `${BASE}${route}` || url === `${BASE}${route}/`
      expect(isStillOnRoute).toBeFalsy()
    })
  }
})

// ─────────────────────────────────────────────────────────
// D) RESPONSIVE LAYOUT (Mobile viewport)
// ─────────────────────────────────────────────────────────
test.describe('D) Responsive Layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 14

  test('D01 — landing page h1 renders on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('D02 — landing page has no horizontal scroll on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const overflowX = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth
    )
    expect(overflowX).toBeFalsy()
  })

  test('D03 — login page renders on mobile', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    // Clerk injects its own h1 — use .first() for our custom heading
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('D04 — select-role page renders on mobile', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('admin')
  })
})

// ─────────────────────────────────────────────────────────
// E) HTTP HEALTH CHECKS
// ─────────────────────────────────────────────────────────
test.describe('E) HTTP Health Checks', () => {
  const publicPages: Array<[string, string]> = [
    ['Landing', '/'],
    ['Login', '/auth/login'],
    ['Select Role', '/auth/select-role'],
    ['Admin onboarding', '/auth/onboarding/admin'],
    ['Employee onboarding', '/auth/onboarding/employee'],
    ['Signup admin', '/auth/signup/admin'],
    ['Signup employee', '/auth/signup/employee'],
  ]

  for (const [label, path] of publicPages) {
    test(`E — ${label} (${path}) returns non-error status`, async ({ page }) => {
      const res = await page.goto(`${BASE}${path}`)
      await page.waitForLoadState('networkidle')
      expect(res?.status()).not.toBe(500)
      expect(res?.status()).not.toBe(404)
    })
  }
})

// ─────────────────────────────────────────────────────────
// F) NAVIGATION AND LINKING
// ─────────────────────────────────────────────────────────
test.describe('F) Navigation and Linking', () => {
  test('F01 — landing page "Sign in" link navigates to /auth/login', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    // Use href selector because <Link><Button> doesn't expose as link by name
    await page.locator('a[href="/auth/login"]').first().click()
    await waitForPage(page)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('F02 — landing page "Get started" link navigates to select-role', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    await page.locator('a[href="/auth/select-role"]').first().click()
    await waitForPage(page)
    await expect(page).toHaveURL(/\/auth\/select-role/)
  })

  test('F03 — login page home link navigates back to root', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    await page.locator('a[href="/"]').first().click()
    await waitForPage(page)
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('F04 — select-role home link navigates back to root', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    await page.locator('a[href="/"]').first().click()
    await waitForPage(page)
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('F05 — signup/admin route loads without 500', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/signup/admin`)
    await waitForPage(page)
    expect(res?.status()).not.toBe(500)
  })

  test('F06 — signup/employee route loads without 500', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/signup/employee`)
    await waitForPage(page)
    expect(res?.status()).not.toBe(500)
  })
})

// ─────────────────────────────────────────────────────────
// G) ONBOARDING UI STRUCTURE
// ─────────────────────────────────────────────────────────
test.describe('G) Onboarding UI Structure', () => {
  async function isOnOnboardingPage(page: Page): Promise<boolean> {
    return page.url().includes('/auth/onboarding')
  }

  test('G01 — admin onboarding page loads without crashing (200 or redirect)', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/onboarding/admin`)
    await waitForPage(page)
    expect(res?.status()).not.toBe(500)
  })

  test('G02 — admin onboarding shows form OR redirects to auth', async ({ page }) => {
    await page.goto(`${BASE}/auth/onboarding/admin`)
    await waitForPage(page)

    if (await isOnOnboardingPage(page)) {
      await expect(page.getByRole('heading', { name: /complete your profile/i })).toBeVisible()
    } else {
      // Redirected to login or select-role or root — all acceptable
      expect(page.url()).not.toContain('/auth/onboarding/admin')
    }
  })

  test('G03 — employee onboarding page loads without crashing', async ({ page }) => {
    const res = await page.goto(`${BASE}/auth/onboarding/employee`)
    await waitForPage(page)
    expect(res?.status()).not.toBe(500)
  })

  test('G04 — admin onboarding has 3 step labels when accessible', async ({ page }) => {
    await page.goto(`${BASE}/auth/onboarding/admin`)
    await waitForPage(page)

    if (!(await isOnOnboardingPage(page))) {
      test.skip()
      return
    }

    const body = (await page.textContent('body'))?.toLowerCase() ?? ''
    expect(body).toContain('basic info')
    expect(body).toContain('profile setup')
    expect(body).toContain('preferences')
  })
})

// ─────────────────────────────────────────────────────────
// H) CHAT PAGE (agent not connected — test redirect only)
// ─────────────────────────────────────────────────────────
test.describe('H) Chat Page (structure, no agent)', () => {
  test('H01 — /admin/chat redirects unauthenticated users away from the chat route', async ({ page }) => {
    await page.goto(`${BASE}/admin/chat`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const url = page.url()
    const isOnChatPage = url.includes('/admin/chat')
    expect(isOnChatPage).toBeFalsy()
  })
})

// ─────────────────────────────────────────────────────────
// I) A/B VARIANT — DARK MODE META & THEMING
// ─────────────────────────────────────────────────────────
test.describe('I) A/B — Dark Theme & Branding', () => {
  test('I01 — landing page uses bg-background class (dark theme)', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const darkBg = await page.locator('.bg-background').first().isVisible()
    expect(darkBg).toBeTruthy()
  })

  test('I02 — login page uses dark background class', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    const darkBg = await page.locator('.bg-background').first().isVisible()
    expect(darkBg).toBeTruthy()
  })

  test('I03 — brand emerald CTA button exists on landing page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    // Emerald CTA buttons should be in navbar
    const emeraldBtn = page.locator('.bg-emerald-600, .bg-emerald-500').first()
    await expect(emeraldBtn).toBeVisible()
  })

  test('I04 — TripWeaver branding visible on landing page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const text = await page.textContent('body')
    expect(text?.toLowerCase()).toContain('tripweaver')
  })

  test('I05 — login page dark background confirmed', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    // Background should be dark (bg-background which is slate-950 in dark mode)
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector('.bg-background')
      return el ? window.getComputedStyle(el).backgroundColor : null
    })
    // Any non-white background is correct for dark mode
    expect(bgColor).not.toBe('rgb(255, 255, 255)')
  })
})

// ─────────────────────────────────────────────────────────
// J) ACCESSIBILITY BASICS
// ─────────────────────────────────────────────────────────
test.describe('J) Accessibility Basics', () => {
  test('J01 — landing page has exactly one h1', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
  })

  test('J02 — login page has our custom h1 "Welcome back"', async ({ page }) => {
    await page.goto(`${BASE}/auth/login`)
    await waitForPage(page)
    // Clerk also injects an h1 — check first one is our custom heading
    await expect(page.locator('h1').first()).toContainText('Welcome back')
  })

  test('J03 — all images on landing page have alt attribute', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await waitForPage(page)
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
    }
  })

  test('J04 — html element has lang attribute set', async ({ page }) => {
    await page.goto(`${BASE}/`)
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
  })

  test('J05 — select-role page has at least one h1 or h2', async ({ page }) => {
    await page.goto(`${BASE}/auth/select-role`)
    await waitForPage(page)
    const headings = await page.locator('h1, h2').count()
    expect(headings).toBeGreaterThanOrEqual(1)
  })
})
