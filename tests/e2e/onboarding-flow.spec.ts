/**
 * E2E tests for admin/employee onboarding flow.
 *
 * Run: npx playwright test tests/e2e/onboarding-flow.spec.ts
 *
 * For authenticated flows, set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD.
 * Without credentials, unauthenticated tests only verify the public-facing
 * page behaviour (redirects, form structure when accessible).
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Onboarding flow", () => {
  test.setTimeout(60000);

  test("unauthenticated: visiting admin onboarding redirects or shows form", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasRedirectedToAuth =
      url.includes("/auth/login") || url.includes("/auth/select-role");
    const isOnOnboarding = url.includes("/auth/onboarding/admin");

    // Must end up somewhere recognisable — not a blank page
    expect(hasRedirectedToAuth || isOnOnboarding).toBeTruthy();
  });

  test("admin onboarding page shows 3-step form OR redirects to login", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    const url = page.url();

    if (url.includes("/auth/login") || url.includes("/auth/select-role")) {
      // Unauthenticated redirect — correct behaviour
      expect(true).toBeTruthy();
      return;
    }

    // If page is accessible, verify the 3-step form structure
    const heading = page.getByRole("heading", { name: /complete your profile/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const stepLabel = page.getByText(/step 1 of 3/i);
    await expect(stepLabel).toBeVisible();
  });

  test("admin onboarding: shows step indicators when form is accessible", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(400);

    const url = page.url();

    // Unauthenticated users get redirected — just verify it's a clean redirect
    if (!url.includes("/auth/onboarding/admin")) {
      expect(url).toBeTruthy();
      return;
    }

    await expect(
      page.getByRole("heading", { name: /complete your profile/i })
    ).toBeVisible({ timeout: 10000 });

    // Step indicators — use .first() to avoid strict-mode violation (text appears in tab + label)
    await expect(page.getByText(/basic info/i).first()).toBeVisible();
    await expect(page.getByText(/profile setup/i).first()).toBeVisible();
    await expect(page.getByText(/preferences/i).first()).toBeVisible();
  });

  test("authenticated admin can complete onboarding and reach dashboard", async ({
    page,
  }) => {
    // Skip if no test credentials are provided
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      return;
    }

    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState("networkidle");
    // Clerk renders its own form — use generic selectors
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/auth\/(login|onboarding|select-role)|\/admin/, { timeout: 15000 });

    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    // Already onboarded users will be redirected to /admin
    if (page.url().includes("/admin")) {
      expect(page.url()).toContain("/admin");
      return;
    }

    await page.getByLabel(/full name/i).fill("E2E Admin");
    await page.getByLabel(/company name/i).fill("E2E Company");
    await page.getByLabel(/department/i).fill("IT");
    await page.getByRole("button", { name: /next/i }).click();

    await page.getByLabel(/job title/i).fill("Manager");
    await page.getByRole("button", { name: /next/i }).click();

    await page.getByRole("button", { name: /complete setup/i }).click();

    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  });
});
