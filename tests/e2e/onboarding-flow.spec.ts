/**
 * E2E tests for admin/employee onboarding flow.
 *
 * Run: npx playwright test tests/e2e/onboarding-flow.spec.ts
 * (Install browsers first if needed: npx playwright install)
 *
 * For the full authenticated flow (complete onboarding), set TEST_ADMIN_EMAIL and
 * TEST_ADMIN_PASSWORD in the environment, or sign in once and run with a stored session.
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "TestPassword123!";

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/auth\/(login|onboarding|select-role)|\/admin/, { timeout: 15000 });
}

test.describe("Onboarding flow", () => {
  test.setTimeout(60000);

  test("unauthenticated: visiting admin onboarding may redirect or show form", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasRedirectedToAuth =
      url.includes("/auth/login") || url.includes("/auth/select-role");
    const isOnOnboarding =
      url.includes("/auth/onboarding/admin") &&
      (await page.getByRole("heading", { name: /complete your profile/i }).isVisible().catch(() => false));

    expect(hasRedirectedToAuth || isOnOnboarding).toBeTruthy();
  });

  test("admin onboarding page shows 3-step form when loaded", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /complete your profile/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const stepLabel = page.getByText(/step 1 of 3/i);
    await expect(stepLabel).toBeVisible();
  });

  test("admin onboarding: can fill step 1 and go to step 2", async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /complete your profile/i })
    ).toBeVisible({ timeout: 10000 });

    await page.getByLabel(/full name \*/i).fill("E2E Test Admin");
    await page.getByLabel(/company name \*/i).fill("E2E Corp");
    await page.getByLabel(/department \*/i).fill("Engineering");

    await page.getByRole("button", { name: /next/i }).click();

    await expect(page.getByText(/step 2 of 3/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/job title \*/i)).toBeVisible();
  });

  test("authenticated admin can complete onboarding and reach dashboard", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto(`${BASE_URL}/auth/onboarding/admin`);
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /complete your profile/i });
    await expect(heading).toBeVisible({ timeout: 10000 }).catch(() => {
      // If already onboarded, we might be on /admin
      if (page.url().includes("/admin")) return;
      throw new Error("Expected onboarding heading or admin dashboard");
    });

    if (!page.url().includes("/admin")) {
      await page.getByLabel(/full name \*/i).fill("E2E Admin");
      await page.getByLabel(/company name \*/i).fill("E2E Company");
      await page.getByLabel(/department \*/i).fill("IT");
      await page.getByRole("button", { name: /next/i }).click();

      await page.getByLabel(/job title \*/i).fill("Manager");
      await page.getByRole("button", { name: /next/i }).click();

      await page.getByRole("button", { name: /complete setup/i }).click();

      await expect(page).toHaveURL(new RegExp(`${BASE_URL}/admin`), {
        timeout: 15000,
      });
    }
  });
});
