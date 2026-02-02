import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs in a user to the admin panel
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  const loginURL = `${serverURL}/admin/login`
  const adminURL = `${serverURL}/admin`

  // Navigate to login page
  await page.goto(loginURL)

  // Fill in credentials
  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for successful login (redirect to admin panel)
  await page.waitForURL(adminURL)
  await expect(page).toHaveURL(adminURL)

  // Verify we're logged in by checking for dashboard elements
  await expect(page.locator('span[title="Dashboard"]')).toBeVisible()
}

/**
 * Logs out the current user
 */
export async function logout({
  page,
  serverURL = 'http://localhost:3000',
}: {
  page: Page
  serverURL?: string
}): Promise<void> {
  // Look for account menu/logout option
  const accountButton = page.locator('[aria-label="Account"]').first()
  if (await accountButton.isVisible()) {
    await accountButton.click()
    await page.locator('text=Log out').click()
    await expect(page).toHaveURL(`${serverURL}/admin/login`)
  }
}
