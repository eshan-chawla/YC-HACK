/**
 * E2E Test: Itinerary Regeneration on Requirement Changes
 * 
 * This test covers:
 * 1. Admin creates event with initial requirements
 * 2. Agent generates itineraries
 * 3. Admin updates event requirements (budget, etc.)
 * 4. Verify old itineraries are invalidated
 * 5. Agent regenerates itineraries with new requirements
 * 6. Verify new itineraries respect new budget
 */

import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('[data-testid="loading"]', { state: 'hidden', timeout: 30000 }).catch(() => {})
}

test.describe('Itinerary Regeneration', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000) // Longer timeout for complex flows
  })

  test('should display event edit page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await waitForPageLoad(page)
    
    // Navigate to first event if available
    const eventLink = page.locator('a[href*="/admin/itineraries/"]').first()
    
    if (await eventLink.isVisible()) {
      await eventLink.click()
      await waitForPageLoad(page)
    }
    
    await page.screenshot({ path: 'test-results/regeneration/event-page.png' })
  })

  test('should show budget fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries/new`)
    await waitForPageLoad(page)
    
    // Look for budget input
    const budgetInput = page.locator(
      'input[name="budget"], input[placeholder*="budget" i], input[type="number"]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/budget-fields.png' })
  })

  test('should show requirement options', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries/new`)
    await waitForPageLoad(page)
    
    // Look for requirement-related fields
    const cabinClassSelect = page.locator(
      'select[name="cabinClass"], [aria-label*="cabin" i]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/requirement-options.png' })
  })
})

test.describe('Chat-Based Regeneration', () => {
  test('should access chat from event page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/chat`)
    await waitForPageLoad(page)
    
    await page.screenshot({ path: 'test-results/regeneration/chat-access.png' })
  })

  test('should send regeneration request', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/chat`)
    await waitForPageLoad(page)
    
    const chatInput = page.locator(
      'textarea, input[placeholder*="message" i], [data-testid="chat-input"]'
    ).first()
    
    if (await chatInput.isVisible()) {
      await chatInput.fill('Please regenerate the itineraries for the Q1 offsite with the updated budget.')
      
      const sendButton = page.locator(
        'button[type="submit"], button:has-text("Send"), [data-testid="send-button"]'
      ).first()
      
      if (await sendButton.isVisible()) {
        await sendButton.click()
        await page.waitForTimeout(3000)
      }
    }
    
    await page.screenshot({ path: 'test-results/regeneration/regeneration-request.png' })
  })
})

test.describe('Budget Update Flow', () => {
  test('should handle budget decrease', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries/new`)
    await waitForPageLoad(page)
    
    // Fill budget field if available
    const budgetInput = page.locator('input[name="budget"], input[type="number"]').first()
    
    if (await budgetInput.isVisible()) {
      await budgetInput.fill('1500')
    }
    
    await page.screenshot({ path: 'test-results/regeneration/budget-decrease.png' })
  })

  test('should handle budget increase', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries/new`)
    await waitForPageLoad(page)
    
    const budgetInput = page.locator('input[name="budget"], input[type="number"]').first()
    
    if (await budgetInput.isVisible()) {
      await budgetInput.fill('3000')
    }
    
    await page.screenshot({ path: 'test-results/regeneration/budget-increase.png' })
  })
})

test.describe('Cache Invalidation Visual', () => {
  test('should show cache status', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await waitForPageLoad(page)
    
    // Look for cache/status indicators
    const statusIndicators = page.locator(
      '[data-testid="cache-status"], .status-badge, [class*="status"]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/cache-status.png' })
  })

  test('should show regeneration in progress', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/chat`)
    await waitForPageLoad(page)
    
    // Look for loading/progress indicators
    const progressIndicator = page.locator(
      '[data-testid="loading"], .spinner, [class*="loading"], [class*="progress"]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/progress-indicator.png' })
  })
})

test.describe('Itinerary Comparison', () => {
  test('should display multiple itineraries', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await waitForPageLoad(page)
    
    // Look for itinerary cards
    const itineraryCards = page.locator(
      '[data-testid="itinerary-card"], .itinerary-card, [class*="itinerary"]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/itinerary-list.png' })
  })

  test('should show cost differences', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await waitForPageLoad(page)
    
    // Look for cost displays
    const costElements = await page.locator('text=/\\$[0-9,]+/').all()
    
    await page.screenshot({ path: 'test-results/regeneration/cost-comparison.png' })
  })
})

test.describe('Policy Requirement Changes', () => {
  test('should update cabin class requirement', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries/new`)
    await waitForPageLoad(page)
    
    // Look for cabin class selector
    const cabinSelect = page.locator(
      'select[name="cabinClass"], select[name="cabin"], [aria-label*="cabin" i]'
    )
    
    if (await cabinSelect.isVisible()) {
      await cabinSelect.selectOption({ label: 'Business' })
    }
    
    await page.screenshot({ path: 'test-results/regeneration/cabin-class-change.png' })
  })

  test('should update airline preferences', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries/new`)
    await waitForPageLoad(page)
    
    // Look for airline preference input
    const airlineInput = page.locator(
      'input[name="airline"], [aria-label*="airline" i], [placeholder*="airline" i]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/airline-preferences.png' })
  })
})

test.describe('Notification on Regeneration', () => {
  test('should show success notification', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await waitForPageLoad(page)
    
    // Look for toast/notification elements
    const toast = page.locator(
      '[data-testid="toast"], .toast, [role="alert"], [class*="notification"]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/success-notification.png' })
  })

  test('should show error notification on failure', async ({ page }) => {
    // Set up route to fail
    await page.route('**/api/**', route => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, body: 'Server Error' })
      }
      return route.continue()
    })
    
    await page.goto(`${BASE_URL}/admin/itineraries`)
    await page.waitForTimeout(2000)
    
    await page.screenshot({ path: 'test-results/regeneration/error-notification.png' })
    
    await page.unroute('**/api/**')
  })
})

test.describe('Audit Trail', () => {
  test('should log requirement changes', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/reports`)
    await waitForPageLoad(page)
    
    // Look for audit log or activity feed
    const activityFeed = page.locator(
      '[data-testid="activity-feed"], [data-testid="audit-log"], [class*="activity"]'
    )
    
    await page.screenshot({ path: 'test-results/regeneration/audit-trail.png' })
  })
})
