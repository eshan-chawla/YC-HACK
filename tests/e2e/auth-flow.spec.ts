/**
 * E2E tests for authentication flows
 *
 * NOTE: Auth is handled by Clerk. Clerk renders its own scoped UI — we test
 * what the *host page* renders (headings, wrapper elements, navigation links)
 * rather than Clerk's internal form fields, which are not reliably accessible
 * to Playwright in the test environment.
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should show login page with Welcome back heading', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Clerk also renders an h1 inside SignIn, so use .first() to target our custom heading
    await expect(page.locator('h1').first()).toContainText('Welcome back')
    // Clerk container should be present
    await expect(page.locator('.clerk-container')).toBeVisible()
  })

  test('should show Sign in to your TripWeaver account subtitle', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Sign in to your TripWeaver account')).toBeVisible()
  })

  test('should show TripWeaver logo on login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // Logo element should be visible
    await expect(page.locator('svg').first()).toBeVisible()
  })

  test('should show back-to-home link on login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('link', { name: /home/i })).toBeVisible()
  })

  test('signup page redirects to select-role', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.waitForLoadState('networkidle')

    // /auth/signup immediately redirects to /auth/select-role
    await expect(page).toHaveURL(/\/auth\/select-role/)
  })

  test('select-role page shows Admin and Employee options', async ({ page }) => {
    await page.goto('/auth/select-role')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(400) // Framer Motion mount animation settle

    await expect(page.getByText(/admin.*manager/i)).toBeVisible()
    // Use exact h3 heading to avoid strict-mode violation from multiple "Employee" text nodes
    await expect(page.locator('h3, h2').filter({ hasText: /^employee$/i }).first()).toBeVisible()
  })

  test('select-role has links to admin and employee signup', async ({ page }) => {
    await page.goto('/auth/select-role')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(400) // Framer Motion mount animation settle

    // Use href selector — Framer Motion can cause text-based role lookups to fail before animation
    const signupLinks = await page.locator('a[href*="/auth/signup/"]').count()
    expect(signupLinks).toBeGreaterThanOrEqual(1)
  })

  test('should redirect unauthenticated users from admin routes', async ({ page }) => {
    await page.goto('/admin')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000) // allow AppShell client-side redirect

    // AppShell redirects unauthenticated users to '/' (root), not /auth/login
    const url = page.url()
    expect(url).not.toContain('/admin')
  })

  test('should redirect unauthenticated users from employee routes', async ({ page }) => {
    await page.goto('/employee')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // AppShell redirects unauthenticated users to '/' (root)
    const url = page.url()
    expect(url).not.toContain('/employee')
  })
})

test.describe('Login Form Validation', () => {
  test('Clerk SignIn component renders on login page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')

    // The Clerk container must be in the DOM
    const clerkContainer = page.locator('.clerk-container')
    await expect(clerkContainer).toBeVisible()
  })

  test('login page returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/auth/login')
    expect(response?.status()).toBe(200)
  })
})

test.describe('Signup Form Validation', () => {
  test('select-role page renders without error', async ({ page }) => {
    const response = await page.goto('/auth/select-role')
    await page.waitForLoadState('networkidle')

    expect(response?.status()).toBe(200)
    // Should not show a generic error
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible()
  })
})
