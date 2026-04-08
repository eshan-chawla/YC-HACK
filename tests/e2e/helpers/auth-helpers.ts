/**
 * Auth helpers for TripWeaver E2E tests.
 *
 * TripWeaver uses Clerk for authentication. Since Clerk's UI is sandboxed,
 * these helpers test auth-gated routes in two ways:
 *
 * 1. Unauthenticated guard tests — navigate to protected routes and assert
 *    the redirect/fallback behavior (no Clerk session required).
 *
 * 2. Authenticated session tests — use PLAYWRIGHT_ADMIN_SESSION and
 *    PLAYWRIGHT_EMPLOYEE_SESSION env vars pointing to pre-saved Clerk
 *    `storageState` files. When those files exist, tests run against live
 *    authenticated sessions. When absent, these tests are skipped.
 *
 * ## Generating storageState files
 *
 *   GENERATE_AUTH_STATE=1 npx playwright test tests/e2e/helpers/save-auth-state.spec.ts
 *
 * This runs a headed browser, lets you log in manually, then saves the state.
 */

import { type BrowserContext, type Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/** Paths to saved Clerk session storage state files */
export const AUTH_STATE_PATHS = {
  admin: process.env.PLAYWRIGHT_ADMIN_SESSION ?? path.join(__dirname, '../.auth/admin.json'),
  employee: process.env.PLAYWRIGHT_EMPLOYEE_SESSION ?? path.join(__dirname, '../.auth/employee.json'),
}

/** Returns true when a saved auth state exists for the given role */
export function hasAuthState(role: 'admin' | 'employee'): boolean {
  return fs.existsSync(AUTH_STATE_PATHS[role])
}

/**
 * Skip a test if no auth state is available for the given role.
 * Use inside test.beforeEach or at the top of a test:
 *
 *   skipIfNoAuth(test, 'admin')
 */
export function skipIfNoAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testFn: { skip: (condition: boolean, reason: string) => void },
  role: 'admin' | 'employee'
): void {
  testFn.skip(
    !hasAuthState(role),
    `No saved auth state for ${role}. Run: GENERATE_AUTH_STATE=1 npx playwright test tests/e2e/helpers/save-auth-state.spec.ts`
  )
}

/**
 * Apply saved session state to an existing browser context by adding cookies
 * and localStorage entries from the saved state file.
 *
 * NOTE: context.storageState({ path }) SAVES state; to LOAD state you must
 * inject cookies manually on an already-created context.
 */
export async function applyAuthState(
  context: BrowserContext,
  role: 'admin' | 'employee'
): Promise<void> {
  const statePath = AUTH_STATE_PATHS[role]
  if (!fs.existsSync(statePath)) {
    throw new Error(
      `Auth state not found at ${statePath}. Run: node scripts/generate-e2e-auth.mjs`
    )
  }
  const raw = fs.readFileSync(statePath, 'utf-8')
  const state = JSON.parse(raw) as {
    cookies: import('@playwright/test').Cookie[]
    origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>
  }
  if (state.cookies?.length) {
    await context.addCookies(state.cookies)
  }
}

/**
 * Mock the TripWeaver AI agent server action so tests don't call Gemini.
 *
 * Intercepts Next.js server action POST requests to the chat route and
 * returns a deterministic mock response.
 *
 * @param page       - Playwright page
 * @param mockContent - Text content the agent should "respond" with
 * @param paymentCompleted - Whether to simulate a completed payment
 */
export async function mockAgentResponse(
  page: Page,
  mockContent: string,
  paymentCompleted = false
): Promise<void> {
  // Next.js server actions POST to the same URL with ACTION_ID header
  await page.route('**/*', async (route) => {
    const request = route.request()
    const headers = request.headers()

    // Intercept Next.js server action requests (they carry Next-Action header)
    if (
      request.method() === 'POST' &&
      (headers['next-action'] || headers['Next-Action'])
    ) {
      // Return a mock streaming response that Next.js server actions use
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: JSON.stringify([{ content: mockContent, paymentCompleted }]),
      })
      return
    }

    await route.continue()
  })
}

/**
 * Wait for the AI typing indicator to appear and then disappear,
 * indicating the agent has finished responding.
 */
export async function waitForAgentResponse(page: Page, timeout = 30000): Promise<void> {
  // Wait for the pulsing bot icon (loading state) to appear
  await page.waitForSelector('.animate-pulse', { timeout: 5000 }).catch(() => {
    // Loading indicator may appear briefly — ignore if it already passed
  })
  // Then wait for it to disappear (agent finished)
  await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout })
}

/** Navigate to a chat page and wait for it to fully load */
export async function navigateToChatPage(
  page: Page,
  role: 'admin' | 'employee'
): Promise<void> {
  const url = role === 'admin' ? '/admin/chat' : '/employee/chat'
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

/** Get the chat message input element */
export function getChatInput(page: Page) {
  return page.locator('input[type="text"]').filter({
    hasText: /.*/,
  }).or(page.locator('input').filter({ has: page.locator(':scope') }))
}

/** Type a message into the chat input and submit */
export async function sendChatMessage(page: Page, message: string): Promise<void> {
  const input = page.getByPlaceholder(/issue a command|ask anything/i)
  await input.fill(message)
  await page.getByRole('button', { name: /send/i }).click()
}
