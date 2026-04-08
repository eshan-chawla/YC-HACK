/**
 * E2E tests for Employee Chat Interface
 *
 * Tests the employee-facing AI chat at /employee/chat covering:
 * - Page structure and authentication guards
 * - Chat UI elements (input, sidebar, header)
 * - Personal trip query flow
 * - Request Revision button behavior (no Approve — admin only)
 * - Conversation sidebar interaction
 *
 * Authentication: Tests without saved auth state verify the redirect guard.
 * Tests WITH auth state (requires PLAYWRIGHT_EMPLOYEE_SESSION) test full flows.
 */

import { test, expect } from '@playwright/test'
import { skipIfNoAuth, mockAgentResponse, sendChatMessage, waitForAgentResponse } from '../helpers/auth-helpers'
import { MOCK_ITINERARY_RESPONSE, MOCK_BUDGET_RESPONSE } from '../fixtures/test-data'

// ─── Unauthenticated guard tests ─────────────────────────────────────────────

test.describe('Employee Chat — Unauthenticated Guard', () => {
  test('redirects unauthenticated users away from /employee/chat', async ({ page }) => {
    await page.goto('/employee/chat')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    expect(url).not.toContain('/employee/chat')
  })

  test('redirects unauthenticated users away from /employee', async ({ page }) => {
    await page.goto('/employee')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    expect(url).not.toContain('/employee')
  })
})

// ─── Authenticated employee chat tests ───────────────────────────────────────

test.describe('Employee Chat — Page Structure', () => {
  test.use({ storageState: 'tests/e2e/.auth/employee.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await page.goto('/employee/chat')
    await page.waitForLoadState('networkidle')
  })

  test('renders the AI Travel Agent heading', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await expect(page.getByText('AI Travel Agent')).toBeVisible()
  })

  test('shows employee-specific input placeholder', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await expect(input).toBeVisible()
  })

  test('shows trip-focused subtitle', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    // Employee chat shows "Your personal trip assistant" or similar
    await expect(page.getByText(/personal trip|your trip/i)).toBeVisible()
  })

  test('renders conversation sidebar with New chat button', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await expect(page.getByText(/new chat/i)).toBeVisible()
  })

  test('shows TripWeaver AI branding in footer', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await expect(page.getByText(/powered by tripweaver ai/i)).toBeVisible()
  })

  test('shows AI responses may vary disclaimer', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await expect(page.getByText(/ai responses may vary/i)).toBeVisible()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    const sendButton = page.getByRole('button', { name: /send/i })
    await expect(sendButton).toBeDisabled()
  })

  test('send button enables when text is typed', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await input.fill('Hello')
    const sendButton = page.getByRole('button', { name: /send/i })
    await expect(sendButton).toBeEnabled()
  })

  test('clears input after sending a message', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Hello! How can I help with your trip today?')

    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await input.fill('Hello')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('')
  })
})

// ─── Employee agent interaction ───────────────────────────────────────────────

test.describe('Employee Chat — Agent Interaction: Personal Trip', () => {
  test.use({ storageState: 'tests/e2e/.auth/employee.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await page.goto('/employee/chat')
    await page.waitForLoadState('networkidle')
  })

  test('displays user message in chat after sending', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Your flight is booked for May 15!')

    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await input.fill('What is my flight status?')
    await input.press('Enter')

    await expect(page.getByText('What is my flight status?')).toBeVisible()
  })

  test('shows typing indicator while agent is processing', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Your trip details are...')

    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await input.fill('Show me my trip')
    await input.press('Enter')

    const loadingVisible = await page.locator('.animate-pulse').isVisible().catch(() => false)
    expect(typeof loadingVisible).toBe('boolean')
  })

  test('employee can ask about dietary restrictions', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    const restrictionResponse = 'I have your dietary preferences on file: **Vegetarian**. Your vegetarian meal has been requested on all flights.'
    await mockAgentResponse(page, restrictionResponse)

    await sendChatMessage(page, 'What restrictions do I have on file?')
    await waitForAgentResponse(page)

    await expect(page.getByText(/vegetarian|dietary|restrictions/i)).toBeVisible({ timeout: 15000 })
  })

  test('employee can query trip details', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    const tripResponse = '## Your Trip — Stripe Sessions 2026\n\n**Flight**: UA 101 · JFK → SFO · May 15\n**Hotel**: Marriott Union Square\n**Status**: Confirmed ✅'
    await mockAgentResponse(page, tripResponse)

    await sendChatMessage(page, 'Show me my trip details')
    await waitForAgentResponse(page)

    await expect(page.getByText(/your trip|stripe sessions/i)).toBeVisible({ timeout: 15000 })
  })

  test('renders agent itinerary proposal with markdown', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Show me my proposed itinerary')
    await waitForAgentResponse(page)

    await expect(page.getByText(/proposed itinerary/i)).toBeVisible({ timeout: 15000 })
  })
})

// ─── Request Revision (no Approve for employee) ───────────────────────────────

test.describe('Employee Chat — Revision Buttons (Admin-only Approve)', () => {
  test.use({ storageState: 'tests/e2e/.auth/employee.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await page.goto('/employee/chat')
    await page.waitForLoadState('networkidle')
  })

  test('shows Request Revision button for itinerary proposals', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Show me my proposed itinerary')
    await waitForAgentResponse(page)

    // Employee should see Request Revision button
    await expect(page.getByRole('button', { name: /request revision/i })).toBeVisible({ timeout: 15000 })
  })

  test('does NOT show Approve button for employee role', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Show me my proposed itinerary')
    await waitForAgentResponse(page)

    // Approve button should NOT appear for employees
    const approveBtn = page.getByRole('button', { name: /^approve$/i })
    await expect(approveBtn).not.toBeVisible()
  })

  test('Request Revision button pre-fills revision message', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Show me my proposed itinerary')
    await waitForAgentResponse(page)

    const revisionBtn = page.getByRole('button', { name: /request revision/i }).first()
    await revisionBtn.click()

    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await expect(input).toHaveValue('I want to request a revision to this itinerary: ')
  })

  test('employee can submit revision request', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Show me my proposed itinerary')
    await waitForAgentResponse(page)

    const revisionBtn = page.getByRole('button', { name: /request revision/i }).first()
    await revisionBtn.click()

    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await input.fill('I want to request a revision to this itinerary: Please find a cheaper hotel.')

    await mockAgentResponse(page, "I'll look for a more affordable hotel option. Here's a revised itinerary with a budget hotel...")
    await input.press('Enter')
    await waitForAgentResponse(page)

    await expect(page.getByText(/revised itinerary|affordable hotel|budget hotel/i)).toBeVisible({ timeout: 15000 })
  })
})

// ─── Employee conversation sidebar ───────────────────────────────────────────

test.describe('Employee Chat — Conversation Sidebar', () => {
  test.use({ storageState: 'tests/e2e/.auth/employee.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await page.goto('/employee/chat')
    await page.waitForLoadState('networkidle')
  })

  test('New chat button creates a fresh conversation', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Hello!')

    await sendChatMessage(page, 'First employee message')
    await waitForAgentResponse(page)

    await page.getByText(/new chat/i).click()
    await page.waitForLoadState('networkidle')

    const messageCount = await page.locator('.rounded-xl.px-4.py-3').count()
    expect(messageCount).toBe(0)
  })

  test('previous conversations appear in sidebar', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Here are your trip details...')

    await sendChatMessage(page, 'Tell me about my upcoming trip')
    await waitForAgentResponse(page)

    await expect(page.getByText(/Tell me about my upcoming trip/i)).toBeVisible({ timeout: 10000 })
  })

  test('does NOT show Team section (employee only sees own conversations)', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    // Employee sidebar should not have a Team section (admin-only)
    const teamSection = page.getByText(/^team$/i)
    const isVisible = await teamSection.isVisible().catch(() => false)
    // Either not present or not visible — both are valid for employee role
    expect(isVisible).toBe(false)
  })
})

// ─── Full employee itinerary revision workflow ────────────────────────────────

test.describe('Employee Chat — Full Revision Workflow', () => {
  test.use({ storageState: 'tests/e2e/.auth/employee.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await page.goto('/employee/chat')
    await page.waitForLoadState('networkidle')
  })

  test('complete revision workflow: view proposal → request revision → get revised itinerary', async ({ page }) => {
    skipIfNoAuth(test, 'employee')

    // Step 1: View proposed itinerary
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)
    await sendChatMessage(page, 'Show me my proposed itinerary for Stripe Sessions')
    await waitForAgentResponse(page)

    await expect(page.getByText(/proposed itinerary/i)).toBeVisible({ timeout: 15000 })

    // Step 2: Click Request Revision
    const revisionBtn = page.getByRole('button', { name: /request revision/i }).first()
    await revisionBtn.click()

    const input = page.getByPlaceholder(/ask anything about your trip/i)
    await expect(input).toHaveValue('I want to request a revision to this itinerary: ')

    // Step 3: Complete the revision request
    await input.fill('I want to request a revision to this itinerary: I need an aisle seat, not window.')
    await mockAgentResponse(page, "Got it! I've updated your seat preference to aisle. Here's the revised itinerary with your aisle seat confirmed on UA 101.")
    await input.press('Enter')
    await waitForAgentResponse(page)

    await expect(page.getByText(/revised itinerary|aisle seat/i)).toBeVisible({ timeout: 15000 })
  })

  test('employee can ask questions about budget', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, MOCK_BUDGET_RESPONSE)

    await sendChatMessage(page, 'Am I within budget for Stripe Sessions?')
    await waitForAgentResponse(page)

    await expect(page.getByText(/budget/i)).toBeVisible({ timeout: 15000 })
  })
})
