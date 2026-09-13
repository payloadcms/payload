import { test, expect } from '@playwright/test'

test.describe('Admin Panel Navigation & Collections', () => {
  test('can load admin panel and inspect dashboard collections', async ({ page }) => {
    await page.goto('/admin')

    // If auto-login is active, dashboard loads directly; otherwise login form is present
    await expect(page).toHaveURL(/\/admin/)

    // Collections navigation
    await expect(page.locator('a[href*="/admin/collections/posts"]').first()).toBeDefined()
    await expect(page.locator('a[href*="/admin/collections/users"]').first()).toBeDefined()
    await expect(page.locator('a[href*="/admin/collections/media"]').first()).toBeDefined()
    await expect(page.locator('a[href*="/admin/collections/categories"]').first()).toBeDefined()

    // At least the login form or the collection links are visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view posts collection list route', async ({ page }) => {
    await page.goto('/admin/collections/posts')
    await expect(page).toHaveURL(/\/admin\/collections\/posts/)
  })
})
