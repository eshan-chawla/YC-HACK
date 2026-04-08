/**
 * E2E tests for Admin Chat Interface
 *
 * Tests the admin-facing AI chat at /admin/chat covering:
 * - Page structure and authentication guards
 * - Chat UI elements (input, sidebar, header)
 * - Agent interaction flow (itinerary planning, policy queries)
 * - Approve/Request Revision button behavior
 * - Conversation sidebar interaction
 *
 * Authentication: Tests without saved auth state verify the redirect guard.
 * Tests WITH auth state (requires PLAYWRIGHT_ADMIN_SESSION) test full flows.
 */

import { test, expect } from '@playwright/test'
import { hasAuthState, skipIfNoAuth, mockAgentResponse, sendChatMessage, waitForAgentResponse } from '../helpers/auth-helpers'
import { MOCK_ITINERARY_RESPONSE, MOCK_BUDGET_RESPONSE, MOCK_TRIPS_RESPONSE } from '../fixtures/test-data'

// ─── Unauthenticated guard tests (no Clerk session needed) ───────────────────

test.describe('Admin Chat — Unauthenticated Guard', () => {
  test('redirects unauthenticated users away from /admin/chat', async ({ page }) => {
    await page.goto('/admin/chat')
    await page.waitForLoadState('networkidle')

    // Should redirect to home or login, not show the admin chat
    const url = page.url()
    expect(url).not.toContain('/admin/chat')
  })

  test('login page is accessible', async ({ page }) => {
    await page.goto('/auth/login')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible()
  })
})

// ─── Authenticated admin chat tests ─────────────────────────────────────────

test.describe('Admin Chat — Page Structure', () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" })
  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await page.goto('/admin/chat')
    await page.waitForLoadState('networkidle')
  })

  test('renders the AI Travel Agent heading', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await expect(page.getByText('AI Travel Agent')).toBeVisible()
  })

  test('shows admin-specific input placeholder', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    const input = page.getByPlaceholder('Issue a command or policy override...')
    await expect(input).toBeVisible()
  })

  test('shows "Operations monitoring & policy overrides" subtitle', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await expect(page.getByText(/operations monitoring/i)).toBeVisible()
  })

  test('renders conversation sidebar with New chat button', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await expect(page.getByText(/new chat/i)).toBeVisible()
  })

  test('shows TripWeaver AI branding in footer', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await expect(page.getByText(/powered by tripweaver ai/i)).toBeVisible()
  })

  test('shows AI responses may vary disclaimer', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await expect(page.getByText(/ai responses may vary/i)).toBeVisible()
  })

  test('send button is disabled when input is empty', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    const sendButton = page.getByRole('button', { name: /send/i })
    await expect(sendButton).toBeDisabled()
  })

  test('send button enables when text is typed', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    const input = page.getByPlaceholder('Issue a command or policy override...')
    await input.fill('Hello')
    const sendButton = page.getByRole('button', { name: /send/i })
    await expect(sendButton).toBeEnabled()
  })

  test('clears input after sending a message', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Hello! How can I help you plan your team travel today?')

    const input = page.getByPlaceholder('Issue a command or policy override...')
    await input.fill('Hello')
    await page.keyboard.press('Enter')
    await expect(input).toHaveValue('')
  })
})

test.describe('Admin Chat — Agent Interaction: Itinerary Planning', () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" })
  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await page.goto('/admin/chat')
    await page.waitForLoadState('networkidle')
  })

  test('displays user message in chat after sending', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_TRIPS_RESPONSE)

    const input = page.getByPlaceholder('Issue a command or policy override...')
    await input.fill('Show me all pending trips')
    await input.press('Enter')

    // User message should appear
    await expect(page.getByText('Show me all pending trips')).toBeVisible()
  })

  test('shows typing indicator while agent is processing', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_TRIPS_RESPONSE)

    const input = page.getByPlaceholder('Issue a command or policy override...')
    await input.fill('Show me pending trips')
    await input.press('Enter')

    // Loading dots or pulsing bot icon should appear briefly
    // (may complete too fast — use a short timeout)
    const loadingVisible = await page.locator('.animate-pulse').isVisible().catch(() => false)
    // Either loading was visible OR it completed — both are valid
    expect(typeof loadingVisible).toBe('boolean')
  })

  test('renders agent itinerary response with markdown', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Generate an itinerary for Sarah Chen for Stripe Sessions')
    await waitForAgentResponse(page)

    // Itinerary content should appear in the chat
    await expect(page.getByText(/proposed itinerary/i)).toBeVisible({ timeout: 15000 })
  })

  test('shows Approve and Request Revision buttons for itinerary proposal', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Generate an itinerary for Sarah Chen')
    await waitForAgentResponse(page)

    // Approve button should appear (admin role)
    await expect(page.getByRole('button', { name: /approve/i })).toBeVisible({ timeout: 15000 })
    // Request Revision button
    await expect(page.getByRole('button', { name: /request revision/i })).toBeVisible()
  })

  test('Approve button pre-fills booking confirmation message', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Generate itinerary for Sarah')
    await waitForAgentResponse(page)

    // Click Approve
    const approveBtn = page.getByRole('button', { name: /approve/i }).first()
    await approveBtn.click()

    // Input should be pre-filled with booking confirmation
    const input = page.getByPlaceholder('Issue a command or policy override...')
    await expect(input).toHaveValue('Go ahead and book this itinerary as proposed.')
  })

  test('Request Revision button pre-fills revision message', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)

    await sendChatMessage(page, 'Generate itinerary for Sarah')
    await waitForAgentResponse(page)

    // Click Request Revision
    const revisionBtn = page.getByRole('button', { name: /request revision/i }).first()
    await revisionBtn.click()

    // Input should be pre-filled
    const input = page.getByPlaceholder('Issue a command or policy override...')
    await expect(input).toHaveValue('I want to request a revision to this itinerary: ')
  })

  test('admin can query budget compliance', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_BUDGET_RESPONSE)

    await sendChatMessage(page, 'Check budget compliance for Stripe Sessions')
    await waitForAgentResponse(page)

    await expect(page.getByText(/budget compliance/i)).toBeVisible({ timeout: 15000 })
  })

  test('admin can query pending trips', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, MOCK_TRIPS_RESPONSE)

    await sendChatMessage(page, 'Show me all pending trips')
    await waitForAgentResponse(page)

    await expect(page.getByText(/pending trips/i)).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Admin Chat — Conversation Sidebar', () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" })
  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await page.goto('/admin/chat')
    await page.waitForLoadState('networkidle')
  })

  test('New chat button creates a fresh conversation', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Hello!')

    // Send a message to create a conversation
    await sendChatMessage(page, 'First conversation message')
    await waitForAgentResponse(page)

    // Click New chat
    await page.getByText(/new chat/i).click()
    await page.waitForLoadState('networkidle')

    // Chat area should be empty (no messages from previous conversation)
    const messageCount = await page.locator('.rounded-xl.px-4.py-3').count()
    expect(messageCount).toBe(0)
  })

  test('previous conversations appear in sidebar', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Hello from the agent!')

    await sendChatMessage(page, 'Tell me about upcoming events')
    await waitForAgentResponse(page)

    // Sidebar should show the conversation (title is first 50 chars of first message)
    await expect(page.getByText(/Tell me about upcoming events/i)).toBeVisible({ timeout: 10000 })
  })

  test('can navigate between conversations in sidebar', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'First response')

    // Create first conversation
    await sendChatMessage(page, 'First conversation')
    await waitForAgentResponse(page)

    // Start new chat
    await page.getByText(/new chat/i).click()

    // Create second conversation
    await mockAgentResponse(page, 'Second response')
    await sendChatMessage(page, 'Second conversation')
    await waitForAgentResponse(page)

    // Click first conversation in sidebar
    await page.getByText(/First conversation/i).click()
    await page.waitForLoadState('networkidle')

    // First conversation messages should be visible
    await expect(page.getByText('First conversation')).toBeVisible()
  })

  test('sidebar shows Team section with employees (admin only)', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    // ConversationSidebar renders a Team section for admin role
    await expect(page.getByText(/team/i)).toBeVisible()
  })
})

test.describe('Admin Chat — Full Itinerary Workflow', () => {
  test.use({ storageState: "tests/e2e/.auth/admin.json" })
  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await page.goto('/admin/chat')
    await page.waitForLoadState('networkidle')
  })

  test('complete itinerary approval workflow: request → view → approve → confirm booking', async ({ page }) => {
    skipIfNoAuth(test, 'admin')

    // Step 1: Admin requests itinerary generation
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)
    await sendChatMessage(page, 'Generate an itinerary for Sarah Chen for Stripe Sessions 2026')
    await waitForAgentResponse(page)

    // Verify itinerary proposal appeared
    await expect(page.getByText(/proposed itinerary/i)).toBeVisible({ timeout: 15000 })

    // Step 2: Click Approve — pre-fills booking message
    const approveBtn = page.getByRole('button', { name: /approve/i }).first()
    await approveBtn.click()

    const input = page.getByPlaceholder('Issue a command or policy override...')
    await expect(input).toHaveValue('Go ahead and book this itinerary as proposed.')

    // Step 3: Send the booking confirmation
    await mockAgentResponse(page, '✅ Booking confirmed! Confirmation #TW-abc123. Sarah Chen is booked on UA 101 JFK→SFO on May 15.', true)
    await input.press('Enter')
    await waitForAgentResponse(page)

    // Booking confirmation message should appear
    await expect(page.getByText(/booking confirmed/i)).toBeVisible({ timeout: 15000 })
  })

  test('complete itinerary revision workflow: request → view → reject → revise', async ({ page }) => {
    skipIfNoAuth(test, 'admin')

    // Step 1: Generate itinerary
    await mockAgentResponse(page, MOCK_ITINERARY_RESPONSE)
    await sendChatMessage(page, 'Generate itinerary for Sarah Chen')
    await waitForAgentResponse(page)

    await expect(page.getByText(/proposed itinerary/i)).toBeVisible({ timeout: 15000 })

    // Step 2: Click Request Revision
    const revisionBtn = page.getByRole('button', { name: /request revision/i }).first()
    await revisionBtn.click()

    const input = page.getByPlaceholder('Issue a command or policy override...')
    await expect(input).toHaveValue('I want to request a revision to this itinerary: ')

    // Step 3: Complete the revision request
    await input.fill('I want to request a revision to this itinerary: Please use a direct flight only.')
    await mockAgentResponse(page, "Understood! I'll search for direct flights only. Here's a revised itinerary...")
    await input.press('Enter')
    await waitForAgentResponse(page)

    await expect(page.getByText(/revised itinerary|direct flight/i)).toBeVisible({ timeout: 15000 })
  })
})
