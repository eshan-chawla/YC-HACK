/**
 * E2E tests for authentication flows
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto('/')
  })

  test('should show login page', async ({ page }) => {
    await page.goto('/auth/login')
    
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show signup page', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('should validate password requirements on signup', async ({ page }) => {
    await page.goto('/auth/signup')
    
    const passwordInput = page.getByLabel('Password', { exact: true })
    await passwordInput.fill('weak')
    
    // Should show password requirement indicators
    await expect(page.getByText(/at least 10 characters/i)).toBeVisible()
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.getByRole('link', { name: /sign up/i }).click()
    await expect(page).toHaveURL('/auth/signup')
    
    await page.getByRole('link', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/auth/login')
  })

  test('should show Google OAuth button', async ({ page }) => {
    await page.goto('/auth/login')
    
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should redirect unauthenticated users from employee routes', async ({ page }) => {
    await page.goto('/employee')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

test.describe('Login Form Validation', () => {
  test('should show error for empty fields', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Browser validation should prevent submission
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeFocused()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Browser validation for email
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeFocused()
  })
})

test.describe('Signup Form Validation', () => {
  test('should validate password match', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await page.getByLabel('Password', { exact: true }).fill('ValidPass123!')
    await page.getByLabel(/confirm password/i).fill('DifferentPass')
    
    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('should disable submit when passwords do not match', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('ValidPass123!')
    await page.getByLabel(/confirm password/i).fill('DifferentPass')
    
    const submitButton = page.getByRole('button', { name: /create account/i })
    await expect(submitButton).toBeDisabled()
  })

  test('should enable submit when all fields are valid', async ({ page }) => {
    await page.goto('/auth/signup')
    
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByLabel('Password', { exact: true }).fill('ValidPass123!')
    await page.getByLabel(/confirm password/i).fill('ValidPass123!')
    
    const submitButton = page.getByRole('button', { name: /create account/i })
    await expect(submitButton).toBeEnabled()
  })
})
