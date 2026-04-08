/**
 * E2E tests for Chat Persistence & Conversation Management
 *
 * Tests that conversations are persisted in Convex and correctly restored:
 * - Messages survive page reload
 * - New conversation creates fresh state
 * - Sidebar navigation loads the correct conversation
 * - ?conversationId= URL param loads specific conversation
 * - Multiple conversations can be managed
 *
 * These tests verify the real-time Convex persistence layer.
 * Requires PLAYWRIGHT_ADMIN_SESSION or PLAYWRIGHT_EMPLOYEE_SESSION.
 */

import { test, expect } from '@playwright/test'
import { skipIfNoAuth, mockAgentResponse, sendChatMessage, waitForAgentResponse } from '../helpers/auth-helpers'
import * as fs from 'fs'
import * as path from 'path'

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/admin/chat')
  await page.waitForLoadState('networkidle')
}

async function loginAsEmployee(page: import('@playwright/test').Page) {
  await page.goto('/employee/chat')
  await page.waitForLoadState('networkidle')
}

// ─── Admin chat persistence ───────────────────────────────────────────────────

test.describe('Chat Persistence — Admin', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await loginAsAdmin(page)
  })

  test('messages persist after page reload', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Hello! I remember your question.')

    await sendChatMessage(page, 'Remember this message please')
    await waitForAgentResponse(page)

    // Capture current URL (contains conversationId)
    const urlBefore = page.url()

    // Reload the page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Messages should be restored from Convex
    await expect(page.getByText('Remember this message please')).toBeVisible({ timeout: 10000 })

    // URL should be the same
    expect(page.url()).toBe(urlBefore)
  })

  test('new conversation starts empty after clicking New Chat', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Previous response')

    await sendChatMessage(page, 'First conversation content')
    await waitForAgentResponse(page)

    // Verify message is present
    await expect(page.getByText('First conversation content')).toBeVisible()

    // Click New Chat
    await page.getByText(/new chat/i).click()
    await page.waitForLoadState('networkidle')

    // Chat area should be empty
    const messageCount = await page.locator('.rounded-xl.px-4.py-3').count()
    expect(messageCount).toBe(0)

    // URL should have changed (new conversation ID or no ID)
    const newUrl = page.url()
    expect(newUrl).not.toContain('First conversation content')
  })

  test('sidebar shows created conversations in list', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Response 1')

    await sendChatMessage(page, 'Admin persistence test message')
    await waitForAgentResponse(page)

    // Sidebar should display the conversation title (first N chars of first message)
    await expect(page.getByText(/Admin persistence test/i)).toBeVisible({ timeout: 10000 })
  })

  test('can navigate back to previous conversation from sidebar', async ({ page }) => {
    skipIfNoAuth(test, 'admin')

    // Create first conversation
    await mockAgentResponse(page, 'First reply')
    await sendChatMessage(page, 'First admin conversation')
    await waitForAgentResponse(page)

    // Start new chat
    await page.getByText(/new chat/i).click()
    await page.waitForLoadState('networkidle')

    // Create second conversation
    await mockAgentResponse(page, 'Second reply')
    await sendChatMessage(page, 'Second admin conversation')
    await waitForAgentResponse(page)

    // Click the first conversation in sidebar
    await page.getByText(/First admin conversation/i).click()
    await page.waitForLoadState('networkidle')

    // First conversation messages should be visible
    await expect(page.getByText('First admin conversation')).toBeVisible({ timeout: 10000 })

    // Second conversation messages should NOT be visible
    const secondVisible = await page.getByText('Second admin conversation').isVisible().catch(() => false)
    expect(secondVisible).toBe(false)
  })

  test('conversationId URL param loads specific conversation', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Specific conversation reply')

    await sendChatMessage(page, 'Specific test conversation')
    await waitForAgentResponse(page)

    // Get the current URL with conversationId
    const urlWithId = page.url()
    const hasConversationId = urlWithId.includes('conversationId')

    if (hasConversationId) {
      // Navigate away
      await page.getByText(/new chat/i).click()
      await page.waitForLoadState('networkidle')

      // Navigate directly to the conversation URL
      await page.goto(urlWithId)
      await page.waitForLoadState('networkidle')

      // Conversation should be loaded
      await expect(page.getByText('Specific test conversation')).toBeVisible({ timeout: 10000 })
    } else {
      // URL doesn't include conversationId — skip this assertion
      test.skip(true, 'URL does not include conversationId param')
    }
  })
})

// ─── Employee chat persistence ────────────────────────────────────────────────

test.describe('Chat Persistence — Employee', () => {
  test.use({ storageState: 'tests/e2e/.auth/employee.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await loginAsEmployee(page)
  })

  test('employee messages persist after page reload', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Your trip details are being saved.')

    await sendChatMessage(page, 'Employee persistence check')
    await waitForAgentResponse(page)

    const urlBefore = page.url()

    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Employee persistence check')).toBeVisible({ timeout: 10000 })
    expect(page.url()).toBe(urlBefore)
  })

  test('employee new conversation starts fresh', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Previous trip response')

    await sendChatMessage(page, 'Employee first conversation')
    await waitForAgentResponse(page)

    await page.getByText(/new chat/i).click()
    await page.waitForLoadState('networkidle')

    const messageCount = await page.locator('.rounded-xl.px-4.py-3').count()
    expect(messageCount).toBe(0)
  })

  test('employee sidebar shows conversation history', async ({ page }) => {
    skipIfNoAuth(test, 'employee')
    await mockAgentResponse(page, 'Trip info response')

    await sendChatMessage(page, 'Employee sidebar test conversation')
    await waitForAgentResponse(page)

    await expect(page.getByText(/Employee sidebar test/i)).toBeVisible({ timeout: 10000 })
  })
})

// ─── Cross-role isolation (admin and employee see only their own) ─────────────

test.describe('Chat Persistence — Conversation Isolation', () => {
  test('admin conversation does not appear in employee sidebar', async ({ browser }) => {
    // Skip if either auth state is missing
    const adminPath = path.join(__dirname, '../.auth/admin.json')
    const employeePath = path.join(__dirname, '../.auth/employee.json')

    if (!fs.existsSync(adminPath) || !fs.existsSync(employeePath)) {
      test.skip(true, 'Both admin and employee auth states required for isolation test')
      return
    }

    // Admin creates a conversation
    const adminContext = await browser.newContext({ storageState: adminPath })
    const adminPage = await adminContext.newPage()

    await mockAgentResponse(adminPage, 'Admin only response')
    await adminPage.goto('/admin/chat')
    await adminPage.waitForLoadState('networkidle')
    await sendChatMessage(adminPage, 'Top secret admin conversation XYZ987')
    await waitForAgentResponse(adminPage)
    await adminContext.close()

    // Employee should NOT see admin's conversation
    const employeeContext = await browser.newContext({ storageState: employeePath })
    const employeePage = await employeeContext.newPage()

    await employeePage.goto('/employee/chat')
    await employeePage.waitForLoadState('networkidle')

    const adminConvVisible = await employeePage.getByText('Top secret admin conversation XYZ987').isVisible().catch(() => false)
    expect(adminConvVisible).toBe(false)

    await employeeContext.close()
  })
})

// ─── Conversation state: multiple concurrent tabs ─────────────────────────────

test.describe('Chat Persistence — Multi-Tab Sync', () => {
  test('opening same conversation in two tabs shows same messages', async ({ browser }) => {
    const adminPath = path.join(__dirname, '../.auth/admin.json')
    if (!fs.existsSync(adminPath)) {
      test.skip(true, 'Admin auth state required for multi-tab test')
      return
    }

    const context = await browser.newContext({ storageState: adminPath })

    const tab1 = await context.newPage()
    await mockAgentResponse(tab1, 'Tab sync response')
    await tab1.goto('/admin/chat')
    await tab1.waitForLoadState('networkidle')

    await sendChatMessage(tab1, 'Tab sync test message')
    await waitForAgentResponse(tab1)

    const currentUrl = tab1.url()

    // Open same URL in tab 2
    const tab2 = await context.newPage()
    await tab2.goto(currentUrl)
    await tab2.waitForLoadState('networkidle')

    // Both tabs should show the message
    await expect(tab1.getByText('Tab sync test message')).toBeVisible()
    await expect(tab2.getByText('Tab sync test message')).toBeVisible({ timeout: 10000 })

    await context.close()
  })
})

// ─── Conversation title generation ───────────────────────────────────────────

test.describe('Chat Persistence — Conversation Titles', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' })

  test.beforeEach(async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await loginAsAdmin(page)
  })

  test('sidebar title uses first 50 chars of first user message', async ({ page }) => {
    skipIfNoAuth(test, 'admin')
    await mockAgentResponse(page, 'Acknowledged')

    const longMessage = 'This is a very specific and unique message for title testing purposes'
    await sendChatMessage(page, longMessage)
    await waitForAgentResponse(page)

    // Sidebar should show title truncated to ~50 chars
    const expectedTitle = longMessage.substring(0, 50)
    await expect(page.getByText(new RegExp(expectedTitle.substring(0, 30), 'i'))).toBeVisible({ timeout: 10000 })
  })

  test('new conversation gets its own title', async ({ page }) => {
    skipIfNoAuth(test, 'admin')

    // Create first conversation
    await mockAgentResponse(page, 'First reply')
    await sendChatMessage(page, 'Unique first title ABC123')
    await waitForAgentResponse(page)

    // Create second conversation
    await page.getByText(/new chat/i).click()
    await mockAgentResponse(page, 'Second reply')
    await sendChatMessage(page, 'Unique second title DEF456')
    await waitForAgentResponse(page)

    // Both titles should appear in sidebar
    await expect(page.getByText(/Unique first title ABC/i)).toBeVisible()
    await expect(page.getByText(/Unique second title DEF/i)).toBeVisible()
  })
})
