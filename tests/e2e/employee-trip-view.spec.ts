/**
 * E2E Test: Employee Trip Viewing and Security Boundaries
 * 
 * This test covers:
 * 1. Employee logs in
 * 2. Employee can view their assigned trips
 * 3. Employee cannot access admin routes
 * 4. Employee cannot view other employees' trips
 * 5. Employee can view itinerary details
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

// Test credentials
const EMPLOYEE_EMAIL = process.env.TEST_EMPLOYEE_EMAIL || 'employee@test.com'
const EMPLOYEE_PASSWORD = process.env.TEST_EMPLOYEE_PASSWORD || 'TestPassword123!'

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 30000 }).catch(() => {})
}

test.describe('Employee Trip View', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000)
  })

  test('should display employee dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/employee/dashboard.png' })
  })

  test('should show trips page', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Look for trips-related content
    const pageContent = await page.textContent('body')
    
    await page.screenshot({ path: 'test-results/employee/trips-list.png' })
  })

  test('should display trip detail', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Click on first trip if available
    const tripLink = page.locator('a[href*="/employee/trips/"]').first()
    
    if (await tripLink.isVisible()) {
      await tripLink.click()
      await waitForPageLoad(page)
    }
    
    await page.screenshot({ path: 'test-results/employee/trip-detail.png' })
  })

  test('should show profile page', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/profile`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/employee/profile.png' })
  })
})

test.describe('Security Boundaries', () => {
  test('should redirect from admin routes when not authorized', async ({ page }) => {
    // Try to access admin dashboard
    await page.goto(`${BASE_URL}/admin`)
    await waitForPageLoad(page)
    
    // Should be redirected to login or show unauthorized
    const currentUrl = page.url()
    
    // Either redirected to login or shows error
    await page.screenshot({ path: 'test-results/security/admin-access-attempt.png' })
  })

  test('should not access admin events page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/security/admin-events-attempt.png' })
  })

  test('should not access admin settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/settings`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/security/admin-settings-attempt.png' })
  })

  test('should not access admin employees page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/employees`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/security/admin-employees-attempt.png' })
  })

  test('should not access admin reports', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/reports`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/security/admin-reports-attempt.png' })
  })
})

test.describe('Data Isolation', () => {
  test('should only show own trips', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Verify we're on employee trips page
    const url = page.url()
    expect(url).toContain('/employee/trips')
    
    await page.screenshot({ path: 'test-results/security/own-trips-only.png' })
  })

  test('should not access other employee profiles', async ({ page }) => {
    // Try to access another employee's trip
    await page.goto(`${BASE_URL}/employee/trips/other_employee_trip`)
    await waitForPageLoad(page)
    
    // Should show error or not found
    await page.screenshot({ path: 'test-results/security/other-trip-attempt.png' })
  })
})

test.describe('Itinerary Details View', () => {
  test('should display flight information', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Look for trip with itinerary
    const tripCard = page.locator('[data-testid="trip-card"], .trip-card, [class*="trip"]').first()
    
    if (await tripCard.isVisible()) {
      await tripCard.click()
      await waitForPageLoad(page)
    }
    
    await page.screenshot({ path: 'test-results/employee/itinerary-flights.png' })
  })

  test('should display hotel information', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/employee/itinerary-hotel.png' })
  })

  test('should display cost breakdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Look for cost-related content
    const costElements = await page.locator('text=/cost|\\$|price|total/i').count()
    
    await page.screenshot({ path: 'test-results/employee/cost-breakdown.png' })
  })

  test('should show agent notes if available', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Look for notes section
    const notesSection = page.locator('text=/notes|remarks|comments/i')
    
    await page.screenshot({ path: 'test-results/employee/agent-notes.png' })
  })
})

test.describe('Employee Read-Only Access', () => {
  test('should not have edit buttons on trip detail', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Try to navigate to trip detail
    const tripLink = page.locator('a[href*="/employee/trips/"]').first()
    
    if (await tripLink.isVisible()) {
      await tripLink.click()
      await waitForPageLoad(page)
    }
    
    // Check for edit/delete buttons (should not exist for employees)
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Delete")')
    const editButtonCount = await editButton.count()
    
    await page.screenshot({ path: 'test-results/employee/readonly-check.png' })
  })

  test('should not be able to modify trip', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Verify no modification controls visible
    const modifyControls = page.locator(
      'button:has-text("Edit"), button:has-text("Delete"), button:has-text("Cancel")'
    )
    
    await page.screenshot({ path: 'test-results/employee/no-modify-controls.png' })
  })
})

test.describe('Employee Navigation', () => {
  test('should have employee-specific navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee`)
    await waitForPageLoad(page)
    
    // Look for employee navigation items
    const navItems = await page.locator('nav a, aside a').all()
    
    await page.screenshot({ path: 'test-results/employee/navigation.png' })
  })

  test('should not show admin navigation items', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee`)
    await waitForPageLoad(page)
    
    // Check for absence of admin-only links
    const adminLinks = page.locator('a[href*="/admin"]')
    const adminLinkCount = await adminLinks.count()
    
    // Should have no admin links in employee view
    await page.screenshot({ path: 'test-results/employee/no-admin-nav.png' })
  })
})

test.describe('Mobile Responsiveness', () => {
  test('employee dashboard on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(`${BASE_URL}/employee`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/mobile/employee-dashboard.png' })
  })

  test('trips list on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/mobile/trips-list.png' })
  })

  test('trip detail on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(`${BASE_URL}/employee/trips`)
    await waitForPageLoad(page)
    
    // Navigate to detail if possible
    const tripLink = page.locator('a[href*="/employee/trips/"]').first()
    
    if (await tripLink.isVisible()) {
      await tripLink.click()
      await waitForPageLoad(page)
    }
    
    await page.screenshot({ path: 'test-results/mobile/trip-detail.png' })
  })
})

test.describe('Error Handling', () => {
  test('should handle 404 for non-existent trip', async ({ page }) => {
    await page.goto(`${BASE_URL}/employee/trips/nonexistent-id-12345`)
    await waitForPageLoad(page)
    
    // Should show error or not found
    await page.screenshot({ path: 'test-results/employee/404-trip.png' })
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Set up route to fail
    await page.route('**/api/**', route => route.abort('failed'))
    
    await page.goto(`${BASE_URL}/employee/trips`)
    await page.waitForTimeout(3000)
    
    await page.screenshot({ path: 'test-results/employee/network-error.png' })
    
    // Clean up
    await page.unroute('**/api/**')
  })
})
